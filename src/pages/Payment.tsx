/**
 * 支付页面
 * 无需登录即可支付并开始测试
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CreditCard, Lock, Loader } from 'lucide-react'
import { getAllQuestionnaires, type QuestionnaireConfig } from '@/utils/questionnaireConfig'
import { generateId } from '@/utils/formatters'
import { useConfirmDialog } from '@/components/ConfirmDialog'

export default function Payment() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const questionnaireType = searchParams.get('type') || ''
  const result = searchParams.get('result')
  const orderNo = searchParams.get('order')
  const { showAlert, DialogComponent } = useConfirmDialog()
  
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireConfig | null>(null)
  const [isPaying, setIsPaying] = useState(false)
  const [paymentMethod] = useState<'alipay'>('alipay') // 仅支持支付宝

  useEffect(() => {
    if (!questionnaireType) {
      showAlert('错误', '请选择要测试的问卷类型', 'alert')
      navigate('/')
      return
    }

    const configs = getAllQuestionnaires()
    const found = configs.find(q => q.value === questionnaireType)
    
    if (!found) {
      showAlert('错误', '未找到该问卷类型', 'alert')
      navigate('/')
      return
    }

    setQuestionnaire(found)
  }, [questionnaireType, navigate, showAlert])

  // 支付完成后从 return_url 返回时，根据订单状态跳转到测试页面
  useEffect(() => {
    const checkOrder = async () => {
      if (result !== 'return' || !orderNo) return
      try {
        const resp = await fetch(`/api/payment/order-status?out_trade_no=${encodeURIComponent(orderNo)}`)
        if (!resp.ok) {
          throw new Error('查询订单失败')
        }
        const data = await resp.json()
        if (data.code === 0 && data.data?.status === 'paid' && data.data.linkId) {
          // 将已支付链接写入本地 paid_test_links，兼容现有 Test 页面逻辑
          const paidLinks = JSON.parse(localStorage.getItem('paid_test_links') || '[]')
          paidLinks.push({
            id: data.data.linkId,
            url: `${window.location.origin}/test/${data.data.linkId}`,
            questionnaireType: data.data.questionnaireType,
            paidAt: new Date().toISOString(),
            price: questionnaire?.price ?? 0,
            status: 'unused',
          })
          localStorage.setItem('paid_test_links', JSON.stringify(paidLinks))

          navigate(`/test/${data.data.linkId}`, { replace: true })
        }
      } catch (error) {
        console.error(error)
      }
    }
    checkOrder()
  }, [result, orderNo, questionnaire?.price, navigate])

  const handlePayment = async () => {
    if (!questionnaire) return

    setIsPaying(true)
 
    try {
      // 生成商户订单号（可根据需要改为后端生成）
      const outTradeNo = generateId()

      const baseUrl = window.location.origin
      const notifyUrl = `${baseUrl}/api/payment/notify`
      const returnUrl = `${baseUrl}/payment?result=return&type=${encodeURIComponent(
        questionnaire.value,
      )}&order=${outTradeNo}`

      const resp = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: questionnaire.label,
          money: String(questionnaire.price),
          out_trade_no: outTradeNo,
          notify_url: notifyUrl,
          return_url: returnUrl,
          type: paymentMethod,
          param: questionnaire.value,
        }),
      })

      if (!resp.ok) {
        const errorText = await resp.text()
        console.error('支付创建失败:', resp.status, errorText)
        throw new Error(`创建支付订单失败 (${resp.status}): ${errorText}`)
      }

      const data = await resp.json()
      console.log('支付接口返回:', data)
      
      // 检查响应格式：后端使用 success 字段
      if (!data.success) {
        console.error('支付接口错误:', data)
        throw new Error(data.message || '支付接口返回错误')
      }
      
      if (!data.data?.payUrl) {
        console.error('支付接口返回数据异常:', data)
        throw new Error(data.message || '支付网关返回异常：缺少支付链接')
      }

      // 跳转到易支付收银台
      window.location.href = data.data.payUrl
    } catch (error) {
      console.error(error)
      setIsPaying(false)
      await showAlert('支付失败', error instanceof Error ? error.message : '支付过程中出现错误，请重试', 'alert')
    }
  }

  if (!questionnaire) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      {DialogComponent}
      
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          {/* 标题 */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">支付测试费用</h1>
            <p className="text-gray-600 dark:text-gray-400">完成支付后即可开始测试</p>
          </div>

          {/* 问卷信息 */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-2">{questionnaire.label}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{questionnaire.description}</p>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span>{questionnaire.questions}</span>
                <span className="mx-2">•</span>
                <span>{questionnaire.duration}</span>
              </div>
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                ¥{questionnaire.price}
              </div>
            </div>
          </div>

          {/* 支付方式 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              支付方式
            </label>
            <div className="p-4 rounded-xl border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20">
              <div className="text-center">
                <div className="text-2xl mb-2">💙</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">支付宝</div>
              </div>
            </div>
          </div>

          {/* 安全提示 */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-6">
            <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">安全支付</p>
              <p className="text-xs">您的支付信息将被加密传输，确保安全</p>
            </div>
          </div>

          {/* 支付按钮 */}
          <button
            onClick={handlePayment}
            disabled={isPaying}
            className="w-full bg-primary-500 text-white py-4 rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPaying ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                支付中...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                立即支付 ¥{questionnaire.price}
              </>
            )}
          </button>

          {/* 返回按钮 */}
          <button
            onClick={() => navigate('/')}
            className="w-full mt-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-sm"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  )
}

