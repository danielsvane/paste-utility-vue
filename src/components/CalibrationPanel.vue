<template>
  <Card title="Calibration">
    <div class="space-y-3">
      <!-- Nozzle Offset Calibration -->
      <div class="calibration-item">
        <div class="grid grid-cols-2 gap-4 items-center">
          <Button @click="handleNozzleOffsetCal" text="Nozzle Offset Cal" />
          <span class="status-indicator" :class="{ completed: hasNozzleOffset }">
            {{ hasNozzleOffset ? '✓' : '' }}
          </span>
        </div>
        <div v-if="hasNozzleOffset" class="calibration-result">
          X: {{ tipXoffset.toFixed(3) }}mm, Y: {{ tipYoffset.toFixed(3) }}mm
        </div>
      </div>

      <!-- Get Rough Board Position -->
      <div class="calibration-item">
        <div class="grid grid-cols-2 gap-4 items-center">
          <Button @click="handleGetRoughPosition" text="Get Rough Board Position" />
          <span class="status-indicator" :class="{ completed: hasRoughPosition }">
            {{ hasRoughPosition ? '✓' : '' }}
          </span>
        </div>
        <div v-if="hasRoughPosition" class="calibration-result">
          X: {{ roughPosition.x.toFixed(3) }}, Y: {{ roughPosition.y.toFixed(3) }}, Z: {{ roughPosition.z.toFixed(3) }}
        </div>
      </div>

      <!-- Get Displacement Plane -->
      <div class="calibration-item">
        <div class="grid grid-cols-2 gap-4 items-center">
          <Button @click="handleGetDisplacementPlane" text="Get Displacement Plane" />
          <span class="status-indicator" :class="{ completed: hasDisplacementPlane }">
            {{ hasDisplacementPlane ? '✓' : '' }}
          </span>
        </div>
        <div v-if="hasDisplacementPlane" class="calibration-result">
          {{ planeFormula }}
        </div>
      </div>

      <!-- Perform Fid Cal -->
      <div class="calibration-item">
        <div class="grid grid-cols-2 gap-4 items-center">
          <Button @click="handlePerformFidCal" text="Perform Fid Cal" />
          <span class="status-indicator" :class="{ completed: hasFidCal }">
            {{ hasFidCal ? '✓' : '' }}
          </span>
        </div>
        <div v-if="hasFidCal" class="calibration-result">
          {{ fidCalStatus }}
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup>
import { computed } from 'vue'
import Button from './Button.vue'
import Card from './Card.vue'
import { useJobStore } from '../stores/job'
import { useSerialStore } from '../stores/serial'

const jobStore = useJobStore()
const serialStore = useSerialStore()

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

// Event handlers
function handleNozzleOffsetCal() {
  console.log('Nozzle Offset Cal clicked')
  // TODO: Implement nozzle offset calibration logic
}

function handleGetRoughPosition() {
  console.log('Get Rough Board Position clicked')
  // TODO: Implement rough board position capture logic
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

.calibration-item {
  @apply space-y-2;
}

.status-indicator {
  @apply w-6 h-6 flex items-center justify-center rounded-full border-2 border-gray-500 text-sm;
}

.status-indicator.completed {
  @apply border-green-500 bg-green-500 text-white;
}

.calibration-result {
  @apply ml-4 text-sm text-gray-300 bg-gray-800 rounded px-3 py-2 font-mono;
}
</style>
