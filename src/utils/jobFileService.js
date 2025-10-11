/**
 * Job file import/export utilities
 */

/**
 * Parse and validate a job JSON file
 * @param {File} file - The job file to parse
 * @returns {Promise<Object>} Parsed job data with placements, fiducials, and settings
 * @throws {Error} If file parsing or validation fails
 */
export async function parseJobFile(file) {
  const text = await file.text()
  const data = JSON.parse(text)

  // Normalize placements
  const placements = data.placements && Array.isArray(data.placements)
    ? data.placements.map(p => ({
        x: p.x,
        y: p.y,
        z: p.z,
        calX: p.calX || null,
        calY: p.calY || null
      }))
    : []

  // Normalize fiducials
  const fiducials = data.fiducials && Array.isArray(data.fiducials)
    ? data.fiducials.map(f => ({
        x: f.x,
        y: f.y,
        z: f.z,
        calX: f.calX || null,
        calY: f.calY || null,
        calZ: f.calZ || null,
        searchX: f.searchX || null,
        searchY: f.searchY || null
      }))
    : []

  // Extract settings
  const settings = {
    dispenseDegrees: data.dispenseDegrees,
    retractionDegrees: data.retractionDegrees,
    dwellMilliseconds: data.dwellMilliseconds
  }

  return {
    placements,
    fiducials,
    settings
  }
}

/**
 * Export job data to a downloadable JSON file
 * @param {Object} jobData - Job data to export
 * @param {Array} jobData.placements - Array of placement points
 * @param {Array} jobData.fiducials - Array of fiducial points
 * @param {number} jobData.dispenseDegrees - Dispense degrees setting
 * @param {number} jobData.retractionDegrees - Retraction degrees setting
 * @param {number} jobData.dwellMilliseconds - Dwell milliseconds setting
 */
export function exportJobToFile(jobData) {
  const data = {
    placements: jobData.placements,
    fiducials: jobData.fiducials,
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
