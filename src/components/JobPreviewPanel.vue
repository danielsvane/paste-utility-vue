<template>
  <Card title="Job Preview">
    <template #actions>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-300">Board Side:</span>
          <ButtonGroup
            v-model="jobStore.boardSide"
            :options="boardSideOptions"
            size="small"
          />
        </div>
        <div class="border-l border-gray-600 pl-4 flex items-center gap-2">
          <span class="text-sm text-gray-300">Click to Move:</span>
          <ButtonGroup
            v-model="movementMode"
            :options="movementModeOptions"
            size="small"
          />
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
import ButtonGroup from './ButtonGroup.vue'
import Card from './Card.vue'
import { useJobStore } from '../stores/job'
import JobPreview from './JobPreview.vue'

const jobStore = useJobStore()
const jobPreviewRef = ref(null)
const movementMode = ref('nozzle') // Default to nozzle

// Button group options
const boardSideOptions = [
  { label: 'Front', value: 'front' },
  { label: 'Back', value: 'back' }
]

const movementModeOptions = [
  { label: 'Nozzle', value: 'nozzle' },
  { label: 'Camera', value: 'camera' }
]

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
</script>

