/**
 * 问卷类型上下架管理页面
 * 管理员可以控制哪些问卷类型在首页显示
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  RefreshCw,
  Eye,
  EyeOff,
  DollarSign,
  Edit,
  X,
  Save
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getAllQuestionnaires,
  loadPublishState,
  loadPublishStateAsync,
  toggleQuestionnairePublish,
  toggleQuestionnairePublishAsync,
  updateCustomQuestionnaire,
  updateCustomQuestionnaireAsync,
  clearConfigCache,
  type QuestionnaireConfig
} from '@/utils/questionnaireConfig'
import { sanitizeText, escapeHtml } from '@/utils/xss'
import { validateTextLength, validateTagText } from '@/utils/validation'

interface QuestionnaireType extends QuestionnaireConfig {
  isPublished: boolean
}

export default function QuestionnaireManage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireType[]>([])
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'unpublished'>('all')
  const [editingQuestionnaire, setEditingQuestionnaire] = useState<QuestionnaireType | null>(null)
  const [editForm, setEditForm] = useState({
    label: '',
    description: '',
    features: [] as string[],
    duration: '',
    price: 1,
    questions: '',
  })

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard')
      return
    }
    loadQuestionnaires()
    
    // 监听问卷类型更新事件
    const handleUpdate = () => {
      loadQuestionnaires()
    }
    
    window.addEventListener('questionnaire-publish-state-updated', handleUpdate)
    
    return () => {
      window.removeEventListener('questionnaire-publish-state-updated', handleUpdate)
    }
  }, [user, navigate])

  const loadQuestionnaires = async () => {
    try {
      // 优先从 API 加载
      const state = await loadPublishStateAsync()
      const all = getAllQuestionnaires()

      const questionnairesWithStatus: QuestionnaireType[] = all.map((q) => {
        // 系统题目默认上架，自定义题目默认下架
        const isPublished = q.isCustom 
          ? (state[q.value] === true)
          : (state[q.value] !== false)
        
        return {
          ...q,
          isPublished,
        }
      })

      setQuestionnaires(questionnairesWithStatus)
    } catch (error) {
      console.error('加载问卷配置失败', error)
      // 降级到同步版本
      const state = loadPublishState()
      const all = getAllQuestionnaires()

      const questionnairesWithStatus: QuestionnaireType[] = all.map((q) => {
        const isPublished = q.isCustom 
          ? (state[q.value] === true)
          : (state[q.value] !== false)
        
        return {
          ...q,
          isPublished,
        }
      })

      setQuestionnaires(questionnairesWithStatus)
    }
  }

  const handleTogglePublish = async (value: string) => {
    try {
      const isPublished = await toggleQuestionnairePublishAsync(value)
      await loadQuestionnaires() // 重新加载以获取最新状态
      toast.success(`问卷已${isPublished ? '上架' : '下架'}`)
    } catch (error) {
      console.error('切换上架状态失败', error)
      // 降级到同步版本
      const isPublished = toggleQuestionnairePublish(value)
      loadQuestionnaires()
      toast.success(`问卷已${isPublished ? '上架' : '下架'}`)
    }
  }

  const handleEdit = (questionnaire: QuestionnaireType) => {
    setEditingQuestionnaire(questionnaire)
    setEditForm({
      label: questionnaire.label,
      description: questionnaire.description,
      features: [...questionnaire.features],
      duration: questionnaire.duration,
      price: questionnaire.price,
      questions: questionnaire.questions.replace('题', ''),
    })
  }

  const handleSaveEdit = async () => {
    if (!editingQuestionnaire) return

    // 验证描述长度（最多500字符）
    const descValidation = validateTextLength(editForm.description, 0, 500, '描述')
    if (!descValidation.isValid) {
      toast.error(descValidation.message || '描述格式不正确')
      return
    }

    // 验证标签长度
    for (const feature of editForm.features) {
      const tagValidation = validateTagText(feature)
      if (!tagValidation.isValid) {
        toast.error(`标签"${feature}"${tagValidation.message || '格式不正确'}`)
        return
      }
    }

    // 清理和转义输入
    const sanitizedLabel = sanitizeText(editForm.label.trim())
    const sanitizedDescription = sanitizeText(editForm.description.trim())
    const sanitizedFeatures = editForm.features.map(f => escapeHtml(sanitizeText(f)))
    const sanitizedDuration = sanitizeText(editForm.duration.trim())

    try {
      const success = await updateCustomQuestionnaireAsync(editingQuestionnaire.value, {
        label: sanitizedLabel,
        description: sanitizedDescription,
        features: sanitizedFeatures,
        duration: sanitizedDuration,
        price: editForm.price,
        questions: editForm.questions,
      })
      
      if (success) {
        await loadQuestionnaires()
        setEditingQuestionnaire(null)
        toast.success('问卷信息已更新，主页将同步显示')
      } else {
        toast.error('保存失败，请重试')
      }
    } catch (error) {
      console.error('保存失败', error)
      // 降级到同步版本
      try {
        updateCustomQuestionnaire(editingQuestionnaire.value, {
          label: sanitizedLabel,
          description: sanitizedDescription,
          features: sanitizedFeatures,
          duration: sanitizedDuration,
          price: editForm.price,
          questions: editForm.questions,
        })
        loadQuestionnaires()
        setEditingQuestionnaire(null)
        toast.success('问卷信息已更新，主页将同步显示')
      } catch (e) {
        toast.error('保存失败，请重试')
      }
    }
  }

  const handleCancelEdit = () => {
    setEditingQuestionnaire(null)
    setEditForm({
      label: '',
      description: '',
      features: [],
      duration: '',
      price: 1,
      questions: '',
    })
  }

  const handleAddFeature = () => {
    const feature = prompt('请输入特性标签：')
    if (feature && feature.trim()) {
      // 验证标签文本
      const validation = validateTagText(feature.trim())
      if (!validation.isValid) {
        toast.error(validation.message || '标签格式不正确')
        return
      }
      
      // 清理和转义标签文本
      const sanitized = sanitizeText(feature.trim())
      const escaped = escapeHtml(sanitized)
      
      // 检查是否已存在
      if (editForm.features.includes(escaped)) {
        toast.error('该标签已存在')
        return
      }
      
      setEditForm(prev => ({
        ...prev,
        features: [...prev.features, escaped],
      }))
    }
  }

  const handleRemoveFeature = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }

  const filteredQuestionnaires = questionnaires.filter((q) => {
    // 搜索过滤
    if (searchText.trim()) {
      const keyword = searchText.toLowerCase()
      const matchesSearch = (
        q.label.toLowerCase().includes(keyword) ||
        q.description.toLowerCase().includes(keyword) ||
        q.value.toLowerCase().includes(keyword)
      )
      if (!matchesSearch) return false
    }
    
    // 状态过滤
    if (statusFilter === 'published' && !q.isPublished) return false
    if (statusFilter === 'unpublished' && q.isPublished) return false
    
    return true
  })

  const handleBatchPublish = async (publish: boolean) => {
    const toUpdate = filteredQuestionnaires
      .filter(q => publish ? !q.isPublished : q.isPublished)
      .map(q => q.value)
    
    if (toUpdate.length === 0) {
      toast.error(`没有可${publish ? '上架' : '下架'}的问卷`)
      return
    }

    try {
      // 构建批量更新请求
      const states: Record<string, boolean> = {}
      const currentState = await loadPublishStateAsync()
      
      toUpdate.forEach(value => {
        const isSystem = questionnaires.find(q => q.value === value)?.isCustom === false
        const current = isSystem 
          ? (currentState[value] !== false)
          : (currentState[value] === true)
        
        if (current !== publish) {
          states[value] = publish
        }
      })

      if (Object.keys(states).length > 0) {
        // 尝试批量更新 API
        const { batchUpdatePublishState } = await import('@/services/api/questionnaireConfig')
        const response = await batchUpdatePublishState({ states })
        if (response.success) {
          clearConfigCache()
          await loadQuestionnaires()
          toast.success(`已批量${publish ? '上架' : '下架'} ${Object.keys(states).length} 个问卷`)
          return
        }
      }

      // 降级到逐个更新
      for (const value of toUpdate) {
        const currentState = loadPublishState()
        const isSystem = questionnaires.find(q => q.value === value)?.isCustom === false
        const current = isSystem 
          ? (currentState[value] !== false)
          : (currentState[value] === true)
        
        if (current !== publish) {
          await toggleQuestionnairePublishAsync(value).catch(() => {
            toggleQuestionnairePublish(value)
          })
        }
      }
      
      await loadQuestionnaires()
      toast.success(`已批量${publish ? '上架' : '下架'} ${toUpdate.length} 个问卷`)
    } catch (error) {
      console.error('批量更新失败', error)
      toast.error('批量更新失败，请重试')
    }
  }

  const stats = {
    total: questionnaires.length,
    published: questionnaires.filter((q) => q.isPublished).length,
    unpublished: questionnaires.filter((q) => !q.isPublished).length,
  }

  if (user?.role !== 'admin') {
    return null
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">问卷类型管理</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
          管理问卷类型的上下架状态，控制哪些问卷在首页显示
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">总问卷数</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-emerald-200 dark:border-emerald-500/40 p-6">
          <div className="text-sm text-emerald-600 dark:text-emerald-400">已上架</div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-2">
            {stats.published}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">已下架</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {stats.unpublished}
          </div>
        </div>
      </div>

      {/* 搜索栏和操作 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索问卷名称、描述..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">全部状态</option>
              <option value="published">已上架</option>
              <option value="unpublished">已下架</option>
            </select>
            <button
              onClick={loadQuestionnaires}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">刷新</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleBatchPublish(true)}
              className="px-3 sm:px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 text-xs sm:text-sm"
            >
              <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="whitespace-nowrap">批量上架选中</span>
            </button>
            <button
              onClick={() => handleBatchPublish(false)}
              className="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2 text-xs sm:text-sm"
            >
              <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="whitespace-nowrap">批量下架选中</span>
            </button>
          </div>
        </div>
      </div>

      {/* 问卷列表 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredQuestionnaires.map((questionnaire) => (
          <div
            key={questionnaire.value}
            className={`bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border-2 transition-all ${
              questionnaire.isPublished
                ? 'border-emerald-200 dark:border-emerald-500/40 shadow-lg'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            {/* 状态标签 */}
            <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
              <div
                className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 flex-shrink-0 ${
                  questionnaire.isPublished
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {questionnaire.isPublished ? (
                  <>
                    <Eye className="w-3 h-3" />
                    <span className="whitespace-nowrap">已上架</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3 h-3" />
                    <span className="whitespace-nowrap">已下架</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-bold text-sm sm:text-base">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{questionnaire.price}</span>
              </div>
            </div>

            {/* 问卷信息 */}
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 break-words">
              {questionnaire.label}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 line-clamp-2">
              {questionnaire.description}
            </p>

            {/* 特性标签 */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              {questionnaire.features.slice(0, 3).map((feature, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 sm:py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs rounded"
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(questionnaire)}
                className="flex-1 px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base bg-blue-500 text-white hover:bg-blue-600"
              >
                <Edit className="w-4 h-4" />
                编辑
              </button>
              <button
                onClick={() => handleTogglePublish(questionnaire.value)}
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base ${
                  questionnaire.isPublished
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                }`}
              >
                {questionnaire.isPublished ? (
                  <>
                    <XCircle className="w-4 h-4" />
                    下架
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    上架
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredQuestionnaires.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          没有找到符合条件的问卷
        </div>
      )}

      {/* 编辑对话框 */}
      {editingQuestionnaire && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">编辑问卷信息</h2>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  问卷名称
                </label>
                <input
                  type="text"
                  value={editForm.label}
                  onChange={(e) => setEditForm(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  描述 <span className="text-gray-500 text-xs">(最多500字符)</span>
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value.length <= 500) {
                      setEditForm(prev => ({ ...prev, description: value }))
                    } else {
                      toast.error('描述长度不能超过500个字符')
                    }
                  }}
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {editForm.description.length}/500
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    题目数量
                  </label>
                  <input
                    type="text"
                    value={editForm.questions}
                    onChange={(e) => setEditForm(prev => ({ ...prev, questions: e.target.value }))}
                    placeholder="例如：90"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    价格（元）
                  </label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 1 }))}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  预计时长
                </label>
                <input
                  type="text"
                  value={editForm.duration}
                  onChange={(e) => setEditForm(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="例如：约15-20分钟"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    特性标签
                  </label>
                  <button
                    onClick={handleAddFeature}
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    + 添加标签
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editForm.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm flex items-center gap-2"
                    >
                      {feature}
                      <button
                        onClick={() => handleRemoveFeature(index)}
                        className="text-primary-500 hover:text-primary-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

