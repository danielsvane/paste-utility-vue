<template>
  <div class="flex flex-col items-center gap-4">
    <!-- Jog Buttons -->
    <div class="grid grid-cols-5 gap-6">
      <div></div>
      <Button @click="controls.jogYPlus" text="Y+" icon="arrow-up" size="large" />
      <div></div>
      <Button @click="controls.jogZPlus" text="Z+" icon="arrow-up" size="large" />
      <Button @click="controls.retract" text="Retract" size="large" icon="arrow-up" type="secondary" />
      <Button @click="controls.jogXMinus" text="X-" icon="arrow-left" size="large" />
      <div></div>
      <Button @click="controls.jogXPlus" text="X+" icon="arrow-right" size="large" />
      <div></div>
      <div></div>
      <div></div>
      <Button @click="controls.jogYMinus" text="Y-" icon="arrow-down" size="large" />
      <div></div>
      <Button @click="controls.jogZMinus" text="Z-" icon="arrow-down" size="large" />
      <Button @click="controls.extrude" text="Extrude" size="large" icon="arrow-down" type="secondary" />
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
import Button from './Button.vue';

const controls = useControlsStore()
</script>
