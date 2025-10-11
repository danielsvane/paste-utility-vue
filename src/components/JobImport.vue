<template>
  <div class="bg-gray-700 rounded-lg p-6">
    <h2 class="text-2xl font-medium text-white mb-4">Job Import</h2>
    <div class="flex flex-wrap gap-3 items-center">
      <input type="file" ref="jobFileInput" @change="handleJobImport" accept=".json" class="hidden" />
      <input
        type="file"
        ref="pasteGerberInput"
        @change="handlePasteGerberSelect"
        accept=".gbr,.gbp,.gtp"
        class="hidden"
      />
      <input
        type="file"
        ref="maskGerberInput"
        @change="handleMaskGerberSelect"
        accept=".gbr,.gbs,.gts"
        class="hidden"
      />

      <Button @click="$refs.jobFileInput.click()">Import Job</Button>
      <span class="text-gray-400">OR</span>
      <Button @click="$refs.pasteGerberInput.click()">
        Select Paste Gerber
      </Button>
      <span v-if="pasteGerberFile" class="text-sm text-gray-300">{{ pasteGerberFile.name }}</span>
      <Button @click="$refs.maskGerberInput.click()">
        Select Mask Gerber
      </Button>
      <span v-if="maskGerberFile" class="text-sm text-gray-300">{{ maskGerberFile.name }}</span>
      <Button
        @click="handleLoadGerbers"
        :disabled="!pasteGerberFile || !maskGerberFile"
      >
        Load Gerbers
      </Button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Button from './Button.vue'
import { useJobStore } from '../stores/job'

const jobStore = useJobStore()

const jobFileInput = ref(null)
const pasteGerberInput = ref(null)
const maskGerberInput = ref(null)
const pasteGerberFile = ref(null)
const maskGerberFile = ref(null)

async function handleJobImport(event) {
  const file = event.target.files[0]
  if (file) {
    const result = await jobStore.importFromFile(file)
    if (!result.success) {
      alert('Failed to import job: ' + result.error)
    }
  }
}

function handlePasteGerberSelect(event) {
  pasteGerberFile.value = event.target.files[0]
}

function handleMaskGerberSelect(event) {
  maskGerberFile.value = event.target.files[0]
}

async function handleLoadGerbers() {
  if (!pasteGerberFile.value || !maskGerberFile.value) {
    alert('Please select both paste and mask gerber files first')
    return
  }
  const result = await jobStore.loadJobFromGerbers(pasteGerberFile.value, maskGerberFile.value)
  if (!result.success) {
    alert('Error loading gerbers: ' + result.error)
  }
}
</script>

