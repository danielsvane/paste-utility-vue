<template>
  <div :class="labelClasses">
    <span v-if="icon" class="label-icon">{{ icon }}</span>
    <span class="label-text">{{ text }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'default',
    validator: (value) => ['success', 'default'].includes(value)
  },
  icon: {
    type: String,
    default: ''
  }
})

const labelClasses = computed(() => {
  const classes = ['label']

  if (props.type === 'success') {
    classes.push('label-success')
  } else if (props.type === 'default') {
    classes.push('label-default')
  }

  return classes.join(' ')
})
</script>

<style scoped>
@reference "../assets/main.css";

.label {
  @apply flex w-fit items-center gap-2 px-3 py-1.5 font-medium rounded-full;
}

.label-success {
  @apply bg-green-600 text-white;
}

.label-default {
  @apply bg-gray-700 text-white;
}

.label-icon {
  @apply text-base leading-none;
}

.label-text {
  @apply leading-none;
}
</style>
