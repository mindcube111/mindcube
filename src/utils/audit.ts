/**
 * 操作日志和审计系统
 * 记录用户操作，支持审计和追踪
 */

export interface OperationLog {
  id: string
  userId: string
  username: string
  action: string
  target: string
  targetType: 'link' | 'questionnaire' | 'user' | 'system' | 'other'
  details?: Record<string, any>
  timestamp: string
  ip?: string
}

import { STORAGE_KEYS, MAX_ITEMS } from '@/constants'
import { getCachedStorageItem, setCachedStorageItem } from './cache'

const AUDIT_LOG_KEY = STORAGE_KEYS.AUDIT_LOGS
const MAX_LOGS = MAX_ITEMS.AUDIT_LOGS

/**
 * 添加操作日志
 */
export function addAuditLog(log: Omit<OperationLog, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return

  try {
    const logs = loadAuditLogs()
    const newLog: OperationLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    }

    // 添加新日志到开头
    logs.unshift(newLog)

    // 限制日志数量
    if (logs.length > MAX_LOGS) {
      logs.splice(MAX_LOGS)
    }

    setCachedStorageItem(AUDIT_LOG_KEY, logs)
    window.dispatchEvent(new Event('audit-logs-updated'))
  } catch (error) {
    console.error('Failed to save audit log:', error)
  }
}

/**
 * 加载操作日志
 */
export function loadAuditLogs(): OperationLog[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = getCachedStorageItem<OperationLog[]>(AUDIT_LOG_KEY, [])
    return Array.isArray(stored) ? stored : []
  } catch (error) {
    console.error('Failed to load audit logs:', error)
    return []
  }
}

/**
 * 查询操作日志
 */
export function queryAuditLogs(filters?: {
  userId?: string
  action?: string
  targetType?: OperationLog['targetType']
  startDate?: string
  endDate?: string
  limit?: number
}): OperationLog[] {
  let logs = loadAuditLogs()

  if (filters?.userId) {
    logs = logs.filter((log) => log.userId === filters.userId)
  }

  if (filters?.action) {
    logs = logs.filter((log) => log.action.includes(filters.action!))
  }

  if (filters?.targetType) {
    logs = logs.filter((log) => log.targetType === filters.targetType)
  }

  if (filters?.startDate) {
    logs = logs.filter((log) => log.timestamp >= filters.startDate!)
  }

  if (filters?.endDate) {
    logs = logs.filter((log) => log.timestamp <= filters.endDate!)
  }

  if (filters?.limit) {
    logs = logs.slice(0, filters.limit)
  }

  return logs
}

/**
 * 清除操作日志
 */
export function clearAuditLogs(): void {
  if (typeof window === 'undefined') return
  import('./cache').then(({ memoryCache }) => {
    memoryCache.delete(AUDIT_LOG_KEY)
  })
  localStorage.removeItem(AUDIT_LOG_KEY)
  window.dispatchEvent(new Event('audit-logs-updated'))
}

/**
 * 导出操作日志
 */
export function exportAuditLogs(logs: OperationLog[]): string {
  const csv = [
    ['时间', '用户ID', '用户名', '操作', '目标', '目标类型', '详情'],
    ...logs.map((log) => [
      new Date(log.timestamp).toLocaleString('zh-CN'),
      log.userId,
      log.username,
      log.action,
      log.target,
      log.targetType,
      log.details ? JSON.stringify(log.details) : '',
    ]),
  ]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return csv
}


