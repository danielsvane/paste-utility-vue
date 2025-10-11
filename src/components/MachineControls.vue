<template>
  <div class="space-y-6">
    <!-- Control Buttons -->
    <div class="flex gap-3 flex-wrap">
      <Button>Jog to Fid in View</Button>
      <Button>Visual Home</Button>
    </div>

    <div class="flex gap-3 flex-wrap">
      <Button>Pressurize</Button>
      <Button>Depressurize</Button>
    </div>

    <div class="flex gap-3 flex-wrap">
      <Button>Extrude</Button>
      <Button>Start Slow Extrude</Button>
      <Button>Stop Extrude</Button>
      <Button>Retract & Raise</Button>
    </div>

    <div class="flex gap-3 flex-wrap">
      <Button>Extrude Next Position</Button>
      <Button :disabled="true">Continue Automatically</Button>
      <Button>Reset Timer</Button>
    </div>

    <div class="text-center text-goldenrod text-sm p-2 bg-gray-800 rounded">
      Manual mode - learning extrusion times
    </div>

    <!-- Homing Controls -->
    <div class="flex gap-3">
      <Button @click="serial.send('G28')" type="secondary">Home All</Button>
      <Button @click="serial.send('G28 X')" type="secondary">Home X</Button>
      <Button @click="serial.send('G28 Y')" type="secondary">Home Y</Button>
      <Button @click="serial.send('G28 Z')" type="secondary">Home Z</Button>
    </div>

    <!-- Jog Controls -->
    <div class="bg-gray-800 rounded-lg p-6">
      <div class="flex flex-col items-center gap-4">
        <!-- Jog Buttons -->
        <div class="grid grid-cols-3 gap-2">
          <div></div>
          <Button @click="controls.jogYPlus" class="w-16 h-16">Y+</Button>
          <div></div>
          <Button @click="controls.jogXMinus" class="w-16 h-16">X-</Button>
          <div></div>
          <Button @click="controls.jogXPlus" class="w-16 h-16">X+</Button>
          <div></div>
          <Button @click="controls.jogYMinus" class="w-16 h-16">Y-</Button>
          <div></div>
        </div>

        <!-- Z Controls -->
        <div class="flex gap-2">
          <Button @click="controls.jogZPlus">Z+</Button>
          <Button @click="controls.jogZMinus">Z-</Button>
        </div>

        <!-- Extrude/Retract -->
        <div class="flex gap-2">
          <Button @click="controls.extrude">Extrude</Button>
          <Button @click="controls.retract">Retract</Button>
        </div>

        <!-- Jog Distance Slider -->
        <div class="w-full">
          <input
            type="range"
            v-model="controls.jogDistance"
            min="1"
            max="4"
            step="1"
            class="w-full"
            list="jog-distances"
          />
          <datalist id="jog-distances">
            <option value="1">0.1mm</option>
            <option value="2">1mm</option>
            <option value="3">10mm</option>
            <option value="4">100mm</option>
          </datalist>
          <div class="text-center text-sm text-gray-400 mt-2">{{ controls.jogDistanceLabel }}</div>
        </div>

        <Button :full-width="true" class="mt-2">Update Z Offset</Button>
      </div>
    </div>

    <!-- Light and Air Controls -->
    <div class="flex gap-3 flex-wrap">
      <Button type="secondary">Ring Lights On</Button>
      <Button type="secondary">Ring Lights Off</Button>
    </div>

    <div class="flex gap-3 flex-wrap">
      <Button type="secondary">Left Air On</Button>
      <Button type="secondary">Left Air Off</Button>
      <Button type="secondary">Left Vac</Button>
    </div>

    <div>
      <Button type="secondary">Disable Steppers</Button>
    </div>
  </div>
</template>

<script setup>
import Button from './Button.vue'
import { useSerialStore } from '../stores/serial'
import { useControlsStore } from '../stores/controls'

const serial = useSerialStore()
const controls = useControlsStore()
</script>

<style scoped>
@import "tailwindcss" reference;
</style>
