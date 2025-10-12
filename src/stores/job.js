import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loadGerberFiles } from '../utils/gerberParser'
import { createPoint, createFiducial } from '../utils/factories'
import { calculatePlaneCoefficients, getZForPlane } from '../utils/geometry'
import { parseJobFile, exportJobToFile } from '../utils/jobFileService'
import { useSerialStore } from './serial'

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
    deleteFiducial
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
