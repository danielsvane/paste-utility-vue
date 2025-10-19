import { parse } from '@tracespace/parser'
import { calculateApertureArea } from './calculateApertureArea'

/**
 * Build aperture lookup table from tool definitions in a Gerber syntax tree
 * @param {Object} syntaxTree - The parsed Gerber syntax tree
 * @returns {Object} - Object mapping aperture codes to their shapes
 */
export function buildApertureLookup(syntaxTree) {
  const apertures = {}

  // Collect all tool definitions
  for (const child of syntaxTree.children) {
    if (child.type === 'toolDefinition') {
      apertures[child.code] = child.shape
    }
  }

  return apertures
}

/**
 * Parse a gerber file and extract position coordinates with area data
 * @param {File} gerberFile - The gerber file to parse
 * @returns {Promise<Array<{x: number, y: number, area: number|null}>>} Array of position objects with x,y coordinates in mm and area in mm²
 */
export async function parseGerberPositions(gerberFile) {
  const gerberText = await gerberFile.text()
  const syntaxTree = parse(gerberText)

  // Build aperture lookup table
  const apertures = buildApertureLookup(syntaxTree)
  console.log('Apertures found:', apertures)

  const positions = []
  let currentAperture = null

  // Iterate through syntax tree and extract graphic shapes with area data
  for (const child of syntaxTree.children) {
    // Track which aperture is currently active
    if (child.type === 'toolChange') {
      currentAperture = child.code
    }

    // Process shape placements
    if (child.type === 'graphic' && child.graphic === 'shape') {
      const x = child.coordinates.x / 1000000 // Convert from micrometers to mm
      const y = child.coordinates.y / 1000000

      // Look up the aperture shape and calculate area
      let area = null

      if (currentAperture && apertures[currentAperture]) {
        const shape = apertures[currentAperture]
        area = calculateApertureArea(shape)
      }

      positions.push({
        x,
        y,
        area
      })
    }
  }

  console.log('Positions with areas:', positions)
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
