/**
 * 题目导入与解析工具（被多个组件和 Worker 依赖）
 * 之前文件内容丢失导致动态导入失败，这里补上一份精简但可用的实现
 */

import { formatDate as baseFormatDate, formatFileSize, generateId } from './formatters'

/**
 * 标准化后的导入题目结构
 */
export interface ImportedQuestion {
  id: string
  title: string
  type: 'single' | 'multiple' | 'text'
  options: string[]
  answer: string
  tags: string[]
  difficulty?: number
  analysis?: string
  createdAt: number
}

export interface ParseResult {
  questions: ImportedQuestion[]
  warnings: string[]
}

/**
 * 表头别名映射：用于 CSV 解析时把中文/别名列映射到内部字段
 */
export const headerAlias: Record<string, string> = {
  题目: 'title',
  问题: 'title',
  标题: 'title',
  类型: 'type',
  题型: 'type',
  选项: 'options',
  备选项: 'options',
  答案: 'answer',
  正确答案: 'answer',
  标签: 'tags',
  分类: 'tags',
  难度: 'difficulty',
  解析: 'analysis',
}

/**
 * 对外暴露的时间格式化，兼容 number / string / Date
 */
export function formatDate(date: number | string | Date, pattern = 'yyyy-MM-dd HH:mm') {
  const value = typeof date === 'number' ? new Date(date) : date
  return baseFormatDate(value as any, pattern)
}

/**
 * 文件大小格式化（给任务队列等组件用）
 */
export function formatSize(bytes: number): string {
  return formatFileSize(bytes)
}

/**
 * 把原始记录（从 CSV/JSON 来）转换成标准 ImportedQuestion
 */
function normalizeRecord(record: any, index: number): ImportedQuestion {
  const id = String(record.id || generateId() || `${Date.now()}-${index}`)
  const title = String(record.title || record.题目 || record.问题 || '').trim()
  const type = (record.type || record.类型 || 'single') as ImportedQuestion['type']

  // 选项：支持数组或用 | / , 分隔的字符串
  let options: string[] = []
  if (Array.isArray(record.options)) {
    options = record.options.map(String)
  } else if (typeof record.options === 'string' && record.options.trim()) {
    options = record.options.split(/[|,，]/).map((s: string) => s.trim()).filter(Boolean)
  } else if (typeof record.optionsRaw === 'string' && record.optionsRaw.trim()) {
    options = record.optionsRaw.split(/[|,，]/).map((s: string) => s.trim()).filter(Boolean)
  }

  const answer = String(record.answer || record.答案 || '').trim()

  // 标签：支持数组或用 , / 、 分隔的字符串
  let tags: string[] = []
  if (Array.isArray(record.tags)) {
    tags = record.tags.map(String)
  } else if (typeof record.tags === 'string' && record.tags.trim()) {
    tags = record.tags.split(/[|,，、]/).map((s: string) => s.trim()).filter(Boolean)
  }

  const difficultyRaw = record.difficulty ?? record.难度
  const difficulty = typeof difficultyRaw === 'number' ? difficultyRaw : difficultyRaw ? Number(difficultyRaw) || undefined : undefined

  const analysis = record.analysis || record.解析 || ''

  const createdAt =
    typeof record.createdAt === 'number'
      ? record.createdAt
      : record.createdAt
      ? new Date(record.createdAt).getTime()
      : Date.now()

  return {
    id,
    title,
    type,
    options,
    answer,
    tags,
    difficulty,
    analysis,
    createdAt,
  }
}

/**
 * 解析 CSV 文本
 * - 支持逗号或制表符分隔
 * - 第一行为表头
 */
export function parseCSV(text: string, alias: Record<string, string> = headerAlias): ParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) {
    return { questions: [], warnings: ['文件内容为空'] }
  }

  const headerLine = lines[0]
  const delimiter = headerLine.includes('\t') && !headerLine.includes(',') ? '\t' : ','
  const headers = headerLine.split(delimiter).map((h) => h.trim())

  const mappedKeys = headers.map((h) => alias[h] || h)
  const warnings: string[] = []
  const questions: ImportedQuestion[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    const cells = line.split(delimiter)
    const record: any = {}
    mappedKeys.forEach((key, idx) => {
      record[key] = cells[idx]?.trim?.() ?? ''
    })

    const normalized = normalizeRecord(record, i - 1)
    if (!normalized.title) {
      warnings.push(`第 ${i + 1} 行缺少题目标题，已跳过`)
      continue
    }
    questions.push(normalized)
  }

  return { questions, warnings }
}

/**
 * 解析 JSON 文本
 * - 期望为数组或包含 questions 字段的对象
 */
export function parseJSON(text: string): ParseResult {
  try {
    const data = JSON.parse(text)
    const list = Array.isArray(data) ? data : Array.isArray(data?.questions) ? data.questions : []

    const questions = list.map((item: any, index: number) => normalizeRecord(item, index))
    return { questions, warnings: [] }
  } catch (error) {
    return {
      questions: [],
      warnings: ['JSON 解析失败，请检查文件格式是否正确'],
    }
  }
}





