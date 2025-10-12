<template>
  <div class="file-picker">
    <input type="file" ref="fileInput" @change="handleFileSelect" :accept="accept" class="hidden" />
    <Button @click="$refs.fileInput.click()" :text="text" :sub-label="selectedFile?.name" :type="type" :size="size"
      :disabled="disabled" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import Button from './Button.vue'

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  accept: {
    type: String,
    default: '*'
  },
  modelValue: {
    type: File,
    default: null
  },
  type: {
    type: String,
    default: 'primary'
  },
  size: {
    type: String,
    default: 'medium'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const fileInput = ref(null)
const selectedFile = ref(props.modelValue)

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  selectedFile.value = newValue
})

function handleFileSelect(event) {
  const file = event.target.files[0]
  selectedFile.value = file
  emit('update:modelValue', file)
  emit('change', file)
}
</script>
