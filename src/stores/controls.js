import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSerialStore } from './serial'

export const useControlsStore = defineStore('controls', () => {
  const serialStore = useSerialStore()

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
    retract
  }
})
