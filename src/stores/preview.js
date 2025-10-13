import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useJobStore } from './job'

export const usePreviewStore = defineStore('preview', () => {
    const jobStore = useJobStore()

    const MARGIN_PERCENT = 0.1 // 10% margin for bounds

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

        // Transformation methods
        transformPoint,
        transformedPlacements,
        getTransformedFiducials
    }
})

