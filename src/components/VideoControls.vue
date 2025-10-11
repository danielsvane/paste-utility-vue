<template>
  <div class="space-y-6">
    <!-- Video Feed -->
    <div class="bg-gray-800 rounded-lg p-4">
      <canvas id="opencv-canvas" class="w-full bg-black rounded"></canvas>
    </div>

    <!-- Connection Required Notice -->
    <div v-if="!serial.isConnected" class="text-center text-gray-400 text-sm p-4 bg-gray-800 rounded border border-gray-600">
      Connect to machine to access controls
    </div>

    <!-- Control Buttons -->
    <template v-if="serial.isConnected">
      <div class="flex gap-3 flex-wrap">
        <button class="btn-goldenrod">Jog to Fid in View</button>
        <button class="btn-goldenrod">Visual Home</button>
      </div>

      <div class="flex gap-3 flex-wrap">
        <button class="btn-goldenrod">Pressurize</button>
        <button class="btn-goldenrod">Depressurize</button>
      </div>

      <div class="flex gap-3 flex-wrap">
        <button class="btn-goldenrod">Extrude</button>
        <button class="btn-goldenrod">Start Slow Extrude</button>
        <button class="btn-goldenrod">Stop Extrude</button>
        <button class="btn-goldenrod">Retract & Raise</button>
      </div>

      <div class="flex gap-3 flex-wrap">
        <button class="btn-goldenrod">Extrude Next Position</button>
        <button class="btn-goldenrod" disabled>Continue Automatically</button>
        <button class="btn-goldenrod">Reset Timer</button>
      </div>
    </template>

    <template v-if="serial.isConnected">
      <div class="text-center text-goldenrod text-sm p-2 bg-gray-800 rounded">
        Manual mode - learning extrusion times
      </div>

      <!-- Homing Controls -->
      <div class="flex gap-3">
        <button @click="serial.send('G28')" class="btn-gray">Home All</button>
        <button @click="serial.send('G28 X')" class="btn-gray">Home X</button>
        <button @click="serial.send('G28 Y')" class="btn-gray">Home Y</button>
        <button @click="serial.send('G28 Z')" class="btn-gray">Home Z</button>
      </div>
    </template>

    <!-- Jog Controls -->
    <div v-if="serial.isConnected" class="bg-gray-800 rounded-lg p-6">
      <div class="flex flex-col items-center gap-4">
        <!-- Jog Buttons -->
        <div class="grid grid-cols-3 gap-2">
          <div></div>
          <button @click="controls.jogYPlus" class="btn-goldenrod w-16 h-16">Y+</button>
          <div></div>
          <button @click="controls.jogXMinus" class="btn-goldenrod w-16 h-16">X-</button>
          <div></div>
          <button @click="controls.jogXPlus" class="btn-goldenrod w-16 h-16">X+</button>
          <div></div>
          <button @click="controls.jogYMinus" class="btn-goldenrod w-16 h-16">Y-</button>
          <div></div>
        </div>

        <!-- Z Controls -->
        <div class="flex gap-2">
          <button @click="controls.jogZPlus" class="btn-goldenrod">Z+</button>
          <button @click="controls.jogZMinus" class="btn-goldenrod">Z-</button>
        </div>

        <!-- Extrude/Retract -->
        <div class="flex gap-2">
          <button @click="controls.extrude" class="btn-goldenrod">Extrude</button>
          <button @click="controls.retract" class="btn-goldenrod">Retract</button>
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

        <button class="btn-goldenrod w-full mt-2">Update Z Offset</button>
      </div>
    </div>

    <!-- Light and Air Controls -->
    <div v-if="serial.isConnected" class="flex gap-3 flex-wrap">
      <button class="btn-gray">Ring Lights On</button>
      <button class="btn-gray">Ring Lights Off</button>
    </div>

    <div v-if="serial.isConnected" class="flex gap-3 flex-wrap">
      <button class="btn-gray">Left Air On</button>
      <button class="btn-gray">Left Air Off</button>
      <button class="btn-gray">Left Vac</button>
    </div>

    <div v-if="serial.isConnected">
      <button class="btn-gray">Disable Steppers</button>
    </div>

    <!-- Console REPL -->
    <div v-if="serial.isConnected" class="bg-gray-800 rounded-lg p-4">
      <h3 class="text-xl font-medium text-white mb-3">Console</h3>
      <div
        ref="consoleDiv"
        class="bg-black text-green-400 font-mono text-sm p-3 rounded h-48 overflow-y-auto mb-3"
      >
        <p v-for="(msg, idx) in consoleMessages" :key="idx" class="whitespace-pre-wrap">{{ msg }}</p>
      </div>
      <div class="flex gap-2">
        <input
          v-model="replInput"
          @keyup.enter="handleSendCommand"
          @keyup.up="handleArrowUp"
          @keyup.down="handleArrowDown"
          type="text"
          placeholder="Send Gcode"
          class="flex-1 bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
        />
        <button @click="handleSendCommand" class="btn-goldenrod">Send</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSerialStore } from '../stores/serial'
import { useControlsStore } from '../stores/controls'

const serial = useSerialStore()
const controls = useControlsStore()

const replInput = ref('')
const consoleDiv = ref(null)

const consoleMessages = computed(() => {
  return serial.consoleMessages
})

function handleSendCommand() {
  if (replInput.value.trim()) {
    serial.sendRepl(replInput.value)
    replInput.value = ''

    // Auto-scroll to bottom
    setTimeout(() => {
      if (consoleDiv.value) {
        consoleDiv.value.scrollTop = consoleDiv.value.scrollHeight
      }
    }, 0)
  }
}

function handleArrowUp() {
  // Command history navigation
}

function handleArrowDown() {
  // Command history navigation
}
</script>

<style scoped>
@import "tailwindcss" reference;

.btn-goldenrod {
  background-color: var(--color-goldenrod);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-weight: 500;
}

.btn-goldenrod:hover {
  background-color: var(--color-goldenrod-dark);
}

.btn-gray {
  @apply bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium;
}
</style>
