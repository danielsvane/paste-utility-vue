import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useModalStore = defineStore('modal', () => {
  const isOpen = ref(false)
  const title = ref('')
  const message = ref('')
  const type = ref('alert') // 'alert' or 'confirm'
  const resolvePromise = ref(null)

  function showAlert(msg, titleText = 'Alert') {
    title.value = titleText
    message.value = msg
    type.value = 'alert'
    isOpen.value = true

    return new Promise((resolve) => {
      resolvePromise.value = resolve
    })
  }

  function showConfirm(msg, titleText = 'Confirm') {
    title.value = titleText
    message.value = msg
    type.value = 'confirm'
    isOpen.value = true

    return new Promise((resolve) => {
      resolvePromise.value = resolve
    })
  }

  function handleConfirm() {
    isOpen.value = false
    if (resolvePromise.value) {
      resolvePromise.value(true)
      resolvePromise.value = null
    }
  }

  function handleCancel() {
    isOpen.value = false
    if (resolvePromise.value) {
      resolvePromise.value(false)
      resolvePromise.value = null
    }
  }

  return {
    isOpen,
    title,
    message,
    type,
    showAlert,
    showConfirm,
    handleConfirm,
    handleCancel
  }
})
