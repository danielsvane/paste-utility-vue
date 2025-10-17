<template>
  <Card title="Job Preview">
    <template #actions>
      <div class="flex items-center gap-4">
        <ButtonGroup v-model="jobStore.boardSide" :options="boardSideOptions" size="small" />
        <div class="border-l border-gray-600 h-6"></div>
        <ButtonGroup v-model="movementMode" :options="movementModeOptions" size="small" />
        <template v-if="jobStore.triangulationData">
          <div class="border-l border-gray-600 h-6"></div>
          <Button :icon="previewStore.showMesh ? 'eye' : 'eye'" size="small"
            :type="previewStore.showMesh ? 'secondary' : 'tertiary'" @click="previewStore.toggleMesh"
            title="Toggle mesh visualization">
            Mesh
          </Button>
        </template>
      </div>
    </template>

    <JobPreview ref="jobPreviewRef" @fiducial-clicked="handleFiducialClicked"
      @placement-clicked="handlePlacementClicked" />
  </Card>
</template>

<script setup>
import { ref } from 'vue'
import { useJobStore } from '../stores/job'
import { usePreviewStore } from '../stores/preview'
import { useModalStore } from '../stores/modal'
import Button from './Button.vue'
import ButtonGroup from './ButtonGroup.vue'
import Card from './Card.vue'
import JobPreview from './JobPreview.vue'

const jobStore = useJobStore()
const previewStore = usePreviewStore()
const modalStore = useModalStore()
const jobPreviewRef = ref(null)
const movementMode = ref('nozzle') // Default to nozzle

// Button group options
const boardSideOptions = [
  { label: 'Front', value: 'front' },
  { label: 'Back', value: 'back' }
]

const movementModeOptions = [
  { value: 'nozzle', icon: 'syringe' },
  { value: 'camera', icon: 'eye' }
]

function handleFiducialClicked(event) {
  // Forward the click event to the store
  jobStore.handleFiducialClick(event.index)
}

async function handlePlacementClicked(event) {
  // Move camera or nozzle to the clicked placement based on movementMode
  // Use calibrated position if available, otherwise use original
  const placement = jobStore.isCalibrated && jobStore.calibratedPlacements.length > event.index
    ? jobStore.calibratedPlacements[event.index]
    : event.placement

  if (!jobStore.isCalibrated) {
    await modalStore.showAlert('Please complete "Get Rough Board Position" calibration first', 'Calibration Required')
    return
  }

  if (movementMode.value === 'camera') {
    jobStore.moveCameraToPosition(placement, event.index)
  } else {
    jobStore.moveNozzleToPosition(placement, event.index)
  }
}
</script>
