<template>
  <div class="flex flex-col min-h-screen">
    <!-- Header -->
    <div class="bg-gray-800 px-8 py-5 flex justify-between items-center">
      <h1 class="text-3xl font-semibold text-white">LumenPnP Pasting Utility</h1>
      <a href="/help.html" class="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded">
        Docs
      </a>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-2 flex-1 overflow-hidden">
      <!-- Left Column -->
      <div class="p-6 overflow-y-auto bg-gray-900 space-y-6">
        <CalibrationPanel v-if="serialStore.isConnected" />
        <JobImport />
        <JobPositionsList />
        <JobPreviewPanel />
        <JobSettings />
        <JobActions />
      </div>

      <!-- Right Column -->
      <div class="p-6 overflow-y-auto bg-gray-900 space-y-6">
        <SerialConnection />
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
import { useSerialStore } from '../stores/serial'
import SerialConnection from '../components/SerialConnection.vue'
import CalibrationPanel from '../components/CalibrationPanel.vue'
import JobImport from '../components/JobImport.vue'
import JobPositionsList from '../components/JobPositionsList.vue'
import JobPreviewPanel from '../components/JobPreviewPanel.vue'
import JobSettings from '../components/JobSettings.vue'
import JobActions from '../components/JobActions.vue'
import VideoControls from '../components/VideoControls.vue'
import MachineControls from '../components/MachineControls.vue'
import ConsoleRepl from '../components/ConsoleRepl.vue'

const serialStore = useSerialStore()
</script>
