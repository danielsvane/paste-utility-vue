<template>
  <div class="min-h-screen bg-gray-900">
    <ModalDialog ref="modalRef" />
    <ToastNotification ref="toastRef" />
    <RouterView />
  </div>
</template>

<script setup>
import { ref, provide } from 'vue'
import { RouterView } from 'vue-router'
import ModalDialog from './components/ModalDialog.vue'
import ToastNotification from './components/ToastNotification.vue'

const modalRef = ref(null)
const toastRef = ref(null)

// Provide modal and toast to all child components
provide('modal', modalRef)
provide('toast', toastRef)
</script>
