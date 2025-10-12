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
      <Button @click="handlePerformFidCal" text="Perform Fid Cal" type="secondary" />
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
      <Button @click="handleGetDisplacementPlane" text="Get Displacement Plane" type="secondary" />
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

const hasRoughPosition = computed(() => {
  return jobStore.roughBoardPosition !== null
})

const roughPosition = computed(() => {
  return jobStore.roughBoardPosition || { x: 0, y: 0, z: 0 }
})

const hasDisplacementPlane = computed(() => {
  return jobStore.planeA !== null &&
         jobStore.planeB !== null &&
         jobStore.planeC !== null &&
         jobStore.planeD !== null
})

const planeFormula = computed(() => {
  if (!hasDisplacementPlane.value) return ''

  const A = jobStore.planeA.toFixed(4)
  const B = jobStore.planeB.toFixed(4)
  const C = jobStore.planeC.toFixed(4)
  const D = jobStore.planeD.toFixed(4)

  return `${A}x + ${B}y + ${C}z + ${D} = 0`
})

const hasFidCal = computed(() => {
  return jobStore.fiducials.length > 0 &&
         jobStore.fiducials.every(fid => fid.calX !== null && fid.calY !== null && fid.calZ !== null)
})

const fidCalStatus = computed(() => {
  const calibratedCount = jobStore.fiducials.filter(
    fid => fid.calX !== null && fid.calY !== null && fid.calZ !== null
  ).length
  return `${calibratedCount} of ${jobStore.fiducials.length} fiducials calibrated`
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
  const pos = roughPosition.value
  return `X: ${pos.x.toFixed(3)}, Y: ${pos.y.toFixed(3)}, Z: ${pos.z.toFixed(3)}`
})

const displacementPlaneStatusText = computed(() => {
  if (!hasDisplacementPlane.value) {
    return 'Displacement plane not calibrated'
  }
  return planeFormula.value
})

const fidCalStatusText = computed(() => {
  if (!hasFidCal.value) {
    return 'Fiducials not calibrated'
  }
  return fidCalStatus.value
})

// Event handlers
function handleNozzleOffsetCal() {
  console.log('Nozzle Offset Cal clicked')
  // TODO: Implement nozzle offset calibration logic
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
  // Calculate plane from fiducials
  const success = jobStore.calculateBoardPlane()
  if (!success) {
    alert('Failed to calculate displacement plane. Ensure 3 fiducials have calZ values.')
  }
}

function handlePerformFidCal() {
  console.log('Perform Fid Cal clicked')
  // TODO: Implement fiducial calibration logic
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
