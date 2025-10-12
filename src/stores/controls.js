import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSerialStore } from './serial'
import { useVideoStore } from './video'

export const useControlsStore = defineStore(
  'controls',
  () => {
    const serialStore = useSerialStore()
    const videoStore = useVideoStore()

    // State
    const jogDistance = ref(2) // Default to 1mm (value 2)

  // Computed
  const jogDistanceLabel = computed(() => {
    const labels = { 1: '0.1mm', 2: '1mm', 3: '10mm', 4: '100mm' }
    return labels[jogDistance.value] || '1mm'
  })

  // Helper function to convert slider value to actual distance
  function getJogDistance() {
    const distLUT = jogDistance.value
    if (distLUT == 1) return 0.1
    else if (distLUT == 2) return 1
    else if (distLUT == 3) return 10
    else if (distLUT == 4) return 100
    else return 1
  }

  // Jog Actions
  function jogYPlus() {
    const dist = getJogDistance()
    serialStore.send(['G91', `G0 Y${dist}`, 'G90'])
  }

  function jogYMinus() {
    const dist = getJogDistance()
    serialStore.send(['G91', `G0 Y-${dist}`, 'G90'])
  }

  function jogXPlus() {
    const dist = getJogDistance()
    serialStore.send(['G91', `G0 X${dist}`, 'G90'])
  }

  function jogXMinus() {
    const dist = getJogDistance()
    serialStore.send(['G91', `G0 X-${dist}`, 'G90'])
  }

  function jogZPlus() {
    const dist = getJogDistance()
    serialStore.send(['G91', `G0 Z${dist}`, 'G90'])
  }

  function jogZMinus() {
    const dist = getJogDistance()
    serialStore.send(['G91', `G0 Z-${dist}`, 'G90'])
  }

  function extrude() {
    serialStore.send(['G91', 'G0 B-2', 'G90'])
  }

  function retract() {
    serialStore.send(['G91', 'G0 B2', 'G90'])
  }

  // Visual homing operations
  async function jogToFid() {
    const videoComposable = videoStore.videoComposable

    if (!videoComposable) {
      console.error('Video composable not available')
      return
    }

    const circle = await videoComposable.CVdetectCircle()

    // Set a 1 second timer to show whatever's in video.cvFrame
    videoComposable.displayCvFrame(1000)

    // If we got a circle
    if (circle) {
      const [x_px, y_px] = circle

      const centerX = videoComposable.canvas.value.width / 2
      const centerY = videoComposable.canvas.value.height / 2
      const offsetX = x_px - centerX
      const offsetY = -(y_px - centerY) // Invert Y coordinate

      const scalingFactor = 0.02
      const scaledOffsetX = offsetX * scalingFactor
      const scaledOffsetY = offsetY * scalingFactor

      // Send jog commands using relative positioning
      await serialStore.goToRelative(scaledOffsetX.toFixed(1), scaledOffsetY.toFixed(1))
    }
  }

  async function visualHome() {
    if (!videoStore.videoComposable) {
      console.error('Video composable not available')
      return
    }

    // Move to datum board position (hardcoded for now)
    await serialStore.goTo(218, 196)
    await serialStore.delay(1000)

    // Fine-tune position using OpenCV (twice for precision)
    await jogToFid()
    await serialStore.delay(1500)
    await jogToFid()
    await serialStore.delay(1500)

    // Reset machine coordinates to datum position
    await serialStore.send(['G92 X218 Y196'])
  }

    return {
      // State
      jogDistance,

      // Computed
      jogDistanceLabel,

      // Actions
      jogYPlus,
      jogYMinus,
      jogXPlus,
      jogXMinus,
      jogZPlus,
      jogZMinus,
      extrude,
      retract,
      jogToFid,
      visualHome
    }
  },
  {
    persist: {
      paths: ['jogDistance']
    }
  }
)
