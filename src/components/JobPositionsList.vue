<template>
  <Card title="Job Positions">
    <template #actions>
      <FilePicker text="Select Paste Gerber" accept=".gbr,.gbp,.gtp" v-model="pasteGerberFile" type="secondary" />
      <FilePicker text="Select Mask Gerber" accept=".gbr,.gbs,.gts" v-model="maskGerberFile" type="secondary" />
      <Button @click="handleLoadGerbers" :disabled="!pasteGerberFile || !maskGerberFile" text="Load Gerbers"
        type="tertiary" icon="circle-down" />
    </template>

    <div class="positions-list text-gray-300">
      <p class="text-sm font-semibold mb-3">
        {{ jobStore.placements.length }} placements, {{ jobStore.fiducials.length }} fiducials
      </p>

      <div class="max-h-96 overflow-y-auto space-y-2 pr-2">
        <!-- Placements -->
        <div v-if="jobStore.placements.length > 0" class="space-y-1">
          <h3 class="text-sm font-semibold text-white mb-2">Placements:</h3>
          <div v-for="(placement, index) in jobStore.placements" :key="`placement-${index}`"
            class="bg-gray-800 rounded px-3 py-2 text-xs">
            <span class="text-gray-400">{{ index + 1 }}.</span>
            X: {{ placement.x.toFixed(3) }}
            Y: {{ placement.y.toFixed(3) }}
            Z: {{ placement.z.toFixed(3) }}
          </div>
        </div>

        <!-- Fiducials -->
        <div v-if="jobStore.fiducials.length > 0" class="space-y-1 mt-4">
          <h3 class="text-sm font-semibold text-white mb-2">Fiducials:</h3>
          <div v-for="(fiducial, index) in jobStore.fiducials" :key="`fiducial-${index}`"
            class="bg-blue-900 rounded px-3 py-2 text-xs">
            <span class="text-gray-400">FID {{ index + 1 }}:</span>
            X: {{ fiducial.x.toFixed(3) }}
            Y: {{ fiducial.y.toFixed(3) }}
            Z: {{ fiducial.z.toFixed(3) }}
          </div>
        </div>

        <p v-if="jobStore.placements.length === 0 && jobStore.fiducials.length === 0"
          class="text-gray-500 text-sm italic">
          No positions loaded. Import a job or load gerber files.
        </p>
      </div>
    </div>
  </Card>
</template>

<script setup>
import { ref } from 'vue'
import Button from './Button.vue'
import Card from './Card.vue'
import FilePicker from './FilePicker.vue'
import { useJobStore } from '../stores/job'

const jobStore = useJobStore()

const pasteGerberFile = ref(null)
const maskGerberFile = ref(null)

async function handleLoadGerbers() {
  if (!pasteGerberFile.value || !maskGerberFile.value) {
    alert('Please select both paste and mask gerber files first')
    return
  }
  const result = await jobStore.loadJobFromGerbers(pasteGerberFile.value, maskGerberFile.value)
  if (!result.success) {
    alert('Error loading gerbers: ' + result.error)
  }
}
</script>
