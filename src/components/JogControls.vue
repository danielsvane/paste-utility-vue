<template>
  <div class="flex flex-col items-center gap-2">
    <!-- Jog Buttons -->
    <div class="grid grid-cols-5 gap-3 auto-rows-[80px]">
      <div></div>
      <Button @click="controls.jogYPlus" text="Y+" icon="arrow-up" size="large" fill />
      <div></div>
      <Button @click="controls.jogZPlus" text="Z+" icon="arrow-up" size="large" fill />
      <Button @click="controls.retract" text="Retract" size="large" icon="arrow-up" type="secondary" fill />
      <Button @click="controls.jogXMinus" text="X-" icon="arrow-left" size="large" fill />
      <div></div>
      <Button @click="controls.jogXPlus" text="X+" icon="arrow-right" size="large" fill />
      <div></div>
      <div class="flex flex-col gap-3">
        <Button @click="job.depressurize" text="Depressurize" type="secondary" size="small" fill />
        <Button @click="job.pressurize" text="Pressurize" type="secondary" size="small" fill />
      </div>
      <div></div>
      <Button @click="controls.jogYMinus" text="Y-" icon="arrow-down" size="large" fill />
      <div></div>
      <Button @click="controls.jogZMinus" text="Z-" icon="arrow-down" size="large" fill />
      <Button @click="controls.extrude" text="Extrude" size="large" icon="arrow-down" type="secondary" fill />
    </div>

    <!-- Jog Distance Selector -->
    <div class="w-full">
      <ButtonGroup v-model="controls.jogDistance" :options="jogDistanceOptions" size="medium" full-width />
    </div>

    <!-- <Button :full-width="true" class="mt-2" text="Update Z Offset" /> -->
  </div>
</template>

<script setup>
import { useControlsStore } from '../stores/controls';
import { useJobStore } from '../stores/job';
import Button from './Button.vue';
import ButtonGroup from './ButtonGroup.vue';

const controls = useControlsStore()
const job = useJobStore()

// Jog distance options
const jogDistanceOptions = [
  { label: '0.01mm', value: 0 },
  { label: '0.1mm', value: 1 },
  { label: '1mm', value: 2 },
  { label: '10mm', value: 3 },
  { label: '100mm', value: 4 }
]
</script>
