<template>
  <button :class="buttonClasses" :disabled="disabled" @click="$emit('click', $event)">
    <font-awesome-icon class="opacity-50" v-if="icon" :icon="icon" />
    <div v-if="text || subLabel" class="flex flex-col items-center -space-y-1">
      <span v-if="text">{{ text }}</span>
      <span v-if="subLabel" class="text-xs opacity-80 truncate font-normal">{{ subLabel }}</span>
    </div>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: {
    type: String,
    default: ''
  },
  subLabel: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'tertiary', 'destructive'].includes(value)
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
  } else if (props.type === 'tertiary') {
    classes.push('btn-tertiary')
  } else if (props.type === 'destructive') {
    classes.push('btn-destructive')
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

.btn-tertiary {
  @apply bg-transparent text-gray-300;
}

.btn-tertiary:hover:not(:disabled) {
  @apply bg-gray-700/50 text-white;
}

.btn-destructive {
  @apply bg-transparent text-red-500 border-2 border-red-500;
}

.btn-destructive:hover:not(:disabled) {
  @apply bg-red-500/10 text-red-400 border-red-400;
}

/* Size styles */
.btn-small {
  @apply px-3 h-9 text-sm;
}

.btn-medium {
  @apply px-4 h-11 text-base;
}

.btn-large {
  @apply px-6 h-16 text-lg;
}

/* Full width */
.btn-full-width {
  @apply w-full;
}

/* Sub label styling */
.sub-label {
  @apply text-xs opacity-70 truncate max-w-full;
}
</style>
