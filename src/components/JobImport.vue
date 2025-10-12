<template>
  <Card title="Job Import">
    <div class="flex flex-wrap gap-3 items-center">
      <FilePicker
        text="Import Job"
        accept=".json"
        @change="handleJobImport"
      />
    </div>
  </Card>
</template>

<script setup>
import Card from './Card.vue'
import FilePicker from './FilePicker.vue'
import { useJobStore } from '../stores/job'

const jobStore = useJobStore()

async function handleJobImport(file) {
  if (file) {
    const result = await jobStore.importFromFile(file)
    if (!result.success) {
      alert('Failed to import job: ' + result.error)
    }
  }
}
</script>
