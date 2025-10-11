<template>
  <div class="job-preview-container">
    <svg
      ref="svgRef"
      class="job-preview-svg"
      :class="{ 'cursor-crosshair': clickMode === 'fiducial-selection' }"
      :viewBox="viewBox"
      @click="handleClick"
    >
      <!-- Fiducials (blue circles) -->
      <g class="fiducials">
        <circle
          v-for="(fid, index) in transformedFiducials"
          :key="`fid-${index}`"
          :cx="fid.x"
          :cy="fid.y"
          :r="fid.selected ? 6 : 4"
          class="fiducial-point"
          :class="{ selected: fid.selected }"
        />
      </g>

      <!-- Placements (red circles) -->
      <g class="placements">
        <circle
          v-for="(placement, index) in transformedPlacements"
          :key="`placement-${index}`"
          :cx="placement.x"
          :cy="placement.y"
          r="3"
          class="placement-point"
        />
      </g>
    </svg>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import Panzoom from '@panzoom/panzoom'

const props = defineProps({
  placements: {
    type: Array,
    default: () => []
  },
  fiducials: {
    type: Array,
    default: () => []
  },
  clickMode: {
    type: String,
    default: null, // 'fiducial-selection' or null
    validator: value => [null, 'fiducial-selection'].includes(value)
  },
  side: {
    type: String,
    default: 'front', // 'front' or 'back'
    validator: value => ['front', 'back'].includes(value)
  }
})

const emit = defineEmits(['fiducial-clicked'])

const svgRef = ref(null)
const selectedFiducials = ref(new Set())
const panzoomInstance = ref(null)
const SVG_WIDTH = 800
const SVG_HEIGHT = 600
const MARGIN_PERCENT = 0.1 // 10% margin

// Calculate bounds and transform points for display
const bounds = computed(() => {
  const allPoints = [...props.placements, ...props.fiducials]

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

const viewBox = computed(() => {
  return `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`
})

// Calculate scale factor to fit points in SVG viewport
const scale = computed(() => {
  const scaleX = SVG_WIDTH / bounds.value.width
  const scaleY = SVG_HEIGHT / bounds.value.height
  return Math.min(scaleX, scaleY)
})

// Transform a point from world coordinates to SVG coordinates
function transformPoint(point, index, isSelected = false) {
  // For backside, flip X-axis (board is viewed from bottom, so left/right are reversed)
  const x = props.side === 'back'
    ? SVG_WIDTH - (point.x - bounds.value.minX) * scale.value
    : (point.x - bounds.value.minX) * scale.value

  // Flip Y axis (SVG Y increases downward, but we want it to increase upward)
  const y = SVG_HEIGHT - (point.y - bounds.value.minY) * scale.value

  return { x, y, index, original: point, selected: isSelected }
}

const transformedPlacements = computed(() => {
  return props.placements.map((p, i) => transformPoint(p, i, false))
})

const transformedFiducials = computed(() => {
  return props.fiducials.map((f, i) => transformPoint(f, i, selectedFiducials.value.has(i)))
})

// Find closest fiducial to click coordinates
function findClosestFiducial(clickX, clickY) {
  const THRESHOLD = 15 // pixels
  let closestIndex = -1
  let minDistance = Infinity

  transformedFiducials.value.forEach((fid, index) => {
    const dx = fid.x - clickX
    const dy = fid.y - clickY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < THRESHOLD && distance < minDistance) {
      minDistance = distance
      closestIndex = index
    }
  })

  return closestIndex
}

function handleClick(event) {
  if (props.clickMode !== 'fiducial-selection') return

  const svg = svgRef.value
  const rect = svg.getBoundingClientRect()

  // Convert click coordinates to SVG coordinates
  const clickX = ((event.clientX - rect.left) / rect.width) * SVG_WIDTH
  const clickY = ((event.clientY - rect.top) / rect.height) * SVG_HEIGHT

  const closestIndex = findClosestFiducial(clickX, clickY)

  if (closestIndex !== -1) {
    selectedFiducials.value.add(closestIndex)
    emit('fiducial-clicked', {
      index: closestIndex,
      fiducial: props.fiducials[closestIndex]
    })
  }
}

// Watch for click mode changes to reset selection
watch(() => props.clickMode, (newMode) => {
  if (newMode !== 'fiducial-selection') {
    selectedFiducials.value.clear()
  }
})

// Initialize panzoom
onMounted(() => {
  if (svgRef.value) {
    panzoomInstance.value = Panzoom(svgRef.value, {
      maxScale: 10,
      minScale: 0.5,
      step: 0.3,
      canvas: true, // Enable better SVG panning
      contain: 'outside', // Allow panning outside the container
      cursor: 'default' // Don't change cursor for panning
    })

    // Enable mouse wheel zoom
    const parent = svgRef.value.parentElement
    if (parent) {
      parent.addEventListener('wheel', panzoomInstance.value.zoomWithWheel)
    }
  }
})

onBeforeUnmount(() => {
  if (panzoomInstance.value) {
    panzoomInstance.value.destroy()
  }
})

// Reset selected fiducials when starting new selection
defineExpose({
  resetSelection() {
    selectedFiducials.value.clear()
  },
  resetZoom() {
    if (panzoomInstance.value) {
      panzoomInstance.value.reset()
    }
  },
  zoomIn() {
    if (panzoomInstance.value) {
      panzoomInstance.value.zoomIn()
    }
  },
  zoomOut() {
    if (panzoomInstance.value) {
      panzoomInstance.value.zoomOut()
    }
  }
})
</script>

<style scoped>
.job-preview-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  background-color: #1f2937; /* gray-800 */
  border-radius: 8px;
  overflow: hidden;
}

.job-preview-svg {
  width: 100%;
  height: 100%;
  cursor: default;
}

.cursor-crosshair {
  cursor: crosshair;
}

.fiducial-point {
  fill: #3b82f6; /* blue-500 */
  stroke: #1d4ed8; /* blue-700 */
  stroke-width: 1;
  transition: all 0.2s ease;
}

.fiducial-point:hover {
  fill: #60a5fa; /* blue-400 */
  stroke-width: 2;
}

.fiducial-point.selected {
  fill: #10b981; /* green-500 */
  stroke: #059669; /* green-600 */
  stroke-width: 2;
}

.placement-point {
  fill: #ef4444; /* red-500 */
  transition: all 0.2s ease;
}

.placement-point:hover {
  fill: #f87171; /* red-400 */
  stroke-width: 1;
}
</style>
