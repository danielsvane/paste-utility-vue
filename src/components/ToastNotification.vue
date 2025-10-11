<template>
  <div
    v-if="isVisible"
    class="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3 max-w-md"
  >
    <p class="flex-1 text-gray-800" v-html="content"></p>
    <button
      @click="handleClose"
      class="text-goldenrod hover:text-goldenrod-dark text-xl font-bold"
    >
      ➡️
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isVisible = ref(false)
const content = ref('')

let resolvePromise = null

function show(contentText) {
  content.value = contentText
  isVisible.value = true

  return new Promise(resolve => {
    resolvePromise = resolve
  })
}

function handleClose() {
  isVisible.value = false
  resolvePromise?.(false)
}

defineExpose({ show })
</script>
