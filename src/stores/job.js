import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { loadGerberFiles } from '../utils/gerberParser'
import { createPoint, createFiducial } from '../utils/factories'
import { calculatePlaneCoefficients, getZForPlane, calculateBestFitPlane } from '../utils/geometry'
import { createDelaunayTriangulation, interpolateZFromTriangulation } from '../utils/meshInterpolation'
import { parseJobFile, exportJobToFile } from '../utils/jobFileService'
import { useSerialStore } from './serial'
import { fromTriangles, applyToPoint } from 'transformation-matrix'
import { SAFE_Z_HEIGHT, DEFAULT_Z_HEIGHT, EXTRUSION_HEIGHT } from '../constants'
import * as macros from '../utils/macros'

export const useJobStore = defineStore('job', () => {
  // Store references
  const serialStore = useSerialStore()

  // IMMUTABLE ORIGINALS - Never mutated after load
  const originalPlacements = ref([])  // { x, y, z: 31.5 }
  const originalFiducials = ref([])   // { x, y, z: 31.5 }

  // Legacy state - kept for backwards compatibility
  const placements = ref([])
  const fiducials = ref([])

  const dispenseDegrees = ref(30)
  const retractionDegrees = ref(1)
  const dwellMilliseconds = ref(100)

  const boardSide = ref('front') // 'front' or 'back'

  const clickedFidBuffer = ref([])
  const currentPlacementIndex = ref(-1)
  const lastNavigatedPlacementIndex = ref(-1)  // Track last navigated placement for UI highlighting

  // Adaptive extrusion timing
  const extrusionTimings = ref([])
  const extrusionStartTime = ref(null)
  const isLearningMode = ref(true)
  const autoExtrusionDuration = ref(null)

  // CALIBRATION DATA
  const roughBoardMatrix = ref(null)      // From rough board position (manual jog)
  const fidCalMatrix = ref(null)          // From fiducial calibration (CV refinement)
  const baseZ = ref(null)                 // From rough board position
  const planeCoefficients = ref(null)     // { A, B, C, D } from plane calibration
  const planeCalibrationPoints = ref([])  // [{ placementIndex, x, y, z }] manual Z calibration points
  const meshCalibrationMethod = ref('plane') // 'plane' = flat plane fit, 'mesh' = triangulation mesh
  const triangulationData = ref(null)     // Delaunay triangulation data for mesh interpolation
  const tipXoffset = ref(0)
  const tipYoffset = ref(0)

  // FIDUCIAL SELECTION MODE - Temporary state during user selection
  const potentialFiducials = ref([])      // All mask-only points before selection
  const selectedFiducialIndices = ref([]) // Indices of user-selected fiducials
  const isFiducialSelectionMode = ref(false)
  const fiducialSelectionResolve = ref(null) // Promise resolver for toast workflow

  // Legacy plane coefficients - kept for backwards compatibility
  const planeA = ref(null)
  const planeB = ref(null)
  const planeC = ref(null)
  const planeD = ref(null)
  const roughBoardPosition = ref(null) // { x, y, z }

  // COMPUTED - Active transformation matrix (priority: fid cal > rough)
  const activeTransformMatrix = computed(() => {
    return fidCalMatrix.value ?? roughBoardMatrix.value
  })

  // COMPUTED - Calibration status flags
  const hasRoughCalibration = computed(() => roughBoardMatrix.value !== null)
  const hasFidCalibration = computed(() => fidCalMatrix.value !== null)
  const hasPlaneCalibration = computed(() => planeCoefficients.value !== null)
  const isCalibrated = computed(() => activeTransformMatrix.value !== null)

  // COMPUTED CALIBRATED POSITIONS - Reactive, not saved
  const calibratedPlacements = computed(() => {
    if (!activeTransformMatrix.value || originalPlacements.value.length === 0) {
      return []
    }

    return originalPlacements.value.map(p => {
      // Apply active XY transformation
      const [x, y] = applyToPoint(activeTransformMatrix.value, [p.x, p.y])

      // Apply Z calibration (priority: mesh/plane > baseZ > original)
      let z
      if (planeCoefficients.value) {
        // Check which calibration method to use
        if (meshCalibrationMethod.value === 'mesh' && triangulationData.value) {
          z = interpolateZFromTriangulation(x, y, triangulationData.value)
          // Fall back to plane if mesh interpolation fails
          if (z === null) {
            z = getZForPlane(x, y, planeCoefficients.value)
          }
        } else {
          // Use plane fit (default)
          z = getZForPlane(x, y, planeCoefficients.value)
        }
      } else if (baseZ.value !== null) {
        z = baseZ.value
      } else {
        z = p.z  // Default 31.5
      }

      return { x, y, z }
    })
  })

  const calibratedFiducials = computed(() => {
    if (!activeTransformMatrix.value || originalFiducials.value.length === 0) {
      return []
    }

    return originalFiducials.value.map(f => {
      // Apply active XY transformation
      const [x, y] = applyToPoint(activeTransformMatrix.value, [f.x, f.y])

      // Apply Z calibration (priority: mesh/plane > baseZ > original)
      let z
      if (planeCoefficients.value) {
        // Check which calibration method to use
        if (meshCalibrationMethod.value === 'mesh' && triangulationData.value) {
          z = interpolateZFromTriangulation(x, y, triangulationData.value)
          // Fall back to plane if mesh interpolation fails
          if (z === null) {
            z = getZForPlane(x, y, planeCoefficients.value)
          }
        } else {
          // Use plane fit (default)
          z = getZForPlane(x, y, planeCoefficients.value)
        }
      } else if (baseZ.value !== null) {
        z = baseZ.value
      } else {
        z = f.z  // Default 31.5
      }

      return { x, y, z }
    })
  })

  // Methods
  function calculateBoardPlane() {
    if (fiducials.value.length !== 3) {
      console.error('Need exactly 3 fiducials for plane calculation')
      return false
    }

    if (
      fiducials.value[0].calZ === null ||
      fiducials.value[1].calZ === null ||
      fiducials.value[2].calZ === null
    ) {
      console.error('All fiducials must have probed Z-heights (calZ)')
      return false
    }

    // Extract calibrated or original positions
    const p1 = {
      x: fiducials.value[0].calX !== null ? fiducials.value[0].calX : fiducials.value[0].x,
      y: fiducials.value[0].calY !== null ? fiducials.value[0].calY : fiducials.value[0].y,
      z: fiducials.value[0].calZ
    }
    const p2 = {
      x: fiducials.value[1].calX !== null ? fiducials.value[1].calX : fiducials.value[1].x,
      y: fiducials.value[1].calY !== null ? fiducials.value[1].calY : fiducials.value[1].y,
      z: fiducials.value[1].calZ
    }
    const p3 = {
      x: fiducials.value[2].calX !== null ? fiducials.value[2].calX : fiducials.value[2].x,
      y: fiducials.value[2].calY !== null ? fiducials.value[2].calY : fiducials.value[2].y,
      z: fiducials.value[2].calZ
    }

    // Calculate plane coefficients using geometry utility
    const coeffs = calculatePlaneCoefficients(p1, p2, p3)
    if (!coeffs) {
      return false
    }

    // Store plane coefficients
    planeA.value = coeffs.A
    planeB.value = coeffs.B
    planeC.value = coeffs.C
    planeD.value = coeffs.D

    console.log('Board plane calculated:', coeffs)

    return true
  }

  function getZForPosition(x, y) {
    const planeCoeffs = {
      A: planeA.value,
      B: planeB.value,
      C: planeC.value,
      D: planeD.value
    }
    return getZForPlane(x, y, planeCoeffs)
  }

  async function importFromFile(file) {
    try {
      const data = await parseJobFile(file)

      // Update state with parsed data
      originalPlacements.value = data.originalPlacements
      originalFiducials.value = data.originalFiducials

      // Update calibration data
      roughBoardMatrix.value = data.calibration.roughBoardMatrix
      fidCalMatrix.value = data.calibration.fidCalMatrix
      baseZ.value = data.calibration.baseZ
      planeCoefficients.value = data.calibration.planeCoefficients
      meshCalibrationMethod.value = data.calibration.meshCalibrationMethod || 'plane' // Default to plane for backwards compatibility
      triangulationData.value = data.calibration.triangulationData || null
      tipXoffset.value = data.calibration.tipXoffset
      tipYoffset.value = data.calibration.tipYoffset

      // Update settings if provided
      if (data.settings.dispenseDegrees) dispenseDegrees.value = data.settings.dispenseDegrees
      if (data.settings.retractionDegrees) retractionDegrees.value = data.settings.retractionDegrees
      if (data.settings.dwellMilliseconds) dwellMilliseconds.value = data.settings.dwellMilliseconds

      console.log(`Loaded ${originalPlacements.value.length} placements and ${originalFiducials.value.length} fiducials`)
      console.log('Calibration status:', {
        hasRough: hasRoughCalibration.value,
        hasFidCal: hasFidCalibration.value,
        hasPlane: hasPlaneCalibration.value
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async function saveToFile() {
    const jobData = {
      originalPlacements: originalPlacements.value,
      originalFiducials: originalFiducials.value,
      roughBoardMatrix: roughBoardMatrix.value,
      fidCalMatrix: fidCalMatrix.value,
      baseZ: baseZ.value,
      planeCoefficients: planeCoefficients.value,
      meshCalibrationMethod: meshCalibrationMethod.value,
      triangulationData: triangulationData.value,
      tipXoffset: tipXoffset.value,
      tipYoffset: tipYoffset.value,
      dispenseDegrees: dispenseDegrees.value,
      retractionDegrees: retractionDegrees.value,
      dwellMilliseconds: dwellMilliseconds.value
    }

    exportJobToFile(jobData)
  }

  async function loadJobFromGerbers(pasteGerberFile, maskGerberFile) {
    try {
      // Detect board side from filename (check paste gerber filename)
      const filename = pasteGerberFile.name.toLowerCase()
      if (filename.includes('b_') || filename.includes('_back') || filename.includes('-back')) {
        boardSide.value = 'back'
        console.log('Detected backside gerber')
      } else {
        boardSide.value = 'front'
        console.log('Detected frontside gerber')
      }

      // Parse gerber files and extract positions
      const { pastePoints, maskPoints, fiducialCandidates } = await loadGerberFiles(
        pasteGerberFile,
        maskGerberFile
      )

      console.log('Gerber parsing complete:', {
        pasteCount: pastePoints.length,
        maskCount: maskPoints.length,
        fiducialCount: fiducialCandidates.length
      })

      // Clear existing data (including calibration)
      originalPlacements.value = []
      originalFiducials.value = []
      roughBoardMatrix.value = null
      fidCalMatrix.value = null
      baseZ.value = null
      planeCoefficients.value = null
      planeCalibrationPoints.value = []
      triangulationData.value = null

      // Clear legacy data for backwards compatibility
      placements.value = []
      fiducials.value = []

      // Clear fiducial selection state
      potentialFiducials.value = []
      selectedFiducialIndices.value = []
      isFiducialSelectionMode.value = false

      // Default Z height
      const defaultZ = DEFAULT_Z_HEIGHT

      // Create plain objects for paste positions
      for (const pointData of pastePoints) {
        originalPlacements.value.push(createPoint(pointData.x, pointData.y, defaultZ))
      }

      // Store fiducial candidates as POTENTIAL fiducials (user will select 3)
      for (const fidData of fiducialCandidates) {
        potentialFiducials.value.push(createFiducial(fidData.x, fidData.y, defaultZ))
      }

      console.log(
        `Loaded ${originalPlacements.value.length} placements and ${potentialFiducials.value.length} potential fiducials`
      )

      // Enter fiducial selection mode if we have candidates
      if (potentialFiducials.value.length >= 3) {
        isFiducialSelectionMode.value = true
        return { success: true, needsFiducialSelection: true }
      } else if (potentialFiducials.value.length > 0) {
        // Not enough candidates, but have some - just use what we have
        originalFiducials.value = [...potentialFiducials.value]
        potentialFiducials.value = []
        console.warn('Less than 3 fiducial candidates found, using all available')
        return { success: true, needsFiducialSelection: false }
      } else {
        // No fiducials at all
        console.warn('No fiducial candidates found')
        return { success: true, needsFiducialSelection: false }
      }
    } catch (error) {
      console.error('Error loading gerbers:', error)
      return { success: false, error: error.message }
    }
  }

  function resetExtrusionTiming() {
    extrusionTimings.value = []
    extrusionStartTime.value = null
    isLearningMode.value = true
    autoExtrusionDuration.value = null
    currentPlacementIndex.value = -1
    console.log('Extrusion timing data has been reset')
  }

  function recordExtrusionTiming() {
    if (extrusionStartTime.value === null || currentPlacementIndex.value <= 0) {
      return
    }

    const extrusionDuration = Date.now() - extrusionStartTime.value
    extrusionTimings.value.push(extrusionDuration)
    console.log(`Pad ${currentPlacementIndex.value + 1} extrusion duration: ${(extrusionDuration / 1000).toFixed(2)}s`)

    // Calculate and display average (excluding first pad)
    if (extrusionTimings.value.length > 0) {
      const average = extrusionTimings.value.reduce((a, b) => a + b, 0) / extrusionTimings.value.length
      console.log(`Average extrusion time: ${(average / 1000).toFixed(2)}s (based on ${extrusionTimings.value.length} pads)`)

      // Update the auto extrusion duration
      autoExtrusionDuration.value = average
    }
  }

  async function moveCameraToPosition(position, placementIndex = -1) {
    // Move to XY position at safe height without changing Z
    // Position should be from calibratedPlacements or calibratedFiducials

    // Safety: lift to safe Z first, then move XY
    await serialStore.send([
      'G90',
      `G0 Z${SAFE_Z_HEIGHT}`,  // Lift to safe height first
      `G0 X${position.x.toFixed(3)} Y${position.y.toFixed(3)}`  // Move XY at safe height
    ])

    // Track which placement was navigated to for UI highlighting
    if (placementIndex >= 0) {
      lastNavigatedPlacementIndex.value = placementIndex
    }
  }

  async function moveNozzleToPosition(position, placementIndex = -1) {
    // Move to XYZ position with tip offset applied
    // Position should be from calibratedPlacements or calibratedFiducials
    const x = position.x + tipXoffset.value
    const y = position.y + tipYoffset.value
    const z = position.z - EXTRUSION_HEIGHT  // Lift 0.2mm above the saved pad touch position

    // Safety: lift to safe Z, move XY, then descend to extrusion height
    await serialStore.send([
      'G90',
      `G0 Z${SAFE_Z_HEIGHT}`,  // Lift to safe height first
      `G0 X${x.toFixed(3)} Y${y.toFixed(3)}`,  // Move XY at safe height
      `G0 Z${z.toFixed(3)}`  // Descend to extrusion height
    ])

    // Track which placement was navigated to for UI highlighting
    if (placementIndex >= 0) {
      lastNavigatedPlacementIndex.value = placementIndex
    }
  }

  function deletePlacement(index) {
    if (index >= 0 && index < originalPlacements.value.length) {
      originalPlacements.value.splice(index, 1)
      console.log(`Deleted placement at index ${index}`)

      // Also delete from legacy array for backwards compatibility
      if (index < placements.value.length) {
        placements.value.splice(index, 1)
      }
    }
  }

  function deleteFiducial(index) {
    if (index >= 0 && index < originalFiducials.value.length) {
      originalFiducials.value.splice(index, 1)
      console.log(`Deleted fiducial at index ${index}`)

      // Also delete from legacy array for backwards compatibility
      if (index < fiducials.value.length) {
        fiducials.value.splice(index, 1)
      }
    }
  }

  // Handle fiducial click event from JobPreview component
  function handleFiducialClick(fiducialIndex) {
    if (!isFiducialSelectionMode.value) return
    if (selectedFiducialIndices.value.length >= 3) return

    // Add to selected indices
    selectedFiducialIndices.value.push(fiducialIndex)
    console.log(`Selected fiducial ${selectedFiducialIndices.value.length} at index ${fiducialIndex}`)

    // Resolve the current promise to continue to next selection
    if (fiducialSelectionResolve.value) {
      fiducialSelectionResolve.value()
      fiducialSelectionResolve.value = null
    }
  }

  // Prepare for fiducial selection (can be called manually or automatically)
  function startFiducialSelection() {
    // If we already have potential fiducials from gerber load, use those
    if (potentialFiducials.value.length >= 3) {
      isFiducialSelectionMode.value = true
      selectedFiducialIndices.value = []
      return true
    }

    // If we have existing fiducials, allow re-selection by moving them to potentialFiducials
    if (originalFiducials.value.length >= 3) {
      potentialFiducials.value = [...originalFiducials.value]
      originalFiducials.value = []
      isFiducialSelectionMode.value = true
      selectedFiducialIndices.value = []
      return true
    }

    // Not enough fiducials to select from
    return false
  }

  // Fiducial selection workflow with toast prompts
  async function selectFiducials(toast) {
    if (!isFiducialSelectionMode.value) {
      throw new Error('Not in fiducial selection mode')
    }

    if (potentialFiducials.value.length < 3) {
      throw new Error('Need at least 3 potential fiducials to select from')
    }

    selectedFiducialIndices.value = []

    try {
      // Prompt for FID1
      await new Promise((resolve) => {
        fiducialSelectionResolve.value = resolve
        toast.show('Please click on FID1 in the preview.')
      })

      // Prompt for FID2
      await new Promise((resolve) => {
        fiducialSelectionResolve.value = resolve
        toast.show('Please click on FID2 in the preview.')
      })

      // Prompt for FID3
      await new Promise((resolve) => {
        fiducialSelectionResolve.value = resolve
        toast.show('Please click on FID3 in the preview.')
      })

      // Finalize: move selected fiducials to originalFiducials
      if (selectedFiducialIndices.value.length === 3) {
        originalFiducials.value = [
          potentialFiducials.value[selectedFiducialIndices.value[0]],
          potentialFiducials.value[selectedFiducialIndices.value[1]],
          potentialFiducials.value[selectedFiducialIndices.value[2]]
        ]

        console.log('Fiducial selection complete:', originalFiducials.value)

        // Exit selection mode
        isFiducialSelectionMode.value = false
        potentialFiducials.value = []
        selectedFiducialIndices.value = []
        fiducialSelectionResolve.value = null
      } else {
        throw new Error('Failed to select 3 fiducials')
      }
    } catch (error) {
      // Clean up on error
      isFiducialSelectionMode.value = false
      selectedFiducialIndices.value = []
      fiducialSelectionResolve.value = null
      throw error
    }
  }

  async function findBoardRoughPosition(toast) {
    // Validate we have fiducials
    if (originalFiducials.value.length < 3) {
      throw new Error('Need at least 3 fiducials to perform rough board position')
    }

    // Request user to jog to fid1
    await toast.show('Please jog the camera to be centered on FID1.')

    // Upon hitting continue, grab current position
    const fid1Rough = await serialStore.grabBoardPosition()
    console.log('fid1Rough:', fid1Rough)

    // Repeat for fid2 and fid3
    await toast.show('Please jog the camera to be centered on FID2.')
    const fid2Rough = await serialStore.grabBoardPosition()

    await toast.show('Please jog the camera to be centered on FID3.')
    const fid3Rough = await serialStore.grabBoardPosition()

    // Ask to jog tip to desired extrusion height
    await toast.show('Please jog the paste extruder tip to your desired extrusion height.')

    // Grab z pos directly - no offset
    let zPos = await serialStore.grabBoardPosition()

    await serialStore.send([`G0 Z${SAFE_Z_HEIGHT}`])

    zPos = parseFloat(zPos[2])

    // Create rough transformation matrix
    roughBoardMatrix.value = fromTriangles(
      [
        [originalFiducials.value[0].x, originalFiducials.value[0].y],
        [originalFiducials.value[1].x, originalFiducials.value[1].y],
        [originalFiducials.value[2].x, originalFiducials.value[2].y]
      ],
      [
        [parseFloat(fid1Rough[0]), parseFloat(fid1Rough[1])],
        [parseFloat(fid2Rough[0]), parseFloat(fid2Rough[1])],
        [parseFloat(fid3Rough[0]), parseFloat(fid3Rough[1])]
      ]
    )

    // Store base Z height
    baseZ.value = zPos

    console.log('Rough calibration complete')
    console.log('Rough board matrix:', roughBoardMatrix.value)
    console.log('Base Z:', baseZ.value)

    // Update legacy rough board position for backwards compatibility
    roughBoardPosition.value = {
      x: parseFloat(fid1Rough[0]),
      y: parseFloat(fid1Rough[1]),
      z: zPos
    }
  }

  async function performFiducialCalibration() {
    // Requires rough calibration first
    if (!hasRoughCalibration.value) {
      throw new Error('Must perform rough board position first')
    }

    // Validate 3 fiducials exist
    if (originalFiducials.value.length !== 3) {
      throw new Error('Need exactly 3 fiducials to perform fiducial calibration')
    }

    let refinedPositions = []
    // Go through and capture the actual positions of the fids
    // Use rough calibration to get close, then CV refines

    for (let i = 0; i < originalFiducials.value.length; i++) {
      console.log(`Processing fiducial ${i + 1}`)

      // Use calibrated fiducials (from rough cal) to navigate to approximate position
      const roughPos = calibratedFiducials.value[i]
      console.log('Jogging to rough position:', roughPos.x, roughPos.y)

      try {
        await macros.goTo(roughPos.x, roughPos.y)
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Import and use controls store for jogToFid (CV refinement)
        const { useControlsStore } = await import('./controls')
        const controlsStore = useControlsStore()

        await controlsStore.jogToFid()
        await new Promise(resolve => setTimeout(resolve, 1500))

        await controlsStore.jogToFid()
        await new Promise(resolve => setTimeout(resolve, 1500))

        const fidReal = await serialStore.grabBoardPosition()

        console.log(`Fiducial ${i + 1} final position:`, fidReal)
        refinedPositions.push([parseFloat(fidReal[0]), parseFloat(fidReal[1])])
      } catch (error) {
        console.error(`Error processing fiducial ${i + 1}:`, error)
        throw error
      }
    }

    // Create refined transformation matrix
    fidCalMatrix.value = fromTriangles(
      [
        [originalFiducials.value[0].x, originalFiducials.value[0].y],
        [originalFiducials.value[1].x, originalFiducials.value[1].y],
        [originalFiducials.value[2].x, originalFiducials.value[2].y]
      ],
      refinedPositions
    )

    console.log('Fiducial calibration complete')
    console.log('Fid cal matrix:', fidCalMatrix.value)
  }

  function clearFiducialCalibration() {
    fidCalMatrix.value = null
    console.log('Fiducial calibration cleared')
    console.log('fidCalMatrix is now:', fidCalMatrix.value)
    console.log('hasFidCalibration is now:', hasFidCalibration.value)
  }

  async function pressurize() {
    await macros.pressurize()
  }

  async function depressurize() {
    await macros.depressurize()
  }

  async function extrude() {
    await macros.extrudePaste()
  }

  async function startSlowExtrude() {
    await macros.startSlowExtrude()
  }

  async function stopExtrude() {
    await macros.stopExtrude()
  }

  async function retractAndRaise() {
    await macros.retractAndRaise()
  }

  // Sequential extrusion workflow: stop extrude, retract, raise, move to next position, pressurize, start slow extrude
  async function extrudeNextPosition() {
    // Determine next position index
    let nextIndex
    const isFirstPosition = currentPlacementIndex.value < 0

    if (isFirstPosition) {
      // No position clicked yet, start at first position
      nextIndex = 0
    } else {
      // Move to next position
      nextIndex = currentPlacementIndex.value + 1
    }

    // Check if we're past the end
    if (nextIndex >= calibratedPlacements.value.length) {
      console.log('No more positions to extrude')
      return
    }

    // Only stop extrude, retract and raise if not the first position
    if (!isFirstPosition) {
      // Record timing for the previous extrusion
      recordExtrusionTiming()

      // Step 1: Stop extrude
      await stopExtrude()

      // Step 2: Retract and raise
      await retractAndRaise()
    }

    // Step 3: Get next position
    const position = calibratedPlacements.value[nextIndex]

    // Step 4: Move to next position
    await moveNozzleToPosition(position, nextIndex)

    // Step 5: Extrude
    await extrude()

    // Step 6: Start slow extrude and start timing (skip first pad)
    await startSlowExtrude()

    // Start timing for this extrusion (skip the very first pad)
    if (nextIndex > 0) {
      extrusionStartTime.value = Date.now()
    }

    // Update current index
    currentPlacementIndex.value = nextIndex

    console.log(`Moved to position ${nextIndex + 1} of ${calibratedPlacements.value.length}`)
  }

  // Automated extrusion workflow using calculated average timing
  async function runAutomatedExtrusion(toast) {
    // Verify we have calculated duration
    if (autoExtrusionDuration.value === null || extrusionTimings.value.length < 2) {
      console.error('Need at least 2 timed extrusions before running automated mode')
      return
    }

    // Switch to auto mode
    isLearningMode.value = false

    // Track if user cancelled
    let cancelled = false

    // Show cancellable toast - it resolves with false when user closes it
    const toastPromise = toast.value.show(`Running automated extrusion (${(autoExtrusionDuration.value / 1000).toFixed(1)}s per pad). Close to cancel.`)
    toastPromise.then((result) => {
      if (result === false) {
        cancelled = true
        console.log('User cancelled automated extrusion')
      }
    })

    // Get remaining placements (everything after current index)
    const remainingCount = calibratedPlacements.value.length - (currentPlacementIndex.value + 1)
    console.log(`Starting automated extrusion for ${remainingCount} remaining pads`)

    try {
      for (let i = currentPlacementIndex.value + 1; i < calibratedPlacements.value.length; i++) {
        // Check if user cancelled
        if (cancelled) {
          console.log('Stopping automated extrusion due to user cancellation')
          break
        }

        // Stop previous extrusion if not first in auto sequence
        if (i > currentPlacementIndex.value + 1) {
          await stopExtrude()
          await retractAndRaise()
        } else {
          // For the first pad in auto sequence, stop the current manual extrusion
          await stopExtrude()
          await retractAndRaise()
        }

        // Check cancellation again after stopping
        if (cancelled) {
          console.log('Stopping automated extrusion due to user cancellation')
          break
        }

        // Get position
        const position = calibratedPlacements.value[i]

        // Move to position
        await moveNozzleToPosition(position, i)

        // Extrude
        await extrude()

        // Start slow extrude
        await startSlowExtrude()

        // Wait for the calculated average duration
        console.log(`Extruding pad ${i + 1} for ${(autoExtrusionDuration.value / 1000).toFixed(1)}s`)
        await new Promise(resolve => setTimeout(resolve, autoExtrusionDuration.value))

        // Update current index
        currentPlacementIndex.value = i
      }

      // Final cleanup after all pads (or cancellation)
      if (cancelled) {
        // If cancelled, make sure we stop and go to safe position
        await stopExtrude()
        await retractAndRaise()
        await serialStore.send(['G0 X5 Y5'])
        console.log('Automated extrusion cancelled - returned to safe position')
      } else {
        // Normal completion
        await stopExtrude()
        await retractAndRaise()
        await serialStore.send(['G0 X5 Y5'])
        console.log('Automated extrusion complete')
      }
    } finally {
      // Switch back to learning mode
      isLearningMode.value = true
    }
  }

  async function runJob(toast) {
    // Validation checks
    if (calibratedPlacements.value.length === 0) {
      throw new Error('No placements loaded')
    }

    if (!isCalibrated.value) {
      throw new Error('Job is not calibrated')
    }

    // Reset to start of job
    currentPlacementIndex.value = -1

    // Track if user cancelled
    let cancelled = false

    // Show cancellable toast - it resolves with false when user closes it
    const toastPromise = toast.value.show('Running job... Close this to cancel.')
    toastPromise.then((result) => {
      if (result === false) {
        cancelled = true
        console.log('User cancelled job')
      }
    })

    try {
      // Initialize: move to safe height
      await serialStore.send([
        'G90',
        `G0 Z${SAFE_Z_HEIGHT}`
      ])

      // Process each placement
      for (let i = 0; i < calibratedPlacements.value.length; i++) {
        // Check for cancellation
        if (cancelled) {
          console.log('Job cancelled by user')
          break
        }

        const position = calibratedPlacements.value[i]

        // Apply tip offset and extrusion height (same as moveNozzleToPosition)
        const x = position.x + tipXoffset.value
        const y = position.y + tipYoffset.value
        const z = position.z - EXTRUSION_HEIGHT  // Lift above the saved pad touch position

        // Execute placement sequence
        await serialStore.send([
          `G0 X${x.toFixed(3)} Y${y.toFixed(3)}`,  // Move to XY position
          `G0 Z${z.toFixed(3)}`,                    // Move to extrusion height
          'G91',                                     // Relative positioning for B axis
          `G0 B-${dispenseDegrees.value}`,          // Dispense paste (negative = extrude)
          `G0 B${retractionDegrees.value}`,         // Retract (positive = retract)
          'G90',                                     // Back to absolute positioning
          `G4 P${dwellMilliseconds.value}`,         // Dwell
          `G0 Z${SAFE_Z_HEIGHT}`                    // Raise to safe height
        ])

        currentPlacementIndex.value = i
        lastNavigatedPlacementIndex.value = i  // Update for UI highlighting

        console.log(`Completed placement ${i + 1} of ${calibratedPlacements.value.length}`)
      }

      // Return to home position
      await serialStore.send(['G0 X5 Y5'])

      if (!cancelled) {
        console.log('Job completed successfully')
      } else {
        console.log('Job was cancelled')
      }

      return { success: !cancelled, cancelled }
    } catch (error) {
      console.error('Error running job:', error)
      throw error
    }
  }

  async function performTipCalibration(toast) {
    await toast.show('Please jog the camera to be centered on any fiducial.')

    // Grab current camera position
    const camPos = await serialStore.grabBoardPosition()

    await serialStore.send([`G0 Z${SAFE_Z_HEIGHT}`])

    await macros.goToRelative(-45, 63)

    await serialStore.send(['G0 Z46.5'])

    await toast.show('Please jog the nozzle tip to be perfectly centered on and touching the fiducial.')

    const nozPos = await serialStore.grabBoardPosition()

    await serialStore.send([`G0 Z${SAFE_Z_HEIGHT}`])

    tipXoffset.value = nozPos[0] - camPos[0]
    tipYoffset.value = nozPos[1] - camPos[1]

    console.log(`Tip offset calibrated: X=${tipXoffset.value.toFixed(3)}, Y=${tipYoffset.value.toFixed(3)}`)
  }

  // Manual plane calibration methods
  async function saveCalibrationPointForPlacement(placementIndex) {
    // Get current position
    const position = await serialStore.grabBoardPosition()
    const x = parseFloat(position[0])
    const y = parseFloat(position[1])
    const z = parseFloat(position[2])

    // Check if we already have a calibration point for this placement
    const existingIndex = planeCalibrationPoints.value.findIndex(p => p.placementIndex === placementIndex)

    if (existingIndex >= 0) {
      // Update existing point
      planeCalibrationPoints.value[existingIndex] = { placementIndex, x, y, z }
      console.log(`Updated calibration point for placement ${placementIndex}: (${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)})`)
    } else {
      // Add new point
      planeCalibrationPoints.value.push({ placementIndex, x, y, z })
      console.log(`Added calibration point for placement ${placementIndex}: (${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)})`)
    }
  }

  function deleteCalibrationPoint(placementIndex) {
    const index = planeCalibrationPoints.value.findIndex(p => p.placementIndex === placementIndex)
    if (index >= 0) {
      planeCalibrationPoints.value.splice(index, 1)
      console.log(`Deleted calibration point for placement ${placementIndex}`)
    }
  }

  function clearCalibrationPoints() {
    planeCalibrationPoints.value = []
    planeCoefficients.value = null
    triangulationData.value = null
    console.log('Cleared all calibration points, plane coefficients, and triangulation data')
  }

  function calculatePlaneFromCalibrationPoints() {
    if (planeCalibrationPoints.value.length < 3) {
      console.warn('Need at least 3 calibration points to calculate plane')
      return false
    }

    // Calculate best-fit plane from calibration points
    const coeffs = calculateBestFitPlane(planeCalibrationPoints.value)

    if (!coeffs) {
      console.error('Failed to calculate plane from calibration points')
      return false
    }

    // Store plane coefficients
    planeCoefficients.value = coeffs

    console.log('Plane calculated from calibration points:', coeffs)
    console.log(`Using ${planeCalibrationPoints.value.length} calibration points`)

    // Also create Delaunay triangulation for mesh interpolation
    const triangulation = createDelaunayTriangulation(planeCalibrationPoints.value)
    if (triangulation) {
      triangulationData.value = triangulation
      console.log('Triangulation mesh created for mesh interpolation mode')
    } else {
      console.warn('Failed to create triangulation - mesh mode will not be available')
    }

    return true
  }

  // Helper to check if a placement has a calibration point
  function hasCalibrationPoint(placementIndex) {
    return planeCalibrationPoints.value.some(p => p.placementIndex === placementIndex)
  }

  // Set the mesh calibration method ('plane' or 'mesh')
  function setMeshCalibrationMethod(method) {
    if (method !== 'plane' && method !== 'mesh') {
      console.error(`Invalid mesh calibration method: ${method}. Must be 'plane' or 'mesh'`)
      return
    }

    if (method === 'mesh' && !triangulationData.value) {
      console.error('Cannot switch to mesh mode - no triangulation data available. Add calibration points first.')
      return
    }

    meshCalibrationMethod.value = method
    console.log(`Mesh calibration method set to: ${method}`)
  }

  // Auto-calculate plane when we have 3 or more calibration points
  watch(
    () => planeCalibrationPoints.value.length,
    (newLength) => {
      if (newLength >= 3) {
        calculatePlaneFromCalibrationPoints()
      } else if (newLength < 3) {
        // Clear plane coefficients if we drop below 3 points
        planeCoefficients.value = null
        console.log('Plane coefficients cleared - need at least 3 calibration points')
      }
    }
  )

  return {
    // Original immutable state
    originalPlacements,
    originalFiducials,

    // Legacy state (backwards compatibility)
    placements,
    fiducials,

    // Settings
    dispenseDegrees,
    retractionDegrees,
    dwellMilliseconds,
    boardSide,
    clickedFidBuffer,
    currentPlacementIndex,
    lastNavigatedPlacementIndex,

    // Adaptive extrusion
    extrusionTimings,
    extrusionStartTime,
    isLearningMode,
    autoExtrusionDuration,

    // Calibration data
    roughBoardMatrix,
    fidCalMatrix,
    baseZ,
    planeCoefficients,
    planeCalibrationPoints,
    meshCalibrationMethod,
    triangulationData,
    tipXoffset,
    tipYoffset,

    // Fiducial selection mode
    potentialFiducials,
    selectedFiducialIndices,
    isFiducialSelectionMode,

    // Legacy calibration (backwards compatibility)
    planeA,
    planeB,
    planeC,
    planeD,
    roughBoardPosition,

    // Computed properties
    activeTransformMatrix,
    hasRoughCalibration,
    hasFidCalibration,
    hasPlaneCalibration,
    isCalibrated,
    calibratedPlacements,
    calibratedFiducials,

    // Methods
    calculateBoardPlane,
    getZForPosition,
    importFromFile,
    saveToFile,
    loadJobFromGerbers,
    resetExtrusionTiming,
    moveCameraToPosition,
    moveNozzleToPosition,
    deletePlacement,
    deleteFiducial,
    handleFiducialClick,
    startFiducialSelection,
    selectFiducials,
    findBoardRoughPosition,
    performFiducialCalibration,
    clearFiducialCalibration,
    performTipCalibration,
    pressurize,
    depressurize,
    extrude,
    startSlowExtrude,
    stopExtrude,
    retractAndRaise,
    extrudeNextPosition,
    runAutomatedExtrusion,
    runJob,
    saveCalibrationPointForPlacement,
    deleteCalibrationPoint,
    clearCalibrationPoints,
    calculatePlaneFromCalibrationPoints,
    hasCalibrationPoint,
    setMeshCalibrationMethod
  }
}, {
  persist: {
    pick: [
      'originalPlacements',
      'originalFiducials',
      'dispenseDegrees',
      'retractionDegrees',
      'dwellMilliseconds',
      'boardSide',
      'roughBoardMatrix',
      'fidCalMatrix',
      'baseZ',
      'planeCoefficients',
      'planeCalibrationPoints',
      'meshCalibrationMethod',
      'triangulationData',
      'tipXoffset',
      'tipYoffset'
    ]
  }
})
