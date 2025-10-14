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

    <!-- Jog Distance Slider -->
    <div class="w-full">
      <input type="range" v-model="controls.jogDistance" min="1" max="4" step="1" class="w-full" list="jog-distances" />
      <datalist id="jog-distances">
        <option value="1">0.1mm</option>
        <option value="2">1mm</option>
        <option value="3">10mm</option>
        <option value="4">100mm</option>
      </datalist>
      <div class="text-center text-sm text-gray-400 mt-2">{{ controls.jogDistanceLabel }}</div>
    </div>

    <!-- <Button :full-width="true" class="mt-2" text="Update Z Offset" /> -->
  </div>
</template>

<script setup>
import { useControlsStore } from '../stores/controls';
import { useJobStore } from '../stores/job';
import Button from './Button.vue';

const controls = useControlsStore()
const job = useJobStore()
</script>
