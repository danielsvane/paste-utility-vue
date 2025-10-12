<template>
  <Card title="Job Positions">
    <template #actions>
      <FilePicker text="Select Paste Gerber" accept=".gbr,.gbp,.gtp" v-model="pasteGerberFile" type="secondary" />
      <FilePicker text="Select Mask Gerber" accept=".gbr,.gbs,.gts" v-model="maskGerberFile" type="secondary" />
      <Button @click="handleLoadGerbers" :disabled="!pasteGerberFile || !maskGerberFile" text="Load Gerbers"
        type="tertiary" icon="circle-down" />
      <Button @click="handleSelectFiducials" :disabled="!canSelectFiducials" text="Select Fiducials"
        type="tertiary" icon="crosshairs" />
    </template>

    <div class="positions-list text-gray-300">
      <!-- Fiducial selection message -->
      <div v-if="jobStore.isFiducialSelectionMode"
           class="calibration-warning text-blue-400 text-sm mb-3 p-2 bg-blue-900/20 rounded">
        👉 Click on 3 fiducials in the preview to select them.
      </div>

      <!-- Calibration status message -->
      <div v-else-if="!jobStore.isCalibrated && (jobStore.originalFiducials.length > 0 || jobStore.originalPlacements.length > 0)"
           class="calibration-warning text-yellow-500 text-sm mb-3 p-2 bg-yellow-900/20 rounded">
        ⚠ Calibration required. Run "Get Rough Board Position" to enable movement.
      </div>

      <div v-if="jobStore.originalPlacements.length > 0 || jobStore.originalFiducials.length > 0 || jobStore.potentialFiducials.length > 0" class="positions-wrapper">
        <div class="positions-grid-container">
          <!-- Header -->
          <div class="grid-header">#</div>
          <div class="grid-header">X</div>
          <div class="grid-header">Y</div>
          <div class="grid-header">Z</div>
          <div class="grid-header"></div>
          <div class="grid-header">Actions</div>

          <!-- Fiducials Section -->
          <template v-if="jobStore.originalFiducials.length > 0">
            <div class="section-header">
              {{ jobStore.originalFiducials.length }} <span class="text-gray-300">fiducials</span>
            </div>

            <div v-for="(fiducial, index) in displayFiducials" :key="`fiducial-${index}`"
              class="grid-row fiducial-row">
              <div class="grid-cell text-gray-400">{{ index + 1 }}</div>
              <div class="grid-cell">{{ fiducial.x !== null ? fiducial.x.toFixed(3) : 'N/A' }}</div>
              <div class="grid-cell">{{ fiducial.y !== null ? fiducial.y.toFixed(3) : 'N/A' }}</div>
              <div class="grid-cell">{{ fiducial.z !== null ? fiducial.z.toFixed(3) : 'N/A' }}</div>
              <div class="grid-cell"></div>
              <div class="grid-cell">
                <div class="action-buttons">
                  <Button icon="eye" size="small" type="tertiary"
                    @click="handleMoveCameraToPosition(fiducial)"
                    :disabled="!jobStore.isCalibrated"
                    title="Move camera to position" />
                  <Button icon="syringe" size="small" type="tertiary"
                    @click="handleMoveNozzleToPosition(fiducial)"
                    :disabled="!jobStore.isCalibrated"
                    title="Move nozzle to position" />
                  <Button icon="trash" size="small" type="tertiary"
                    @click="handleDeleteFiducial(index)"
                    title="Delete fiducial" />
                </div>
              </div>
            </div>
          </template>

          <!-- Placements Section -->
          <template v-if="jobStore.originalPlacements.length > 0">
            <div class="section-header">
              {{ jobStore.originalPlacements.length }} <span class="text-gray-300">placements</span>
            </div>

            <div v-for="(placement, index) in displayPlacements" :key="`placement-${index}`"
                 class="grid-row"
                 :class="{ 'active-placement': jobStore.lastNavigatedPlacementIndex === index }">
              <div class="grid-cell text-gray-400">{{ index + 1 }}</div>
              <div class="grid-cell">{{ placement.x !== null ? placement.x.toFixed(3) : 'N/A' }}</div>
              <div class="grid-cell">{{ placement.y !== null ? placement.y.toFixed(3) : 'N/A' }}</div>
              <div class="grid-cell" :class="{ 'calibrated-z': jobStore.hasCalibrationPoint(index) }">
                {{ placement.z !== null ? placement.z.toFixed(3) : 'N/A' }}
              </div>
              <div class="grid-cell"></div>
              <div class="grid-cell">
                <div class="action-buttons">
                  <Button icon="eye" size="small" type="tertiary"
                    @click="handleMoveCameraToPosition(placement, index)"
                    :disabled="!jobStore.isCalibrated"
                    title="Move camera to position" />
                  <Button icon="syringe" size="small" type="tertiary"
                    @click="handleMoveNozzleToPosition(placement, index)"
                    :disabled="!jobStore.isCalibrated"
                    title="Move nozzle to position" />
                  <Button icon="save" size="small" type="tertiary"
                    @click="handleSaveCalibrationPoint(index)"
                    :disabled="!jobStore.isCalibrated"
                    :title="jobStore.hasCalibrationPoint(index) ? 'Update calibration Z height' : 'Save current Z height for plane calibration'" />
                  <Button icon="trash" size="small" type="tertiary"
                    @click="handleDeletePlacement(index)"
                    title="Delete position" />
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <p v-else class="text-gray-500 text-sm italic">
        No positions loaded. Import a job or load gerber files.
      </p>
    </div>
  </Card>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import Button from './Button.vue'
import Card from './Card.vue'
import FilePicker from './FilePicker.vue'
import { useJobStore } from '../stores/job'

const jobStore = useJobStore()
const toast = inject('toast')

const pasteGerberFile = ref(null)
const maskGerberFile = ref(null)

// Check if fiducial selection is possible
const canSelectFiducials = computed(() => {
  return jobStore.potentialFiducials.length >= 3 || jobStore.originalFiducials.length >= 3
})

// Use calibrated positions if available, otherwise show original positions
const displayFiducials = computed(() => {
  // Hide during selection mode - user selects on preview
  if (jobStore.isFiducialSelectionMode) {
    return []
  }

  if (jobStore.isCalibrated && jobStore.calibratedFiducials.length > 0) {
    return jobStore.calibratedFiducials
  }
  return jobStore.originalFiducials
})

const displayPlacements = computed(() => {
  if (jobStore.isCalibrated && jobStore.calibratedPlacements.length > 0) {
    return jobStore.calibratedPlacements
  }
  return jobStore.originalPlacements
})

async function handleLoadGerbers() {
  if (!pasteGerberFile.value || !maskGerberFile.value) {
    alert('Please select both paste and mask gerber files first')
    return
  }
  const result = await jobStore.loadJobFromGerbers(pasteGerberFile.value, maskGerberFile.value)
  if (!result.success) {
    alert('Error loading gerbers: ' + result.error)
    return
  }

  // Automatically start fiducial selection workflow if needed
  if (result.needsFiducialSelection) {
    console.log('Gerbers loaded. Starting fiducial selection workflow.')
    try {
      await jobStore.selectFiducials(toast.value)
      console.log('Fiducial selection completed')
    } catch (error) {
      console.error('Fiducial selection failed:', error)
      alert('Fiducial selection failed: ' + error.message)
    }
  }
}

async function handleSelectFiducials() {
  // Start selection mode
  if (!jobStore.startFiducialSelection()) {
    alert('Need at least 3 fiducial candidates to select from')
    return
  }

  try {
    // Run the selection workflow
    await jobStore.selectFiducials({
      show: (message) => {
        return new Promise((resolve) => {
          // Simple alert-based approach for now
          // TODO: Replace with proper toast component
          alert(message)
          resolve()
        })
      }
    })
    console.log('Fiducial selection completed')
  } catch (error) {
    console.error('Fiducial selection failed:', error)
    alert('Fiducial selection failed: ' + error.message)
  }
}

function handleMoveCameraToPosition(position, index) {
  jobStore.moveCameraToPosition(position, index)
}

function handleMoveNozzleToPosition(position, index) {
  jobStore.moveNozzleToPosition(position, index)
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

async function handleSaveCalibrationPoint(index) {
  try {
    await jobStore.saveCalibrationPointForPlacement(index)
    console.log(`Saved calibration point for placement ${index + 1}`)
  } catch (error) {
    console.error('Error saving calibration point:', error)
    alert('Failed to save calibration point: ' + error.message)
  }
}
</script>

<style scoped>
@reference "../assets/main.css";

.positions-wrapper {
  @apply max-h-96 overflow-y-auto pr-2;
}

.positions-grid-container {
  @apply w-full grid gap-0;
  grid-template-columns: 50px 80px 80px 80px minmax(0, 1fr) 140px;
}

.grid-header {
  @apply text-right px-3 py-2 font-semibold text-gray-400 bg-gray-900/80;
  position: sticky;
  top: 0;
  z-index: 10;
}

.grid-header:first-child {
  @apply text-left;
}

.section-header {
  @apply col-span-6 text-sm font-semibold text-gray-100 mt-3 mb-2 px-3;
}

.grid-row {
  @apply col-span-6 grid items-center border-b border-gray-700 transition-colors rounded;
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
}

.grid-cell {
  @apply text-right text-sm px-2 py-1 text-gray-100;
}

.grid-cell:first-child {
  @apply text-left text-gray-400;
}

.grid-row:hover {
  @apply bg-gray-700;
}

.grid-row.active-placement {
  @apply bg-blue-900/30 border-l-4 border-blue-500;
}

.action-buttons {
  @apply flex gap-1 justify-end;
}

.calibrated-z {
  @apply text-green-400 font-semibold;
}
</style>
