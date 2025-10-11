<template>
  <Card title="Job Actions">
    <div class="flex gap-3">
      <Button @click="handleExportJob" text="Export Job" />
      <Button @click="handleRunJob" text="Run Job" />
    </div>
  </Card>
</template>

<script setup>
import Button from './Button.vue'
import Card from './Card.vue'
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

