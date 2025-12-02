/**
 * 字段映射工具：用于将导入文件的列与系统字段进行对应
 */

export interface FieldMapping {
  id: string
  name: string
  mapping: Record<string, string>
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'question_field_mappings'

const BUILTIN_MAPPING: FieldMapping = {
  id: 'default-mapping',
  name: '默认映射',
  mapping: {
    题目: 'title',
    类型: 'type',
    选项: 'options',
    答案: 'answer',
    标签: 'tags',
    难度: 'difficulty',
    解析: 'analysis',
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

function readMappings(): FieldMapping[] {
  if (typeof window === 'undefined') return [BUILTIN_MAPPING]
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return [BUILTIN_MAPPING]
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [BUILTIN_MAPPING]
  } catch {
    return [BUILTIN_MAPPING]
  }
}

function persist(mappings: FieldMapping[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings))
}

export function loadFieldMappings(): FieldMapping[] {
  return readMappings()
}

export function saveFieldMapping(mapping: FieldMapping) {
  const mappings = readMappings()
  const index = mappings.findIndex((item) => item.id === mapping.id)
  if (index >= 0) {
    mappings[index] = mapping
  } else {
    mappings.unshift(mapping)
  }
  persist(mappings)
}

export function createFieldMapping(name: string, mapping: Record<string, string>): FieldMapping {
  const now = Date.now()
  const fieldMapping: FieldMapping = {
    id: `mapping_${now}`,
    name,
    mapping,
    createdAt: now,
    updatedAt: now,
  }
  saveFieldMapping(fieldMapping)
  return fieldMapping
}

export function autoDetectFieldMapping(sourceFields: string[]): Record<string, string> {
  const normalized = sourceFields.map((field) => field.trim())
  const defaultMap = BUILTIN_MAPPING.mapping
  const result: Record<string, string> = {}

  normalized.forEach((field) => {
    if (defaultMap[field]) {
      result[field] = defaultMap[field]
      return
    }
    // 简单的包含关系匹配
    if (/题|目/.test(field)) {
      result[field] = 'title'
    } else if (/类|型/.test(field)) {
      result[field] = 'type'
    } else if (/选|项/.test(field)) {
      result[field] = 'options'
    } else if (/答|案/.test(field)) {
      result[field] = 'answer'
    } else if (/标|签/.test(field)) {
      result[field] = 'tags'
    } else if (/难|度/.test(field)) {
      result[field] = 'difficulty'
    } else if (/解|析/.test(field)) {
      result[field] = 'analysis'
    }
  })

  return result
}








