/**
 * Geometry utility functions for 3D plane calculations
 */

/**
 * Calculate plane coefficients from three 3D points
 * Uses cross product of two vectors in the plane to find the normal vector
 * Plane equation: Ax + By + Cz + D = 0
 *
 * @param {Object} p1 - First point {x, y, z}
 * @param {Object} p2 - Second point {x, y, z}
 * @param {Object} p3 - Third point {x, y, z}
 * @returns {Object|null} Plane coefficients {A, B, C, D} or null if invalid
 */
export function calculatePlaneCoefficients(p1, p2, p3) {
  if (!p1 || !p2 || !p3) {
    console.error('Invalid points provided for plane calculation')
    return null
  }

  if (p1.z === null || p2.z === null || p3.z === null) {
    console.error('All points must have valid Z coordinates')
    return null
  }

  // Create two vectors in the plane
  const v1 = {
    x: p2.x - p1.x,
    y: p2.y - p1.y,
    z: p2.z - p1.z
  }

  const v2 = {
    x: p3.x - p1.x,
    y: p3.y - p1.y,
    z: p3.z - p1.z
  }

  // Cross product to get plane normal
  const normal = {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x
  }

  // Plane coefficients
  const A = normal.x
  const B = normal.y
  const C = normal.z
  const D = -(normal.x * p1.x + normal.y * p1.y + normal.z * p1.z)

  return { A, B, C, D }
}

/**
 * Calculate Z coordinate for a given X,Y position on a plane
 * Plane equation: Ax + By + Cz + D = 0
 * Solving for z: z = -(Ax + By + D) / C
 *
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Object} planeCoeffs - Plane coefficients {A, B, C, D}
 * @returns {number|null} Z coordinate or null if invalid
 */
export function getZForPlane(x, y, planeCoeffs) {
  if (!planeCoeffs || planeCoeffs.C === null || planeCoeffs.C === 0) {
    console.error('Invalid plane coefficients or C coefficient is zero')
    return null
  }

  // z = -(A*x + B*y + D) / C
  return -(planeCoeffs.A * x + planeCoeffs.B * y + planeCoeffs.D) / planeCoeffs.C
}
