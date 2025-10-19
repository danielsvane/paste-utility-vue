<template>
  <Button @click="$emit('calibrate')" :text="buttonText" type="secondary" />
  <div class="flex items-center gap-2">
    <font-awesome-icon v-if="isCalibrated" icon="circle-check" class="w-6 h-6 flex-shrink-0 text-lg text-green-600" />
    <div v-else class="w-6 h-6 flex-shrink-0"></div>
    <span class="text-sm text-gray-300">
      {{ statusText }}
    </span>
  </div>
  <Button v-if="isCalibrated" @click="$emit('clear')" icon="xmark" type="tertiary" class="!px-3" />
  <div v-else></div>
</template>

<script setup>
import Button from './Button.vue'

defineProps({
  buttonText: {
    type: String,
    required: true
  },
  statusText: {
    type: String,
    required: true
  },
  isCalibrated: {
    type: Boolean,
    required: true
  }
})

defineEmits(['calibrate', 'clear'])
</script>
