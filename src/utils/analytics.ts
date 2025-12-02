/**
 * 用户行为分析工具
 * 追踪用户操作和页面访问
 */

interface AnalyticsEvent {
  name: string
  category: string
  label?: string
  value?: number
  timestamp: number
  userId?: string
  sessionId?: string
  metadata?: Record<string, any>
}

// 转化漏斗步骤定义
export enum FunnelStep {
  HOME_VISIT = 'home_visit',           // 首页访问
  CARD_SELECT = 'card_select',          // 选择卡片
  PAYMENT_PAGE = 'payment_page',        // 支付页
  PAYMENT_SUCCESS = 'payment_success',  // 支付成功
  TEST_COMPLETE = 'test_complete',       // 完成测评
}

interface FunnelEvent {
  step: FunnelStep
  userId?: string
  sessionId: string
  questionnaireType?: string
  amount?: number
  timestamp: number
  metadata?: Record<string, any>
}

class Analytics {
  private events: AnalyticsEvent[] = []
  private funnelEvents: FunnelEvent[] = []
  private sessionId: string

  constructor() {
    // 生成或获取会话ID
    this.sessionId = this.getOrCreateSessionId()
  }

  /**
   * 获取或创建会话ID
   */
  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return ''
    
    const stored = sessionStorage.getItem('analytics_session_id')
    if (stored) return stored
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    sessionStorage.setItem('analytics_session_id', sessionId)
    return sessionId
  }

  /**
   * 追踪事件
   */
  track(eventName: string, category: string, label?: string, value?: number, metadata?: Record<string, any>) {
    const event: AnalyticsEvent = {
      name: eventName,
      category,
      label,
      value,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      metadata,
    }

    this.events.push(event)

    // 可以在这里发送到分析服务
    // this.sendToAnalyticsService(event)

    // 保存到 localStorage（可选）
    this.saveToLocalStorage(event)
  }

  /**
   * 追踪转化漏斗步骤
   */
  trackFunnelStep(
    step: FunnelStep,
    questionnaireType?: string,
    amount?: number,
    metadata?: Record<string, any>
  ) {
    const funnelEvent: FunnelEvent = {
      step,
      sessionId: this.sessionId,
      questionnaireType,
      amount,
      timestamp: Date.now(),
      metadata,
    }

    this.funnelEvents.push(funnelEvent)
    this.saveFunnelToLocalStorage(funnelEvent)

    // 同时记录为普通事件
    this.track(`funnel_${step}`, 'funnel', questionnaireType, amount, metadata)
  }

  /**
   * 追踪页面访问
   */
  trackPageView(path: string) {
    this.track('page_view', 'navigation', path)
  }

  /**
   * 追踪用户操作
   */
  trackUserAction(action: string, details?: Record<string, any>) {
    this.track('user_action', 'interaction', action, undefined)
    if (details) {
      // 可以将详细信息存储到单独的事件中
      this.track('user_action_details', 'interaction', JSON.stringify(details), undefined)
    }
  }

  /**
   * 追踪按钮点击
   */
  trackButtonClick(buttonName: string, location?: string) {
    this.track('button_click', 'interaction', buttonName, undefined)
    if (location) {
      this.track('button_click_location', 'navigation', location, undefined)
    }
  }

  /**
   * 追踪表单提交
   */
  trackFormSubmit(formName: string, success: boolean) {
    this.track('form_submit', 'interaction', formName, success ? 1 : 0)
  }

  /**
   * 追踪搜索
   */
  trackSearch(query: string, resultCount: number) {
    this.track('search', 'interaction', query, resultCount)
  }

  /**
   * 追踪下载
   */
  trackDownload(fileName: string, fileType: string) {
    this.track('download', 'interaction', `${fileName}.${fileType}`, undefined)
  }

  /**
   * 保存到 localStorage
   */
  private saveToLocalStorage(event: AnalyticsEvent) {
    try {
      const stored = localStorage.getItem('analytics_events')
      const events = stored ? JSON.parse(stored) : []
      events.push(event)

      // 只保留最近1000条事件
      if (events.length > 1000) {
        events.splice(0, events.length - 1000)
      }

      localStorage.setItem('analytics_events', JSON.stringify(events))
    } catch {
      // 忽略错误
    }
  }

  /**
   * 保存转化漏斗事件到 localStorage
   */
  private saveFunnelToLocalStorage(event: FunnelEvent) {
    try {
      const stored = localStorage.getItem('analytics_funnel_events')
      const events = stored ? JSON.parse(stored) : []
      events.push(event)

      // 只保留最近5000条漏斗事件
      if (events.length > 5000) {
        events.splice(0, events.length - 5000)
      }

      localStorage.setItem('analytics_funnel_events', JSON.stringify(events))
    } catch {
      // 忽略错误
    }
  }

  /**
   * 获取转化漏斗数据
   */
  getFunnelData(startDate?: Date, endDate?: Date) {
    const stored = typeof window !== 'undefined' 
      ? localStorage.getItem('analytics_funnel_events') 
      : null
    let events: FunnelEvent[] = stored ? JSON.parse(stored) : []

    // 时间过滤
    if (startDate || endDate) {
      events = events.filter(event => {
        const eventDate = new Date(event.timestamp)
        if (startDate && eventDate < startDate) return false
        if (endDate && eventDate > endDate) return false
        return true
      })
    }

    // 按会话分组
    const sessions = new Map<string, FunnelEvent[]>()
    events.forEach(event => {
      if (!sessions.has(event.sessionId)) {
        sessions.set(event.sessionId, [])
      }
      sessions.get(event.sessionId)!.push(event)
    })

    // 统计各步骤的数量
    const stepCounts = {
      [FunnelStep.HOME_VISIT]: 0,
      [FunnelStep.CARD_SELECT]: 0,
      [FunnelStep.PAYMENT_PAGE]: 0,
      [FunnelStep.PAYMENT_SUCCESS]: 0,
      [FunnelStep.TEST_COMPLETE]: 0,
    }

    sessions.forEach(sessionEvents => {
      // 按时间排序
      sessionEvents.sort((a, b) => a.timestamp - b.timestamp)
      
      // 检查每个步骤是否完成
      const stepsCompleted = new Set<FunnelStep>()
      sessionEvents.forEach(event => {
        stepsCompleted.add(event.step)
      })

      // 如果完成了某个步骤，说明前面的步骤也都完成了
      if (stepsCompleted.has(FunnelStep.TEST_COMPLETE)) {
        stepCounts[FunnelStep.TEST_COMPLETE]++
        stepCounts[FunnelStep.PAYMENT_SUCCESS]++
        stepCounts[FunnelStep.PAYMENT_PAGE]++
        stepCounts[FunnelStep.CARD_SELECT]++
        stepCounts[FunnelStep.HOME_VISIT]++
      } else if (stepsCompleted.has(FunnelStep.PAYMENT_SUCCESS)) {
        stepCounts[FunnelStep.PAYMENT_SUCCESS]++
        stepCounts[FunnelStep.PAYMENT_PAGE]++
        stepCounts[FunnelStep.CARD_SELECT]++
        stepCounts[FunnelStep.HOME_VISIT]++
      } else if (stepsCompleted.has(FunnelStep.PAYMENT_PAGE)) {
        stepCounts[FunnelStep.PAYMENT_PAGE]++
        stepCounts[FunnelStep.CARD_SELECT]++
        stepCounts[FunnelStep.HOME_VISIT]++
      } else if (stepsCompleted.has(FunnelStep.CARD_SELECT)) {
        stepCounts[FunnelStep.CARD_SELECT]++
        stepCounts[FunnelStep.HOME_VISIT]++
      } else if (stepsCompleted.has(FunnelStep.HOME_VISIT)) {
        stepCounts[FunnelStep.HOME_VISIT]++
      }
    })

    // 计算转化率
    const totalVisits = stepCounts[FunnelStep.HOME_VISIT]
    const conversionRates = {
      [FunnelStep.HOME_VISIT]: 100,
      [FunnelStep.CARD_SELECT]: totalVisits > 0 ? (stepCounts[FunnelStep.CARD_SELECT] / totalVisits) * 100 : 0,
      [FunnelStep.PAYMENT_PAGE]: totalVisits > 0 ? (stepCounts[FunnelStep.PAYMENT_PAGE] / totalVisits) * 100 : 0,
      [FunnelStep.PAYMENT_SUCCESS]: totalVisits > 0 ? (stepCounts[FunnelStep.PAYMENT_SUCCESS] / totalVisits) * 100 : 0,
      [FunnelStep.TEST_COMPLETE]: totalVisits > 0 ? (stepCounts[FunnelStep.TEST_COMPLETE] / totalVisits) * 100 : 0,
    }

    // 计算流失率
    const dropOffRates = {
      [FunnelStep.HOME_VISIT]: 0,
      [FunnelStep.CARD_SELECT]: totalVisits > 0 ? ((totalVisits - stepCounts[FunnelStep.CARD_SELECT]) / totalVisits) * 100 : 0,
      [FunnelStep.PAYMENT_PAGE]: stepCounts[FunnelStep.CARD_SELECT] > 0 ? ((stepCounts[FunnelStep.CARD_SELECT] - stepCounts[FunnelStep.PAYMENT_PAGE]) / stepCounts[FunnelStep.CARD_SELECT]) * 100 : 0,
      [FunnelStep.PAYMENT_SUCCESS]: stepCounts[FunnelStep.PAYMENT_PAGE] > 0 ? ((stepCounts[FunnelStep.PAYMENT_PAGE] - stepCounts[FunnelStep.PAYMENT_SUCCESS]) / stepCounts[FunnelStep.PAYMENT_PAGE]) * 100 : 0,
      [FunnelStep.TEST_COMPLETE]: stepCounts[FunnelStep.PAYMENT_SUCCESS] > 0 ? ((stepCounts[FunnelStep.PAYMENT_SUCCESS] - stepCounts[FunnelStep.TEST_COMPLETE]) / stepCounts[FunnelStep.PAYMENT_SUCCESS]) * 100 : 0,
    }

    return {
      stepCounts,
      conversionRates,
      dropOffRates,
      totalSessions: sessions.size,
      totalVisits,
    }
  }

  /**
   * 加载事件数据
   */
  private loadEvents() {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem('analytics_events')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  /**
   * 加载漏斗事件数据
   */
  private loadFunnelEvents() {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem('analytics_funnel_events')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const events = this.loadEvents()
    const pageViews = events.filter((e) => e.name === 'page_view').length
    const userActions = events.filter((e) => e.name === 'user_action').length
    const buttonClicks = events.filter((e) => e.name === 'button_click').length
    const searches = events.filter((e) => e.name === 'search').length
    const downloads = events.filter((e) => e.name === 'download').length

    // 获取最常访问的页面
    const pageViewPaths = events
      .filter((e) => e.name === 'page_view')
      .map((e) => e.label || '')
      .filter(Boolean)

    const pageViewCounts = pageViewPaths.reduce((acc, path) => {
      acc[path] = (acc[path] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topPages = Object.entries(pageViewCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([path, count]) => ({ path, count }))

    return {
      totalEvents: events.length,
      pageViews,
      userActions,
      buttonClicks,
      searches,
      downloads,
      topPages,
    }
  }

  /**
   * 导出事件数据（用于分析）
   */
  exportEvents() {
    return JSON.stringify(this.events, null, 2)
  }

  /**
   * 清除所有事件
   */
  clear() {
    this.events = []
    localStorage.removeItem('analytics_events')
  }
}

export const analytics = new Analytics()

