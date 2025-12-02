/**
 * 导出历史记录管理
 * 记录所有数据导出操作
 */

import { generateId } from './formatters'

export interface ExportHistory {
  id: string
  userId: string
  username: string
  exportType: 'links' | 'logs' | 'statistics' | 'reports' | 'users'
  format: 'excel' | 'csv' | 'pdf' | 'json'
  filename: string
  recordCount: number
  timestamp: string
  details?: Record<string, any>
}

const EXPORT_HISTORY_KEY = 'export_history'
const MAX_HISTORY = 500

/**
 * 加载导出历史
 */
export function loadExportHistory(): ExportHistory[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(EXPORT_HISTORY_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.warn('加载导出历史失败', error)
    return []
  }
}

/**
 * 保存导出历史
 */
export function saveExportHistory(history: Omit<ExportHistory, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return
  
  try {
    const existing = loadExportHistory()
    const newHistory: ExportHistory = {
      ...history,
      id: generateId(),
      timestamp: new Date().toISOString(),
    }
    const updated = [newHistory, ...existing].slice(0, MAX_HISTORY)
    localStorage.setItem(EXPORT_HISTORY_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('保存导出历史失败', error)
  }
}

/**
 * 删除导出历史
 */
export function deleteExportHistory(historyId: string): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const existing = loadExportHistory()
    const filtered = existing.filter(h => h.id !== historyId)
    localStorage.setItem(EXPORT_HISTORY_KEY, JSON.stringify(filtered))
    return filtered.length < existing.length
  } catch (error) {
    console.error('删除导出历史失败', error)
    return false
  }
}

/**
 * 清除所有导出历史
 */
export function clearExportHistory(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(EXPORT_HISTORY_KEY)
}