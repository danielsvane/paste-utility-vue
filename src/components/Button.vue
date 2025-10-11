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
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 0.25rem;
  font-weight: 500;
  transition: background-color 0.2s;
  cursor: pointer;
  border: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Type styles */
.btn-primary {
  background-color: var(--color-goldenrod);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-goldenrod-dark);
}

.btn-secondary {
  background-color: rgb(55, 65, 81); /* gray-700 */
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: rgb(75, 85, 99); /* gray-600 */
}

/* Size styles */
.btn-small {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.btn-medium {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

.btn-large {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}

/* Full width */
.btn-full-width {
  width: 100%;
}
</style>
