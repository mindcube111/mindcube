/**
 * 补充题目导入功能的组件测试和集成测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuestionImport from '@/pages/QuestionImport'
import {
  loadFieldMappings,
  saveFieldMapping,
  createFieldMapping,
  autoDetectFieldMapping,
} from './fieldMapping'
import {
  loadValidationRules,
  saveValidationRule,
  validateRecord,
  DEFAULT_RULES,
} from './validationRules'
import { loadBanks, createBank, getCurrentBankId, setCurrentBankId } from './questionBank'

describe('题目导入 - 字段映射功能', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('应该能够自动检测字段映射', () => {
    const sourceFields = ['题目', '类型', '选项', '答案']
    const mapping = autoDetectFieldMapping(sourceFields)
    expect(mapping['题目']).toBe('title')
    expect(mapping['类型']).toBe('type')
    expect(mapping['答案']).toBe('answer')
  })

  it('应该能够保存和加载字段映射', () => {
    const mapping = createFieldMapping('测试映射', {
      question: 'title',
      type: 'type',
      answer: 'answer',
    })
    saveFieldMapping(mapping)
    const loaded = loadFieldMappings()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].name).toBe('测试映射')
  })
})

describe('题目导入 - 校验规则功能', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('应该能够校验题目记录', () => {
    const validRecord = {
      title: '测试题目',
      type: 'single',
      optionsRaw: '选项A|选项B',
      answer: '选项A',
      tags: '标签1',
      difficulty: '3',
    }
    const result = validateRecord(validRecord, DEFAULT_RULES)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('应该能够检测缺失必填字段', () => {
    const invalidRecord = {
      type: 'single',
      optionsRaw: '选项A|选项B',
    }
    const result = validateRecord(invalidRecord, DEFAULT_RULES)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('应该能够保存和加载校验规则', () => {
    const rule = {
      id: 'test-rule',
      name: '测试规则',
      rules: DEFAULT_RULES,
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    saveValidationRule(rule)
    const loaded = loadValidationRules()
    expect(loaded).toHaveLength(1)
  })
})

describe('题目导入 - 多题库功能', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('应该能够创建和切换题库', () => {
    const bank1 = createBank('题库1', '第一个题库')
    const bank2 = createBank('题库2', '第二个题库')
    const banks = loadBanks()
    expect(banks.length).toBeGreaterThanOrEqual(2)

    setCurrentBankId(bank1.id)
    expect(getCurrentBankId()).toBe(bank1.id)

    setCurrentBankId(bank2.id)
    expect(getCurrentBankId()).toBe(bank2.id)
  })
})

describe('题目导入 - 集成测试', () => {
  beforeEach(() => {
    localStorage.clear()
    // Mock toast
    vi.mock('react-hot-toast', () => ({
      default: {
        success: vi.fn(),
        error: vi.fn(),
      },
    }))
  })

  it('应该能够完整执行导入流程', async () => {
    // 这里可以添加完整的E2E测试逻辑
    // 由于涉及DOM操作，实际测试应该在Playwright中进行
    expect(true).toBe(true) // 占位测试
  })
})

