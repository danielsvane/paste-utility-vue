<template>
  <div class="space-y-6">
    <!-- Job Import/Export Section -->
    <div class="bg-gray-700 rounded-lg p-6">
      <div class="flex flex-wrap gap-3 items-center">
        <input type="file" ref="jobFileInput" @change="handleJobImport" accept=".json" class="hidden" />
        <input
          type="file"
          ref="pasteGerberInput"
          @change="handlePasteGerberSelect"
          accept=".gbr"
          class="hidden"
        />
        <input
          type="file"
          ref="maskGerberInput"
          @change="handleMaskGerberSelect"
          accept=".gbr"
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

    <!-- Job Positions Section -->
    <div class="bg-gray-700 rounded-lg p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-medium text-white">Job Positions</h2>
        <div class="flex gap-2">
          <button class="btn-goldenrod">Get Rough Board Position</button>
          <button class="btn-goldenrod">Perform Fid Cal</button>
          <button class="btn-goldenrod">Capture New Position</button>
        </div>
      </div>
      <div class="positions-list text-gray-300">
        <p class="text-sm font-semibold mb-3">
          {{ jobStore.placements.length }} placements, {{ jobStore.fiducials.length }} fiducials
        </p>

        <div class="max-h-96 overflow-y-auto space-y-2 pr-2">
          <!-- Placements -->
          <div v-if="jobStore.placements.length > 0" class="space-y-1">
            <h3 class="text-sm font-semibold text-white mb-2">Placements:</h3>
            <div
              v-for="(placement, index) in jobStore.placements"
              :key="`placement-${index}`"
              class="bg-gray-800 rounded px-3 py-2 text-xs"
            >
              <span class="text-gray-400">{{ index + 1 }}.</span>
              X: {{ placement.x.toFixed(3) }}
              Y: {{ placement.y.toFixed(3) }}
              Z: {{ placement.z.toFixed(3) }}
            </div>
          </div>

          <!-- Fiducials -->
          <div v-if="jobStore.fiducials.length > 0" class="space-y-1 mt-4">
            <h3 class="text-sm font-semibold text-white mb-2">Fiducials:</h3>
            <div
              v-for="(fiducial, index) in jobStore.fiducials"
              :key="`fiducial-${index}`"
              class="bg-blue-900 rounded px-3 py-2 text-xs"
            >
              <span class="text-gray-400">FID {{ index + 1 }}:</span>
              X: {{ fiducial.x.toFixed(3) }}
              Y: {{ fiducial.y.toFixed(3) }}
              Z: {{ fiducial.z.toFixed(3) }}
            </div>
          </div>

          <p v-if="jobStore.placements.length === 0 && jobStore.fiducials.length === 0" class="text-gray-500 text-sm italic">
            No positions loaded. Import a job or load gerber files.
          </p>
        </div>
      </div>
    </div>

    <!-- Gerber Visualization -->
    <div class="bg-gray-700 rounded-lg p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-medium text-white">Job Preview</h2>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-300">Board Side:</span>
          <label class="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="radio"
              v-model="jobStore.boardSide"
              value="front"
              class="cursor-pointer"
            />
            Front
          </label>
          <label class="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="radio"
              v-model="jobStore.boardSide"
              value="back"
              class="cursor-pointer"
            />
            Back
          </label>
        </div>
      </div>
      <JobPreview
        :placements="jobStore.placements"
        :fiducials="jobStore.fiducials"
        :side="jobStore.boardSide"
        :click-mode="null"
      />
    </div>

    <!-- Job Settings -->
    <div class="bg-gray-700 rounded-lg p-6">
      <h2 class="text-2xl font-medium text-white mb-4">Job Settings</h2>
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="block text-sm text-gray-300 mb-1">Dispense Degrees:</label>
          <input
            v-model.number="jobStore.dispenseDegrees"
            type="number"
            min="1"
            max="300"
            class="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-300 mb-1">Retraction Degrees:</label>
          <input
            v-model.number="jobStore.retractionDegrees"
            type="number"
            min="1"
            max="200"
            class="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-300 mb-1">Dwell Milliseconds:</label>
          <input
            v-model.number="jobStore.dwellMilliseconds"
            type="number"
            min="0"
            max="5000"
            class="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
          />
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="bg-gray-700 rounded-lg p-6">
      <div class="flex gap-3">
        <button @click="handleExportJob" class="btn-goldenrod">Export Job</button>
        <button @click="handleRunJob" class="btn-goldenrod">Run Job</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useJobStore } from '../stores/job'
import JobPreview from './JobPreview.vue'

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

function handleExportJob() {
  jobStore.saveToFile()
}

function handleRunJob() {
  console.log('Run job clicked')
  // Job running logic will be implemented
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
