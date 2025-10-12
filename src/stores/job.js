import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loadGerberFiles } from '../utils/gerberParser'
import { createPoint, createFiducial } from '../utils/factories'
import { calculatePlaneCoefficients, getZForPlane } from '../utils/geometry'
import { parseJobFile, exportJobToFile } from '../utils/jobFileService'
import { useSerialStore } from './serial'
import { fromTriangles, applyToPoint } from 'transformation-matrix'

export const useJobStore = defineStore('job', () => {
  // State
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

  // Bed leveling plane coefficients
  const planeA = ref(null)
  const planeB = ref(null)
  const planeC = ref(null)
  const planeD = ref(null)

  // Calibration data
  const tipXoffset = ref(0)
  const tipYoffset = ref(0)
  const roughBoardPosition = ref(null) // { x, y, z }

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
      placements.value = data.placements
      fiducials.value = data.fiducials

      // Update settings if provided
      if (data.settings.dispenseDegrees) dispenseDegrees.value = data.settings.dispenseDegrees
      if (data.settings.retractionDegrees) retractionDegrees.value = data.settings.retractionDegrees
      if (data.settings.dwellMilliseconds) dwellMilliseconds.value = data.settings.dwellMilliseconds

      console.log(`Loaded ${placements.value.length} placements and ${fiducials.value.length} fiducials`)

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async function saveToFile() {
    const jobData = {
      placements: placements.value,
      fiducials: fiducials.value,
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

      // Clear existing data
      placements.value = []
      fiducials.value = []

      // Default Z height
      const defaultZ = 31.5

      // Create plain objects for paste positions
      for (const pointData of pastePoints) {
        placements.value.push(createPoint(pointData.x, pointData.y, defaultZ))
      }

      // Create plain objects for fiducial candidates (mask-only points)
      for (const fidData of fiducialCandidates) {
        fiducials.value.push(createFiducial(fidData.x, fidData.y, defaultZ))
      }

      console.log(
        `Loaded ${placements.value.length} placements and ${fiducials.value.length} potential fiducials`
      )

      return { success: true }
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

  function moveCameraToPosition(x, y) {
    const { send } = useSerialStore()
    // Move to XY position at safe height without changing Z
    send(['G90', `G0 X${x.toFixed(3)} Y${y.toFixed(3)}`])
  }

  function moveNozzleToPosition(x, y, z) {
    const { send } = useSerialStore()
    // Move to XYZ position
    send(['G90', `G0 X${x.toFixed(3)} Y${y.toFixed(3)} Z${z.toFixed(3)}`])
  }

  function deletePlacement(index) {
    if (index >= 0 && index < placements.value.length) {
      placements.value.splice(index, 1)
      console.log(`Deleted placement at index ${index}`)
    }
  }

  function deleteFiducial(index) {
    if (index >= 0 && index < fiducials.value.length) {
      fiducials.value.splice(index, 1)
      console.log(`Deleted fiducial at index ${index}`)
    }
  }

  function transformPlacements(realFids) {
    // Get the original fiducial positions from our job
    const origFids = [
      [fiducials.value[0].x, fiducials.value[0].y],
      [fiducials.value[1].x, fiducials.value[1].y],
      [fiducials.value[2].x, fiducials.value[2].y]
    ]

    const matrix = fromTriangles(origFids, realFids)

    for (let point of placements.value) {
      let transformedPoint = applyToPoint(matrix, [point.x, point.y])

      point.calX = transformedPoint[0]
      point.calY = transformedPoint[1]
    }
  }

  async function findBoardRoughPosition(toast) {
    const serialStore = useSerialStore()

    // Request user to jog to fid1
    await toast.show('Please jog the camera to be centered on FID1.')

    // Upon hitting continue, grab current position, save to fid1 searchXY
    const fid1Rough = await serialStore.grabBoardPosition()

    console.log('fid1Rough:', fid1Rough)

    fiducials.value[0].searchX = parseFloat(fid1Rough[0])
    fiducials.value[0].searchY = parseFloat(fid1Rough[1])

    // Repeat for fid2 and fid3
    await toast.show('Please jog the camera to be centered on FID2.')
    const fid2Rough = await serialStore.grabBoardPosition()
    fiducials.value[1].searchX = parseFloat(fid2Rough[0])
    fiducials.value[1].searchY = parseFloat(fid2Rough[1])

    await toast.show('Please jog the camera to be centered on FID3.')
    const fid3Rough = await serialStore.grabBoardPosition()
    fiducials.value[2].searchX = parseFloat(fid3Rough[0])
    fiducials.value[2].searchY = parseFloat(fid3Rough[1])

    // Ask to jog tip to desired extrusion height
    await toast.show('Please jog the paste extruder tip to your desired extrusion height.')

    // Grab z pos directly - no offset
    let zPos = await serialStore.grabBoardPosition()

    await serialStore.send(['G0 Z31.5'])

    zPos = parseFloat(zPos[2])

    // Save that position to every placement
    for (const placement of placements.value) {
      placement.z = zPos
    }

    console.log('Fiducials:', fiducials.value)

    transformPlacements([
      [fiducials.value[0].searchX, fiducials.value[0].searchY],
      [fiducials.value[1].searchX, fiducials.value[1].searchY],
      [fiducials.value[2].searchX, fiducials.value[2].searchY]
    ])

    console.log(placements.value)

    // Update rough board position state
    roughBoardPosition.value = {
      x: parseFloat(fid1Rough[0]),
      y: parseFloat(fid1Rough[1]),
      z: zPos
    }
  }

  async function performFiducialCalibration() {
    const serialStore = useSerialStore()
    const { jogToFid } = await import('./controls')
    const controlsStore = jogToFid ? null : (await import('./controls')).useControlsStore()
    const controls = controlsStore ? controlsStore() : null

    // Validate 3 fiducials exist
    if (fiducials.value.length !== 3) {
      console.error('No fids in this job, cannot perform fiducial calibration.')
      return
    }

    let fidActual = []
    // Go through and capture the actual positions of the fids
    // Then we can perform the transformation

    for (let i = 0; i < fiducials.value.length; i++) {
      const fid = fiducials.value[i]
      console.log(`Processing fiducial ${i + 1}:`, fid)
      console.log('jogging to fid:', fid.searchX, fid.searchY)

      try {
        await serialStore.goTo(fid.searchX, fid.searchY)
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Import and use controls store for jogToFid
        const { useControlsStore } = await import('./controls')
        const controlsStore = useControlsStore()

        await controlsStore.jogToFid()
        await new Promise(resolve => setTimeout(resolve, 1500))

        await controlsStore.jogToFid()
        await new Promise(resolve => setTimeout(resolve, 1500))

        const fidReal = await serialStore.grabBoardPosition()

        console.log(`Fiducial ${i + 1} final position:`, fidReal)
        fidActual.push([parseFloat(fidReal[0]), parseFloat(fidReal[1])])

        fid.calX = parseFloat(fidReal[0])
        fid.calY = parseFloat(fidReal[1])
      } catch (error) {
        console.error(`Error processing fiducial ${i + 1}:`, error)
        throw error
      }
    }

    console.log('All fiducials processed, transforming placements...')
    transformPlacements(fidActual)

    console.log('fid cal complete:', fiducials.value)
  }

  return {
    // State
    placements,
    fiducials,
    dispenseDegrees,
    retractionDegrees,
    dwellMilliseconds,
    boardSide,
    clickedFidBuffer,
    currentPlacementIndex,
    extrusionTimings,
    extrusionStartTime,
    isLearningMode,
    autoExtrusionDuration,
    planeA,
    planeB,
    planeC,
    planeD,
    tipXoffset,
    tipYoffset,
    roughBoardPosition,

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
    transformPlacements,
    findBoardRoughPosition,
    performFiducialCalibration
  }
}, {
  persist: {
    paths: [
      'dispenseDegrees',
      'retractionDegrees',
      'dwellMilliseconds',
      'boardSide',
      'planeA',
      'planeB',
      'planeC',
      'planeD',
      'tipXoffset',
      'tipYoffset',
      'roughBoardPosition'
    ]
  }
})
