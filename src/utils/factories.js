/**
 * Factory functions for creating plain objects
 */

/**
 * Create a point object with calibration fields
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} z - Z coordinate
 * @returns {Object} Point object with x, y, z and calibration fields
 */
export function createPoint(x, y, z) {
  return {
    x,
    y,
    z,
    calX: null,
    calY: null
  }
}

/**
 * Create a fiducial object with calibration and search fields
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} z - Z coordinate
 * @param {number|null} searchX - Search region X coordinate
 * @param {number|null} searchY - Search region Y coordinate
 * @returns {Object} Fiducial object with coordinates and calibration fields
 */
export function createFiducial(x, y, z, searchX = null, searchY = null) {
  return {
    x,
    y,
    z,
    calX: null,
    calY: null,
    calZ: null,
    searchX,
    searchY
  }
}
