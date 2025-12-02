export interface ImportHistoryRecord {
  id: string
  bankId: string
  bankName?: string
  fileName: string
  fileSize: number
  fileType: 'csv' | 'json' | 'xlsx' | 'txt' | 'unknown'
  importedCount: number
  totalParsed: number
  skippedCount: number
  strategy: 'append' | 'overwrite'
  createdAt: number
}

const STORAGE_KEY = 'question-import-history'

export function loadImportHistory(): ImportHistoryRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveImportHistory(records: ImportHistoryRecord[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export function addImportHistory(record: ImportHistoryRecord) {
  const list = loadImportHistory()
  list.unshift(record)
  // 只保留最近 50 条
  const trimmed = list.slice(0, 50)
  saveImportHistory(trimmed)
}




