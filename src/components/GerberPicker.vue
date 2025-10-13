<template>
  <div class="flex gap-4">
    <FilePicker text="Select Paste Gerber" accept=".gbr,.gbp,.gtp" v-model="pasteGerberFile" type="secondary" />
    <FilePicker text="Select Mask Gerber" accept=".gbr,.gbs,.gts" v-model="maskGerberFile" type="secondary" />
    <Button @click="handleLoadGerbers" :disabled="!pasteGerberFile || !maskGerberFile" text="Load Gerbers"
      type="tertiary" icon="circle-down" />
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import { useJobStore } from '../stores/job'
import FilePicker from './FilePicker.vue'
import Button from './Button.vue'

const toast = inject('toast')
const jobStore = useJobStore()
const pasteGerberFile = ref(null)
const maskGerberFile = ref(null)

async function handleLoadGerbers() {
  if (!pasteGerberFile.value || !maskGerberFile.value) {
    alert('Please select both paste and mask gerber files first')
    return
  }
  const result = await jobStore.loadJobFromGerbers(pasteGerberFile.value, maskGerberFile.value)
  if (!result.success) {
    alert('Error loading gerbers: ' + result.error)
    return
  }

  // Automatically start fiducial selection workflow if needed
  if (result.needsFiducialSelection) {
    console.log('Gerbers loaded. Starting fiducial selection workflow.')
    try {
      await jobStore.selectFiducials(toast.value)
      console.log('Fiducial selection completed')
    } catch (error) {
      console.error('Fiducial selection failed:', error)
      alert('Fiducial selection failed: ' + error.message)
    }
  }
}


</script>
