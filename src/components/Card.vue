<template>
  <div class="bg-gray-800 rounded-lg p-6">
    <!-- Header section with title and optional actions -->
    <div v-if="title || $slots.actions" class="flex justify-between items-center mb-4">
      <h2 v-if="title" class="text-2xl font-medium text-white">{{ title }}</h2>
      <div v-if="$slots.actions">
        <slot name="actions"></slot>
      </div>
    </div>

    <!-- Main content slot -->
    <slot></slot>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  }
})
</script>
