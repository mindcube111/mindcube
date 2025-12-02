/**
 * API 缓存 Hook
 * 为频繁请求的接口提供缓存机制，减少重复请求
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { memoryCache } from '@/utils/cache'

interface UseApiCacheOptions<T> {
  key: string
  fetcher: () => Promise<{ success: boolean; data?: T; message?: string }>
  cacheTime?: number // 缓存时间（毫秒），默认5分钟
  revalidateOnFocus?: boolean // 窗口聚焦时重新验证
  revalidateOnReconnect?: boolean // 网络重连时重新验证
  enabled?: boolean // 是否启用请求
}

export function useApiCache<T>({
  key,
  fetcher,
  cacheTime = 5 * 60 * 1000, // 默认5分钟
  revalidateOnFocus = true,
  revalidateOnReconnect = true,
  enabled = true,
}: UseApiCacheOptions<T>) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const fetcherRef = useRef(fetcher)

  // 更新 fetcher 引用，避免依赖变化导致重新请求
  useEffect(() => {
    fetcherRef.current = fetcher
  }, [fetcher])

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return

    // 检查缓存
    if (!force) {
      const cached = memoryCache.get<T>(key)
      if (cached !== null) {
        setData(cached)
        setError(null)
        return
      }
    }

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsLoading(true)
    setError(null)

    try {
      // 使用 ref 中的最新 fetcher，避免闭包问题
      const result = await fetcherRef.current()
      
      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      if (result.success && result.data) {
        setData(result.data)
        memoryCache.set(key, result.data, cacheTime)
      } else {
        setError(new Error(result.message || '请求失败'))
      }
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return
      }
      setError(err instanceof Error ? err : new Error('未知错误'))
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [key, enabled, cacheTime])

  // 初始加载
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 窗口聚焦时重新验证
  useEffect(() => {
    if (!revalidateOnFocus || !enabled) return

    const handleFocus = () => {
      const cached = memoryCache.get<T>(key)
      if (cached !== null) {
        // 如果缓存存在但可能过期，后台刷新
        fetchData(true)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [key, revalidateOnFocus, enabled, fetchData])

  // 网络重连时重新验证
  useEffect(() => {
    if (!revalidateOnReconnect || !enabled) return

    const handleOnline = () => {
      fetchData(true)
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [revalidateOnReconnect, enabled, fetchData])

  // 清理函数
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    data,
    isLoading,
    error,
    mutate: fetchData, // 手动刷新
    clearCache: () => memoryCache.delete(key),
  }
}

