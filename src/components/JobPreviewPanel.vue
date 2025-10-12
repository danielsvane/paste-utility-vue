<template>
  <Card title="Job Preview">
    <template #actions>
      <div class="flex items-center gap-4">
        <!-- Zoom Controls -->
        <div class="flex items-center gap-2 border-r border-gray-600 pr-4">
          <Button
            @click="handleZoomIn"
            size="small"
            title="Zoom In"
            text="+"
          />
          <Button
            @click="handleZoomOut"
            size="small"
            title="Zoom Out"
            text="−"
          />
          <Button
            @click="handleResetZoom"
            size="small"
            title="Reset Zoom & Pan"
            text="Reset"
          />
        </div>
        <span class="text-sm text-gray-300">Board Side:</span>
        <label class="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="radio"
            v-model="jobStore.boardSide"
            value="front"
            class="cursor-pointer"
          />
          Front
        </label>
        <label class="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="radio"
            v-model="jobStore.boardSide"
            value="back"
            class="cursor-pointer"
          />
          Back
        </label>
        <div class="border-l border-gray-600 pl-4 flex items-center gap-2">
          <span class="text-sm text-gray-300">Click to Move:</span>
          <label class="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="radio"
              v-model="movementMode"
              value="nozzle"
              class="cursor-pointer"
            />
            Nozzle
          </label>
          <label class="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="radio"
              v-model="movementMode"
              value="camera"
              class="cursor-pointer"
            />
            Camera
          </label>
        </div>
      </div>
    </template>

    <JobPreview
      ref="jobPreviewRef"
      :placements="displayPlacements"
      :fiducials="displayFiducials"
      :side="jobStore.boardSide"
      :click-mode="clickMode"
      :active-placement-index="jobStore.lastNavigatedPlacementIndex"
      :calibrated-placement-indices="calibratedPlacementIndices"
      @fiducial-clicked="handleFiducialClicked"
      @placement-clicked="handlePlacementClicked"
    />
  </Card>
</template>

<script setup>
import { ref, computed } from 'vue'
import Button from './Button.vue'
import Card from './Card.vue'
import { useJobStore } from '../stores/job'
import JobPreview from './JobPreview.vue'

const jobStore = useJobStore()
const jobPreviewRef = ref(null)
const movementMode = ref('nozzle') // Default to nozzle

// Use original positions for preview (not calibrated, since we want to show gerber data)
const displayPlacements = computed(() => jobStore.originalPlacements)

// Show potential fiducials during selection mode, otherwise show original
const displayFiducials = computed(() => {
  if (jobStore.isFiducialSelectionMode) {
    return jobStore.potentialFiducials
  }
  return jobStore.originalFiducials
})

// Enable click mode when in fiducial selection
const clickMode = computed(() => {
  return jobStore.isFiducialSelectionMode ? 'fiducial-selection' : null
})

// Get indices of placements with calibration points
const calibratedPlacementIndices = computed(() => {
  return jobStore.planeCalibrationPoints.map(p => p.placementIndex)
})

function handleFiducialClicked(event) {
  // Forward the click event to the store
  jobStore.handleFiducialClick(event.index)
}

function handlePlacementClicked(event) {
  // Move camera or nozzle to the clicked placement based on movementMode
  // Use calibrated position if available, otherwise use original
  const placement = jobStore.isCalibrated && jobStore.calibratedPlacements.length > event.index
    ? jobStore.calibratedPlacements[event.index]
    : event.placement

  if (!jobStore.isCalibrated) {
    alert('Please complete "Get Rough Board Position" calibration first')
    return
  }

  if (movementMode.value === 'camera') {
    jobStore.moveCameraToPosition(placement, event.index)
  } else {
    jobStore.moveNozzleToPosition(placement, event.index)
  }
}

function handleZoomIn() {
  if (jobPreviewRef.value) {
    jobPreviewRef.value.zoomIn()
  }
}

function handleZoomOut() {
  if (jobPreviewRef.value) {
    jobPreviewRef.value.zoomOut()
  }
}

function handleResetZoom() {
  if (jobPreviewRef.value) {
    jobPreviewRef.value.resetZoom()
  }
}
</script>

