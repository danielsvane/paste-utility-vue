<template>
  <Card title="Job Positions">
    <template #actions>
      <div class="flex items-center gap-2">
        <!-- Clear All Button -->
        <Button
          v-if="jobStore.originalPlacements.length > 0 || jobStore.originalFiducials.length > 0"
          icon="trash"
          size="small"
          type="secondary"
          @click="handleClearAllPositions"
          title="Clear all placements and fiducials"
        >
          Clear All
        </Button>

        <!-- Z Interpolation Selector -->
        <div v-if="jobStore.hasPlaneCalibration && jobStore.triangulationData" class="flex items-center gap-2">
          <label for="mesh-method" class="text-sm text-gray-400">Z Interpolation:</label>
          <select
            id="mesh-method"
            v-model="jobStore.meshCalibrationMethod"
            class="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="plane">Plane Fit</option>
            <option value="mesh">Mesh</option>
          </select>
        </div>
      </div>
    </template>

    <div class="positions-list text-gray-300">
      <!-- Fiducial selection message -->
      <InfoBox v-if="jobStore.isFiducialSelectionMode" variant="info">
        👉 Click on 3 fiducials in the preview to select them.
      </InfoBox>

      <!-- Calibration status message -->
      <InfoBox
        v-else-if="!jobStore.isCalibrated && (jobStore.originalFiducials.length > 0 || jobStore.originalPlacements.length > 0)"
        variant="warning">
        ⚠ Calibration required. Run "Get Rough Board Position" to enable movement.
      </InfoBox>

      <div
        v-if="jobStore.originalPlacements.length > 0 || jobStore.originalFiducials.length > 0 || jobStore.potentialFiducials.length > 0"
        class="positions-wrapper">
        <div class="positions-grid-container">
          <!-- Header -->
          <div class="grid-header">#</div>
          <div class="grid-header">X</div>
          <div class="grid-header">Y</div>
          <div class="grid-header">Z</div>
          <div class="grid-header">Area</div>
          <div class="grid-header"></div>
          <div class="grid-header">Actions</div>

          <!-- Fiducials Section -->
          <template v-if="jobStore.originalFiducials.length > 0">
            <div class="section-header">
              {{ jobStore.originalFiducials.length }} <span class="text-gray-300">fiducials</span>
            </div>

            <div v-for="(fiducial, index) in displayFiducials" :key="`fiducial-${index}`" class="grid-row fiducial-row">
              <div class="grid-cell text-gray-400">{{ index + 1 }}</div>
              <div class="grid-cell">{{ fiducial.x != null ? fiducial.x.toFixed(3) : 'N/A' }}</div>
              <div class="grid-cell">{{ fiducial.y != null ? fiducial.y.toFixed(3) : 'N/A' }}</div>
              <div class="grid-cell">{{ fiducial.z != null ? fiducial.z.toFixed(3) : 'N/A' }}</div>
              <div class="grid-cell text-gray-500">N/A</div>
              <div class="grid-cell"></div>
              <div class="grid-cell">
                <div class="action-buttons">
                  <Button icon="eye" size="small" type="tertiary" @click="handleMoveCameraToPosition(fiducial)"
                    :disabled="!jobStore.isCalibrated" title="Move camera to position" />
                  <Button icon="syringe" size="small" type="tertiary" @click="handleMoveNozzleToPosition(fiducial)"
                    :disabled="!jobStore.isCalibrated" title="Move nozzle to position" />
                  <Button icon="trash" size="small" type="tertiary" @click="handleDeleteFiducial(index)"
                    title="Delete fiducial" />
                </div>
              </div>
            </div>
          </template>

          <!-- Placements Section -->
          <template v-if="jobStore.originalPlacements.length > 0">
            <div class="section-header">
              {{ jobStore.originalPlacements.length }} <span class="text-gray-300">placements</span>
              <Button
                v-if="jobStore.placementsWithCalibratedZ.length > 0"
                icon="trash"
                size="small"
                type="tertiary"
                @click="handleClearAllCalibrationPoints"
                title="Clear all saved Z heights"
                class="ml-2" />
            </div>

            <div v-for="(placement, index) in displayPlacements" :key="`placement-${index}`" class="grid-row"
              :class="{ 'active-placement': jobStore.lastNavigatedPlacementIndex === index }">
              <div class="grid-cell text-gray-400">{{ index + 1 }}</div>
              <div class="grid-cell">{{ placement.x != null ? placement.x.toFixed(3) : 'N/A' }}</div>
              <div class="grid-cell">{{ placement.y != null ? placement.y.toFixed(3) : 'N/A' }}</div>
              <div class="grid-cell" :class="{ 'calibrated-z': jobStore.hasCalibrationPoint(index) }">
                {{ placement.z != null ? placement.z.toFixed(3) : 'N/A' }}
              </div>
              <div class="grid-cell">{{ placement.area != null ? placement.area.toFixed(3) : 'N/A' }}</div>
              <div class="grid-cell"></div>
              <div class="grid-cell">
                <div class="action-buttons">
                  <Button icon="save" size="small" type="tertiary" @click="handleSaveCalibrationPoint(index)"
                    :disabled="!jobStore.isCalibrated"
                    :title="jobStore.hasCalibrationPoint(index) ? 'Update calibration Z height' : 'Save current Z height for plane calibration'" />
                  <Button icon="eye" size="small" type="tertiary" @click="handleMoveCameraToPosition(placement, index)"
                    :disabled="!jobStore.isCalibrated" title="Move camera to position" />
                  <Button icon="syringe" size="small" type="tertiary"
                    @click="handleMoveNozzleToPosition(placement, index)" :disabled="!jobStore.isCalibrated"
                    title="Move nozzle to position" />
                  <Button icon="trash" size="small" type="tertiary" @click="handleDeletePlacement(index)"
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
import { computed, nextTick, watch } from 'vue'
import { useJobStore } from '../stores/job'
import Button from './Button.vue'
import Card from './Card.vue'
import InfoBox from './InfoBox.vue'

const jobStore = useJobStore()

// Watch for placement selection changes and scroll to selected row
watch(() => jobStore.lastNavigatedPlacementIndex, async (newIndex) => {
  if (newIndex >= 0) {
    // Wait for DOM to update with the active-placement class
    await nextTick()

    // Find the active placement row and scroll it into view within the table only
    const activeRow = document.querySelector('.grid-row.active-placement')
    const scrollContainer = document.querySelector('.positions-wrapper')

    if (activeRow && scrollContainer) {
      // Calculate position to center the row in the scrollable container
      const containerRect = scrollContainer.getBoundingClientRect()
      const rowRect = activeRow.getBoundingClientRect()
      const scrollOffset = rowRect.top - containerRect.top - (containerRect.height / 2) + (rowRect.height / 2)

      // Smooth scroll only the container, not the page
      scrollContainer.scrollTo({
        top: scrollContainer.scrollTop + scrollOffset,
        behavior: 'smooth'
      })
    }
  }
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

function handleClearAllCalibrationPoints() {
  const count = jobStore.placementsWithCalibratedZ.length
  if (confirm(`Clear all ${count} saved Z height${count > 1 ? 's' : ''}?`)) {
    jobStore.clearCalibrationPoints()
    console.log('Cleared all calibration points')
  }
}

function handleClearAllPositions() {
  const placementCount = jobStore.originalPlacements.length
  const fiducialCount = jobStore.originalFiducials.length
  const totalCount = placementCount + fiducialCount

  if (confirm(`Clear all ${totalCount} position${totalCount > 1 ? 's' : ''} (${placementCount} placement${placementCount > 1 ? 's' : ''}, ${fiducialCount} fiducial${fiducialCount > 1 ? 's' : ''})?\n\nThis will also clear all calibration data.`)) {
    jobStore.clearAllPositions()
    console.log('Cleared all positions and calibration data')
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
  grid-template-columns: 50px 80px 80px 80px 80px minmax(0, 1fr) 140px;
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
  @apply col-span-7 text-sm font-semibold text-gray-100 mt-3 mb-2 px-3;
}

.grid-row {
  @apply col-span-7 grid items-center border-b border-gray-700 transition-colors rounded;
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
  @apply bg-blue-900/30;
}

.action-buttons {
  @apply flex gap-1 justify-end;
}

.calibrated-z {
  @apply text-green-400 font-semibold;
}
</style>
