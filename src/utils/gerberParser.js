import { createParser } from '@tracespace/parser'

/**
 * Parse a gerber file and extract position coordinates
 * @param {File} gerberFile - The gerber file to parse
 * @returns {Promise<Array<{x: number, y: number}>>} Array of position objects with x,y coordinates in mm
 */
export async function parseGerberPositions(gerberFile) {
  const gerberText = await gerberFile.text()
  const parser = createParser()
  parser.feed(gerberText)
  const syntaxTree = parser.results()

  const positions = []

  // Iterate through syntax tree and extract graphic shapes
  for (const child of syntaxTree.children) {
    if (child.type === 'graphic' && child.graphic === 'shape') {
      positions.push({
        x: child.coordinates.x / 1000000, // Convert from micrometers to mm
        y: child.coordinates.y / 1000000
      })
    }
  }

  return positions
}

/**
 * Find positions that exist in one array but not the other (within tolerance)
 * @param {Array} maskPoints - Points from mask gerber
 * @param {Array} pastePoints - Points from paste gerber
 * @param {number} tolerance - Distance tolerance for considering points the same (default 0.001mm)
 * @returns {Array} Points that are only in mask
 */
export function findMaskOnlyPoints(maskPoints, pastePoints, tolerance = 0.001) {
  return maskPoints.filter(maskPoint => {
    return !pastePoints.some(pastePoint =>
      Math.abs(pastePoint.x - maskPoint.x) < tolerance &&
      Math.abs(pastePoint.y - maskPoint.y) < tolerance
    )
  })
}

/**
 * Load and parse both paste and mask gerber files
 * @param {File} pasteGerberFile - Paste gerber file
 * @param {File} maskGerberFile - Mask gerber file
 * @returns {Promise<{pastePoints: Array, maskPoints: Array, fiducialCandidates: Array}>}
 */
export async function loadGerberFiles(pasteGerberFile, maskGerberFile) {
  const pastePoints = await parseGerberPositions(pasteGerberFile)
  const maskPoints = await parseGerberPositions(maskGerberFile)
  const fiducialCandidates = findMaskOnlyPoints(maskPoints, pastePoints)

  return {
    pastePoints,
    maskPoints,
    fiducialCandidates
  }
}
