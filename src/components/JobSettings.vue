<template>
  <Card title="Job Settings">
    <!-- Extrusion Mode Selection -->
    <div class="mb-4">
      <label class="block text-sm text-gray-300 mb-2">Extrusion Mode:</label>
      <div class="flex gap-4">
        <label class="flex items-center cursor-pointer">
          <input
            v-model="jobStore.extrusionMode"
            type="radio"
            value="fixed"
            class="mr-2 cursor-pointer"
          />
          <span class="text-white">Fixed</span>
        </label>
        <label class="flex items-center cursor-pointer">
          <input
            v-model="jobStore.extrusionMode"
            type="radio"
            value="adaptive"
            class="mr-2 cursor-pointer"
          />
          <span class="text-white">Adaptive (Area-Based)</span>
        </label>
      </div>
    </div>

    <!-- Settings Grid -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm text-gray-300 mb-1">
          Dispense Degrees (Fixed):
        </label>
        <input
          v-model.number="jobStore.dispenseDegrees"
          type="number"
          min="1"
          max="300"
          :disabled="jobStore.extrusionMode === 'adaptive'"
          class="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      <div>
        <label class="block text-sm text-gray-300 mb-1">
          Dispense Degrees/mm² (Adaptive):
        </label>
        <input
          v-model.number="jobStore.dispenseAdaptive"
          type="number"
          min="1"
          max="100"
          step="0.1"
          :disabled="jobStore.extrusionMode === 'fixed'"
          class="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

    <!-- Depressurize After Job Checkbox -->
    <div class="mt-4">
      <label class="flex items-center cursor-pointer">
        <input
          v-model="jobStore.depressurizeAfterJob"
          type="checkbox"
          class="mr-2 cursor-pointer"
        />
        <span class="text-white">Depressurize after job</span>
      </label>
    </div>
  </Card>
</template>

<script setup>
import Card from './Card.vue'
import { useJobStore } from '../stores/job'

const jobStore = useJobStore()
</script>
