<template>
  <div class="flex flex-col min-h-screen">
    <!-- Header -->
    <div class="bg-gray-800 px-8 py-5 flex items-center gap-6">
      <h1 class="text-2xl font-light text-white">LumenPnP Pasting Utility</h1>
      <FilePicker text="Load Project" type="tertiary" icon="folder-open" accept=".json" @change="handleLoadJob" />
      <Button @click="handleSaveProject" text="Save Project" type="tertiary" icon="save" />
      <Button @click="handleResetProject" text="Reset" type="tertiary" icon="trash" />
      <Button @click="handleRunJob" text="Run Job" type="secondary" icon="play" />
      <div class="flex-1"></div>
      <Button @click="$router.push('/help')" text="Help" type="tertiary" />
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-[1fr_auto] gap-6 p-6">
      <!-- Left Column -->
      <GerberPicker />
      <SerialConnection />
      <div class="flex flex-col gap-6">
        <JobPositionsList />
        <JobPreviewPanel />
        <JobSettings />
      </div>

      <!-- Right Column -->
      <div class="max-w-2xl flex flex-col gap-6">
        <VideoControls />
        <MachineControls v-if="serialStore.isConnected" />
        <SemiAutomaticJob v-if="serialStore.isConnected" />
        <CalibrationPanel v-if="serialStore.isConnected" />
        <ConsoleRepl v-if="serialStore.isConnected" />
      </div>
    </div>
  </div>
</template>

<script setup>
import Button from '../components/Button.vue'
import CalibrationPanel from '../components/CalibrationPanel.vue'
import ConsoleRepl from '../components/ConsoleRepl.vue'
import FilePicker from '../components/FilePicker.vue'
import GerberPicker from '../components/GerberPicker.vue'
import JobPositionsList from '../components/JobPositionsList.vue'
import JobPreviewPanel from '../components/JobPreviewPanel.vue'
import JobSettings from '../components/JobSettings.vue'
import MachineControls from '../components/MachineControls.vue'
import SemiAutomaticJob from '../components/SemiAutomaticJob.vue'
import SerialConnection from '../components/SerialConnection.vue'
import VideoControls from '../components/VideoControls.vue'
import { useJobStore } from '../stores/job'
import { useSerialStore } from '../stores/serial'

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
