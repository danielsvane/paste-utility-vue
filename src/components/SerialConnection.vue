<template>
  <div class="serial-connection">
    <!-- Connection Status -->
    <div class="status-section">
      <Label
        :type="serialStore.isConnected ? 'success' : 'default'"
        :text="serialStore.isConnected ? 'Connected' : 'Not Connected'"
        :icon="serialStore.isConnected ? '●' : '○'"
      />

      <!-- Device Information -->
      <div v-if="serialStore.isConnected && serialStore.deviceInfo" class="device-info">
        <div class="device-name">USB Serial Device</div>
        <div class="device-details">
          VID: 0x{{ deviceVendorId }}, PID: 0x{{ deviceProductId }}
        </div>
      </div>
      <div v-else-if="hasAuthorizedPorts" class="device-info">
        <div class="device-name-secondary">Last device available</div>
      </div>
      <div v-else class="device-info">
        <div class="device-name-secondary">No device selected</div>
      </div>
    </div>

    <!-- Actions -->
    <div class="actions-section">
      <!-- Primary action button -->
      <Button
        v-if="!serialStore.isConnected"
        type="primary"
        @click="handleConnect"
      >
        {{ hasAuthorizedPorts ? 'Connect' : 'Select Device' }}
      </Button>

      <!-- Disconnect button when connected -->
      <Button
        v-if="serialStore.isConnected"
        type="secondary"
        @click="handleDisconnect"
      >
        Disconnect
      </Button>

      <!-- Change device tertiary action -->
      <Button
        v-if="hasAuthorizedPorts || serialStore.isConnected"
        type="tertiary"
        size="small"
        @click="handlePickNewDevice"
      >
        Change Device
      </Button>
    </div>

    <!-- Auto-connect checkbox -->
    <label class="auto-connect-label">
      <input
        type="checkbox"
        v-model="serialStore.autoConnect"
        class="checkbox"
      />
      <span class="checkbox-text">Auto-connect on startup</span>
    </label>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useSerialStore } from '../stores/serial'
import Button from './Button.vue'
import Label from './Label.vue'

const modalRef = inject('modal')
const serialStore = useSerialStore()
const hasAuthorizedPorts = ref(false)

const deviceVendorId = computed(() => {
  return serialStore.deviceInfo?.usbVendorId?.toString(16).padStart(4, '0') || '0000'
})

const deviceProductId = computed(() => {
  return serialStore.deviceInfo?.usbProductId?.toString(16).padStart(4, '0') || '0000'
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
    await serialStore.tryAutoConnect()
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

    // Update hasAuthorizedPorts
    const authorizedPorts = await serialStore.getAuthorizedPorts()
    hasAuthorizedPorts.value = authorizedPorts.length > 0
  } catch (err) {
    console.error('Error picking new device:', err)
  }
}
</script>

<style scoped>
.serial-connection {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Status Section */
.status-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Device Information */
.device-info {
  margin-left: 1.5rem;
}

.device-name {
  font-size: 1rem;
  font-weight: 600;
  color: #f3f4f6; /* gray-100 */
}

.device-name-secondary {
  font-size: 0.875rem;
  font-weight: 500;
  color: #9ca3af; /* gray-400 */
}

.device-details {
  font-size: 0.75rem;
  color: #6b7280; /* gray-500 */
  margin-top: 0.25rem;
  font-family: 'Courier New', monospace;
}

/* Actions Section */
.actions-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Auto-connect Checkbox */
.auto-connect-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: #e5e7eb; /* gray-200 */
  font-size: 0.875rem;
}

.checkbox {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
  accent-color: var(--color-goldenrod);
}

.checkbox-text {
  user-select: none;
}
</style>
