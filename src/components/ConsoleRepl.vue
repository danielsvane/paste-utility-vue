<template>
  <Card title="Console">
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
      <Button @click="handleSendCommand">Send</Button>
    </div>
  </Card>
</template>

<script setup>
import { ref, computed } from 'vue'
import Button from './Button.vue'
import Card from './Card.vue'
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

