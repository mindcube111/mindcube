/**
 * 性能监控工具
 * 监控应用性能指标，包括 Web Vitals
 */

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  type?: 'navigation' | 'paint' | 'resource' | 'web-vital'
}

interface WebVitals {
  lcp?: number // Largest Contentful Paint
  fcp?: number // First Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private webVitals: WebVitals = {}

  /**
   * 监控页面加载性能
   */
  measurePageLoad() {
    if (typeof window === 'undefined' || !window.performance) return

    window.addEventListener('load', () => {
      const perfData = window.performance.timing
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
      const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.navigationStart
      const firstPaint = perfData.responseEnd - perfData.navigationStart
      const ttfb = perfData.responseStart - perfData.navigationStart

      this.recordMetric('page_load_time', pageLoadTime, 'navigation')
      this.recordMetric('dom_content_loaded', domContentLoaded, 'navigation')
      this.recordMetric('first_paint', firstPaint, 'paint')
      this.recordMetric('ttfb', ttfb, 'web-vital')
      this.webVitals.ttfb = ttfb
    })
  }

  /**
   * 监控 Web Vitals
   */
  measureWebVitals() {
    if (typeof window === 'undefined' || !window.performance) return

    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          if (lastEntry) {
            const lcp = lastEntry.renderTime || lastEntry.loadTime
            this.recordMetric('lcp', lcp, 'web-vital')
            this.webVitals.lcp = lcp
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (e) {
        // 浏览器不支持
      }

      // First Contentful Paint (FCP)
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (entry.name === 'first-contentful-paint') {
              const fcp = entry.startTime
              this.recordMetric('fcp', fcp, 'web-vital')
              this.webVitals.fcp = fcp
            }
          })
        })
        fcpObserver.observe({ entryTypes: ['paint'] })
      } catch (e) {
        // 浏览器不支持
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (entry.processingStart && entry.startTime) {
              const fid = entry.processingStart - entry.startTime
              this.recordMetric('fid', fid, 'web-vital')
              this.webVitals.fid = fid
            }
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
      } catch (e) {
        // 浏览器不支持
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
          this.recordMetric('cls', clsValue, 'web-vital')
          this.webVitals.cls = clsValue
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (e) {
        // 浏览器不支持
      }
    }
  }

  /**
   * 记录性能指标
   */
  recordMetric(name: string, value: number, type: PerformanceMetric['type'] = 'navigation') {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      type,
    }

    this.metrics.push(metric)

    // 只保留最近1000条指标
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // 这里可以发送到监控服务
    // this.sendToMonitoringService(metric)

    // 开发环境打印
    if (import.meta.env.DEV) {
      console.log(`[Performance] ${name}: ${value.toFixed(2)}ms`, { type })
    }
  }

  /**
   * 测量函数执行时间
   */
  measureFunction<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    this.recordMetric(name, end - start)
    return result
  }

  /**
   * 异步测量函数执行时间
   */
  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    this.recordMetric(name, end - start)
    return result
  }

  /**
   * 获取性能指标
   */
  getMetrics() {
    return this.metrics
  }

  /**
   * 获取 Web Vitals
   */
  getWebVitals(): WebVitals {
    return { ...this.webVitals }
  }

  /**
   * 获取性能报告
   */
  getReport() {
    const metrics = this.getMetrics()
    const webVitals = this.getWebVitals()

    return {
      metrics,
      webVitals,
      summary: {
        totalMetrics: metrics.length,
        averageLoadTime: this.calculateAverage('page_load_time'),
        averageFCP: webVitals.fcp,
        averageLCP: webVitals.lcp,
        averageFID: webVitals.fid,
        averageCLS: webVitals.cls,
        averageTTFB: webVitals.ttfb,
      },
    }
  }

  /**
   * 计算平均值
   */
  private calculateAverage(metricName: string): number {
    const values = this.metrics.filter((m) => m.name === metricName).map((m) => m.value)
    if (values.length === 0) return 0
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  /**
   * 清除所有指标
   */
  clear() {
    this.metrics = []
    this.webVitals = {}
  }
}

export const performanceMonitor = new PerformanceMonitor()

// 自动开始监控
if (typeof window !== 'undefined') {
  performanceMonitor.measurePageLoad()
  performanceMonitor.measureWebVitals()
}

