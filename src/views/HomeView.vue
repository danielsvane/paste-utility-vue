<template>
  <div class="flex flex-col min-h-screen">
    <!-- Header -->
    <div class="bg-gray-800 px-8 py-5 flex justify-between items-center gap-6">
      <h1 class="text-2xl font-light text-white">LumenPnP Pasting Utility</h1>
      <FilePicker text="Load Project" type="secondary" icon="folder-open" accept=".json" @change="handleLoadJob" />
      <Button @click="handleSaveProject" text="Save Project" type="secondary" icon="save" />
      <Button @click="handleResetProject" text="Reset" type="secondary" icon="trash" />
      <Button @click="handleRunJob" text="Run Job" type="secondary" icon="play" />
      <div class="flex-1 flex items-center gap-4">
        <SerialConnection />
      </div>
      <Button @click="$router.push('/help')" text="Help" type="tertiary" />
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-2 flex-1 overflow-hidden">
      <!-- Left Column -->
      <div class="p-6 overflow-y-auto bg-gray-900 space-y-6">
        <JobPositionsList />
        <JobPreviewPanel />
        <JobSettings />
      </div>

      <!-- Right Column -->
      <div class="p-6 overflow-y-auto bg-gray-900 space-y-6">
        <VideoControls />
        <MachineControls v-if="serialStore.isConnected" />
        <CalibrationPanel v-if="serialStore.isConnected" />
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
import { useJobStore } from '../stores/job'
import Card from '../components/Card.vue'
import Button from '../components/Button.vue'
import FilePicker from '../components/FilePicker.vue'
import SerialConnection from '../components/SerialConnection.vue'
import CalibrationPanel from '../components/CalibrationPanel.vue'
import JobPositionsList from '../components/JobPositionsList.vue'
import JobPreviewPanel from '../components/JobPreviewPanel.vue'
import JobSettings from '../components/JobSettings.vue'
import VideoControls from '../components/VideoControls.vue'
import MachineControls from '../components/MachineControls.vue'
import ConsoleRepl from '../components/ConsoleRepl.vue'

const serialStore = useSerialStore()
const jobStore = useJobStore()

async function handleLoadJob(file) {
  if (file) {
    const result = await jobStore.importFromFile(file)
    if (!result.success) {
      alert('Failed to import job: ' + result.error)
    } else {
      console.log('Job loaded successfully')
    }
  }
}

function handleSaveProject() {
  try {
    jobStore.saveToFile()
    console.log('Project saved successfully')
  } catch (error) {
    console.error('Failed to save project:', error)
    alert('Failed to save project: ' + error.message)
  }
}

function handleResetProject() {
  if (confirm('Are you sure you want to reset the project? This will clear all job data and calibrations from localStorage.')) {
    // Clear the persisted store data from localStorage
    localStorage.removeItem('job')

    // Reset store to initial state
    jobStore.$reset()

    console.log('Project reset - localStorage cleared')
    alert('Project reset successfully. The page will reload.')

    // Reload page to ensure clean state
    window.location.reload()
  }
}

function handleRunJob() {
  console.log('Run job clicked')
  // Job running logic will be implemented
}
</script>
