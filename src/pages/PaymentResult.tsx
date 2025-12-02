/**
 * 支付结果页面
 * 支付成功后跳转至此，显示支付状态并提供"开始测评"按钮
 */

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, ArrowRight, Home, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageTransition from '@/components/PageTransition'
import { analytics, FunnelStep } from '@/utils/analytics'
import { getOrderByOutTradeNo } from '@/services/api/orders'
import { handleError } from '@/utils/errorHandler'
import { logger } from '@/utils/logger'
import toast from 'react-hot-toast'

interface PaymentResult {
  success: boolean
  orderNo?: string
  amount?: number
  linkId?: string
  questionnaireType?: string
  message?: string
}

export default function PaymentResult() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [result, setResult] = useState<PaymentResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 从 URL 参数获取订单信息
    const outTradeNo = searchParams.get('out_trade_no') || searchParams.get('outTradeNo')
    const tradeStatus = searchParams.get('trade_status') || searchParams.get('status')
    
    if (!outTradeNo) {
      setResult({
        success: false,
        message: '未找到订单信息，请检查支付状态',
      })
      setLoading(false)
      return
    }

    // 查询订单状态和关联的测试链接
    checkOrderStatus(outTradeNo, tradeStatus)
  }, [searchParams])

  const checkOrderStatus = async (outTradeNo: string, tradeStatus: string | null) => {
    try {
      // 使用统一的 API 客户端查询订单
      const orderResponse = await getOrderByOutTradeNo(outTradeNo)
      
      if (!orderResponse.success || !orderResponse.data) {
        setResult({
          success: false,
          orderNo: outTradeNo,
          message: orderResponse.message || '订单查询失败，请稍后重试',
        })
        setLoading(false)
        return
      }

      const order = orderResponse.data

      // 检查订单状态
      const isPaid = tradeStatus === 'TRADE_SUCCESS' || 
                     tradeStatus === 'paid' || 
                     order.status === 'paid'

      if (isPaid) {
        // 根据订单信息获取或生成测试链接
        const linkId = order.linkId || await generateTestLink(order)
        
        if (!linkId) {
          setResult({
            success: false,
            orderNo: outTradeNo,
            message: '测试链接生成失败，请联系客服',
          })
          setLoading(false)
          return
        }

        const resultData = {
          success: true,
          orderNo: outTradeNo,
          amount: order.amount,
          linkId: linkId,
          questionnaireType: order.packageName || order.questionnaireType,
          message: '支付成功！',
        }
        setResult(resultData)
        
        // 追踪支付成功
        analytics.trackFunnelStep(
          FunnelStep.PAYMENT_SUCCESS,
          order.questionnaireType || order.packageName,
          order.amount,
          { orderNo: outTradeNo, linkId }
        )
      } else {
        setResult({
          success: false,
          orderNo: outTradeNo,
          message: order.status === 'pending' 
            ? '订单支付中，请稍候...' 
            : '订单状态异常，请稍后重试或联系客服',
        })
      }
    } catch (error) {
      const errorMessage = handleError(error, { outTradeNo })
      toast.error(errorMessage)
      setResult({
        success: false,
        orderNo: outTradeNo,
        message: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  // 根据订单信息生成测试链接
  const generateTestLink = async (order: any): Promise<string | undefined> => {
    try {
      // 从订单的 param 中解析 questionnaireType，或者从 packageId 获取
      const questionnaireType = order.questionnaireType || order.packageId || 'SCL-90'
      
      const resp = await fetch('/api/links/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionnaireType: questionnaireType,
          quantity: 1,
          orderNo: order.outTradeNo,
        }),
      })

      if (resp.ok) {
        const data = await resp.json()
        if (data.success && data.data?.links && data.data.links.length > 0) {
          return data.data.links[0].id
        }
      }
    } catch (error) {
      logger.error('生成测试链接失败', error, { order })
    }
    return undefined
  }

  const handleStartTest = () => {
    if (result?.linkId) {
      navigate(`/test/${result.linkId}`)
    }
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">正在查询支付状态...</p>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 sm:p-8">
          {result?.success ? (
            <>
              {/* 支付成功 */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  支付成功！
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  您的订单已支付成功，现在可以开始测评了
                </p>
              </div>

              {/* 订单信息 */}
              {result.orderNo && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                  <div className="space-y-2 text-sm">
                    {result.orderNo && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">订单号：</span>
                        <span className="font-medium text-gray-900 dark:text-white">{result.orderNo}</span>
                      </div>
                    )}
                    {result.amount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">支付金额：</span>
                        <span className="font-medium text-gray-900 dark:text-white">¥{result.amount.toFixed(2)}</span>
                      </div>
                    )}
                    {result.questionnaireType && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">测评类型：</span>
                        <span className="font-medium text-gray-900 dark:text-white">{result.questionnaireType}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 开始测评按钮 */}
              {result.linkId ? (
                <div className="space-y-3">
                  <button
                    onClick={handleStartTest}
                    className="w-full bg-primary-500 text-white py-4 rounded-lg font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 text-lg shadow-lg"
                  >
                    <span>开始测评</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                    支付成功后，系统已自动为您生成测试链接
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        测试链接生成中，请稍候...如果长时间未生成，请联系客服。
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 返回首页 */}
              <div className="mt-6 text-center">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span>返回首页</span>
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* 支付失败或异常 */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                  <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  支付状态异常
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {result?.message || '无法确认支付状态，请稍后重试'}
                </p>
                {result?.orderNo && (
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    订单号：{result.orderNo}
                  </p>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/payment')}
                  className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
                >
                  重新支付
                </button>
                <Link
                  to="/"
                  className="block w-full text-center py-3 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  返回首页
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </PageTransition>
  )
}


