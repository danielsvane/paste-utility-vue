/**
 * Factory functions for creating plain objects
 */

/**
 * Create a point object
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} [z] - Z coordinate (optional, only set for calibrated points)
 * @returns {Object} Point object with x, y, and optionally z coordinates
 */
export function createPoint(x, y, z) {
  const point = { x, y }
  if (z !== undefined) {
    point.z = z
  }
  return point
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
