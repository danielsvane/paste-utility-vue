/**
 * Factory functions for creating plain objects
 */

/**
 * Create a point object
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} [z] - Z coordinate (optional, only set for calibrated points)
 * @param {number} [area] - Pad area in mm² (optional, from gerber aperture)
 * @returns {Object} Point object with x, y, and optionally z and area
 */
export function createPoint(x, y, z, area) {
  const point = { x, y }
  if (z !== undefined) {
    point.z = z
  }
  if (area !== undefined && area !== null) {
    point.area = area
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
