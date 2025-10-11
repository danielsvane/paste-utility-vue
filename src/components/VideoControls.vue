<template>
  <Card title="Video Feed">
    <template #actions>
      <select
        v-model="selectedCamera"
        class="bg-gray-700 text-white px-4 py-2 rounded border border-gray-600"
        :disabled="cameras.length === 0"
      >
        <option v-if="cameras.length === 0" value="">No cameras found</option>
        <option v-for="camera in cameras" :key="camera.deviceId" :value="camera.deviceId">
          {{ camera.label }}
        </option>
      </select>
    </template>

    <canvas id="opencv-canvas" class="w-full bg-black rounded"></canvas>
    <div v-if="videoError" class="mt-2 text-red-400 text-sm">
      Error: {{ videoError }}
    </div>
  </Card>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { onOpenCVReady, logOpenCVVersion } from '../composables/useOpenCV'
import { useVideo } from '../composables/useVideo'
import Card from './Card.vue'

const cameras = ref([])
const selectedCamera = ref(null)
const isVideoStarted = ref(false)
const videoError = ref(null)

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
  })
})

// Watch for camera selection changes and auto-start video
watch(selectedCamera, async (newCamera) => {
  if (newCamera && videoComposable) {
    // Stop existing video if running
    if (isVideoStarted.value) {
      videoComposable.stopVideo()
      isVideoStarted.value = false
    }
    // Start video with new camera
    await handleStartVideo()
  }
})

async function handleStartVideo() {
  if (isVideoStarted.value) return

  try {
    videoError.value = null
    const canvas = document.getElementById('opencv-canvas')
    await videoComposable.startVideo(selectedCamera.value, canvas)
    isVideoStarted.value = true
  } catch (err) {
    videoError.value = err.message
    console.error('Error starting video:', err)
  }
}
</script>
