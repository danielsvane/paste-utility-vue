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
          >
            +
          </Button>
          <Button
            @click="handleZoomOut"
            size="small"
            title="Zoom Out"
          >
            −
          </Button>
          <Button
            @click="handleResetZoom"
            size="small"
            title="Reset Zoom & Pan"
          >
            Reset
          </Button>
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
      </div>
    </template>

    <JobPreview
      ref="jobPreviewRef"
      :placements="jobStore.placements"
      :fiducials="jobStore.fiducials"
      :side="jobStore.boardSide"
      :click-mode="null"
    />
  </Card>
</template>

<script setup>
import { ref } from 'vue'
import Button from './Button.vue'
import Card from './Card.vue'
import { useJobStore } from '../stores/job'
import JobPreview from './JobPreview.vue'

const jobStore = useJobStore()
const jobPreviewRef = ref(null)

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

