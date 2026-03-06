export type ToastType = 'success' | 'error' | 'info' | 'warn'

export function showToast(message: string, type: ToastType = 'info', duration = 3000) {

  const container = document.getElementById('gcs-toast-container')
  if (!container) return

  const toast = document.createElement('div')
  toast.className = `gcs-toast ${type}`
  toast.innerText = message

  container.appendChild(toast)

  setTimeout(() => {
    toast.remove()
  }, duration)
}