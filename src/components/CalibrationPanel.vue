<template>
  <Card title="Calibration">
    <div class="calibration-grid">
      <!-- Get Rough Board Position -->
      <Button @click="handleGetRoughPosition" text="Get Rough Board Position" type="secondary" />
      <div class="status-container">
        <span class="status-indicator" :class="{ completed: hasRoughPosition }">
          {{ hasRoughPosition ? '✓' : '' }}
        </span>
        <span class="status-text" :class="{ calibrated: hasRoughPosition }">
          {{ roughPositionStatusText }}
        </span>
      </div>

      <!-- Perform Fid Cal -->
      <div class="flex gap-2">
        <Button @click="handlePerformFidCal" text="Perform Fid Cal" type="secondary" />
        <Button
          v-if="hasFidCal"
          @click="handleClearFidCal"
          text="Clear"
          type="tertiary"
          class="!px-3"
        />
      </div>
      <div class="status-container">
        <span class="status-indicator" :class="{ completed: hasFidCal }">
          {{ hasFidCal ? '✓' : '' }}
        </span>
        <span class="status-text" :class="{ calibrated: hasFidCal }">
          {{ fidCalStatusText }}
        </span>
      </div>

      <!-- Nozzle Offset Calibration -->
      <Button @click="handleNozzleOffsetCal" text="Nozzle Offset Cal" type="secondary" />
      <div class="status-container">
        <span class="status-indicator" :class="{ completed: hasNozzleOffset }">
          {{ hasNozzleOffset ? '✓' : '' }}
        </span>
        <span class="status-text" :class="{ calibrated: hasNozzleOffset }">
          {{ nozzleOffsetStatusText }}
        </span>
      </div>

      <!-- Get Displacement Plane -->
      <div class="flex gap-2">
        <Button
          v-if="!hasDisplacementPlane"
          @click="handleGetDisplacementPlane"
          text="Get Displacement Plane (Legacy)"
          type="secondary"
        />
        <Button
          v-if="hasDisplacementPlane && jobStore.planeCalibrationPoints.length > 0"
          @click="handleClearCalibrationPoints"
          text="Clear"
          type="tertiary"
          class="!px-3"
        />
      </div>
      <div class="status-container">
        <span class="status-indicator" :class="{ completed: hasDisplacementPlane }">
          {{ hasDisplacementPlane ? '✓' : '' }}
        </span>
        <span class="status-text" :class="{ calibrated: hasDisplacementPlane }">
          {{ displacementPlaneStatusText }}
        </span>
      </div>
    </div>
  </Card>
</template>

<script setup>
import { computed, inject } from 'vue'
import Button from './Button.vue'
import Card from './Card.vue'
import { useJobStore } from '../stores/job'
import { useSerialStore } from '../stores/serial'

const jobStore = useJobStore()
const serialStore = useSerialStore()
const toast = inject('toast')

// Computed properties for calibration status
const hasNozzleOffset = computed(() => {
  return jobStore.tipXoffset !== 0 || jobStore.tipYoffset !== 0
})

const tipXoffset = computed(() => jobStore.tipXoffset)
const tipYoffset = computed(() => jobStore.tipYoffset)

// Use new calibration status flags
const hasRoughPosition = computed(() => jobStore.hasRoughCalibration)

const hasDisplacementPlane = computed(() => jobStore.hasPlaneCalibration)

const hasFidCal = computed(() => jobStore.hasFidCalibration)

const planeFormula = computed(() => {
  if (!hasDisplacementPlane.value || !jobStore.planeCoefficients) return ''

  const A = jobStore.planeCoefficients.A.toFixed(4)
  const B = jobStore.planeCoefficients.B.toFixed(4)
  const C = jobStore.planeCoefficients.C.toFixed(4)
  const D = jobStore.planeCoefficients.D.toFixed(4)

  return `${A}x + ${B}y + ${C}z + ${D} = 0`
})

// Status text for each calibration item
const nozzleOffsetStatusText = computed(() => {
  if (!hasNozzleOffset.value) {
    return 'Nozzle offset not calibrated'
  }
  return `X: ${tipXoffset.value.toFixed(3)}mm, Y: ${tipYoffset.value.toFixed(3)}mm`
})

const roughPositionStatusText = computed(() => {
  if (!hasRoughPosition.value) {
    return 'Board position not calibrated'
  }
  // Show x, y, z position
  if (jobStore.roughBoardPosition !== null) {
    return `X: ${jobStore.roughBoardPosition.x.toFixed(3)}mm, Y: ${jobStore.roughBoardPosition.y.toFixed(3)}mm, Z: ${jobStore.roughBoardPosition.z.toFixed(3)}mm`
  }
  return 'Rough calibration complete'
})

const displacementPlaneStatusText = computed(() => {
  const calibrationPointCount = jobStore.planeCalibrationPoints.length

  if (!hasDisplacementPlane.value) {
    if (calibrationPointCount > 0) {
      return `${calibrationPointCount} placement${calibrationPointCount > 1 ? 's' : ''} with custom Z (need ≥3)`
    }
    return 'Displacement plane not calibrated'
  }

  return `${planeFormula.value} (from ${calibrationPointCount} point${calibrationPointCount > 1 ? 's' : ''})`
})

const fidCalStatusText = computed(() => {
  if (!hasFidCal.value) {
    return 'Fiducials not calibrated'
  }
  return `${jobStore.originalFiducials.length} fiducials calibrated (CV refined)`
})

// Event handlers
async function handleNozzleOffsetCal() {
  console.log('Nozzle Offset Cal clicked')
  try {
    await jobStore.performTipCalibration(toast.value)
    console.log('Nozzle offset calibration completed successfully')
  } catch (error) {
    console.error('Error during nozzle offset calibration:', error)
    alert('Nozzle offset calibration failed: ' + error.message)
  }
}

async function handleGetRoughPosition() {
  console.log('Get Rough Board Position clicked')
  try {
    await jobStore.findBoardRoughPosition(toast.value)
    console.log('Rough board position captured successfully')
  } catch (error) {
    console.error('Error during rough board position capture:', error)
  }
}

function handleGetDisplacementPlane() {
  console.log('Get Displacement Plane clicked')
  // Calculate plane from fiducials (legacy method)
  const success = jobStore.calculateBoardPlane()
  if (!success) {
    alert('Failed to calculate displacement plane. Ensure 3 fiducials have calZ values.')
  }
}

function handleClearCalibrationPoints() {
  if (confirm('Are you sure you want to clear all calibration points and the displacement plane?')) {
    jobStore.clearCalibrationPoints()
    console.log('Calibration points cleared')
  }
}

async function handlePerformFidCal() {
  console.log('Perform Fid Cal clicked')
  try {
    await jobStore.performFiducialCalibration()
    console.log('Fiducial calibration completed successfully')
  } catch (error) {
    console.error('Error during fiducial calibration:', error)
    alert('Fiducial calibration failed: ' + error.message)
  }
}

function handleClearFidCal() {
  if (confirm('Are you sure you want to clear the fiducial calibration? This will revert to using rough calibration.')) {
    jobStore.clearFiducialCalibration()
    console.log('Fiducial calibration cleared')
    console.log('hasFidCal after clear:', hasFidCal.value)
    console.log('fidCalMatrix after clear:', jobStore.fidCalMatrix)
  }
}
</script>

<style scoped>
@reference "tailwindcss";

.calibration-grid {
  @apply grid gap-x-4 gap-y-3 items-center;
  grid-template-columns: max-content 1fr;
}

.status-container {
  @apply flex items-center gap-2;
}

.status-indicator {
  @apply w-6 h-6 flex items-center justify-center rounded-full border-2 border-gray-500 text-sm flex-shrink-0;
}

.status-indicator.completed {
  @apply border-green-500 bg-green-500 text-white;
}

.status-text {
  @apply text-sm text-gray-500;
}

.status-text.calibrated {
  @apply text-green-400 font-mono;
}
</style>
