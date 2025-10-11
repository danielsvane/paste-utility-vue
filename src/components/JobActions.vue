<template>
  <div class="bg-gray-700 rounded-lg p-6">
    <div class="flex gap-3">
      <Button @click="handleExportJob">Export Job</Button>
      <Button @click="handleRunJob">Run Job</Button>
    </div>
  </div>
</template>

<script setup>
import Button from './Button.vue'
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

