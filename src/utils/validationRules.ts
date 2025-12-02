/**
 * 题目导入校验规则
 */

export interface ValidationRule {
  field: string
  required?: boolean
  message?: string
  validator?: (value: unknown, record: Record<string, unknown>) => boolean
}

export interface ValidationRuleSet {
  id: string
  name: string
  rules: ValidationRule[]
  enabled: boolean
  createdAt: number
  updatedAt: number
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export const DEFAULT_RULES: ValidationRule[] = [
  { field: 'title', required: true, message: '题目为必填项' },
  { field: 'type', required: true, message: '题型为必填项' },
  {
    field: 'optionsRaw',
    validator: (value, record) => {
      if (record.type === 'text') return true
      return typeof value === 'string' && value.trim().length > 0
    },
    message: '非文本题目需要提供选项',
  },
  {
    field: 'answer',
    validator: (value, record) => {
      if (record.type === 'text') return true
      return typeof value === 'string' && value.trim().length > 0
    },
    message: '非文本题目需要提供答案',
  },
]

const STORAGE_KEY = 'question_validation_rules'

function readRules(): ValidationRuleSet[] {
  if (typeof window === 'undefined') {
    return [
      {
        id: 'default-rule-set',
        name: '默认校验规则',
        rules: DEFAULT_RULES,
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persist(rules: ValidationRuleSet[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
}

export function loadValidationRules(): ValidationRuleSet[] {
  return readRules()
}

export function saveValidationRule(ruleSet: ValidationRuleSet) {
  const list = readRules()
  const index = list.findIndex((item) => item.id === ruleSet.id)
  if (index >= 0) {
    list[index] = ruleSet
  } else {
    list.unshift(ruleSet)
  }
  persist(list)
}

export function validateRecord(record: Record<string, any>, rules: ValidationRule[]): ValidationResult {
  const errors: string[] = []

  rules.forEach((rule) => {
    const value = record[rule.field]
    if (rule.required && (value === undefined || value === null || String(value).trim() === '')) {
      errors.push(rule.message || `${rule.field} 为必填项`)
      return
    }
    if (rule.validator && !rule.validator(value, record)) {
      errors.push(rule.message || `${rule.field} 不符合要求`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}








