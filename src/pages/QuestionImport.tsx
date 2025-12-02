import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Upload, AlertCircle, FileText, ListChecks, Database, Download, History, Settings2 } from 'lucide-react'
import toast from 'react-hot-toast'

import QuestionBankSelector from '@/components/QuestionBankSelector'
import {
  loadBankQuestions,
  saveBankQuestions,
} from '@/utils/questionBank'
import type { ImportedQuestion, ParseResult } from '@/utils/questionImport'
import { parseCSV, parseJSON, formatDate, headerAlias } from '@/utils/questionImport'
import { addImportHistory, loadImportHistory, type ImportHistoryRecord } from '@/utils/questionImportHistory'
import { useQuestionBanks } from '@/hooks/useQuestionBanks'

type ImportStep = 'select' | 'preview' | 'done'
type ImportStrategy = 'append' | 'overwrite'

interface SkippedDetail {
  title: string
  reason: string
}

export default function QuestionImport() {
  const { currentBankId, banks, setActiveBank } = useQuestionBanks()

  const [fileName, setFileName] = useState<string>('')
  const [fileSize, setFileSize] = useState<number>(0)
  const [fileType, setFileType] = useState<'csv' | 'json' | 'xlsx' | 'txt' | 'unknown'>('unknown')

  const [parsing, setParsing] = useState(false)
  const [step, setStep] = useState<ImportStep>('select')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [importedCount, setImportedCount] = useState<number | null>(null)
  const [skippedDetails, setSkippedDetails] = useState<SkippedDetail[]>([])
  const [strategy, setStrategy] = useState<ImportStrategy>('append')
  const [showSkippedDetail, setShowSkippedDetail] = useState(false)
  const [history, setHistory] = useState<ImportHistoryRecord[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // 简单字段映射配置
  const [customTitleHeader, setCustomTitleHeader] = useState('')
  const [customAnswerHeader, setCustomAnswerHeader] = useState('')

  useEffect(() => {
    setHistory(loadImportHistory())
  }, [])

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setFileSize(file.size)
    const lower = file.name.toLowerCase()
    const asJSON = lower.endsWith('.json')
    const asCSV = lower.endsWith('.csv')
    const asXlsx = lower.endsWith('.xlsx') || lower.endsWith('.xls')
    const asTxt = lower.endsWith('.txt')

    if (asXlsx) {
      toast.error('当前版本暂不支持直接解析 Excel（.xlsx），请先导出为 CSV 再导入。')
      e.target.value = ''
      return
    }

    if (asJSON) setFileType('json')
    else if (asCSV) setFileType('csv')
    else if (asTxt) setFileType('txt')
    else setFileType('unknown')

    setParsing(true)
    setStep('select')
    setParseResult(null)
    setImportedCount(null)
    setSkippedDetails([])

    try {
      const text = await file.text()
      let result: ParseResult
      if (asJSON) {
        result = parseJSON(text)
      } else {
        const alias = { ...headerAlias }
        const titleKey = customTitleHeader.trim()
        const answerKey = customAnswerHeader.trim()
        if (titleKey) alias[titleKey] = 'title'
        if (answerKey) alias[answerKey] = 'answer'
        result = parseCSV(text, alias)
      }

      if (!result.questions.length) {
        toast.error('未解析出任何题目，请检查文件格式')
        setParsing(false)
        return
      }

      setParseResult(result)
      setStep('preview')
      toast.success(`解析完成，共识别到 ${result.questions.length} 道题目`)
    } catch (error) {
      console.error(error)
      toast.error('文件解析失败，请确认格式是否正确')
    } finally {
      setParsing(false)
      // 清空 input，方便用户再次选择同一文件
      e.target.value = ''
    }
  }

  const handleImport = useCallback(() => {
    if (!parseResult) {
      toast.error('请先选择并解析文件')
      return
    }
    if (!currentBankId) {
      toast.error('请先选择题库')
      return
    }

    try {
      const existing = loadBankQuestions(currentBankId) as ImportedQuestion[]

      const existingMap = new Map<string, ImportedQuestion>()
      existing.forEach((q) => {
        const key = q.title.trim()
        if (key) existingMap.set(key, q)
      })

      let added = 0
      const merged: ImportedQuestion[] = []
      const skipped: SkippedDetail[] = []

      if (strategy === 'append') {
        // 追加模式：保留原题，只新增不重复的
        merged.push(...existing)
        parseResult.questions.forEach((q) => {
          const key = q.title.trim()
          if (!key) {
            skipped.push({ title: '(空标题)', reason: '缺少题目标题' })
            return
          }
          if (existingMap.has(key)) {
            skipped.push({ title: q.title, reason: '与现有题目标题重复，已跳过' })
            return
          }
          merged.push(q)
          existingMap.set(key, q)
          added++
        })
      } else {
        // 覆盖模式：相同标题覆盖旧题，其余保留
        const incomingMap = new Map<string, ImportedQuestion>()
        parseResult.questions.forEach((q) => {
          const key = q.title.trim()
          if (!key) {
            skipped.push({ title: '(空标题)', reason: '缺少题目标题' })
            return
          }
          incomingMap.set(key, q)
        })

        // 遍历现有题目，根据是否被覆盖记录原因
        existing.forEach((q) => {
          const key = q.title.trim()
          if (!key) return
          if (!incomingMap.has(key)) {
            merged.push(q)
          } else {
            skipped.push({ title: q.title, reason: '已被导入文件中同标题题目覆盖' })
          }
        })

        // 追加所有新题，并统计最终“新增”的数量
        incomingMap.forEach((q, key) => {
          const existed = existingMap.has(key)
          merged.push(q)
          if (!existed) {
            added++
          }
        })
      }

      const skippedCount = skipped.length
      setSkippedDetails(skipped)

      if (added === 0) {
        toast('没有新的题目需要导入（根据标题及导入策略判断）')
      }

      saveBankQuestions(currentBankId, merged)
      setImportedCount(added)
      setStep('done')

      // 写入导入历史
      const bankName = banks.find((b) => b.id === currentBankId)?.name
      const record: ImportHistoryRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        bankId: currentBankId,
        bankName,
        fileName: fileName || '未命名文件',
        fileSize,
        fileType,
        importedCount: added,
        totalParsed: parseResult.questions.length,
        skippedCount,
        strategy,
        createdAt: Date.now(),
      }
      addImportHistory(record)
      setHistory((prev) => [record, ...prev].slice(0, 50))

      if (added > 0) {
        toast.success(`成功导入 ${added} 道新题目`)
      }
    } catch (error) {
      console.error(error)
      toast.error('导入题目时发生错误')
    }
  }, [currentBankId, parseResult, strategy, banks, fileName, fileSize, fileType])

  const previewQuestions = useMemo(() => {
    if (!parseResult) return []
    return parseResult.questions.slice(0, 10)
  }, [parseResult])

  const totalParsed = parseResult?.questions.length ?? 0

  return (
    <div className="w-full space-y-6 p-4 md:p-6 lg:p-8">
      <header className="flex flex-col lg:flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-500/20">
            <Upload className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">题目导入中心</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              支持从 CSV / JSON 文件批量导入题目，自动解析题干、选项、答案等信息并存入题库，并记录导入历史。
            </p>
          </div>
        </div>
      </header>

      <main className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Database className="w-3 h-3" />
            <span>导入目标题库</span>
          </div>
          <QuestionBankSelector onBankChange={setActiveBank} />
        </section>

        <section className="rounded-2xl border border-dashed border-primary-200 bg-white/60 p-6 shadow-sm dark:border-primary-500/40 dark:bg-gray-900/80">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary-100 p-2 dark:bg-primary-500/20">
                  <FileText className="w-4 h-4 text-primary-600 dark:text-primary-300" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">选择题目文件</h2>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    支持 CSV（推荐）或 JSON 文件。CSV 文件第一行为表头，可包含：题目/问题、类型、选项、答案、标签、难度、解析 等列。
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:ring-offset-gray-900">
                  <Upload className="w-4 h-4" />
                  <span>{parsing ? '解析中...' : '选择文件'}</span>
                  <input
                    type="file"
                    accept=".csv,.txt,.json,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={parsing}
                  />
                </label>

                {fileName && (
                  <div className="space-y-0.5 text-xs text-gray-600 dark:text-gray-300">
                    <div>
                      当前文件：
                      <span className="font-medium">{fileName}</span>
                      {fileSize > 0 && (
                        <span className="ml-1 text-gray-400">({(fileSize / 1024).toFixed(1)} KB)</span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500">
                      解析方式：
                      {fileType === 'json'
                        ? 'JSON 解析'
                        : fileType === 'csv' || fileType === 'txt'
                        ? 'CSV 文本解析'
                        : '自动识别 / 默认 CSV 解析'}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const header = '题目,类型,选项,答案,标签,难度,解析'
                    const exampleRow = '示例题目,single,选项A|选项B|选项C,A,示例标签,1,示例解析'
                    const content = `${header}\n${exampleRow}`
                    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = '题目导入模板.csv'
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <Download className="h-3 w-3" />
                  下载 CSV 模板
                </button>

                <button
                  type="button"
                  onClick={() => setShowHistory(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <History className="h-3 w-3" />
                  导入历史
                </button>
              </div>

              <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-start gap-1.5">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 text-amber-500" />
                  <p>
                    CSV 示例表头：
                    <span className="font-mono text-[11px]">
                      题目,类型,选项,答案,标签,难度,解析
                    </span>
                    。选项可用逗号或竖线分隔；标签可用逗号或顿号分隔。
                  </p>
                </div>
                <p>
                  题型字段可填写 <span className="font-mono">single</span>（单选）、
                  <span className="font-mono">multiple</span>（多选）、
                  <span className="font-mono">text</span>（开放题）。未填写时默认单选题。
                </p>

                <div className="mt-2 rounded-lg border border-dashed border-gray-200 p-2 dark:border-gray-700">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                    <Settings2 className="h-3.5 w-3.5 text-gray-400" />
                    自定义表头映射（可选）
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="whitespace-nowrap text-[11px] text-gray-500 dark:text-gray-400">标题列名</span>
                      <input
                        value={customTitleHeader}
                        onChange={(e) => setCustomTitleHeader(e.target.value)}
                        placeholder="例如：题干"
                        className="flex-1 rounded border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="whitespace-nowrap text-[11px] text-gray-500 dark:text-gray-400">答案列名</span>
                      <input
                        value={customAnswerHeader}
                        onChange={(e) => setCustomAnswerHeader(e.target.value)}
                        placeholder="例如：正确选项"
                        className="flex-1 rounded border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                    如不填写，将根据内置中文别名（题目/问题/标题、答案/正确答案 等）自动识别。
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full md:w-64 rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-100">
                <ListChecks className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                导入步骤
              </h3>
              <ol className="space-y-1.5 list-decimal list-inside">
                <li className={step !== 'select' ? 'line-through decoration-primary-500' : ''}>选择题库与文件</li>
                <li className={step === 'preview' || step === 'done' ? 'font-semibold text-primary-600' : ''}>
                  预览并确认题目
                </li>
                <li className={step === 'done' ? 'font-semibold text-emerald-600' : ''}>导入并保存到题库</li>
              </ol>
            </div>
          </div>
        </section>

        {parseResult && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-primary-600" />
                  解析结果预览
                </h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  共解析出 <span className="font-semibold text-primary-600">{totalParsed}</span> 道题目，以下展示前{' '}
                  <span className="font-semibold">{previewQuestions.length}</span> 道。
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    导入策略：
                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        value="append"
                        checked={strategy === 'append'}
                        onChange={() => setStrategy('append')}
                        className="h-3 w-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span>追加（仅新增不重复题目）</span>
                    </label>
                    <label className="inline-flex items-center gap-1 cursor-pointer ml-3">
                      <input
                        type="radio"
                        value="overwrite"
                        checked={strategy === 'overwrite'}
                        onChange={() => setStrategy('overwrite')}
                        className="h-3 w-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span>覆盖（同标题题目将覆盖旧题）</span>
                    </label>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleImport}
                disabled={parsing || !totalParsed}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                导入到当前题库
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 text-xs dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">题目</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">类型</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">选项</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">答案</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">标签</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">难度</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">创建时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                  {previewQuestions.map((q) => (
                    <tr key={q.id}>
                      <td className="max-w-xs px-3 py-2 text-gray-900 dark:text-gray-100">
                        <div className="line-clamp-2">{q.title}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                        {q.type === 'single' && '单选题'}
                        {q.type === 'multiple' && '多选题'}
                        {q.type === 'text' && '开放题'}
                      </td>
                      <td className="max-w-xs px-3 py-2 text-gray-700 dark:text-gray-300">
                        <div className="line-clamp-2">{q.options?.join(' | ')}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{q.answer}</td>
                      <td className="max-w-xs px-3 py-2 text-gray-700 dark:text-gray-300">
                        <div className="line-clamp-2">{q.tags?.join('、')}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{q.difficulty ?? '-'}</td>
                      <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-[11px]">
                        {formatDate(q.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {parseResult.warnings.length > 0 && (
              <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
                <div className="mb-1 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="h-3.5 w-3.5" />
                  导入警告（不影响其它题目导入）：
                </div>
                <ul className="list-disc list-inside space-y-0.5">
                  {parseResult.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {step === 'done' && importedCount !== null && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                成功将 <span className="font-semibold">{importedCount}</span> 道新题目导入到当前题库。
                {skippedDetails.length > 0 && (
                  <>
                    {' '}
                    其中 <span className="font-semibold">{skippedDetails.length}</span> 道题目因重复或缺少必要信息被跳过。
                  </>
                )}
                <span className="ml-1">
                  如需修改上下架状态，可前往「题目上下架操作台」页面进行管理。
                </span>
              </div>
              {skippedDetails.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSkippedDetail((v) => !v)}
                  className="mt-1 inline-flex items-center justify-center rounded border border-emerald-400 px-2 py-1 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100 dark:border-emerald-400/60 dark:text-emerald-100 dark:hover:bg-emerald-400/10"
                >
                  {showSkippedDetail ? '收起被跳过明细' : '查看被跳过的题目'}
                </button>
              )}
            </div>

            {showSkippedDetail && skippedDetails.length > 0 && (
              <div className="mt-3 max-h-40 overflow-auto rounded border border-emerald-200 bg-white/70 p-2 text-[11px] text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-900/40 dark:text-emerald-50">
                <div className="mb-1 font-semibold">被跳过题目列表</div>
                <ul className="space-y-0.5">
                  {skippedDetails.map((item, idx) => (
                    <li key={idx}>
                      <span className="font-medium">{item.title}</span>
                      <span className="ml-1 opacity-80">（{item.reason}）</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {showHistory && history.length > 0 && (
          <section className="rounded-2xl border border-gray-200 bg-white p-4 text-xs text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">导入历史</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="text-[11px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                收起
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-[11px] dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-300">时间</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-300">题库</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-300">文件</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-300">导入/总数</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-300">跳过</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-300">策略</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td className="px-2 py-1">{formatDate(h.createdAt)}</td>
                      <td className="px-2 py-1">{h.bankName || h.bankId}</td>
                      <td className="px-2 py-1">
                        <div className="max-w-[160px] truncate" title={h.fileName}>
                          {h.fileName}
                        </div>
                      </td>
                      <td className="px-2 py-1">
                        <span className="font-semibold">{h.importedCount}</span>
                        <span className="opacity-70"> / {h.totalParsed}</span>
                      </td>
                      <td className="px-2 py-1">{h.skippedCount}</td>
                      <td className="px-2 py-1">{h.strategy === 'append' ? '追加' : '覆盖'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}