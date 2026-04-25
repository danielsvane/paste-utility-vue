<template>
  <Card title="Calibration">
    <div class="grid gap-x-4 gap-y-3 items-center" style="grid-template-columns: max-content 1fr max-content;">
      <!-- Grid-based board positioning -->
      <div class="flex items-center gap-2">
        <select v-model="gridRow" class="bg-gray-700 text-white rounded px-2 h-11 text-base">
          <option v-for="letter in 'ABCDEFG'" :key="letter" :value="letter">{{ letter }}</option>
        </select>
        <input
          v-model.number="gridCol"
          type="number"
          min="1"
          max="52"
          placeholder="Col"
          class="bg-gray-700 text-white rounded px-2 h-11 w-16 text-base"
        />
        <Button @click="handleSetFromGrid" text="Set from Grid" type="secondary" />
      </div>
      <div class="flex items-center gap-2">
        <font-awesome-icon v-if="hasRoughPosition" icon="circle-check" class="w-6 h-6 flex-shrink-0 text-lg text-green-600" />
        <div v-else class="w-6 h-6 flex-shrink-0"></div>
        <span class="text-sm text-gray-300">{{ roughPositionStatusText }}</span>
      </div>
      <Button v-if="hasRoughPosition" @click="handleClearRoughPosition" icon="xmark" type="tertiary" class="!px-3" />
      <div v-else></div>

      <CalibrationRow
        button-text="Get Board Position"
        :status-text="'Manual fallback'"
        :is-calibrated="false"
        @calibrate="handleGetRoughPosition"
        @clear="handleClearRoughPosition"
      />
      <CalibrationRow
        button-text="Get Z Height"
        :status-text="zHeightStatusText"
        :is-calibrated="hasZHeight"
        @calibrate="handleGetZHeight"
        @clear="handleClearZHeight"
      />
      <CalibrationRow
        button-text="Perform Fid Cal"
        :status-text="fidCalStatusText"
        :is-calibrated="hasFidCal"
        @calibrate="handlePerformFidCal"
        @clear="handleClearFidCal"
      />
      <CalibrationRow
        button-text="Nozzle Offset Cal"
        :status-text="nozzleOffsetStatusText"
        :is-calibrated="hasNozzleOffset"
        @calibrate="handleNozzleOffsetCal"
        @clear="handleClearNozzleOffset"
      />
    </div>
  </Card>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import Card from './Card.vue'
import CalibrationRow from './CalibrationRow.vue'
import Button from './Button.vue'
import { useJobStore } from '../stores/job'
import { decomposeTSR } from 'transformation-matrix'

const jobStore = useJobStore()
const toast = inject('toast')

// Grid position inputs
const gridRow = ref('A')
const gridCol = ref(11)

// Computed properties for calibration status
const hasNozzleOffset = computed(() => jobStore.hasNozzleOffsetCalibration)

const tipXoffset = computed(() => jobStore.effectiveTipXoffset)
const tipYoffset = computed(() => jobStore.effectiveTipYoffset)

// Use new calibration status flags
const hasRoughPosition = computed(() => jobStore.hasRoughCalibration)

const hasZHeight = computed(() => jobStore.hasZCalibration)

const hasFidCal = computed(() => jobStore.hasFidCalibration)

// Status text for each calibration item
const nozzleOffsetStatusText = computed(() => {
  const prefix = hasNozzleOffset.value ? '' : 'Default: '
  return `${prefix}X: ${tipXoffset.value.toFixed(3)}mm, Y: ${tipYoffset.value.toFixed(3)}mm`
})

const roughPositionStatusText = computed(() => {
  if (!hasRoughPosition.value) {
    return 'Board XY position not calibrated'
  }
  // Decompose transformation matrix into meaningful components
  if (jobStore.roughBoardMatrix !== null) {
    const decomposed = decomposeTSR(jobStore.roughBoardMatrix)
    const offsetX = decomposed.translate.tx.toFixed(2)
    const offsetY = decomposed.translate.ty.toFixed(2)
    const rotation = (decomposed.rotation.angle * 180 / Math.PI).toFixed(2)
    const scaleX = decomposed.scale.sx.toFixed(3)
    const scaleY = decomposed.scale.sy.toFixed(3)
    return `Offset: (${offsetX}, ${offsetY})mm, Rot: ${rotation}°, Scale: (${scaleX}, ${scaleY})`
  }
  return 'Rough XY calibration complete'
})

const zHeightStatusText = computed(() => {
  if (!hasZHeight.value) {
    return 'Z height not calibrated'
  }
  return `Z: ${jobStore.baseZ.toFixed(3)}mm`
})

const fidCalStatusText = computed(() => {
  if (!hasFidCal.value) {
    return 'Fiducials not calibrated'
  }
  // Decompose transformation matrix into meaningful components
  if (jobStore.fidCalMatrix !== null) {
    const decomposed = decomposeTSR(jobStore.fidCalMatrix)
    const offsetX = decomposed.translate.tx.toFixed(2)
    const offsetY = decomposed.translate.ty.toFixed(2)
    const rotation = (decomposed.rotation.angle * 180 / Math.PI).toFixed(2)
    const scaleX = decomposed.scale.sx.toFixed(3)
    const scaleY = decomposed.scale.sy.toFixed(3)
    return `Offset: (${offsetX}, ${offsetY})mm, Rot: ${rotation}°, Scale: (${scaleX}, ${scaleY})`
  }
  return `${jobStore.originalFiducials.length} fiducials calibrated`
})

// Event handlers
function handleSetFromGrid() {
  const rowIndex = gridRow.value.charCodeAt(0) - 'A'.charCodeAt(0)
  jobStore.setPositionFromGrid(gridCol.value, rowIndex)
}

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

async function handleGetZHeight() {
  console.log('Get Z Height clicked')
  try {
    await jobStore.findZHeight(toast.value)
    console.log('Z height calibrated successfully')
  } catch (error) {
    console.error('Error during Z height calibration:', error)
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

function handleClearRoughPosition() {
  if (confirm('Are you sure you want to clear the rough board position calibration?')) {
    jobStore.clearRoughCalibration()
    console.log('Rough position calibration cleared')
  }
}

function handleClearZHeight() {
  if (confirm('Are you sure you want to clear the Z height calibration?')) {
    jobStore.clearZCalibration()
    console.log('Z height calibration cleared')
  }
}

function handleClearNozzleOffset() {
  if (confirm('Are you sure you want to clear the nozzle offset calibration?')) {
    jobStore.clearNozzleOffsetCalibration()
    console.log('Nozzle offset calibration cleared')
  }
}
</script>
