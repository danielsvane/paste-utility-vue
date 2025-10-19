<template>
  <div class="w-full h-[600px] bg-gray-900/50 rounded-lg overflow-hidden">
    <svg ref="svgRef" class="w-full h-full cursor-default" :viewBox="previewStore.viewBox"
      preserveAspectRatio="xMidYMid meet">
      <!-- Mesh visualization (simple gray triangles) -->
      <g v-if="previewStore.showMesh" style="pointer-events: none;">
        <polygon v-for="(triangle, index) in previewStore.transformedTriangles" :key="`triangle-${index}`"
          :points="`${triangle.vertices[0].x},${triangle.vertices[0].y} ${triangle.vertices[1].x},${triangle.vertices[1].y} ${triangle.vertices[2].x},${triangle.vertices[2].y}`"
          fill="#6b7280" fill-opacity="0.15" stroke="#6b7280" stroke-width="0.3" stroke-opacity="0.4" />
      </g>

      <!-- Fiducials (white circles) -->
      <g>
        <circle v-for="(fid, index) in transformedFiducials" :key="`fid-${index}`" :cx="fid.x" :cy="fid.y"
          :r="previewStore.pointRadius * (fid.selected ? 1.5 : 1)" :class="{
            'fill-white transition-all duration-200 cursor-pointer': !fid.selected,
            'fill-white': !fid.selected && previewStore.clickMode === 'fiducial-selection',
            'fill-green-500 transition-all duration-200 cursor-pointer': fid.selected
          }" @click.stop="handleFiducialClick(index)" />
      </g>

      <!-- Placements (color-coded by Z height when calibrated, scaled by area in adaptive mode) -->
      <g>
        <circle v-for="(placement, index) in previewStore.transformedPlacements" :key="`placement-${index}`"
          :cx="placement.x" :cy="placement.y"
          :r="(placement.radius || previewStore.pointRadius) * (placement.index === previewStore.activePlacementIndex ? 3 : 0.5)"
          :fill="placement.color || 'goldenrod'"
          :stroke="previewStore.calibratedPlacementIndices.includes(placement.index) ? '#22c55e' : 'none'"
          :stroke-width="0.5" :class="{
            'transition-all duration-200 cursor-pointer': true,
            'animate-pulse': placement.index === previewStore.activePlacementIndex
          }" @click.stop="handlePlacementClick(placement.index)" />
      </g>
    </svg>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import Panzoom from '@panzoom/panzoom'
import { usePreviewStore } from '../stores/preview'

const previewStore = usePreviewStore()

const emit = defineEmits(['fiducial-clicked', 'placement-clicked'])

const svgRef = ref(null)
const selectedFiducials = ref(new Set())
const panzoomInstance = ref(null)

// Compute transformed fiducials with local selection state
const transformedFiducials = computed(() => {
  return previewStore.getTransformedFiducials(selectedFiducials.value)
})

// Handle clicks on fiducials
function handleFiducialClick(index) {
  // Only handle fiducial clicks when in fiducial selection mode
  if (previewStore.clickMode === 'fiducial-selection') {
    selectedFiducials.value.add(index)
    emit('fiducial-clicked', {
      index,
      fiducial: previewStore.displayFiducials[index]
    })
  }
}

// Handle clicks on placements
function handlePlacementClick(index) {
  // Only handle placement clicks when NOT in fiducial selection mode
  if (previewStore.clickMode !== 'fiducial-selection') {
    emit('placement-clicked', {
      index,
      placement: previewStore.displayPlacements[index]
    })
  }
}

// Watch for click mode changes to reset selection
watch(() => previewStore.clickMode, (newMode) => {
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
