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
      <select
        v-model="selectedCamera"
        class="bg-gray-700 text-white px-4 py-2 rounded border border-gray-600"
      >
        <option v-for="camera in cameras" :key="camera.deviceId" :value="camera.deviceId">
          {{ camera.label }}
        </option>
      </select>
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
    <div class="flex flex-1 overflow-hidden">
      <!-- Left Column -->
      <div class="flex-1 p-6 overflow-y-auto bg-gray-800">
        <JobControls />
      </div>

      <!-- Right Column -->
      <div class="flex-1 p-6 overflow-y-auto bg-gray-900 border-l border-gray-700">
        <VideoControls />
      </div>
    </div>

    <!-- Footer -->
    <div class="bg-gray-800 p-4 text-center border-t border-gray-700">
      <img src="/opulo-gold-alpha-tiny.png" alt="Opulo" class="inline-block h-6" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { onOpenCVReady, logOpenCVVersion } from '../composables/useOpenCV'
import { useSerialStore } from '../stores/serial'
import { useVideo } from '../composables/useVideo'
import JobControls from '../components/JobControls.vue'
import VideoControls from '../components/VideoControls.vue'

const modalRef = inject('modal')
const cameras = ref([])
const selectedCamera = ref(null)

const serialStore = useSerialStore()

let cv = null
let videoComposable = null

onMounted(() => {
  onOpenCVReady(async resolvedCv => {
    cv = resolvedCv
    console.log('OpenCV loaded')

    // Log OpenCV version and build information
    logOpenCVVersion(cv)

    // Initialize video manager
    videoComposable = useVideo(cv)
    const cameraList = await videoComposable.populateCameraList()
    cameras.value = cameraList

    // Auto-select top camera
    const topCam = cameraList.find(c => c.isTop)
    if (topCam) {
      selectedCamera.value = topCam.deviceId
    } else if (cameraList.length > 0) {
      selectedCamera.value = cameraList[0].deviceId
    }

    // Initialize serial store with modal reference
    serialStore.setModal(modalRef.value)
  })
})

async function handleConnect() {
  if (serialStore.isConnected) return

  try {
    await serialStore.connect()
    const canvas = document.getElementById('opencv-canvas')
    await videoComposable.startVideo(selectedCamera.value, canvas)
  } catch (err) {
    alert('Error: ' + err.message)
  }
}
</script>
