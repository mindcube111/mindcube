/**
 * 统一的 Toast Hook
 * 防止重复提示，统一管理 Toast 消息
 */

import { useRef, useCallback } from 'react'
import toast from 'react-hot-toast'

interface ToastOptions {
  duration?: number
  id?: string
}

// 存储最近显示的 toast ID，用于防重复
const recentToasts = new Map<string, number>()
const DEBOUNCE_TIME = 2000 // 2秒内不重复显示相同消息

function getToastId(message: string, type?: string): string {
  return `${type || 'default'}_${message}`
}

export function useToast() {
  const toastIdRef = useRef<string | null>(null)

  const showToast = useCallback((
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' | 'loading' = 'info',
    options?: ToastOptions
  ) => {
    const toastId = options?.id || getToastId(message, type)
    const now = Date.now()
    const lastShown = recentToasts.get(toastId)

    // 防重复：如果2秒内显示过相同消息，则忽略
    if (lastShown && now - lastShown < DEBOUNCE_TIME) {
      return
    }

    // 如果已有相同类型的 toast 在显示，先关闭它
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current)
    }

    recentToasts.set(toastId, now)

    let id: string
    switch (type) {
      case 'success':
        id = toast.success(message, { duration: options?.duration || 3000, id: toastId })
        break
      case 'error':
        id = toast.error(message, { duration: options?.duration || 4000, id: toastId })
        break
      case 'warning':
        id = toast(message, { duration: options?.duration || 3000, icon: '⚠️', id: toastId })
        break
      case 'loading':
        id = toast.loading(message, { id: toastId })
        break
      default:
        id = toast(message, { duration: options?.duration || 3000, id: toastId })
    }

    toastIdRef.current = id

    // 清理过期的记录（5分钟后）
    setTimeout(() => {
      recentToasts.delete(toastId)
    }, 5 * 60 * 1000)
  }, [])

  const dismiss = useCallback(() => {
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = null
    }
  }, [])

  return {
    success: (message: string, options?: ToastOptions) => showToast(message, 'success', options),
    error: (message: string, options?: ToastOptions) => showToast(message, 'error', options),
    info: (message: string, options?: ToastOptions) => showToast(message, 'info', options),
    warning: (message: string, options?: ToastOptions) => showToast(message, 'warning', options),
    loading: (message: string, options?: ToastOptions) => showToast(message, 'loading', options),
    dismiss,
  }
}











