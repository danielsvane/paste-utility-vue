<template>
  <div class="flex gap-4 items-center">
    <button
      @click="handleConnect"
      :disabled="serialStore.isConnected"
      :class="[
        'px-6 py-2 rounded font-medium',
        serialStore.isConnected
          ? 'bg-green-600 text-white cursor-not-allowed'
          : 'text-white'
      ]"
      :style="!serialStore.isConnected ? { backgroundColor: 'var(--color-goldenrod)' } : {}"
      @mouseenter="e => !serialStore.isConnected && (e.target.style.backgroundColor = 'var(--color-goldenrod-dark)')"
      @mouseleave="e => !serialStore.isConnected && (e.target.style.backgroundColor = 'var(--color-goldenrod)')"
    >
      {{ connectButtonText }}
    </button>

    <button
      v-if="!serialStore.isConnected && hasAuthorizedPorts"
      @click="handlePickNewDevice"
      class="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white text-sm"
    >
      Pick Different Device
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useSerialStore } from '../stores/serial'

const modalRef = inject('modal')
const serialStore = useSerialStore()
const hasAuthorizedPorts = ref(false)

const connectButtonText = computed(() => {
  if (serialStore.isConnected) return 'Connected'
  if (hasAuthorizedPorts.value) return 'Reconnect to Device'
  return 'Connect'
})

onMounted(async () => {
  // Initialize serial store with modal reference
  serialStore.setModal(modalRef.value)

  // Setup event listeners for device connect/disconnect
  serialStore.setupEventListeners()

  // Check if we have authorized ports
  const authorizedPorts = await serialStore.getAuthorizedPorts()
  hasAuthorizedPorts.value = authorizedPorts.length > 0

  // Attempt to auto-connect to previously authorized device
  try {
    await serialStore.autoConnect()
  } catch (err) {
    console.error('Auto-connect on mount failed:', err)
  }
})

async function handleConnect() {
  if (serialStore.isConnected) return

  try {
    await serialStore.connect()
    // Update hasAuthorizedPorts after successful connection
    const authorizedPorts = await serialStore.getAuthorizedPorts()
    hasAuthorizedPorts.value = authorizedPorts.length > 0
  } catch (err) {
    alert('Error connecting to serial: ' + err.message)
  }
}

async function handlePickNewDevice() {
  try {
    const usbVendorId = 0x0483
    const selectedPort = await navigator.serial.requestPort({ filters: [{ usbVendorId }] })

    // Open the newly selected port
    await selectedPort.open({
      baudRate: 115200,
      bufferSize: 255,
      dataBits: 8,
      flowControl: 'none',
      parity: 'none',
      stopBits: 1
    })

    serialStore.port = selectedPort
    serialStore.isConnected = true

    // Send boot commands
    await serialStore.send(serialStore.bootCommands || [
      'G90',
      'M260 A112 B1 S1',
      'M260 A109',
      'M260 B48',
      'M260 B27',
      'M260 S1',
      'M260 A112 B2 S1',
      'M260 A109',
      'M260 B48',
      'M260 B27',
      'M260 S1',
      'G0 F35000'
    ])
    await serialStore.send(['M150 P255 R255 U255 B255'])

    // Update hasAuthorizedPorts
    const authorizedPorts = await serialStore.getAuthorizedPorts()
    hasAuthorizedPorts.value = authorizedPorts.length > 0
  } catch (err) {
    console.error('Error picking new device:', err)
  }
}
</script>
