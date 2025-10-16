<template>
  <div class="text-sm mb-3 p-2 rounded" :class="variantClass">
    <slot></slot>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'info',
    validator: (value) => ['info', 'warning', 'error', 'success'].includes(value)
  }
})

const variantClass = computed(() => {
  const variants = {
    info: 'text-blue-400 bg-blue-900/20',
    warning: 'text-yellow-500 bg-yellow-900/20',
    error: 'text-red-500 bg-red-900/20',
    success: 'text-green-500 bg-green-900/20'
  }
  return variants[props.variant]
})
</script>
