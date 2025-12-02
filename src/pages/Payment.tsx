import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import PageTransition from '@/components/PageTransition'
import { useAuth } from '@/contexts/AuthContext'
import { getAllQuestionnaires } from '@/utils/questionnaireConfig'
import { analytics, FunnelStep } from '@/utils/analytics'
import { logger } from '@/utils/logger'
import { handleError } from '@/utils/errorHandler'
import toast from 'react-hot-toast'

export default function Payment() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const formRef = useRef<HTMLFormElement | null>(null)

  const [name, setName] = useState('心理测评套餐')
  const [money, setMoney] = useState('1.00')
  const [outTradeNo, setOutTradeNo] = useState(() => `${Date.now()}`)
  const [notifyUrl, setNotifyUrl] = useState('')
  const [returnUrl, setReturnUrl] = useState('')
  const [param, setParam] = useState('管理后台发起')
  const [packageId, setPackageId] = useState<string | undefined>(undefined)
  const [questionnaireType, setQuestionnaireType] = useState<string | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 从 URL 参数或路由 state 中预填套餐信息
  useEffect(() => {
    // 优先从 URL 参数获取问卷类型（首页跳转）
    const typeFromUrl = searchParams.get('type')
    if (typeFromUrl) {
      const allQuestionnaires = getAllQuestionnaires()
      const questionnaire = allQuestionnaires.find(q => q.value === typeFromUrl)
      if (questionnaire) {
        setName(questionnaire.label)
        setMoney(questionnaire.price.toString())
        setQuestionnaireType(questionnaire.value)
        
        // 追踪支付页访问
        analytics.trackFunnelStep(
          FunnelStep.PAYMENT_PAGE,
          questionnaire.value,
          questionnaire.price,
          { label: questionnaire.label }
        )
      }
    }

    // 从路由 state 中预填套餐信息（用于管理站购买套餐）
    const state = location.state as
      | {
          from?: string
          packageId?: string
          name?: string
          money?: number | string
          param?: string
          questionnaireType?: string
        }
      | undefined

    if (state?.name) {
      setName(state.name)
    }
    if (state?.money !== undefined) {
      const moneyStr = typeof state.money === 'number' ? state.money.toFixed(2) : state.money
      setMoney(moneyStr)
    }
    if (state?.param) {
      setParam(state.param)
    }
    if (state?.packageId) {
      setPackageId(state.packageId)
    }
    if (state?.questionnaireType) {
      setQuestionnaireType(state.questionnaireType)
    }
  }, [location.state, searchParams])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const origin = window.location.origin

    setNotifyUrl((prev) => prev || `${origin}/api/zpay/notify`)
    setReturnUrl((prev) => prev || `${origin}/payment/result`)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // 防止重复提交
    if (isSubmitting) return
    
    setError(null)
    if (!name || !money || !outTradeNo || !notifyUrl || !returnUrl) return

    const form = formRef.current
    if (!form) return

    setIsSubmitting(true)
    try {
      // 先在后端创建订单，再跳转到 ZPAY 支付
      const resp = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outTradeNo: outTradeNo,
          amount: Number(money),
          packageId,
          packageName: name,
          questionnaireType: questionnaireType || undefined,
        }),
      })

      if (!resp.ok) {
        const text = await resp.text()
        setError(`创建订单失败：${text || resp.status}`)
        return
      }

      const paramPayload = {
        note: param || '',
        source: (location.state as any)?.from ?? (questionnaireType ? 'home' : 'payment'),
        packageId: packageId ?? null,
        questionnaireType: questionnaireType ?? null,
        userId: user?.id ?? null,
      }

      const prepareResp = await fetch('/api/zpay/prepare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          money,
          outTradeNo,
          notifyUrl,
          returnUrl,
          param: JSON.stringify(paramPayload),
        }),
      })

      if (!prepareResp.ok) {
        const text = await prepareResp.text()
        setError(`生成支付参数失败：${text || prepareResp.status}`)
        return
      }

      const prepareData = await prepareResp.json().catch(() => null)
      if (!prepareData?.success || !prepareData.data) {
        setError(prepareData?.message || '生成支付参数失败')
        return
      }

      const { submitUrl, params } = prepareData.data as {
        submitUrl: string
        params: Record<string, string>
      }

      // 清空之前的表单内容，重新构建隐藏字段
      while (form.firstChild) {
        form.removeChild(form.firstChild)
      }

      Object.entries(params).forEach(([key, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value
        form.appendChild(input)
      })

      form.action = submitUrl
      form.method = 'POST'
      form.target = '_blank'
      form.submit()
    } catch (err) {
      logger.error('创建订单失败', err, { outTradeNo, amount: money })
      const errorMessage = handleError(err, { action: 'createOrder', outTradeNo })
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegenerateOutTradeNo = () => {
    setOutTradeNo(`${Date.now()}`)
  }

  const handleBackHome = () => {
    navigate('/')
  }

  return (
    <PageTransition>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              支付配置（仅支持支付宝）
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              当前使用 ZPAY 易支付兼容接口，通过页面跳转方式发起支付。前台页面和管理后台均可复用本接口。
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  商品名称
                </label>
                <input
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：心理测评套餐 A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  订单金额（元）
                </label>
                <input
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={money}
                  onChange={(e) => setMoney(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                商户订单号（out_trade_no）
              </label>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={outTradeNo}
                  onChange={(e) => setOutTradeNo(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={handleRegenerateOutTradeNo}
                  className="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  重新生成
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                每笔订单需保持全局唯一，可使用时间戳或业务订单号。
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                异步回调地址（notify_url）
              </label>
              <input
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：https://your-domain.com/api/zpay/notify"
                value={notifyUrl}
                onChange={(e) => setNotifyUrl(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                服务端异步通知地址，建议设置为后端接口地址，不支持携带查询参数。
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                页面跳转地址（return_url）
              </label>
              <input
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：https://your-domain.com/payment/result"
                value={returnUrl}
                onChange={(e) => setReturnUrl(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                用户支付完成后浏览器跳转的页面地址，不支持携带查询参数。
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                业务备注（param，选填）
              </label>
              <input
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：套餐类型、用户ID 等，将在回调中原样返回"
                value={param}
                onChange={(e) => setParam(e.target.value)}
              />
            </div>

            <div className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-100 dark:border-gray-800 mt-4">
              <div className="text-xs text-gray-500 dark:text-gray-500">
                支付方式固定为 <span className="font-semibold text-blue-600">支付宝（alipay）</span>。
                如需微信支付，请在 ZPAY 后台单独开通。
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBackHome}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                >
                  回到主页
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                >
                  {isSubmitting ? '正在跳转支付…' : '发起支付（跳转收银台）'}
                </button>
              </div>
            </div>
          </form>

          {/* 用于真正提交到 ZPAY 的隐藏表单 */}
          <form ref={formRef} className="hidden" />
        </div>
      </div>
    </PageTransition>
  )
}


