<template>
  <Card title="Video Feed">
    <template #actions>
      <select v-model="videoStore.selectedCamera" @change="handleCameraChange"
        class="bg-gray-700 text-white px-4 py-2 rounded border border-gray-600" :disabled="!videoStore.hasCameras">
        <option v-if="!videoStore.hasCameras" value="">No cameras found</option>
        <option v-for="camera in videoStore.cameras" :key="camera.deviceId" :value="camera.deviceId">
          {{ camera.label }}
        </option>
      </select>
    </template>

    <div class="relative">
      <canvas id="opencv-canvas" class="w-full bg-black rounded"></canvas>
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="relative w-12 h-12">
          <!-- Horizontal line -->
          <div class="absolute top-1/2 left-0 w-full h-0.5 bg-yellow-400 opacity-80 -translate-y-1/2"></div>
          <!-- Vertical line -->
          <div class="absolute left-1/2 top-0 h-full w-0.5 bg-yellow-400 opacity-80 -translate-x-1/2"></div>
          <!-- Center dot -->
          <div class="absolute top-1/2 left-1/2 w-1 h-1 bg-yellow-400 opacity-80 -translate-x-1/2 -translate-y-1/2 rounded-full"></div>
        </div>
      </div>
    </div>
    <div v-if="videoStore.videoError" class="mt-2 text-red-400 text-sm">
      Error: {{ videoStore.videoError }}
    </div>

    <!-- Debug Controls -->
    <div v-if="videoStore.isVideoStarted && videoStore.videoComposable"
      class="mt-4 p-3 bg-gray-800 rounded border border-gray-600">
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm font-semibold text-gray-300">Circle Detection Debug Mode</label>
        <input type="checkbox" v-model="videoStore.videoComposable.debugMode.value" class="w-5 h-5 rounded" />
      </div>
      <div v-if="videoStore.videoComposable.debugMode.value" class="text-xs text-gray-400 mb-2">
        Shows circle info and pauses after each detection. Press Space or click Continue.
      </div>
      <Button v-if="videoStore.videoComposable.debugMode.value" type="primary" text="Continue (Space)"
        @click="videoStore.videoComposable.continueDebug()" class="w-full" />
    </div>

    <!-- Jog Controls (only visible when connected and video started) -->
    <div v-if="serial.isConnected && videoStore.isVideoStarted" class="flex gap-3 flex-wrap mt-4">
      <Button type="tertiary" text="Jog to Fid in View" @click="controls.jogToFid()" />
      <Button type="tertiary" text="Visual Home" @click="controls.visualHome()" />
    </div>

    <!-- Jog Control Arrows -->
    <div v-if="serial.isConnected && videoStore.isVideoStarted" class="mt-4">
      <JogControls />
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
import JogControls from './JogControls.vue'

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
