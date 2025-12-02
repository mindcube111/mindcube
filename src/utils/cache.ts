/**
 * 数据缓存工具
 * 提供内存缓存层，减少 localStorage 读取
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  expiry: number // 过期时间（毫秒）
}

class MemoryCache {
  private cache: Map<string, CacheItem<any>> = new Map()
  private defaultExpiry = 5 * 60 * 1000 // 默认5分钟过期

  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, expiry?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: expiry || this.defaultExpiry,
    })
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    // 检查是否过期
    if (Date.now() - item.timestamp > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 检查缓存是否存在且未过期
   */
  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    if (Date.now() - item.timestamp > item.expiry) {
      this.cache.delete(key)
      return false
    }

    return true
  }
}

// 导出单例
export const memoryCache = new MemoryCache()

/**
 * 带缓存的 localStorage 读取
 */
export function getCachedStorageItem<T>(key: string, defaultValue: T): T {
  // 先检查内存缓存
  const cached = memoryCache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // 从 localStorage 读取
  if (typeof window === 'undefined') return defaultValue

  try {
    const stored = localStorage.getItem(key)
    if (!stored) return defaultValue

    const parsed = JSON.parse(stored)
    // 存入内存缓存
    memoryCache.set(key, parsed)
    return parsed
  } catch {
    return defaultValue
  }
}

/**
 * 设置缓存和 localStorage
 */
export function setCachedStorageItem<T>(key: string, value: T): void {
  // 存入内存缓存
  memoryCache.set(key, value)

  // 存入 localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Failed to set localStorage key "${key}":`, error)
    }
  }
}

