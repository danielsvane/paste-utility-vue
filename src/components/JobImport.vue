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

      <button @click="$refs.jobFileInput.click()" class="btn-goldenrod">Import Job</button>
      <span class="text-gray-400">OR</span>
      <button @click="$refs.pasteGerberInput.click()" class="btn-goldenrod">
        Select Paste Gerber
      </button>
      <span v-if="pasteGerberFile" class="text-sm text-gray-300">{{ pasteGerberFile.name }}</span>
      <button @click="$refs.maskGerberInput.click()" class="btn-goldenrod">
        Select Mask Gerber
      </button>
      <span v-if="maskGerberFile" class="text-sm text-gray-300">{{ maskGerberFile.name }}</span>
      <button
        @click="handleLoadGerbers"
        :disabled="!pasteGerberFile || !maskGerberFile"
        class="btn-goldenrod disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Load Gerbers
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
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

<style scoped>
.btn-goldenrod {
  background-color: var(--color-goldenrod);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-weight: 500;
}

.btn-goldenrod:hover {
  background-color: var(--color-goldenrod-dark);
}
</style>
