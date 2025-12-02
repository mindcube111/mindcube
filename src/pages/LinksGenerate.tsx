import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Copy, Download, Check, AlertCircle, Info, Shield, ExternalLink, Database } from 'lucide-react'
import { Link, QuestionnaireType } from '@/types'
import { addLinks } from '@/utils/links'
import { useConfirmDialog } from '@/components/ConfirmDialog'
import { useAuth } from '@/contexts/AuthContext'
import { addAuditLog } from '@/utils/audit'

interface QuestionnaireDefinition {
  value: QuestionnaireType | string
    label: string
    description: string
    features: string[]
    duration: string
    questions: string
  isCustom?: boolean
}

const CUSTOM_TYPES_KEY = 'question_import_custom_types'
const PUBLISH_STATE_KEY = 'question_publish_state'

const SYSTEM_QUESTIONNAIRES: QuestionnaireDefinition[] = [
    { 
      value: 'SCL-90', 
      label: 'SCL-90 心理健康测评',
      description: '综合心理健康症状自评量表，评估9个心理症状维度',
      features: ['90个题目', '9个评估维度', '专业报告解读', '适合个人自查'],
      duration: '约15-20分钟',
    questions: '90题',
    },
    { 
      value: 'MBTI', 
      label: 'MBTI 人格评估',
      description: '16型人格测试，帮助了解个人性格特点和职业倾向',
      features: ['93个题目', '16种人格类型', '职业匹配分析', '适合团队建设'],
      duration: '约20-25分钟',
    questions: '93题',
    },
    { 
      value: 'Holland', 
      label: '霍兰德职业测试',
      description: '职业兴趣测评，帮助发现个人职业兴趣和适合的职业方向',
      features: ['60个题目', '6种职业兴趣类型', '职业推荐', '适合职业规划'],
      duration: '约10-15分钟',
    questions: '60题',
    },
  ]

export default function LinksGenerate() {
  const { user, updateUserUsedQuota } = useAuth()
  const [quantity, setQuantity] = useState(1)
  const [questionnaireType, setQuestionnaireType] = useState<string>('')
  const [availableTypes, setAvailableTypes] = useState<QuestionnaireDefinition[]>([])
  const [generatedLinks, setGeneratedLinks] = useState<Link[]>([])
  const [copied, setCopied] = useState(false)
  const [remainingQuota, setRemainingQuota] = useState(() =>
    user?.role === 'admin' ? Infinity : user?.remainingQuota ?? 480,
  )
  const { showAlert, DialogComponent } = useConfirmDialog()
  const isAdmin = user?.role === 'admin'

  const refreshTypes = useCallback(() => {
    const publishState = loadPublishState()
    const customTypes = loadCustomTypes()

    const system = SYSTEM_QUESTIONNAIRES.filter((type) => publishState[type.value as string] ?? true)

    const custom = customTypes
      .map<QuestionnaireDefinition>((name) => ({
        value: name,
        label: name,
        description: `自定义问卷：${name}`,
        features: ['自定义题库', '支持协作', '立即上线'],
        duration: '自定义',
        questions: '—',
        isCustom: true,
      }))
      .filter((type) => publishState[type.value] ?? true)

    const combined = [...system, ...custom]
    setAvailableTypes(combined)
    setQuestionnaireType((prev) =>
      prev && combined.some((type) => equalsIgnoreCase(type.value, prev))
        ? prev
        : combined[0]?.value ?? '',
    )
  }, [])

  useEffect(() => {
    refreshTypes()
    const handler = () => refreshTypes()
    window.addEventListener('question-types-updated', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('question-types-updated', handler)
      window.removeEventListener('storage', handler)
    }
  }, [refreshTypes])

  useEffect(() => {
    if (!user) return
    setRemainingQuota(user.role === 'admin' ? Infinity : user.remainingQuota ?? 480)
  }, [user])

  const selectedQuestionnaire = useMemo(
    () => availableTypes.find((type) => equalsIgnoreCase(type.value, questionnaireType)),
    [availableTypes, questionnaireType],
  )

  const handleGenerate = async () => {
    if (!questionnaireType) {
      await showAlert('提示', '当前没有可用的问卷类型，无法生成链接', 'warning')
      return
    }

    if (!isAdmin && quantity > remainingQuota) {
      await showAlert('额度不足', `剩余额度：${remainingQuota}，请购买套餐后重试`, 'warning')
      return
    }

    const newLinks = addLinks(questionnaireType as QuestionnaireType, quantity, user?.id)
    setGeneratedLinks(newLinks)

    if (!isAdmin && user) {
      setRemainingQuota((prev) => prev - quantity)
      updateUserUsedQuota(user.id, quantity)
    }
    setCopied(false)

    if (user) {
      addAuditLog({
        userId: user.id,
        username: user.name,
        action: '生成链接',
        target: `${quantity}个${questionnaireType}链接`,
        targetType: 'link',
        details: { quantity, questionnaireType },
      })
    }
  }

  const handleCopyAll = async () => {
    const text = generatedLinks.map((link) => link.url).join('\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExport = () => {
    const content = generatedLinks.map((link, index) => `${index + 1},${link.url},${link.status}`).join('\n')
    const blob = new Blob([`序号,链接,状态\n${content}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `测试链接_${questionnaireType}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {DialogComponent}
      
      <header>
        <h1 className="text-3xl font-bold text-gray-900">生成测试链接</h1>
        <p className="text-gray-600 mt-2">创建一次性链接，用户无需注册即可参与测评，每个链接仅可使用一次</p>
      </header>

      <section className="card">
        <h2 className="text-xl font-semibold mb-4">链接生成设置</h2>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">选择问卷类型</label>
              {isAdmin && (
                <RouterLink
                  to="/admin/questions/import"
                  className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  <Database className="w-3 h-3" />
                  题库管理
                  <ExternalLink className="w-3 h-3" />
                </RouterLink>
              )}
            </div>
            <select
              value={questionnaireType}
              onChange={(e) => setQuestionnaireType(e.target.value)}
              className="input"
              disabled={availableTypes.length === 0}
            >
              {availableTypes.length === 0 ? (
                <option>暂无可用问卷，请联系管理员上架</option>
              ) : (
                availableTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
                ))
              )}
            </select>
            {selectedQuestionnaire && (
              <div className="mt-2 text-sm text-gray-600 space-y-2">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>预计用时：{selectedQuestionnaire.duration}</span>
                  <span>题目数量：{selectedQuestionnaire.questions}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedQuestionnaire.features.map((feature) => (
                    <span key={feature} className="px-2 py-1 rounded-full bg-primary-50 text-primary-600 text-xs">
                      {feature}
                    </span>
                  ))}
                </div>
                {selectedQuestionnaire.isCustom && isAdmin && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <RouterLink
                      to="/admin/questions/import"
                      className="inline-flex items-center gap-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <Database className="w-4 h-4" />
                      管理自定义题库
                      <ExternalLink className="w-3 h-3" />
                    </RouterLink>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">生成数量（1-1000）</label>
            <input
              type="number"
              min="1"
              max="1000"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              className="input"
            />
            <p className="text-sm text-gray-500 mt-1">
              每个链接消耗 1 个额度，当前剩余额度：
              <span className="font-semibold text-primary-600">
                {isAdmin ? '无限' : remainingQuota}
              </span>
            </p>
          </div>

          <InfoSection />

          <button
            onClick={handleGenerate}
            disabled={availableTypes.length === 0 || !questionnaireType}
            className="btn-primary w-full py-4 text-lg shadow-xl shadow-primary-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            生成链接
          </button>
        </div>
      </section>

      {generatedLinks.length > 0 && (
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">已生成 {generatedLinks.length} 个链接</h2>
            <div className="flex gap-2">
              <button onClick={handleCopyAll} className="btn-secondary flex items-center gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? '已复制' : '复制全部'}
              </button>
              <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
                <Download className="w-4 h-4" />
                导出CSV
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {generatedLinks.map((link, index) => (
              <div key={link.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500 w-8">#{index + 1}</span>
                <code className="flex-1 text-sm text-gray-800 font-mono break-all">{link.url}</code>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                  link.status === 'unused' 
                      ? 'bg-successLight text-success'
                    : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {link.status === 'unused' ? '未使用' : link.status}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(link.url)}
                  className="text-primary-600 hover:text-primary-700 flex-shrink-0"
                  title="复制链接"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function InfoSection() {
  return (
    <div className="space-y-3">
      <InfoCard
        icon={Shield}
        iconClass="text-primary-600"
        bgClass="bg-primary-50 border-primary-200"
        title="一次性使用链接："
        items={[
          '每个链接只能使用一次，使用后自动失效',
          '用户无需注册即可参与测评',
          '完成测评后链接状态自动变为“已使用”',
          '每个链接对应独立报告',
        ]}
      />
      <InfoCard
        icon={Info}
        iconClass="text-blue-600"
        bgClass="bg-blue-50 border-blue-200"
        title="使用说明："
        items={['链接永久有效（除非手动禁用）', '建议为每个用户生成独立链接', '可在“链接管理”中查看状态']}
      />
      <InfoCard
        icon={AlertCircle}
        iconClass="text-yellow-600"
        bgClass="bg-yellow-50 border-yellow-200"
        title="注意事项："
        items={['每个链接消耗 1 个额度', '生成后无法撤销', '已使用链接不可恢复']}
      />
    </div>
  )
}

function InfoCard({
  icon: Icon,
  iconClass,
  bgClass,
  title,
  items,
}: {
  icon: typeof Shield
  iconClass: string
  bgClass: string
  title: string
  items: string[]
}) {
  return (
    <div className={`flex items-start gap-2 p-3 border rounded-lg ${bgClass}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconClass}`} />
      <div className="text-sm">
        <p className="font-medium mb-1">{title}</p>
        <ul className="list-disc list-inside space-y-1 text-xs text-gray-700">
          {items.map((item) => (
            <li key={item}>{item}</li>
            ))}
        </ul>
        </div>
    </div>
  )
}

function loadCustomTypes(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(CUSTOM_TYPES_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

function loadPublishState(): Record<string, boolean> {
  const defaults: Record<string, boolean> = {
    'SCL-90': true,
    MBTI: true,
    Holland: true,
  }
  if (typeof window === 'undefined') return defaults
  try {
    const stored = localStorage.getItem(PUBLISH_STATE_KEY)
    if (!stored) return defaults
    const parsed = JSON.parse(stored)
    return { ...defaults, ...(parsed || {}) }
  } catch {
    return defaults
  }
}

function equalsIgnoreCase(a?: string | number, b?: string | number) {
  if (a === undefined || b === undefined) return false
  return a.toString().toLowerCase() === b.toString().toLowerCase()
}







