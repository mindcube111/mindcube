/**
 * 防抖和节流工具函数
 * 用于优化频繁触发的事件处理
 */

/**
 * 防抖函数
 * 在事件被触发 n 秒后再执行回调，如果在这 n 秒内又被触发，则重新计时
 * 
 * @param func - 要防抖的函数
 * @param wait - 等待时间（毫秒）
 * @returns 防抖后的函数
 * 
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('Searching:', query)
 * }, 300)
 * 
 * input.addEventListener('input', (e) => {
 *   debouncedSearch(e.target.value)
 * })
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function debounced(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
      timeout = null
    }, wait)
  }
}

/**
 * 节流函数
 * 在 n 秒内只执行一次回调，如果在这 n 秒内多次触发，只有第一次会执行
 * 
 * @param func - 要节流的函数
 * @param wait - 等待时间（毫秒）
 * @returns 节流后的函数
 * 
 * @example
 * const throttledScroll = throttle(() => {
 *   console.log('Scrolling')
 * }, 100)
 * 
 * window.addEventListener('scroll', throttledScroll)
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0
  let timeout: NodeJS.Timeout | null = null
  
  return function throttled(...args: Parameters<T>) {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTime
    
    if (timeSinceLastCall >= wait) {
      // 如果距离上次调用已经超过 wait 时间，立即执行
      lastCallTime = now
      func(...args)
    } else {
      // 否则，设置定时器在剩余时间后执行
      if (timeout) {
        clearTimeout(timeout)
      }
      
      timeout = setTimeout(() => {
        lastCallTime = Date.now()
        func(...args)
        timeout = null
      }, wait - timeSinceLastCall)
    }
  }
}

/**
 * React Hook 版本的防抖
 * 返回一个防抖后的函数，组件卸载时自动清理
 * 
 * @param func - 要防抖的函数
 * @param wait - 等待时间（毫秒）
 * @param deps - 依赖数组（可选）
 * @returns 防抖后的函数
 * 
 * @example
 * const debouncedSearch = useDebounce((query: string) => {
 *   searchAPI(query)
 * }, 300, [])
 */
import { useRef, useEffect, useCallback, DependencyList } from 'react'

export function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  deps: DependencyList = []
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const funcRef = useRef(func)
  
  // 更新函数引用
  useEffect(() => {
    funcRef.current = func
  }, [func, ...deps])
  
  // 清理函数
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      funcRef.current(...args)
      timeoutRef.current = null
    }, wait)
  }, [wait])
}

/**
 * React Hook 版本的节流
 * 返回一个节流后的函数，组件卸载时自动清理
 * 
 * @param func - 要节流的函数
 * @param wait - 等待时间（毫秒）
 * @param deps - 依赖数组（可选）
 * @returns 节流后的函数
 */
export function useThrottle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  deps: DependencyList = []
): (...args: Parameters<T>) => void {
  const lastCallTimeRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const funcRef = useRef(func)
  
  // 更新函数引用
  useEffect(() => {
    funcRef.current = func
  }, [func, ...deps])
  
  // 清理函数
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTimeRef.current
    
    if (timeSinceLastCall >= wait) {
      lastCallTimeRef.current = now
      funcRef.current(...args)
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCallTimeRef.current = Date.now()
        funcRef.current(...args)
        timeoutRef.current = null
      }, wait - timeSinceLastCall)
    }
  }, [wait])
}

