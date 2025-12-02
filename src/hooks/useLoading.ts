/**
 * 加载状态管理 Hook
 * 统一管理异步操作的加载状态
 */

import { useState, useCallback } from 'react'

export interface UseLoadingReturn {
  isLoading: boolean
  loadingMessage: string | null
  startLoading: (message?: string) => void
  stopLoading: () => void
  withLoading: <T>(asyncFn: () => Promise<T>, message?: string) => Promise<T>
}

export function useLoading(initialMessage: string | null = null): UseLoadingReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState<string | null>(initialMessage)

  const startLoading = useCallback((message?: string) => {
    setIsLoading(true)
    if (message !== undefined) {
      setLoadingMessage(message)
    }
  }, [])

  const stopLoading = useCallback(() => {
    setIsLoading(false)
    setLoadingMessage(null)
  }, [])

  const withLoading = useCallback(
    async <T,>(asyncFn: () => Promise<T>, message?: string): Promise<T> => {
      startLoading(message)
      try {
        const result = await asyncFn()
        return result
      } finally {
        stopLoading()
      }
    },
    [startLoading, stopLoading]
  )

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    withLoading,
  }
}

