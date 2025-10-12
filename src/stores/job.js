import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loadGerberFiles } from '../utils/gerberParser'
import { createPoint, createFiducial } from '../utils/factories'
import { calculatePlaneCoefficients, getZForPlane } from '../utils/geometry'
import { parseJobFile, exportJobToFile } from '../utils/jobFileService'
import { useSerialStore } from './serial'
import { fromTriangles, applyToPoint } from 'transformation-matrix'

export const useJobStore = defineStore('job', () => {
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

      // Apply Z calibration (priority: plane > baseZ > original)
      let z
      if (planeCoefficients.value) {
        z = getZForPlane(x, y, planeCoefficients.value)
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

      // Apply Z calibration (priority: plane > baseZ > original)
      let z
      if (planeCoefficients.value) {
        z = getZForPlane(x, y, planeCoefficients.value)
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

      // Clear legacy data for backwards compatibility
      placements.value = []
      fiducials.value = []

      // Clear fiducial selection state
      potentialFiducials.value = []
      selectedFiducialIndices.value = []
      isFiducialSelectionMode.value = false

      // Default Z height
      const defaultZ = 31.5

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
    console.log('Extrusion timing data has been reset')
  }

  function moveCameraToPosition(position) {
    const { send } = useSerialStore()
    // Move to XY position at safe height without changing Z
    // Position should be from calibratedPlacements or calibratedFiducials
    send(['G90', `G0 X${position.x.toFixed(3)} Y${position.y.toFixed(3)}`])
  }

  function moveNozzleToPosition(position) {
    const { send } = useSerialStore()
    // Move to XYZ position with tip offset applied
    // Position should be from calibratedPlacements or calibratedFiducials
    const x = position.x + tipXoffset.value
    const y = position.y + tipYoffset.value
    send(['G90', `G0 X${x.toFixed(3)} Y${y.toFixed(3)} Z${position.z.toFixed(3)}`])
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
    const serialStore = useSerialStore()

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

    await serialStore.send(['G0 Z31.5'])

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
    const serialStore = useSerialStore()

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
        await serialStore.goTo(roughPos.x, roughPos.y)
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
    clearFiducialCalibration
  }
}, {
  persist: {
    paths: [
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
      'tipXoffset',
      'tipYoffset'
    ]
  }
})
