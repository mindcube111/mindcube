/**
 * 题目导入任务队列的本地存储实现
 */

export type ImportTaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface ImportTask {
  id: string
  fileName: string
  fileSize: number
  questionCount: number
  added: number
  updated: number
  progress: number
  status: ImportTaskStatus
  createdAt: string
  completedAt?: string
  error?: string
}

const STORAGE_KEY = 'question_import_tasks'

const hasWindow = typeof window !== 'undefined'

function readTasks(): ImportTask[] {
  if (!hasWindow) return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistTasks(tasks: ImportTask[]) {
  if (!hasWindow) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.slice(0, 50)))
}

export function loadTasks(): ImportTask[] {
  return readTasks()
}

export function upsertTask(task: ImportTask): ImportTask {
  const tasks = readTasks()
  const index = tasks.findIndex((item) => item.id === task.id)
  if (index >= 0) {
    tasks[index] = task
  } else {
    tasks.unshift(task)
  }
  persistTasks(tasks)
  return task
}

export function deleteTask(id: string) {
  const tasks = readTasks().filter((task) => task.id !== id)
  persistTasks(tasks)
}

export function createTask(partial: Partial<ImportTask> & { fileName: string; questionCount: number }): ImportTask {
  const task: ImportTask = {
    id: partial.id || `task_${Date.now()}`,
    fileName: partial.fileName,
    fileSize: partial.fileSize ?? 0,
    questionCount: partial.questionCount,
    added: partial.added ?? 0,
    updated: partial.updated ?? 0,
    progress: partial.progress ?? 0,
    status: partial.status ?? 'pending',
    createdAt: partial.createdAt ?? new Date().toISOString(),
    completedAt: partial.completedAt,
    error: partial.error,
  }
  return upsertTask(task)
}








