<template>
  <div v-if="isVisible" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Overlay -->
    <div class="fixed inset-0 bg-black bg-opacity-50" @click="handleCancel"></div>

    <!-- Modal -->
    <div class="relative z-10 bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 flex flex-col gap-4">
      <div class="flex items-start justify-between">
        <img src="/lumen-icon.png" class="h-8 w-8" alt="Lumen" />
        <button @click="handleCancel" class="text-gray-400 hover:text-gray-600 text-2xl font-bold">
          ⨉
        </button>
      </div>

      <h2 class="text-2xl font-semibold text-gray-800">{{ title }}</h2>
      <p class="text-gray-600" v-html="content"></p>

      <input
        v-if="style === 1"
        v-model.number="inputValue"
        type="number"
        min="1"
        max="254"
        class="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2"
        style="--tw-ring-color: var(--color-goldenrod)"
      />

      <div class="flex gap-3 justify-end">
        <button
          @click="handleCancel"
          class="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded text-gray-800 font-medium"
        >
          Cancel
        </button>
        <button
          @click="handleOk"
          @keyup.enter="handleOk"
          class="px-4 py-2 rounded text-white font-medium"
          style="background-color: var(--color-goldenrod)"
          @mouseenter="e => e.target.style.backgroundColor = 'var(--color-goldenrod-dark)'"
          @mouseleave="e => e.target.style.backgroundColor = 'var(--color-goldenrod)'"
          ref="okButton"
        >
          OK
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const isVisible = ref(false)
const title = ref('')
const content = ref('')
const style = ref(0) // 0 = ok/cancel, 1 = with number input
const inputValue = ref(1)
const okButton = ref(null)

let resolvePromise = null

async function show(titleText, contentText, modalStyle = 0) {
  title.value = titleText
  content.value = contentText
  style.value = modalStyle
  isVisible.value = true

  await nextTick()
  okButton.value?.focus()

  return new Promise(resolve => {
    resolvePromise = resolve
  })
}

function handleOk() {
  isVisible.value = false
  if (style.value === 1) {
    resolvePromise?.(inputValue.value)
  } else {
    resolvePromise?.(true)
  }
}

function handleCancel() {
  isVisible.value = false
  resolvePromise?.(false)
}

defineExpose({ show })
</script>
