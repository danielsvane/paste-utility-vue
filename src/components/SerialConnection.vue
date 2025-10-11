<template>
  <div class="serial-connection">
    <!-- Status Label -->
    <Label :type="serialStore.isConnected ? 'success' : 'default'"
      :text="serialStore.isConnected ? 'Connected' : 'Not Connected'"
      :icon="serialStore.isConnected ? 'link' : 'link-slash'" />

    <!-- Reconnect button (only when not connected but has previous device) -->
    <Button v-if="!serialStore.isConnected && hasAuthorizedPorts" type="secondary" @click="handleReconnect"
      text="Reconnect" />

    <!-- Select Device button (always visible when not connected) -->
    <Button v-if="!serialStore.isConnected" type="primary" @click="handlePickNewDevice" text="Select Device" />

    <!-- Disconnect button (only when connected) -->
    <Button v-if="serialStore.isConnected" type="tertiary" @click="handleDisconnect" icon="link-slash"
      text="Disconnect" />

    <!-- Change Device button (only when connected) -->
    <Button v-if="serialStore.isConnected" type="tertiary" @click="handlePickNewDevice" text="Change Device"
      icon="left-right" />

    <!-- Auto-connect checkbox (only when connected) -->
    <label v-if="serialStore.isConnected">
      <input type="checkbox" v-model="serialStore.autoConnect" />
      Auto-connect
    </label>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { useSerialStore } from '../stores/serial'
import Button from './Button.vue'
import Label from './Label.vue'

const modalRef = inject('modal')
const serialStore = useSerialStore()
const hasAuthorizedPorts = ref(false)

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
    await serialStore.tryAutoConnect()
  } catch (err) {
    console.error('Auto-connect on mount failed:', err)
  }
})

async function handleReconnect() {
  if (serialStore.isConnected) return

  try {
    await serialStore.connect()
    // Update hasAuthorizedPorts after successful connection
    const authorizedPorts = await serialStore.getAuthorizedPorts()
    hasAuthorizedPorts.value = authorizedPorts.length > 0
  } catch (err) {
    alert('Error reconnecting to serial: ' + err.message)
  }
}

async function handleDisconnect() {
  if (!serialStore.isConnected) return

  try {
    await serialStore.disconnect()
  } catch (err) {
    alert('Error disconnecting from serial: ' + err.message)
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

    // Update hasAuthorizedPorts after successful connection
    const authorizedPorts = await serialStore.getAuthorizedPorts()
    hasAuthorizedPorts.value = authorizedPorts.length > 0
  } catch (err) {
    console.error('Error picking new device:', err)
  }
}
</script>

<style scoped>
@reference "../assets/main.css";

.serial-connection {
  @apply flex items-center gap-3 flex-wrap;
}
</style>
