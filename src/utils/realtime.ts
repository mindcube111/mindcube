import { useEffect, useState } from 'react'

type UpdateCallback<T> = (data: T) => void
type FetchFunction<T> = () => Promise<T> | T

interface PollingOptions {
  interval?: number
  immediate?: boolean
  onError?: (error: Error) => void
}

class RealtimeDataManager {
  private timers = new Map<string, ReturnType<typeof setInterval>>()
  private callbacks = new Map<string, Set<UpdateCallback<any>>>()

  startPolling<T>(
    key: string,
    fetchFn: FetchFunction<T>,
    callback: UpdateCallback<T>,
    options: PollingOptions = {}
  ) {
    const { interval = 30000, immediate = true, onError } = options

    if (!this.callbacks.has(key)) {
      this.callbacks.set(key, new Set())
    }
    this.callbacks.get(key)!.add(callback)

    const execute = async () => {
      try {
        const data = await fetchFn()
        this.callbacks.get(key)?.forEach((cb) => cb(data))
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        if (onError) {
          onError(error)
        } else {
          console.error(`[Realtime] Polling error for ${key}:`, error)
        }
      }
    }

    if (immediate) {
      execute()
    }

    if (this.timers.has(key)) {
      clearInterval(this.timers.get(key)!)
    }
    const timer = setInterval(execute, interval)
    this.timers.set(key, timer)

    return () => this.stopPolling(key, callback)
  }

  stopPolling<T>(key: string, callback?: UpdateCallback<T>) {
    if (callback) {
      const callbacks = this.callbacks.get(key)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.clearKey(key)
        }
      }
    } else {
      this.clearKey(key)
    }
  }

  stopAll() {
    this.timers.forEach((timer) => clearInterval(timer))
    this.timers.clear()
    this.callbacks.clear()
  }

  private clearKey(key: string) {
    const timer = this.timers.get(key)
    if (timer) {
      clearInterval(timer)
    }
    this.timers.delete(key)
    this.callbacks.delete(key)
  }
}

export const realtimeManager = new RealtimeDataManager()

export function useRealtimeData<T>(
  key: string,
  fetchFn: FetchFunction<T>,
  options: PollingOptions = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true
    const stop = realtimeManager.startPolling(
      key,
      async () => {
        if (!mounted) return data as T
        setLoading(true)
        try {
          const result = await fetchFn()
          if (mounted) {
            setData(result)
            setError(null)
          }
          return result
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err))
          if (mounted) {
            setError(error)
          }
          throw error
        } finally {
          if (mounted) {
            setLoading(false)
          }
        }
      },
      (newData) => {
        if (mounted) {
          setData(newData)
          setError(null)
        }
      },
      {
        ...options,
        onError: (err) => {
          if (mounted) {
            setError(err)
          }
          options.onError?.(err)
        },
      }
    )

    return () => {
      mounted = false
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { data, loading, error }
}


