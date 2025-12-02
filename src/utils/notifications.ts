import toast from 'react-hot-toast'

type NotificationType = 'success' | 'error' | 'info' | 'warning'

interface NotificationPayload {
  title: string
  message?: string
  type?: NotificationType
  duration?: number
}

function showToast(type: NotificationType, payload: NotificationPayload) {
  const message = payload.message ?? payload.title
  const duration = payload.duration ?? 3000
  switch (type) {
    case 'success':
      toast.success(message, { duration })
      break
    case 'error':
      toast.error(message, { duration })
      break
    case 'warning':
      toast(message, { duration, icon: '⚠️' })
      break
    default:
      toast(message, { duration })
  }
}

export const notificationService = {
  success: (payload: NotificationPayload) => showToast('success', payload),
  error: (payload: NotificationPayload) => showToast('error', payload),
  info: (payload: NotificationPayload) => showToast('info', payload),
  warning: (payload: NotificationPayload) => showToast('warning', payload),
  requestPermission: () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return Promise.resolve('default')
    if (Notification.permission === 'granted') return Promise.resolve('granted')
    if (Notification.permission !== 'denied') {
      return Notification.requestPermission()
    }
    return Promise.resolve(Notification.permission)
  },
  showNewNotification: (title: string, body?: string) => {
    if (typeof window === 'undefined' || Notification.permission !== 'granted') return
    new Notification(title, { body })
  },
  showNewReport: (title: string, reportId: string) => {
    if (typeof window === 'undefined' || Notification.permission !== 'granted') return
    new Notification(title, {
      body: `报告编号：${reportId}`,
    })
  },
}

