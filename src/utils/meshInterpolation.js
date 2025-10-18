/**
 * Mesh interpolation utility functions using Delaunay triangulation
 * For non-planar surface interpolation from scattered calibration points
 */

import Delaunator from 'delaunator'

/**
 * Create Delaunay triangulation from calibration points
 *
 * @param {Array} points - Array of point objects with {x, y, z} properties (minimum 3)
 * @returns {Object|null} Triangulation data with {delaunay, points} or null if invalid
 */
export function createDelaunayTriangulation(points) {
  if (!points || points.length < 3) {
    console.error('Need at least 3 points for triangulation')
    return null
  }

  // Validate all points have valid coordinates
  for (const p of points) {
    if (!p || p.x === null || p.y === null || p.z === null) {
      console.error('All points must have valid x, y, z coordinates')
      return null
    }
  }

  try {
    // Create Delaunay triangulation using from() with point array
    // Delaunator.from() expects an array of objects with x,y properties
    const delaunay = Delaunator.from(points, p => p.x, p => p.y)

    // Validate that triangulation was successful
    if (!delaunay.triangles || delaunay.triangles.length === 0) {
      console.error('Delaunay triangulation created no triangles - points may be collinear or degenerate')
      return null
    }

    console.log(`Created Delaunay triangulation with ${points.length} points and ${delaunay.triangles.length / 3} triangles`)

    return {
      delaunay,
      points // Keep reference to original points with Z data
    }
  } catch (error) {
    console.error('Failed to create Delaunay triangulation:', error)
    return null
  }
}

/**
 * Calculate barycentric coordinates for a point P relative to triangle ABC
 * Barycentric coordinates (u, v, w) where P = u*A + v*B + w*C and u+v+w=1
 *
 * @param {number} px - X coordinate of query point
 * @param {number} py - Y coordinate of query point
 * @param {Object} p1 - First triangle vertex {x, y}
 * @param {Object} p2 - Second triangle vertex {x, y}
 * @param {Object} p3 - Third triangle vertex {x, y}
 * @returns {Object} Barycentric coordinates {u, v, w}
 */
export function getBarycentricCoordinates(px, py, p1, p2, p3) {
  // Calculate vectors
  const v0x = p2.x - p1.x
  const v0y = p2.y - p1.y
  const v1x = p3.x - p1.x
  const v1y = p3.y - p1.y
  const v2x = px - p1.x
  const v2y = py - p1.y

  // Calculate dot products
  const dot00 = v0x * v0x + v0y * v0y
  const dot01 = v0x * v1x + v0y * v1y
  const dot02 = v0x * v2x + v0y * v2y
  const dot11 = v1x * v1x + v1y * v1y
  const dot12 = v1x * v2x + v1y * v2y

  // Calculate barycentric coordinates
  const invDenom = 1 / (dot00 * dot11 - dot01 * dot01)
  const v = (dot11 * dot02 - dot01 * dot12) * invDenom
  const w = (dot00 * dot12 - dot01 * dot02) * invDenom
  const u = 1 - v - w

  return { u, v, w }
}

/**
 * Find which triangle contains the query point
 * Returns triangle indices or null if not found
 *
 * @param {number} x - X coordinate of query point
 * @param {number} y - Y coordinate of query point
 * @param {Object} triangulation - Triangulation data from createDelaunayTriangulation
 * @returns {Object|null} Triangle indices {i0, i1, i2} or null if not found
 */
export function findContainingTriangle(x, y, triangulation) {
  const { delaunay, points } = triangulation
  const { triangles } = delaunay

  // Check each triangle
  for (let i = 0; i < triangles.length; i += 3) {
    const i0 = triangles[i]
    const i1 = triangles[i + 1]
    const i2 = triangles[i + 2]

    const p1 = points[i0]
    const p2 = points[i1]
    const p3 = points[i2]

    // Get barycentric coordinates
    const bary = getBarycentricCoordinates(x, y, p1, p2, p3)

    // Point is inside triangle if all barycentric coordinates are >= 0
    // Allow small negative values for numerical tolerance
    const epsilon = -1e-6
    if (bary.u >= epsilon && bary.v >= epsilon && bary.w >= epsilon) {
      return { i0, i1, i2, bary }
    }
  }

  return null
}

/**
 * Find the nearest triangle edge point for extrapolation
 * Used when query point is outside the triangulation
 *
 * @param {number} x - X coordinate of query point
 * @param {number} y - Y coordinate of query point
 * @param {Object} triangulation - Triangulation data from createDelaunayTriangulation
 * @returns {Object} Nearest edge info {triangle: {i0, i1, i2}, closestPoint: {x, y}, bary}
 */
export function findNearestTriangleEdge(x, y, triangulation) {
  const { delaunay, points } = triangulation
  const { triangles } = delaunay

  let minDist = Infinity
  let nearestTriangle = null
  let nearestBary = null
  let closestPoint = null

  // Check each triangle
  for (let i = 0; i < triangles.length; i += 3) {
    const i0 = triangles[i]
    const i1 = triangles[i + 1]
    const i2 = triangles[i + 2]

    const p1 = points[i0]
    const p2 = points[i1]
    const p3 = points[i2]

    // Get barycentric coordinates (will be outside [0,1] range)
    const bary = getBarycentricCoordinates(x, y, p1, p2, p3)

    // Project point onto triangle (clamp barycentric coordinates)
    const u = Math.max(0, Math.min(1, bary.u))
    const v = Math.max(0, Math.min(1, bary.v))
    const w = Math.max(0, Math.min(1, bary.w))

    // Normalize to ensure u + v + w = 1
    const sum = u + v + w
    const uNorm = u / sum
    const vNorm = v / sum
    const wNorm = w / sum

    // Calculate the projected point on triangle
    const projX = uNorm * p1.x + vNorm * p2.x + wNorm * p3.x
    const projY = uNorm * p1.y + vNorm * p2.y + wNorm * p3.y

    // Calculate distance from query point to projected point
    const dx = x - projX
    const dy = y - projY
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < minDist) {
      minDist = dist
      nearestTriangle = { i0, i1, i2 }
      nearestBary = bary // Keep original (unclamped) barycentric coordinates for extrapolation
      closestPoint = { x: projX, y: projY }
    }
  }

  return { triangle: nearestTriangle, bary: nearestBary, closestPoint }
}

/**
 * Interpolate Z height for a given XY position using Delaunay triangulation
 * Handles both interpolation (inside mesh) and extrapolation (outside mesh)
 *
 * @param {number} x - X coordinate of query point
 * @param {number} y - Y coordinate of query point
 * @param {Object} triangulation - Triangulation data from createDelaunayTriangulation
 * @returns {number|null} Interpolated Z height or null if triangulation is invalid
 */
export function interpolateZFromTriangulation(x, y, triangulation) {
  if (!triangulation || !triangulation.delaunay || !triangulation.points) {
    console.error('Invalid triangulation data')
    return null
  }

  // First try to find containing triangle (interpolation)
  const triangle = findContainingTriangle(x, y, triangulation)

  if (triangle) {
    // Point is inside triangulation - interpolate
    const { i0, i1, i2, bary } = triangle
    const { points } = triangulation

    const z1 = points[i0].z
    const z2 = points[i1].z
    const z3 = points[i2].z

    // Interpolate Z using barycentric coordinates
    const z = bary.u * z1 + bary.v * z2 + bary.w * z3

    return z
  } else {
    // Point is outside triangulation - extrapolate from nearest triangle edge
    const nearest = findNearestTriangleEdge(x, y, triangulation)
    const { triangle: nearTriangle, bary } = nearest

    if (!nearTriangle) {
      console.error('No triangles found in triangulation data')
      return null
    }

    const { points } = triangulation

    const z1 = points[nearTriangle.i0].z
    const z2 = points[nearTriangle.i1].z
    const z3 = points[nearTriangle.i2].z

    // Extrapolate Z using barycentric coordinates (may be outside [0,1])
    const z = bary.u * z1 + bary.v * z2 + bary.w * z3

    return z
  }
}
