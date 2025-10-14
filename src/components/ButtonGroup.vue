<template>
  <div class="button-group" :class="{ 'full-width': fullWidth }">
    <button v-for="(option, index) in options" :key="option.value" :class="getButtonClasses(option, index)"
      @click="selectOption(option.value)">
      <font-awesome-icon v-if="option.icon" :icon="option.icon" class="text-sm" />
      <span v-if="option.label">{{ option.label }}</span>
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    required: true
  },
  options: {
    type: Array,
    required: true,
    validator: (options) => {
      return options.every(opt =>
        opt.hasOwnProperty('value') && (opt.hasOwnProperty('label') || opt.hasOwnProperty('icon'))
      )
    }
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  fullWidth: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

function selectOption(value) {
  emit('update:modelValue', value)
}

function getButtonClasses(option, index) {
  const classes = ['button-group-item']

  // Active state (use loose equality to handle string/number type coercion)
  if (option.value == props.modelValue) {
    classes.push('active')
  }

  // Position classes for border radius
  if (index === 0) {
    classes.push('first')
  }
  if (index === props.options.length - 1) {
    classes.push('last')
  }

  // Size classes
  classes.push(`size-${props.size}`)

  return classes.join(' ')
}
</script>

<style scoped>
@reference "../assets/main.css";

.button-group {
  @apply inline-flex items-stretch bg-gray-800 rounded overflow-hidden;
  border: 1px solid #374151;
  /* gray-700 */
}

.button-group.full-width {
  @apply w-full flex;
}

.button-group.full-width .button-group-item {
  @apply flex-1;
}

.button-group-item {
  @apply inline-flex flex-col items-center justify-center gap-1 font-medium transition-all cursor-pointer;
  @apply bg-transparent text-gray-400;
  border-right: 1px solid #374151;
  /* gray-700 - divider between buttons */
}

.button-group-item.last {
  border-right: none;
}

.button-group-item:hover:not(.active) {
  @apply bg-gray-700/50 text-gray-300;
}

.button-group-item.active {
  @apply bg-gray-700 text-white;
}

/* Size styles */
.button-group-item.size-small {
  @apply px-3 h-8 text-xs;
}

.button-group-item.size-medium {
  @apply px-4 h-11 text-sm;
}

.button-group-item.size-large {
  @apply px-6 h-16 text-base;
}
</style>
