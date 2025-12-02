/**
 * 数据备份和恢复系统
 * 支持手动和自动备份、数据恢复
 */

import { STORAGE_KEYS, MAX_ITEMS } from '@/constants'

export interface BackupData {
  id: string
  name: string
  description?: string
  timestamp: string
  data: {
    links?: any[]
    users?: any[]
    questionnaires?: {
      customTypes: any[]
      publishState: Record<string, any>
      history: any[]
    }
    auditLogs?: any[]
    settings?: Record<string, any>
  }
  size: number
  version: string
}

const BACKUP_STORAGE_KEY = STORAGE_KEYS.BACKUPS
const MAX_BACKUPS = MAX_ITEMS.BACKUPS

/**
 * 创建数据备份
 */
export function createBackup(name: string, description?: string): BackupData {
  const timestamp = new Date().toISOString()
  const backup: BackupData = {
    id: `backup_${Date.now()}`,
    name,
    description,
    timestamp,
    version: '1.0',
    data: {
      // 备份链接数据
      links: (() => {
        try {
          const stored = localStorage.getItem(STORAGE_KEYS.LINKS)
          return stored ? JSON.parse(stored) : []
        } catch {
          return []
        }
      })(),
      // 备份用户数据
      users: (() => {
        try {
          const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_USERS)
          return stored ? JSON.parse(stored) : []
        } catch {
          return []
        }
      })(),
      // 备份问卷数据
      questionnaires: (() => {
        try {
          const customTypes = localStorage.getItem(STORAGE_KEYS.QUESTION_TYPES)
          const publishState = localStorage.getItem(STORAGE_KEYS.PUBLISH_STATE)
          const history = localStorage.getItem(STORAGE_KEYS.IMPORT_HISTORY)
          return {
            customTypes: customTypes ? JSON.parse(customTypes) : [],
            publishState: publishState ? JSON.parse(publishState) : {},
            history: history ? JSON.parse(history) : [],
          }
        } catch {
          return {
            customTypes: [],
            publishState: {},
            history: [],
          }
        }
      })(),
      // 备份审计日志
      auditLogs: (() => {
        try {
          const stored = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)
          return stored ? JSON.parse(stored) : []
        } catch {
          return []
        }
      })(),
    },
    size: 0,
  }

  // 计算备份大小（近似值）
  backup.size = JSON.stringify(backup.data).length

  // 保存备份列表
  const backups = loadBackups()
  backups.unshift(backup)

  // 限制备份数量
  if (backups.length > MAX_BACKUPS) {
    backups.splice(MAX_BACKUPS)
  }

  localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(backups))

  return backup
}

/**
 * 加载备份列表
 */
export function loadBackups(): BackupData[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(BACKUP_STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Failed to load backups:', error)
    return []
  }
}

/**
 * 获取单个备份
 */
export function getBackup(backupId: string): BackupData | null {
  const backups = loadBackups()
  return backups.find((backup) => backup.id === backupId) || null
}

/**
 * 恢复备份
 */
export function restoreBackup(backupId: string): { success: boolean; message: string } {
  const backup = getBackup(backupId)
  if (!backup) {
    return { success: false, message: '备份不存在' }
  }

  try {
    // 恢复链接数据
    if (backup.data.links) {
      localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(backup.data.links))
    }

    // 恢复用户数据
    if (backup.data.users) {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_USERS, JSON.stringify(backup.data.users))
    }

    // 恢复问卷数据
    if (backup.data.questionnaires) {
      const qData = backup.data.questionnaires as any
      if (qData.customTypes) {
        localStorage.setItem(STORAGE_KEYS.QUESTION_TYPES, JSON.stringify(qData.customTypes))
      }
      if (qData.publishState) {
        localStorage.setItem(STORAGE_KEYS.PUBLISH_STATE, JSON.stringify(qData.publishState))
      }
      if (qData.history) {
        localStorage.setItem(STORAGE_KEYS.IMPORT_HISTORY, JSON.stringify(qData.history))
      }
    }

    // 恢复审计日志
    if (backup.data.auditLogs) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(backup.data.auditLogs))
    }

    // 触发更新事件
    window.dispatchEvent(new Event('links-updated'))
    window.dispatchEvent(new Event('question-types-updated'))
    window.dispatchEvent(new Event('audit-logs-updated'))

    return { success: true, message: '备份恢复成功' }
  } catch (error) {
    console.error('Failed to restore backup:', error)
    return { success: false, message: '恢复备份时出错' }
  }
}

/**
 * 删除备份
 */
export function deleteBackup(backupId: string): boolean {
  const backups = loadBackups()
  const filtered = backups.filter((backup) => backup.id !== backupId)

  if (filtered.length === backups.length) {
    return false // 备份不存在
  }

  localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(filtered))
  return true
}

/**
 * 导出备份为JSON文件
 */
export function exportBackupAsJSON(backup: BackupData): void {
  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${backup.name}_${backup.timestamp.split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 从JSON文件导入备份
 */
export function importBackupFromJSON(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const backup = JSON.parse(reader.result as string) as BackupData
        // 验证备份格式
        if (!backup.id || !backup.name || !backup.timestamp || !backup.data) {
          reject(new Error('无效的备份文件格式'))
          return
        }
        // 添加到备份列表
        const backups = loadBackups()
        backups.unshift(backup)
        if (backups.length > MAX_BACKUPS) {
          backups.splice(MAX_BACKUPS)
        }
        localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(backups))
        resolve(backup)
      } catch (error) {
        reject(new Error('无法解析备份文件'))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

