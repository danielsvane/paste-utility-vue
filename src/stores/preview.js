import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useJobStore } from './job'

export const usePreviewStore = defineStore('preview', () => {
    const jobStore = useJobStore()

    const MARGIN_PERCENT = 0.1 // 10% margin for bounds
    const showMesh = ref(false) // Toggle for mesh visualization

    // Get the appropriate placements to display (always original for gerber preview)
    const displayPlacements = computed(() => jobStore.originalPlacements)

    // Show potential fiducials during selection mode, otherwise show original
    const displayFiducials = computed(() => {
        if (jobStore.isFiducialSelectionMode) {
            return jobStore.potentialFiducials
        }
        return jobStore.originalFiducials
    })

    // Calculate bounds from all points (placements + fiducials)
    const bounds = computed(() => {
        const allPoints = [...displayPlacements.value, ...displayFiducials.value]

        if (allPoints.length === 0) {
            return {
                minX: 0,
                minY: 0,
                maxX: 100,
                maxY: 100,
                width: 100,
                height: 100
            }
        }

        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity

        for (const point of allPoints) {
            minX = Math.min(minX, point.x)
            minY = Math.min(minY, point.y)
            maxX = Math.max(maxX, point.x)
            maxY = Math.max(maxY, point.y)
        }

        const width = maxX - minX
        const height = maxY - minY
        const margin = Math.max(width, height) * MARGIN_PERCENT

        return {
            minX: minX - margin,
            minY: minY - margin,
            maxX: maxX + margin,
            maxY: maxY + margin,
            width: width + 2 * margin,
            height: height + 2 * margin
        }
    })

    // ViewBox based on actual bounds - SVG will scale to fit container
    const viewBox = computed(() => {
        const b = bounds.value
        // Use negative height to flip Y axis so it increases upward
        return `${b.minX} ${-b.maxY} ${b.width} ${b.height}`
    })

    // Responsive point radius based on viewBox size
    const pointRadius = computed(() => {
        // Base radius as a percentage of the viewport
        return Math.max(bounds.value.width, bounds.value.height) * 0.01
    })

    // Enable click mode when in fiducial selection
    const clickMode = computed(() => {
        return jobStore.isFiducialSelectionMode ? 'fiducial-selection' : null
    })

    // Get board side from job store
    const boardSide = computed(() => jobStore.boardSide)

    // Get active placement index for highlighting
    const activePlacementIndex = computed(() => jobStore.lastNavigatedPlacementIndex)

    // Get indices of placements with calibration points (for highlighting)
    const calibratedPlacementIndices = computed(() => {
        return jobStore.planeCalibrationPoints.map(p => p.placementIndex)
    })

    // Transform a point from world coordinates to SVG coordinates
    function transformPoint(point, index, isSelected = false) {
        // For backside, flip X-axis (board is viewed from bottom, so left/right are reversed)
        // Since we're using viewBox, we can work directly with the original coordinates
        const x = boardSide.value === 'back'
            ? bounds.value.maxX - (point.x - bounds.value.minX)
            : point.x

        // Negate Y to flip the axis (SVG Y increases downward, we want it upward)
        const y = -point.y

        return { x, y, index, original: point, selected: isSelected }
    }

    // Transformed placements for display
    const transformedPlacements = computed(() => {
        return displayPlacements.value.map((p, i) => transformPoint(p, i, false))
    })

    // Transformed fiducials for display (with selection state from outside)
    function getTransformedFiducials(selectedFiducials) {
        return displayFiducials.value.map((f, i) =>
            transformPoint(f, i, selectedFiducials.has(i))
        )
    }

    // Get calibration points in original gerber coordinate space for triangulation
    const calibrationPointsInGerberSpace = computed(() => {
        if (!jobStore.planeCalibrationPoints || jobStore.planeCalibrationPoints.length === 0) {
            return []
        }

        // Map calibration points to use original placement XY positions
        return jobStore.planeCalibrationPoints.map(calPoint => {
            const originalPlacement = jobStore.originalPlacements[calPoint.placementIndex]
            if (!originalPlacement) {
                console.warn(`No original placement found for calibration point index ${calPoint.placementIndex}`)
                return null
            }

            // Use original gerber XY, but calibrated Z
            return {
                x: originalPlacement.x,
                y: originalPlacement.y,
                z: calPoint.z
            }
        }).filter(p => p !== null)
    })

    // Transformed triangles with Z-based color mapping
    const transformedTriangles = computed(() => {
        if (!showMesh.value || !jobStore.triangulationData || !jobStore.planeCalibrationPoints.length) {
            console.log('Mesh not shown:', { showMesh: showMesh.value, hasTriangulation: !!jobStore.triangulationData, pointsCount: jobStore.planeCalibrationPoints.length })
            return []
        }

        console.log('Computing mesh triangles...')
        const { delaunay } = jobStore.triangulationData
        const { triangles } = delaunay

        // Use points in gerber coordinate space (not machine coordinates)
        const points = calibrationPointsInGerberSpace.value
        console.log('Using points in gerber space:', points)

        // Calculate min/max Z for color mapping
        let minZ = Infinity
        let maxZ = -Infinity
        for (const p of points) {
            minZ = Math.min(minZ, p.z)
            maxZ = Math.max(maxZ, p.z)
        }

        const zRange = maxZ - minZ || 1 // Avoid division by zero

        // Map Z to color (red = low, blue = high)
        function getColorFromZ(z) {
            // Normalize Z to [0, 1]
            const normalized = (z - minZ) / zRange
            // Map to hue: 0° (red) to 240° (blue)
            const hue = normalized * 240
            return `hsl(${hue}, 70%, 50%)`
        }

        // Build triangle array
        const result = []
        for (let i = 0; i < triangles.length; i += 3) {
            const i0 = triangles[i]
            const i1 = triangles[i + 1]
            const i2 = triangles[i + 2]

            const p1 = points[i0]
            const p2 = points[i1]
            const p3 = points[i2]

            // Transform points to SVG coordinates
            const v1 = transformPoint(p1, i0, false)
            const v2 = transformPoint(p2, i1, false)
            const v3 = transformPoint(p3, i2, false)

            // Calculate average Z for color
            const avgZ = (p1.z + p2.z + p3.z) / 3
            const color = getColorFromZ(avgZ)

            result.push({
                vertices: [v1, v2, v3],
                color
            })
        }

        console.log(`Generated ${result.length} triangles for mesh visualization`)
        if (result.length > 0) {
            console.log('First triangle:', result[0])
        }

        return result
    })

    // Toggle mesh visibility
    function toggleMesh() {
        showMesh.value = !showMesh.value
        console.log('Mesh visibility toggled to:', showMesh.value)
    }

    return {
        // Display data
        displayPlacements,
        displayFiducials,

        // Bounds and transformations
        bounds,
        viewBox,
        pointRadius,

        // UI state
        clickMode,
        boardSide,
        activePlacementIndex,
        calibratedPlacementIndices,

        // Mesh visualization
        showMesh,
        calibrationPointsInGerberSpace,
        transformedTriangles,
        toggleMesh,

        // Transformation methods
        transformPoint,
        transformedPlacements,
        getTransformedFiducials
    }
})

