<template>
  <div class="bg-gray-800 rounded-lg p-4">
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
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSerialStore } from '../stores/serial'

const serial = useSerialStore()

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
</style>
