import { defineStore } from 'pinia'
import { ref, shallowRef, computed } from 'vue'
import { useVideo } from '../composables/useVideo'

export const useVideoStore = defineStore('video', () => {
  // Use shallowRef because the composable has its own internal refs
  const videoComposable = shallowRef(null)
  const isVideoStarted = ref(false)
  const cameras = ref([])
  const selectedCamera = ref(null)
  const videoError = ref(null)

  // Computed
  const hasCameras = computed(() => cameras.value.length > 0)

  async function initializeVideo(cv) {
    videoComposable.value = useVideo(cv)

    try {
      const cameraList = await videoComposable.value.populateCameraList()
      cameras.value = cameraList

      // Auto-select top camera
      const topCam = cameraList.find(c => c.isTop)
      if (topCam) {
        selectedCamera.value = topCam.deviceId
      } else if (cameraList.length > 0) {
        selectedCamera.value = cameraList[0].deviceId
      }
    } catch (err) {
      videoError.value = err.message
      console.error('Error initializing video:', err)
    }
  }

  async function startVideo(canvas) {
    if (isVideoStarted.value || !videoComposable.value || !selectedCamera.value) {
      return
    }

    try {
      videoError.value = null
      await videoComposable.value.startVideo(selectedCamera.value, canvas)
      isVideoStarted.value = true
    } catch (err) {
      videoError.value = err.message
      console.error('Error starting video:', err)
    }
  }

  function stopVideo() {
    if (videoComposable.value && isVideoStarted.value) {
      videoComposable.value.stopVideo()
      isVideoStarted.value = false
    }
  }

  async function selectCamera(cameraId, canvas) {
    // Stop existing video if running
    if (isVideoStarted.value) {
      stopVideo()
    }

    selectedCamera.value = cameraId

    // Start video with new camera
    if (canvas && videoComposable.value) {
      await startVideo(canvas)
    }
  }

  return {
    // State
    videoComposable,
    isVideoStarted,
    cameras,
    selectedCamera,
    videoError,

    // Computed
    hasCameras,

    // Actions
    initializeVideo,
    startVideo,
    stopVideo,
    selectCamera
  }
})
