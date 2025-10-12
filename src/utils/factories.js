/**
 * Factory functions for creating plain objects
 */

/**
 * Create a point object
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} z - Z coordinate
 * @returns {Object} Point object with x, y, z coordinates
 */
export function createPoint(x, y, z) {
  return {
    x,
    y,
    z
  }
}

/**
 * Create a fiducial object
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} z - Z coordinate
 * @returns {Object} Fiducial object with x, y, z coordinates
 */
export function createFiducial(x, y, z) {
  return {
    x,
    y,
    z
  }
}
