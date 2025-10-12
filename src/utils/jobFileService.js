/**
 * Job file import/export utilities
 */

/**
 * Parse and validate a job JSON file
 * @param {File} file - The job file to parse
 * @returns {Promise<Object>} Parsed job data with original positions, calibration data, and settings
 * @throws {Error} If file parsing or validation fails
 */
export async function parseJobFile(file) {
  const text = await file.text()
  const data = JSON.parse(text)

  // Support both new and legacy formats
  // New format: originalPlacements, originalFiducials + calibration matrices
  // Legacy format: placements, fiducials with embedded calX/calY

  // Normalize original placements (prefer originalPlacements, fall back to placements)
  const originalPlacements = (data.originalPlacements || data.placements || []).map(p => ({
    x: p.x,
    y: p.y,
    z: p.z
  }))

  // Normalize original fiducials (prefer originalFiducials, fall back to fiducials)
  const originalFiducials = (data.originalFiducials || data.fiducials || []).map(f => ({
    x: f.x,
    y: f.y,
    z: f.z
  }))

  // Extract calibration data (new format)
  const calibration = {
    roughBoardMatrix: data.roughBoardMatrix || null,
    fidCalMatrix: data.fidCalMatrix || null,
    baseZ: data.baseZ || null,
    planeCoefficients: data.planeCoefficients || null,
    tipXoffset: data.tipXoffset || 0,
    tipYoffset: data.tipYoffset || 0
  }

  // Extract settings
  const settings = {
    dispenseDegrees: data.dispenseDegrees,
    retractionDegrees: data.retractionDegrees,
    dwellMilliseconds: data.dwellMilliseconds
  }

  return {
    originalPlacements,
    originalFiducials,
    calibration,
    settings
  }
}

/**
 * Export job data to a downloadable JSON file
 * @param {Object} jobData - Job data to export
 * @param {Array} jobData.originalPlacements - Array of original placement points
 * @param {Array} jobData.originalFiducials - Array of original fiducial points
 * @param {Object|null} jobData.roughBoardMatrix - Rough board calibration matrix
 * @param {Object|null} jobData.fidCalMatrix - Fiducial calibration matrix
 * @param {number|null} jobData.baseZ - Base Z height
 * @param {Object|null} jobData.planeCoefficients - Plane calibration coefficients
 * @param {number} jobData.tipXoffset - Tip X offset
 * @param {number} jobData.tipYoffset - Tip Y offset
 * @param {number} jobData.dispenseDegrees - Dispense degrees setting
 * @param {number} jobData.retractionDegrees - Retraction degrees setting
 * @param {number} jobData.dwellMilliseconds - Dwell milliseconds setting
 */
export function exportJobToFile(jobData) {
  const data = {
    // Original immutable positions
    originalPlacements: jobData.originalPlacements,
    originalFiducials: jobData.originalFiducials,

    // Calibration data
    roughBoardMatrix: jobData.roughBoardMatrix,
    fidCalMatrix: jobData.fidCalMatrix,
    baseZ: jobData.baseZ,
    planeCoefficients: jobData.planeCoefficients,
    tipXoffset: jobData.tipXoffset,
    tipYoffset: jobData.tipYoffset,

    // Settings
    dispenseDegrees: jobData.dispenseDegrees,
    retractionDegrees: jobData.retractionDegrees,
    dwellMilliseconds: jobData.dwellMilliseconds
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `paste-job-${new Date().toISOString()}.json`
  a.click()
  URL.revokeObjectURL(url)
}
