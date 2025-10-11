<template>
  <Card title="Job Settings">
    <div class="grid grid-cols-3 gap-4">
      <div>
        <label class="block text-sm text-gray-300 mb-1">Dispense Degrees:</label>
        <input
          v-model.number="jobStore.dispenseDegrees"
          type="number"
          min="1"
          max="300"
          class="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
        />
      </div>
      <div>
        <label class="block text-sm text-gray-300 mb-1">Retraction Degrees:</label>
        <input
          v-model.number="jobStore.retractionDegrees"
          type="number"
          min="1"
          max="200"
          class="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
        />
      </div>
      <div>
        <label class="block text-sm text-gray-300 mb-1">Dwell Milliseconds:</label>
        <input
          v-model.number="jobStore.dwellMilliseconds"
          type="number"
          min="0"
          max="5000"
          class="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
        />
      </div>
    </div>
  </Card>
</template>

<script setup>
import Card from './Card.vue'
import { useJobStore } from '../stores/job'

const jobStore = useJobStore()
</script>
