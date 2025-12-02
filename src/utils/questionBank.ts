/**
 * 多题库/多空间管理 - 干净实现
 */

export interface QuestionBank {
  id: string
  name: string
  description?: string
  questionCount: number
  createdAt: number
  updatedAt: number
}

const BANK_STORAGE_KEY = 'question-banks'
const DEFAULT_BANK_ID = 'default'

/**
 * 获取题库存储键
 */
function getBankStorageKey(bankId: string): string {
  return `question-bank-${bankId}`
}

/**
 * 加载所有题库
 */
export function loadBanks(): QuestionBank[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(BANK_STORAGE_KEY)
    if (!raw) {
      // 创建默认题库并直接保存，避免递归调用
      const defaultBank: QuestionBank = {
        id: DEFAULT_BANK_ID,
        name: '默认题库',
        description: '系统默认题库',
        questionCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify([defaultBank]))
      return [defaultBank]
    }
    return JSON.parse(raw)
  } catch (error) {
    console.warn('题库列表读取失败', error)
    return []
  }
}

/**
 * 保存题库列表
 */
function saveBankList(banks: QuestionBank[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify(banks))
}

/**
 * 保存题库信息
 */
export function saveBank(bank: QuestionBank): void {
  if (typeof window === 'undefined') return
  try {
    const banks = loadBanks()
    const index = banks.findIndex((b) => b.id === bank.id)
    if (index >= 0) {
      banks[index] = { ...bank, updatedAt: Date.now() }
    } else {
      banks.push(bank)
    }
    saveBankList(banks)
  } catch (error) {
    console.warn('题库保存失败', error)
  }
}

/**
 * 删除题库
 */
export function deleteBank(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const banks = loadBanks()
    const updated = banks.filter((b) => b.id !== id)
    saveBankList(updated)

    // 删除题库的题目数据
    localStorage.removeItem(getBankStorageKey(id))
  } catch (error) {
    console.warn('题库删除失败', error)
  }
}

/**
 * 创建新题库
 */
export function createBank(name: string, description?: string): QuestionBank {
  const bank: QuestionBank = {
    id: `bank_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    name,
    description,
    questionCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  saveBank(bank)
  return bank
}

/**
 * 加载题库中的题目
 */
export function loadBankQuestions(bankId: string): any[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(getBankStorageKey(bankId))
    if (!raw) return []
    return JSON.parse(raw)
  } catch (error) {
    console.warn(`题库 ${bankId} 题目读取失败`, error)
    return []
  }
}

/**
 * 保存题库中的题目
 */
export function saveBankQuestions(bankId: string, questions: any[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(getBankStorageKey(bankId), JSON.stringify(questions))

    // 更新题库信息
    try {
      const raw = localStorage.getItem(BANK_STORAGE_KEY)
      if (raw) {
        const banks: QuestionBank[] = JSON.parse(raw)
        const bank = banks.find((b) => b.id === bankId)
        if (bank) {
          bank.questionCount = questions.length
          bank.updatedAt = Date.now()
          const index = banks.findIndex((b) => b.id === bankId)
          if (index >= 0) {
            banks[index] = bank
          }
          localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify(banks))
        }
      }
    } catch (err) {
      console.warn('更新题库信息失败', err)
    }
  } catch (error) {
    console.warn(`题库 ${bankId} 题目保存失败`, error)
  }
}

/**
 * 获取当前使用的题库ID
 */
export function getCurrentBankId(): string {
  if (typeof window === 'undefined') return DEFAULT_BANK_ID
  return localStorage.getItem('current-question-bank-id') || DEFAULT_BANK_ID
}

/**
 * 设置当前使用的题库ID
 */
export function setCurrentBankId(bankId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('current-question-bank-id', bankId)
}





