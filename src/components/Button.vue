<template>
  <button
    :class="buttonClasses"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot name="icon"></slot>
    <slot></slot>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary'].includes(value)
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  fullWidth: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])

const buttonClasses = computed(() => {
  const classes = ['btn']

  // Type classes
  if (props.type === 'primary') {
    classes.push('btn-primary')
  } else if (props.type === 'secondary') {
    classes.push('btn-secondary')
  }

  // Size classes
  if (props.size === 'small') {
    classes.push('btn-small')
  } else if (props.size === 'medium') {
    classes.push('btn-medium')
  } else if (props.size === 'large') {
    classes.push('btn-large')
  }

  // Full width
  if (props.fullWidth) {
    classes.push('btn-full-width')
  }

  return classes.join(' ')
})
</script>

<style scoped>
@reference "../assets/main.css";

.btn {
  @apply inline-flex items-center justify-center gap-2 rounded font-semibold transition-colors cursor-pointer tracking-wide;
}

.btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* Type styles */
.btn-primary {
  @apply bg-goldenrod-dark text-white;
}

.btn-primary:hover:not(:disabled) {
  @apply bg-goldenrod;
}

.btn-secondary {
  @apply bg-gray-700 text-white;
}

.btn-secondary:hover:not(:disabled) {
  @apply bg-gray-600;
}

/* Size styles */
.btn-small {
  @apply px-3 h-9 text-sm;
}

.btn-medium {
  @apply px-4 h-11 text-base;
}

.btn-large {
  @apply px-6 h-14 text-lg;
}

/* Full width */
.btn-full-width {
  @apply w-full;
}
</style>
