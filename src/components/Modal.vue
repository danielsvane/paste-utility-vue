<template>
  <dialog ref="dialogRef" class="rounded-lg overflow-hidden max-w-md w-full p-0 m-auto border-0 backdrop:bg-black/50"
    @close="handleClose">
    <div class="bg-gray-800 p-6">
      <h2 class="text-xl font-semibold text-white mb-4">{{ modalStore.title }}</h2>
      <p class="text-gray-300 mb-6">{{ modalStore.message }}</p>

      <div class="flex gap-3 justify-end">
        <Button v-if="modalStore.type === 'confirm'" @click="modalStore.handleCancel" text="Cancel" type="tertiary" />
        <Button @click="modalStore.handleConfirm" :text="modalStore.type === 'confirm' ? 'Confirm' : 'OK'"
          type="primary" />
      </div>
    </div>
  </dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useModalStore } from '../stores/modal'
import Button from './Button.vue'

const modalStore = useModalStore()
const dialogRef = ref(null)

// Watch for isOpen changes and use native dialog methods
watch(() => modalStore.isOpen, (newValue) => {
  if (newValue && dialogRef.value) {
    dialogRef.value.showModal()
  } else if (!newValue && dialogRef.value) {
    dialogRef.value.close()
  }
})

// Handle ESC key or clicking outside (native dialog close)
function handleClose() {
  if (modalStore.type === 'alert') {
    modalStore.handleConfirm()
  } else {
    modalStore.handleCancel()
  }
}
</script>
