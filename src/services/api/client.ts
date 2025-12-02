/**
 * API 客户端基础配置
 * 提供统一的请求封装、错误处理和认证管理
 */

// API 基础 URL - 可通过环境变量配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const API_TIMEOUT = 30000 // 30秒超时
const DEFAULT_CACHE_TTL = 60_000 // 60秒缓存
const DEFAULT_RETRY_TIMES = 1
const DEFAULT_RETRY_DELAY = 300 // 毫秒

// 使用统一的类型定义
import type { ApiResponse } from './types'
export type { ApiResponse }

export interface ApiError {
  message: string
  code?: number
  status?: number
}

// 请求配置接口
export interface RequestConfig extends RequestInit {
  timeout?: number
  skipAuth?: boolean // 是否跳过认证（如登录接口）
  useCache?: boolean
  cacheTTL?: number
  dedupe?: boolean
  retry?: number
  retryDelay?: number
}

class ApiClient {
  private baseURL: string
  private timeout: number
  private cache = new Map<string, { expires: number; response: ApiResponse<any> }>()
  private inflightRequests = new Map<string, Promise<ApiResponse<any>>>()

  constructor(baseURL: string, timeout: number = API_TIMEOUT) {
    this.baseURL = baseURL.replace(/\/$/, '') // 移除尾部斜杠
    this.timeout = timeout
  }

  /**
   * 获取认证 Token（从 localStorage）
   */
  private getAuthToken(): string | null {
    const user = localStorage.getItem('user')
    if (user) {
      try {
        const parsed = JSON.parse(user)
        return parsed.token || null
      } catch {
        return null
      }
    }
    return null
  }

  /**
   * 设置认证 Token
   */
  setAuthToken(token: string): void {
    const user = localStorage.getItem('user')
    if (user) {
      try {
        const parsed = JSON.parse(user)
        parsed.token = token
        localStorage.setItem('user', JSON.stringify(parsed))
      } catch {
        console.error('Failed to update auth token')
      }
    }
  }

  /**
   * 清除认证 Token
   */
  clearAuthToken(): void {
    const user = localStorage.getItem('user')
    if (user) {
      try {
        const parsed = JSON.parse(user)
        delete parsed.token
        localStorage.setItem('user', JSON.stringify(parsed))
      } catch {
        console.error('Failed to clear auth token')
      }
    }
  }

  /**
   * 构建完整的请求 URL
   */
  private buildURL(endpoint: string): string {
    // 如果 endpoint 是完整 URL，直接返回
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint
    }
    // 移除 endpoint 开头的斜杠
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
    return `${this.baseURL}/${cleanEndpoint}`
  }

  /**
   * 构建缓存键
   */
  private buildCacheKey(url: string, config: RequestInit): string {
    const method = (config.method || 'GET').toUpperCase()
    const body =
      typeof config.body === 'string'
        ? config.body
        : config.body
          ? JSON.stringify(config.body)
          : ''
    return `${method}:${url}:${body}`
  }

  private getCachedResponse<T>(key: string): ApiResponse<T> | null {
    const cached = this.cache.get(key)
    if (cached && cached.expires > Date.now()) {
      return this.cloneResponse(cached.response)
    }
    if (cached) {
      this.cache.delete(key)
    }
    return null
  }

  private setCache<T>(key: string, response: ApiResponse<T>, ttl: number) {
    this.cache.set(key, {
      response,
      expires: Date.now() + ttl,
    })
  }

  private cloneResponse<T>(value: ApiResponse<T>): ApiResponse<T> {
    if (typeof structuredClone === 'function') {
      return structuredClone(value)
    }
    return JSON.parse(JSON.stringify(value))
  }

  /**
   * 请求拦截器 - 添加认证头和默认配置
   */
  private async buildRequest(
    _endpoint: string,
    config: RequestConfig = {}
  ): Promise<RequestInit> {
    const { skipAuth = false, timeout, ...fetchConfig } = config

    const headers = new Headers(fetchConfig.headers as HeadersInit | undefined)
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    // 添加认证 Token
    if (!skipAuth) {
      const token = this.getAuthToken()
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
    }

    return {
      ...fetchConfig,
      headers,
    }
  }

  /**
   * 错误处理
   */
  private handleError(error: unknown, response?: Response): ApiError {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return {
        message: '网络连接失败，请检查网络设置',
        code: -1,
      }
    }

    if (response) {
      // HTTP 错误响应
      if (response.status === 401) {
        // 未授权，清除 token 并跳转到登录页
        this.clearAuthToken()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return {
          message: '登录已过期，请重新登录',
          code: 401,
          status: 401,
        }
      }

      if (response.status === 403) {
        return {
          message: '没有权限访问该资源',
          code: 403,
          status: 403,
        }
      }

      if (response.status >= 500) {
        return {
          message: '服务器错误，请稍后重试',
          code: response.status,
          status: response.status,
        }
      }

      return {
        message: `请求失败：${response.statusText}`,
        code: response.status,
        status: response.status,
      }
    }

    // 其他错误
    return {
      message: error instanceof Error ? error.message : '未知错误',
      code: -1,
    }
  }

  /**
   * 带超时的 fetch 请求
   */
  private async fetchWithTimeout(
    url: string,
    config: RequestInit,
    timeout: number = this.timeout
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('请求超时，请稍后重试')
      }
      throw error
    }
  }

  private shouldRetryStatus(status: number): boolean {
    return status === 408 || status === 429 || status >= 500
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private async executeWithRetry(
    requestFn: () => Promise<Response>,
    retryTimes: number,
    retryDelay: number
  ): Promise<Response> {
    let attempt = 0
    let lastError: unknown = null

    while (attempt <= retryTimes) {
      try {
        const response = await requestFn()
        if (!response.ok && this.shouldRetryStatus(response.status) && attempt < retryTimes) {
          await this.delay(retryDelay * Math.pow(2, attempt))
          attempt++
          continue
        }
        return response
      } catch (error) {
        lastError = error
        if (attempt >= retryTimes) {
          throw error
        }
        await this.delay(retryDelay * Math.pow(2, attempt))
        attempt++
      }
    }

    throw lastError instanceof Error ? lastError : new Error('请求失败')
  }

  private async performRequest<T>(
    url: string,
    requestConfig: RequestInit,
    timeout: number,
    retryTimes: number,
    retryDelay: number
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.executeWithRetry(
        () => this.fetchWithTimeout(url, requestConfig, timeout),
        retryTimes,
        retryDelay
      )

      let data: any
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      if (!response.ok) {
        const error = this.handleError(new Error(data?.message || '请求失败'), response)
        return {
          success: false,
          message: error.message,
          code: error.code,
        }
      }

      if (data && typeof data === 'object' && 'success' in data) {
        return data as ApiResponse<T>
      }

      return {
        success: true,
        data: data as T,
      }
    } catch (error) {
      const apiError = this.handleError(error)
      return {
        success: false,
        message: apiError.message,
        code: apiError.code,
      }
    }
  }

  /**
   * 核心请求方法
   */
  async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildURL(endpoint)
    const requestConfig = await this.buildRequest(endpoint, config)
    const timeout = config.timeout || this.timeout
    const method = (requestConfig.method || 'GET').toUpperCase()
    const cacheKey = this.buildCacheKey(url, requestConfig)
    const enableCache = config.useCache ?? method === 'GET'
    const cacheTTL = config.cacheTTL ?? DEFAULT_CACHE_TTL
    const dedupe = config.dedupe ?? method === 'GET'
    const retryTimes = config.retry ?? DEFAULT_RETRY_TIMES
    const retryDelay = config.retryDelay ?? DEFAULT_RETRY_DELAY

    if (enableCache) {
      const cached = this.getCachedResponse<T>(cacheKey)
      if (cached) {
        return cached
      }
    }

    if (dedupe) {
      const inflight = this.inflightRequests.get(cacheKey)
      if (inflight) {
        return inflight as Promise<ApiResponse<T>>
      }
    }

    const requestPromise = this.performRequest<T>(
      url,
      requestConfig,
      timeout,
      retryTimes,
      retryDelay
    )

    if (dedupe) {
      this.inflightRequests.set(cacheKey, requestPromise)
    }

    try {
      const response = await requestPromise
      if (enableCache && response.success) {
        this.setCache(cacheKey, response, cacheTTL)
      }
      return response
    } finally {
      if (dedupe) {
        this.inflightRequests.delete(cacheKey)
      }
    }
  }

  /**
   * GET 请求
   */
  async get<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  /**
   * POST 请求
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUT 请求
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PATCH 请求
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETE 请求
   */
  async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' })
  }
}

// 导出单例实例
export const apiClient = new ApiClient(API_BASE_URL, API_TIMEOUT)
export default apiClient
