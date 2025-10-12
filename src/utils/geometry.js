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

/**
 * Calculate best-fit plane from multiple 3D points using least-squares method
 * Fits the plane equation: z = Ax + By + C
 * Then converts to standard form: Ax + By - z + C = 0
 *
 * @param {Array} points - Array of point objects with {x, y, z} properties (minimum 3)
 * @returns {Object|null} Plane coefficients {A, B, C, D} or null if invalid
 */
export function calculateBestFitPlane(points) {
  if (!points || points.length < 3) {
    console.error('Need at least 3 points for best-fit plane calculation')
    return null
  }

  // Validate all points have valid coordinates
  for (const p of points) {
    if (!p || p.x === null || p.y === null || p.z === null) {
      console.error('All points must have valid x, y, z coordinates')
      return null
    }
  }

  const n = points.length

  // Calculate sums for least-squares solution
  // We're fitting z = Ax + By + C
  let sumX = 0, sumY = 0, sumZ = 0
  let sumXX = 0, sumYY = 0, sumXY = 0
  let sumXZ = 0, sumYZ = 0

  for (const p of points) {
    sumX += p.x
    sumY += p.y
    sumZ += p.z
    sumXX += p.x * p.x
    sumYY += p.y * p.y
    sumXY += p.x * p.y
    sumXZ += p.x * p.z
    sumYZ += p.y * p.z
  }

  // Set up the normal equations: [XX XY X] [A]   [XZ]
  //                               [XY YY Y] [B] = [YZ]
  //                               [X  Y  n] [C]   [Z ]

  // Solve using Cramer's rule
  const det = sumXX * (sumYY * n - sumY * sumY) -
              sumXY * (sumXY * n - sumX * sumY) +
              sumX * (sumXY * sumY - sumYY * sumX)

  if (Math.abs(det) < 1e-10) {
    console.error('Points are colinear or degenerate - cannot fit plane')
    return null
  }

  // Calculate A coefficient
  const detA = sumXZ * (sumYY * n - sumY * sumY) -
               sumXY * (sumYZ * n - sumZ * sumY) +
               sumX * (sumYZ * sumY - sumYY * sumZ)
  const A = detA / det

  // Calculate B coefficient
  const detB = sumXX * (sumYZ * n - sumZ * sumY) -
               sumXZ * (sumXY * n - sumX * sumY) +
               sumX * (sumXY * sumZ - sumYZ * sumX)
  const B = detB / det

  // Calculate C coefficient
  const detC = sumXX * (sumYY * sumZ - sumY * sumYZ) -
               sumXY * (sumXY * sumZ - sumX * sumYZ) +
               sumXZ * (sumXY * sumY - sumYY * sumX)
  const C = detC / det

  // Convert from z = Ax + By + C to standard form Ax + By + Cz + D = 0
  // Standard form: Ax + By - z + C = 0
  // So our coefficients are: (A, B, -1, C)
  return {
    A: A,
    B: B,
    C: -1,
    D: C
  }
}
