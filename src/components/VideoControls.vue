<template>
  <Card title="Video Feed">
    <template #actions>
      <select
        v-model="videoStore.selectedCamera"
        @change="handleCameraChange"
        class="bg-gray-700 text-white px-4 py-2 rounded border border-gray-600"
        :disabled="!videoStore.hasCameras"
      >
        <option v-if="!videoStore.hasCameras" value="">No cameras found</option>
        <option v-for="camera in videoStore.cameras" :key="camera.deviceId" :value="camera.deviceId">
          {{ camera.label }}
        </option>
      </select>
    </template>

    <canvas id="opencv-canvas" class="w-full bg-black rounded"></canvas>
    <div v-if="videoStore.videoError" class="mt-2 text-red-400 text-sm">
      Error: {{ videoStore.videoError }}
    </div>

    <!-- Jog Controls (only visible when connected and video started) -->
    <div v-if="serial.isConnected && videoStore.isVideoStarted" class="flex gap-3 flex-wrap mt-4">
      <Button type="tertiary" text="Jog to Fid in View" @click="controls.jogToFid()" />
      <Button type="tertiary" text="Visual Home" @click="controls.visualHome()" />
    </div>
  </Card>
</template>

<script setup>
import { onMounted } from 'vue'
import { onOpenCVReady, logOpenCVVersion } from '../composables/useOpenCV'
import { useSerialStore } from '../stores/serial'
import { useControlsStore } from '../stores/controls'
import { useVideoStore } from '../stores/video'
import Card from './Card.vue'
import Button from './Button.vue'

const serial = useSerialStore()
const controls = useControlsStore()
const videoStore = useVideoStore()

onMounted(() => {
  onOpenCVReady(async (cv) => {
    console.log('OpenCV loaded')
    logOpenCVVersion(cv)

    // Initialize video in the store
    await videoStore.initializeVideo(cv)

    // Auto-start video with selected camera
    const canvas = document.getElementById('opencv-canvas')
    if (videoStore.selectedCamera && canvas) {
      await videoStore.startVideo(canvas)
    }
  })
})

async function handleCameraChange() {
  const canvas = document.getElementById('opencv-canvas')
  await videoStore.selectCamera(videoStore.selectedCamera, canvas)
}
</script>
