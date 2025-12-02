/**
 * 题目上下架操作台（与 QuestionManage 相同，实现拆到新文件以规避旧缓存问题）
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Search, Filter, CheckCircle2, XCircle, Trash2, Upload, Download, RefreshCw } from 'lucide-react'
import {
  loadBankQuestions,
  saveBankQuestions,
  getCurrentBankId,
  setCurrentBankId as setGlobalBankId,
  loadBanks,
} from '@/utils/questionBank'
import QuestionBankSelector from '@/components/QuestionBankSelector'
import type { ImportedQuestion } from '@/utils/questionImport'
import { formatDate } from '@/utils/questionImport'

interface ManagedQuestion extends ImportedQuestion {
  status: 'online' | 'offline'
  updatedAt?: number
}

const STORAGE_KEY_PREFIX = 'question-status-'

function getStatusStorageKey(bankId: string): string {
  return `${STORAGE_KEY_PREFIX}${bankId}`
}

function loadQuestionStatuses(bankId: string): Record<string, 'online' | 'offline'> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(getStatusStorageKey(bankId))
    if (!raw) return {}
    return JSON.parse(raw)
  } catch (error) {
    console.warn('题目状态读取失败', error)
    return {}
  }
}

function saveQuestionStatuses(bankId: string, statuses: Record<string, 'online' | 'offline'>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(getStatusStorageKey(bankId), JSON.stringify(statuses))
  } catch (error) {
    console.warn('题目状态保存失败', error)
  }
}

export default function QuestionManagePage() {
  const [currentBankId, setCurrentBankId] = useState<string>(() => {
    const bankId = getCurrentBankId()
    const banks = loadBanks()
    if (banks.length === 0) {
      const defaultBanks = loadBanks()
      if (defaultBanks.length > 0) {
        setGlobalBankId(defaultBanks[0].id)
        return defaultBanks[0].id
      }
    }
    return bankId
  })
  const [questions, setQuestions] = useState<ManagedQuestion[]>([])
  const [statuses, setStatuses] = useState<Record<string, 'online' | 'offline'>>({})
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'single' | 'multiple' | 'text'>('all')
  const [loading, setLoading] = useState(false)

  const migrateOldQuestions = useCallback((targetBankId: string) => {
    try {
      const oldStorageKey = 'question-bank'
      const oldData = localStorage.getItem(oldStorageKey)
      if (oldData) {
        try {
          const oldQuestions = JSON.parse(oldData)
          if (Array.isArray(oldQuestions) && oldQuestions.length > 0) {
            const existingQuestions = loadBankQuestions(targetBankId)

            if (existingQuestions.length === 0) {
              saveBankQuestions(targetBankId, oldQuestions)
              localStorage.removeItem(oldStorageKey)
              console.log(`已将 ${oldQuestions.length} 道题目从旧系统迁移到题库 ${targetBankId}`)
              return true
            }

            const existingMap = new Map<string, ImportedQuestion>()
            existingQuestions.forEach((q: ImportedQuestion) => {
              existingMap.set(q.title.trim(), q)
            })

            const mergedQuestions: ImportedQuestion[] = [...existingQuestions]
            let addedCount = 0

            oldQuestions.forEach((oldQ: ImportedQuestion) => {
              const key = oldQ.title?.trim()
              if (key && !existingMap.has(key)) {
                mergedQuestions.push(oldQ)
                existingMap.set(key, oldQ)
                addedCount++
              }
            })

            if (addedCount > 0) {
              saveBankQuestions(targetBankId, mergedQuestions)
              localStorage.removeItem(oldStorageKey)
              console.log(`已合并 ${addedCount} 道旧题目到题库 ${targetBankId}`)
              return true
            }
          }
        } catch (e) {
          console.warn('迁移旧数据失败', e)
        }
      }
      return false
    } catch (error) {
      console.warn('迁移旧数据时出错', error)
      return false
    }
  }, [])

  const loadQuestions = useCallback(
    (targetBankId?: string) => {
      setLoading(true)
      try {
        let bankId = targetBankId || currentBankId || getCurrentBankId()

        let banks = loadBanks()
        if (banks.length === 0) {
          banks = loadBanks()
        }

        if (banks.length > 0) {
          const exists = banks.some(b => b.id === bankId)
          const finalBankId = exists ? bankId : banks[0].id

          if (!exists && banks[0]) {
            setGlobalBankId(banks[0].id)
            setCurrentBankId(banks[0].id)
            bankId = banks[0].id
          }

          const hasMigrated = migrateOldQuestions(finalBankId)

          let bankQuestions = loadBankQuestions(finalBankId) as ImportedQuestion[]
          if (hasMigrated) {
            bankQuestions = loadBankQuestions(finalBankId) as ImportedQuestion[]
          }

          const questionStatuses = loadQuestionStatuses(finalBankId)

          const managedQuestions: ManagedQuestion[] = bankQuestions.map((q) => ({
            ...q,
            status: questionStatuses[q.id] || 'online',
            updatedAt: questionStatuses[q.id] ? Date.now() : q.createdAt,
          }))

          setQuestions(managedQuestions)
          setStatuses(questionStatuses)

          if (finalBankId !== currentBankId) {
            setCurrentBankId(finalBankId)
            setGlobalBankId(finalBankId)
          }

          if (hasMigrated && managedQuestions.length > 0) {
            const banksList = loadBanks()
            const bankIndex = banksList.findIndex(b => b.id === finalBankId)
            if (bankIndex >= 0) {
              banksList[bankIndex].questionCount = managedQuestions.length
              banksList[bankIndex].updatedAt = Date.now()
              localStorage.setItem('question-banks', JSON.stringify(banksList))
            }
            toast.success(`已迁移 ${managedQuestions.length} 道题目到当前题库`)
          }
        } else {
          setQuestions([])
          setStatuses({})
        }
      } catch (error) {
        console.error('加载题目失败', error)
        toast.error('加载题目失败')
      } finally {
        setLoading(false)
      }
    },
    [currentBankId, migrateOldQuestions]
  )

  const [hasCheckedMigration, setHasCheckedMigration] = useState(false)

  useEffect(() => {
    if (!hasCheckedMigration) {
      try {
        const oldStorageKey = 'question-bank'
        const oldData = localStorage.getItem(oldStorageKey)
        if (oldData) {
          try {
            const oldQuestions = JSON.parse(oldData)
            if (Array.isArray(oldQuestions) && oldQuestions.length > 0) {
              console.log(`发现 ${oldQuestions.length} 道旧题目，将在加载时自动迁移`)
            }
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
      setHasCheckedMigration(true)
    }

    loadQuestions()
    
    // 监听题目更新事件
    const handleQuestionsUpdate = () => {
      loadQuestions()
    }
    
    window.addEventListener('questions-updated', handleQuestionsUpdate)
    
    return () => {
      window.removeEventListener('questions-updated', handleQuestionsUpdate)
    }
  }, [loadQuestions, hasCheckedMigration])

  const toggleQuestionStatus = useCallback(
    (questionId: string, currentStatus: 'online' | 'offline') => {
      const newStatus = currentStatus === 'online' ? 'offline' : 'online'
      const newStatuses: Record<string, 'online' | 'offline'> = { ...statuses, [questionId]: newStatus }
      setStatuses(newStatuses)
      saveQuestionStatuses(currentBankId, newStatuses)

      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, status: newStatus, updatedAt: Date.now() } : q))
      )

      toast.success(`题目已${newStatus === 'online' ? '上架' : '下架'}`)
    },
    [currentBankId, statuses]
  )

  const batchUpdateStatus = useCallback(
    (selectedIds: string[], status: 'online' | 'offline') => {
      const newStatuses: Record<string, 'online' | 'offline'> = { ...statuses }
      selectedIds.forEach((id) => {
        newStatuses[id] = status
      })

      setStatuses(newStatuses)
      saveQuestionStatuses(currentBankId, newStatuses)

      setQuestions((prev) =>
        prev.map((q) => (selectedIds.includes(q.id) ? { ...q, status, updatedAt: Date.now() } : q))
      )

      toast.success(`已批量${status === 'online' ? '上架' : '下架'} ${selectedIds.length} 道题目`)
    },
    [currentBankId, statuses]
  )

  const handleDeleteQuestion = useCallback(
    (questionId: string) => {
      if (!confirm('确定删除这道题目吗？删除后无法恢复。')) return

      const updatedQuestions = questions.filter((q) => q.id !== questionId)
      setQuestions(updatedQuestions)
      saveBankQuestions(
        currentBankId,
        updatedQuestions.map(({ status, updatedAt, ...q }) => q)
      )

      const newStatuses = { ...statuses }
      delete newStatuses[questionId]
      setStatuses(newStatuses)
      saveQuestionStatuses(currentBankId, newStatuses)

      toast.success('题目已删除')
    },
    [currentBankId, questions, statuses]
  )

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (statusFilter !== 'all' && q.status !== statusFilter) return false
      if (typeFilter !== 'all' && q.type !== typeFilter) return false

      if (searchText.trim()) {
        const keyword = searchText.toLowerCase()
        return (
          q.title.toLowerCase().includes(keyword) ||
          q.tags.some((tag) => tag.toLowerCase().includes(keyword)) ||
          q.answer.toLowerCase().includes(keyword) ||
          (q.analysis && q.analysis.toLowerCase().includes(keyword))
        )
      }

      return true
    })
  }, [questions, statusFilter, typeFilter, searchText])

  const stats = useMemo(() => {
    return {
      total: questions.length,
      online: questions.filter((q) => q.status === 'online').length,
      offline: questions.filter((q) => q.status === 'offline').length,
      byType: {
        single: questions.filter((q) => q.type === 'single').length,
        multiple: questions.filter((q) => q.type === 'multiple').length,
        text: questions.filter((q) => q.type === 'text').length,
      },
    }
  }, [questions])

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      single: '单选题',
      multiple: '多选题',
      text: '开放题',
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      single: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
      multiple: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
      text: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="w-full space-y-6">
      <header>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-500/20">
                <CheckCircle2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">题目上下架操作台</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">管理题目的上下架状态，控制题目在测试中的可见性</p>
              </div>
            </div>
          </div>
          <div className="hidden lg:block min-w-[280px]">
            <QuestionBankSelector
              onBankChange={(bankId) => {
                setGlobalBankId(bankId)
                setCurrentBankId(bankId)
                setTimeout(() => {
                  loadQuestions()
                }, 100)
              }}
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">题目总数</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="rounded-full bg-gray-100 p-3 dark:bg-gray-800">
              <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">已上架</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.online}</p>
            </div>
            <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">已下架</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats.offline}</p>
            </div>
            <div className="rounded-full bg-gray-100 p-3 dark:bg-gray-800">
              <XCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-primary-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-600 dark:text-primary-400">类型分布</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                单:{stats.byType.single} 多:{stats.byType.multiple} 开:{stats.byType.text}
              </p>
            </div>
            <div className="rounded-full bg-primary-100 p-3 dark:bg-primary-500/20">
              <Filter className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索题目、标签、答案..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 dark:border-gray-700">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="text-sm bg-transparent border-none outline-none text-gray-700 dark:text-gray-300"
              >
                <option value="all">全部状态</option>
                <option value="online">已上架</option>
                <option value="offline">已下架</option>
              </select>
            </div>

            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 dark:border-gray-700">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                className="text-sm bg-transparent border-none outline-none text-gray-700 dark:text-gray-300"
              >
                <option value="all">全部类型</option>
                <option value="single">单选题</option>
                <option value="multiple">多选题</option>
                <option value="text">开放题</option>
              </select>
            </div>

            <button
              onClick={() => {
                const selected = filteredQuestions.filter((q) => q.status === 'offline').map((q) => q.id)
                if (selected.length === 0) {
                  toast.error('没有可上架的题目')
                  return
                }
                batchUpdateStatus(selected, 'online')
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              批量上架
            </button>

            <button
              onClick={() => {
                const selected = filteredQuestions.filter((q) => q.status === 'online').map((q) => q.id)
                if (selected.length === 0) {
                  toast.error('没有可下架的题目')
                  return
                }
                batchUpdateStatus(selected, 'offline')
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              批量下架
            </button>

            <button
              onClick={() => loadQuestions()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              刷新
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>没有找到符合条件的题目</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className={`rounded-lg border p-4 transition-all ${
                    question.status === 'online'
                      ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/40 dark:bg-emerald-500/10'
                      : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(question.type)}`}>
                          {getTypeLabel(question.type)}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            question.status === 'online'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {question.status === 'online' ? '已上架' : '已下架'}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">{question.title}</h3>
                      {question.options.length > 0 && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span className="font-medium">选项:</span>
                          <span className="ml-2">{question.options.join(' | ')}</span>
                        </div>
                      )}
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span className="font-medium">答案:</span>
                        <span className="ml-2">{question.answer}</span>
                      </div>
                      {question.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {question.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded dark:bg-gray-700 dark:text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {question.analysis && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium">解析:</span>
                          <span className="ml-2">{question.analysis}</span>
                        </div>
                      )}
                      <div className="mt-2 text-xs text-gray-400">创建时间: {formatDate(question.createdAt)}</div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => toggleQuestionStatus(question.id, question.status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          question.status === 'online'
                            ? 'bg-gray-600 text-white hover:bg-gray-700'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {question.status === 'online' ? (
                          <>
                            <Download className="w-4 h-4 inline mr-1" />
                            下架
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 inline mr-1" />
                            上架
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4 inline mr-1" />
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}





