/**
 * Estimate area for macro shapes by calculating bounding box from parameters
 * @param {Object} shape - The macro shape object with variableValues and name
 * @returns {number|null} - Estimated area in mm² or null if unable to calculate
 */
export function estimateMacroArea(shape) {
  if (!shape.variableValues || shape.variableValues.length === 0) {
    return null
  }

  const values = shape.variableValues
  const name = shape.name.toLowerCase()

  const coords = []
  let startIndex = 0
  let endIndex = values.length

  // Determine parameter format based on macro name
  if (name.includes('roundrect') || name.includes('roundedrect')) {
    // RoundRect: [radius, x1, y1, x2, y2, x3, y3, x4, y4, rotation]
    // Format from Gerber macro: $1=radius, $2-$9=4 corners, last=rotation
    // IMPORTANT: The rounding radius extends BEYOND the corner coordinates
    // Actual dimensions = bounding box + 2*radius on each axis
    const radius = values[0]
    startIndex = 1 // Skip radius
    endIndex = values.length - 1 // Skip rotation at end

    // Extract coordinate pairs
    for (let i = startIndex; i < endIndex - 1; i += 2) {
      if (i + 1 < endIndex) {
        coords.push({ x: values[i], y: values[i + 1] })
      }
    }

    if (coords.length === 0) {
      return 0.5 // fallback
    }

    // Calculate bounding box from corner coordinates
    const xValues = coords.map((c) => c.x)
    const yValues = coords.map((c) => c.y)

    const minX = Math.min(...xValues)
    const maxX = Math.max(...xValues)
    const minY = Math.min(...yValues)
    const maxY = Math.max(...yValues)

    // Add rounding radius to each side (circles extend beyond corners)
    const width = Math.abs(maxX - minX) + 2 * radius
    const height = Math.abs(maxY - minY) + 2 * radius

    const area = width * height

    return area
  } else if (name.includes('rotrect') || name.includes('rotatedrect')) {
    // RotRect: [width, height, rotation]
    // Just use width × height directly
    if (values.length >= 2) {
      const area = Math.abs(values[0] * values[1])
      return area
    }
  } else if (name.includes('outline')) {
    // Outline5P, Outline, etc: [x1, y1, x2, y2, ..., rotation]
    // Last value is rotation
    startIndex = 0
    endIndex = values.length - 1
  } else if (name.includes('freepoly') || name.includes('poly')) {
    // FreePoly0: [numVertices, x1, y1, x2, y2, ..., rotation]
    // First value is vertex count, last is rotation
    startIndex = 1
    endIndex = values.length - 1
  } else {
    // Unknown macro - try generic approach
    // Assume first value might be radius/size, last might be rotation
    startIndex = Math.abs(values[0]) < 5 ? 1 : 0
    endIndex = Math.abs(values[values.length - 1]) > 50 ? values.length - 1 : values.length
  }

  // Extract coordinate pairs (keep actual signed values for proper bounding box)
  for (let i = startIndex; i < endIndex - 1; i += 2) {
    if (i + 1 < endIndex) {
      coords.push({ x: values[i], y: values[i + 1] })
    }
  }

  if (coords.length === 0) {
    return 0.5 // fallback
  }

  // Calculate bounding box from signed coordinates
  const xValues = coords.map((c) => c.x)
  const yValues = coords.map((c) => c.y)

  const minX = Math.min(...xValues)
  const maxX = Math.max(...xValues)
  const minY = Math.min(...yValues)
  const maxY = Math.max(...yValues)

  const width = Math.abs(maxX - minX)
  const height = Math.abs(maxY - minY)

  const area = width * height

  return area
}

/**
 * Calculate area in mm² for a given aperture shape
 * @param {Object} shape - The aperture shape object
 * @returns {number|null} - Area in mm² or null if unable to calculate
 */
export function calculateApertureArea(shape) {
  if (!shape) return null

  switch (shape.type) {
    case 'circle':
      // Area = π × r²
      const radius = shape.diameter / 2
      return Math.PI * radius * radius

    case 'rectangle':
      // Area = width × height
      return shape.xSize * shape.ySize

    case 'obround':
      // Obround is a rectangle with semicircular ends
      // Area = rectangular part + circular ends
      const minDim = Math.min(shape.xSize, shape.ySize)
      const maxDim = Math.max(shape.xSize, shape.ySize)
      const rectArea = (maxDim - minDim) * minDim
      const circArea = Math.PI * (minDim / 2) * (minDim / 2)
      return rectArea + circArea

    case 'polygon':
      // Regular polygon area = (n × s²) / (4 × tan(π/n))
      // where s = side length ≈ diameter × sin(π/n)
      const n = shape.vertices
      const r = shape.diameter / 2
      return (n * r * r * Math.sin((2 * Math.PI) / n)) / 2

    case 'macroShape':
      // Estimate area from bounding box of macro parameters
      return estimateMacroArea(shape)

    default:
      console.warn(`Unknown aperture shape type: ${shape.type}`)
      return null
  }
}
