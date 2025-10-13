<template>
  <div class="button-group">
    <button v-for="(option, index) in options" :key="option.value" :class="getButtonClasses(option, index)"
      @click="selectOption(option.value)">
      <font-awesome-icon v-if="option.icon" :icon="option.icon" class="text-sm" />
      <span>{{ option.label }}</span>
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
        opt.hasOwnProperty('label') && opt.hasOwnProperty('value')
      )
    }
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  }
})

const emit = defineEmits(['update:modelValue'])

function selectOption(value) {
  emit('update:modelValue', value)
}

function getButtonClasses(option, index) {
  const classes = ['button-group-item']

  // Active state
  if (option.value === props.modelValue) {
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
  @apply px-3 py-2 text-xs;
}

.button-group-item.size-medium {
  @apply px-4 py-2.5 text-sm;
}

.button-group-item.size-large {
  @apply px-6 py-3 text-base;
}
</style>
