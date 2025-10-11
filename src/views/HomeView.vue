<template>
  <div class="flex flex-col min-h-screen">
    <!-- Header -->
    <div class="bg-gray-800 px-8 py-5">
      <h1 class="text-3xl font-semibold text-white">LumenPnP Pasting Utility</h1>
    </div>

    <!-- Top Controls -->
    <div class="bg-gray-800 px-8 py-4 flex gap-4 items-center border-t border-gray-700">
      <a href="/help.html" class="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded">
        Docs
      </a>
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
        {{ serialStore.isConnected ? 'Connected' : 'Connect' }}
      </button>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-2 flex-1 overflow-hidden">
      <!-- Left Column -->
      <div class="p-6 overflow-y-auto bg-gray-800 space-y-6">
        <CalibrationPanel v-if="serialStore.isConnected" />
        <JobImport />
        <JobPositionsList />
        <JobPreviewPanel />
        <JobSettings />
        <JobActions />
      </div>

      <!-- Right Column -->
      <div class="p-6 overflow-y-auto bg-gray-900 border-l border-gray-700 space-y-6">
        <VideoControls />
        <MachineControls v-if="serialStore.isConnected" />
        <ConsoleRepl v-if="serialStore.isConnected" />
      </div>
    </div>

    <!-- Footer -->
    <div class="bg-gray-800 p-4 text-center border-t border-gray-700">
      <img src="/opulo-gold-alpha-tiny.png" alt="Opulo" class="inline-block h-6" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, inject } from 'vue'
import { useSerialStore } from '../stores/serial'
import CalibrationPanel from '../components/CalibrationPanel.vue'
import JobImport from '../components/JobImport.vue'
import JobPositionsList from '../components/JobPositionsList.vue'
import JobPreviewPanel from '../components/JobPreviewPanel.vue'
import JobSettings from '../components/JobSettings.vue'
import JobActions from '../components/JobActions.vue'
import VideoControls from '../components/VideoControls.vue'
import MachineControls from '../components/MachineControls.vue'
import ConsoleRepl from '../components/ConsoleRepl.vue'

const modalRef = inject('modal')
const serialStore = useSerialStore()

onMounted(() => {
  // Initialize serial store with modal reference
  serialStore.setModal(modalRef.value)
})

async function handleConnect() {
  if (serialStore.isConnected) return

  try {
    await serialStore.connect()
  } catch (err) {
    alert('Error connecting to serial: ' + err.message)
  }
}
</script>
