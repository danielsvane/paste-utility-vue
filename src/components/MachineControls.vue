<template>
  <Card title="Machine Controls">
    <div class="space-y-6">
      <!-- Control Buttons -->
      <div class="flex gap-3 flex-wrap">
        <Button text="Jog to Fid in View" />
        <Button text="Visual Home" />
      </div>

      <div class="flex gap-3 flex-wrap">
        <Button text="Pressurize" />
        <Button text="Depressurize" />
      </div>

      <div class="flex gap-3 flex-wrap">
        <Button text="Extrude" />
        <Button text="Start Slow Extrude" />
        <Button text="Stop Extrude" />
        <Button text="Retract & Raise" />
      </div>

      <div class="flex gap-3 flex-wrap">
        <Button text="Extrude Next Position" />
        <Button :disabled="true" text="Continue Automatically" />
        <Button text="Reset Timer" />
      </div>

      <div class="text-center text-goldenrod text-sm p-2 bg-gray-700 rounded">
        Manual mode - learning extrusion times
      </div>

      <!-- Homing Controls -->
      <div class="flex gap-3">
        <Button @click="serial.send('G28')" type="secondary" text="Home All" />
        <Button @click="serial.send('G28 X')" type="secondary" text="Home X" />
        <Button @click="serial.send('G28 Y')" type="secondary" text="Home Y" />
        <Button @click="serial.send('G28 Z')" type="secondary" text="Home Z" />
      </div>

      <!-- Jog Controls -->
      <div class="bg-gray-700 rounded-lg p-6">
      <div class="flex flex-col items-center gap-4">
        <!-- Jog Buttons -->
        <div class="grid grid-cols-3 gap-2">
          <div></div>
          <Button @click="controls.jogYPlus" class="w-16 h-16" text="Y+" />
          <div></div>
          <Button @click="controls.jogXMinus" class="w-16 h-16" text="X-" />
          <div></div>
          <Button @click="controls.jogXPlus" class="w-16 h-16" text="X+" />
          <div></div>
          <Button @click="controls.jogYMinus" class="w-16 h-16" text="Y-" />
          <div></div>
        </div>

        <!-- Z Controls -->
        <div class="flex gap-2">
          <Button @click="controls.jogZPlus" text="Z+" />
          <Button @click="controls.jogZMinus" text="Z-" />
        </div>

        <!-- Extrude/Retract -->
        <div class="flex gap-2">
          <Button @click="controls.extrude" text="Extrude" />
          <Button @click="controls.retract" text="Retract" />
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

        <Button :full-width="true" class="mt-2" text="Update Z Offset" />
      </div>
    </div>

    <!-- Light and Air Controls -->
    <div class="flex gap-3 flex-wrap">
      <Button type="secondary" text="Ring Lights On" />
      <Button type="secondary" text="Ring Lights Off" />
    </div>

    <div class="flex gap-3 flex-wrap">
      <Button type="secondary" text="Left Air On" />
      <Button type="secondary" text="Left Air Off" />
      <Button type="secondary" text="Left Vac" />
    </div>

      <div>
        <Button type="secondary" text="Disable Steppers" />
      </div>
    </div>
  </Card>
</template>

<script setup>
import Button from './Button.vue'
import Card from './Card.vue'
import { useSerialStore } from '../stores/serial'
import { useControlsStore } from '../stores/controls'

const serial = useSerialStore()
const controls = useControlsStore()
</script>

<style scoped>
@import "tailwindcss" reference;
</style>
