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

      <div class="max-h-96 overflow-y-auto pr-2">
        <div v-if="jobStore.placements.length > 0 || jobStore.fiducials.length > 0" class="positions-grid-container">
          <!-- Header -->
          <div class="grid-header">#</div>
          <div class="grid-header">X</div>
          <div class="grid-header">Y</div>
          <div class="grid-header">Z</div>
          <div class="grid-header"></div>
          <div class="grid-header">Actions</div>

          <!-- Fiducials Section -->
          <template v-if="jobStore.fiducials.length > 0">
            <div class="section-header">Fiducials:</div>

            <div v-for="(fiducial, index) in jobStore.fiducials" :key="`fiducial-${index}`" class="grid-row fiducial-row">
              <div class="grid-cell text-gray-400">{{ index + 1 }}</div>
              <div class="grid-cell">{{ fiducial.x.toFixed(3) }}</div>
              <div class="grid-cell">{{ fiducial.y.toFixed(3) }}</div>
              <div class="grid-cell">{{ fiducial.z.toFixed(3) }}</div>
              <div class="grid-cell"></div>
              <div class="grid-cell">
                <div class="action-buttons">
                  <Button icon="eye" size="small" type="tertiary" @click="handleMoveCameraToPosition(fiducial)"
                    title="Move camera to position" />
                  <Button icon="syringe" size="small" type="tertiary" @click="handleMoveNozzleToPosition(fiducial)"
                    title="Move nozzle to position" />
                  <Button icon="trash" size="small" type="tertiary" @click="handleDeleteFiducial(index)"
                    title="Delete fiducial" />
                </div>
              </div>
            </div>
          </template>

          <!-- Placements Section -->
          <template v-if="jobStore.placements.length > 0">
            <div class="section-header">Placements:</div>

            <div v-for="(placement, index) in jobStore.placements" :key="`placement-${index}`" class="grid-row">
              <div class="grid-cell text-gray-400">{{ index + 1 }}</div>
              <div class="grid-cell">{{ placement.x.toFixed(3) }}</div>
              <div class="grid-cell">{{ placement.y.toFixed(3) }}</div>
              <div class="grid-cell">{{ placement.z.toFixed(3) }}</div>
              <div class="grid-cell"></div>
              <div class="grid-cell">
                <div class="action-buttons">
                  <Button icon="eye" size="small" type="tertiary" @click="handleMoveCameraToPosition(placement)"
                    title="Move camera to position" />
                  <Button icon="syringe" size="small" type="tertiary" @click="handleMoveNozzleToPosition(placement)"
                    title="Move nozzle to position" />
                  <Button icon="trash" size="small" type="tertiary" @click="handleDeletePlacement(index)"
                    title="Delete position" />
                </div>
              </div>
            </div>
          </template>
        </div>

        <p v-else class="text-gray-500 text-sm italic">
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

function handleMoveCameraToPosition(placement) {
  jobStore.moveCameraToPosition(placement.x, placement.y)
}

function handleMoveNozzleToPosition(placement) {
  jobStore.moveNozzleToPosition(placement.x, placement.y, placement.z)
}

function handleDeletePlacement(index) {
  if (confirm(`Delete placement ${index + 1}?`)) {
    jobStore.deletePlacement(index)
  }
}

function handleDeleteFiducial(index) {
  if (confirm(`Delete fiducial ${index + 1}?`)) {
    jobStore.deleteFiducial(index)
  }
}
</script>

<style scoped>
@reference "../assets/main.css";

.positions-grid-container {
  @apply w-full grid gap-0;
  grid-template-columns: 50px 80px 80px 80px minmax(0, 1fr) 140px;
}

.grid-header {
  @apply text-right px-3 py-2 font-semibold text-gray-400 border-b border-gray-700;
}

.grid-header:first-child {
  @apply text-left;
}

.section-header {
  @apply col-span-6 text-sm font-semibold text-white mt-3 mb-2 px-3;
}

.grid-row {
  @apply col-span-6 grid;
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
}

.grid-cell {
  @apply text-right px-3 py-2 bg-gray-800 border-b border-gray-700 transition-colors;
}

.grid-cell:first-child {
  @apply text-left;
}

/* Hover effect for placement rows */
.grid-row:hover .grid-cell {
  @apply bg-gray-700;
}

/* Fiducial row styling */
.grid-row.fiducial-row .grid-cell {
  @apply bg-blue-900/30;
}

.grid-row.fiducial-row:hover .grid-cell {
  @apply bg-blue-800/40;
}

.action-buttons {
  @apply flex gap-1 justify-end;
}
</style>
