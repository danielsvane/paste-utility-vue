<template>
  <div class="space-y-6">
    <!-- Video Feed -->
    <div class="bg-gray-800 rounded-lg p-4">
      <canvas id="opencv-canvas" class="w-full bg-black rounded"></canvas>
    </div>

    <!-- Machine Controls -->
    <MachineControls />
  </div>
</template>

<script setup>
import MachineControls from './MachineControls.vue'
</script>
