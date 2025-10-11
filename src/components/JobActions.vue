<template>
  <div class="bg-gray-700 rounded-lg p-6">
    <div class="flex gap-3">
      <button @click="handleExportJob" class="btn-goldenrod">Export Job</button>
      <button @click="handleRunJob" class="btn-goldenrod">Run Job</button>
    </div>
  </div>
</template>

<script setup>
import { useJobStore } from '../stores/job'

const jobStore = useJobStore()

function handleExportJob() {
  jobStore.saveToFile()
}

function handleRunJob() {
  console.log('Run job clicked')
  // Job running logic will be implemented
}
</script>

<style scoped>
.btn-goldenrod {
  background-color: var(--color-goldenrod);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-weight: 500;
}

.btn-goldenrod:hover {
  background-color: var(--color-goldenrod-dark);
}
</style>
