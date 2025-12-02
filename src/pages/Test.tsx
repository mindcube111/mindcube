/**
 * 公开测试页面
 * 无需登录即可进行测试
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock } from 'lucide-react'
import { getLinkByUrl, updateLinkStatus } from '@/utils/links'
import { getAllQuestionnaires } from '@/utils/questionnaireConfig'
import { useConfirmDialog } from '@/components/ConfirmDialog'
import toast from 'react-hot-toast'
import { analytics, FunnelStep } from '@/utils/analytics'

export default function Test() {
  const { linkId } = useParams<{ linkId: string }>()
  const navigate = useNavigate()
  const { showAlert, DialogComponent } = useConfirmDialog()
  
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [questions, setQuestions] = useState<any[]>([])
  const [link, setLink] = useState<any>(null)
  const [paidLink, setPaidLink] = useState<any>(null)

  useEffect(() => {
    if (!linkId) {
      showAlert('错误', '无效的测试链接', 'alert')
      navigate('/')
      return
    }

    // 检查链接是否有效（从付费链接或普通链接中查找）
    const testUrl = `${window.location.origin}/test/${linkId}`
    const foundLink = getLinkByUrl(testUrl)
    
    // 也检查付费链接
    const paidLinks = JSON.parse(localStorage.getItem('paid_test_links') || '[]')
    const foundPaidLink = paidLinks.find((l: any) => l.id === linkId)
    
    setLink(foundLink)
    setPaidLink(foundPaidLink)

    if (!foundLink && !foundPaidLink) {
      showAlert('错误', '测试链接不存在或已失效', 'alert')
      navigate('/')
      return
    }

    if (foundLink && foundLink.status === 'used') {
      showAlert('提示', '该测试链接已被使用', 'info')
      navigate('/')
      return
    }

    if (foundPaidLink && foundPaidLink.status === 'used') {
      showAlert('提示', '该测试链接已被使用', 'info')
      navigate('/')
      return
    }

    // 获取问卷类型
    const type = foundLink?.questionnaireType || foundPaidLink?.questionnaireType
    if (!type) {
      showAlert('错误', '无法获取问卷类型', 'alert')
      navigate('/')
      return
    }

    // 加载题目（这里使用模拟数据，实际应该从API或localStorage加载）
    const configs = getAllQuestionnaires()
    const config = configs.find(q => q.value === type)
    
    if (config) {
      // 模拟题目数据（实际应该从题目库加载）
      const mockQuestions = Array.from({ length: parseInt(config.questions) || 10 }, (_, i) => ({
        id: i + 1,
        title: `题目 ${i + 1}`,
        options: ['完全不符合', '不太符合', '一般', '比较符合', '完全符合'],
      }))
      setQuestions(mockQuestions)
    }
  }, [linkId, navigate, showAlert])

  const handleAnswer = (questionIndex: number, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex,
    }))
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      await showAlert('提示', '请完成所有题目后再提交', 'warning')
      return
    }

    // 标记链接为已使用
    const testUrl = `${window.location.origin}/test/${linkId}`
    const link = getLinkByUrl(testUrl)
    
    if (link) {
      updateLinkStatus(link.id, 'used')
    } else {
      // 更新付费链接状态
      const paidLinks = JSON.parse(localStorage.getItem('paid_test_links') || '[]')
      const updatedLinks = paidLinks.map((l: any) =>
        l.id === linkId ? { ...l, status: 'used' } : l
      )
      localStorage.setItem('paid_test_links', JSON.stringify(updatedLinks))
    }

    setIsCompleted(true)
    toast.success('测试完成！')

    // 追踪完成测评
    const type = link?.questionnaireType || paidLink?.questionnaireType
    analytics.trackFunnelStep(
      FunnelStep.TEST_COMPLETE,
      type,
      undefined,
      { linkId, questionCount: questions.length }
    )

    // 这里应该生成报告并跳转到报告页面
    setTimeout(() => {
      navigate(`/report/${linkId}`)
    }, 2000)
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-background to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        {DialogComponent}
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">测试完成！</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">正在生成报告...</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      {DialogComponent}
      
      <div className="max-w-3xl mx-auto">
        {/* 进度条 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              题目 {currentQuestion + 1} / {questions.length}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 题目卡片 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {question.title}
          </h2>

          {/* 选项 */}
          <div className="space-y-3">
            {question.options.map((option: string, index: number) => (
              <button
                key={index}
                onClick={() => handleAnswer(currentQuestion, index)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  answers[currentQuestion] === index
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      answers[currentQuestion] === index
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {answers[currentQuestion] === index && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-gray-900 dark:text-white">{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* 导航按钮 */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={handlePrev}
              disabled={currentQuestion === 0}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一题
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestion === questions.length - 1 ? '提交答案' : '下一题'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

