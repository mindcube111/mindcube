import { useState, useEffect } from 'react'
import type React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn, Lock, User, AlertCircle, Home, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { generateCaptcha, verifyCaptcha, type CaptchaChallenge } from '@/utils/captcha'

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [captcha, setCaptcha] = useState<CaptchaChallenge>(generateCaptcha())
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 刷新验证码
  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha())
    setCaptchaAnswer('')
  }

  // 页面加载时生成验证码
  useEffect(() => {
    refreshCaptcha()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 验证验证码
    if (!captchaAnswer.trim()) {
      setError('请输入验证码')
      return
    }

    const userAnswer = parseInt(captchaAnswer.trim(), 10)
    if (!verifyCaptcha(userAnswer, captcha.answer)) {
      setError('验证码错误，请重新输入')
      refreshCaptcha()
      return
    }

    setIsSubmitting(true)

    const result = await login(username, password, captchaAnswer, captcha.id)
    setIsSubmitting(false)

    if (result.success) {
      // 检查是否有待处理的问卷类型（从未登录用户点击"开始测试"而来）
      const pendingQuestionnaireType = sessionStorage.getItem('pendingQuestionnaireType')
      if (pendingQuestionnaireType) {
        sessionStorage.removeItem('pendingQuestionnaireType')
        navigate(`/links/generate?type=${pendingQuestionnaireType}`)
      } else {
        navigate('/dashboard')
      }
    } else {
      setError(result.message || '登录失败，请稍后重试')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full">
        {/* Logo 和标题 */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mb-3 sm:mb-4 shadow-lg shadow-primary-500/30 bg-gradient-to-br from-primary-500 to-primary-600">
            <img
              src="/logo-cube.jpg"
              alt="MIND CUBE Logo"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white px-2 tracking-tight">MIND CUBE 心理测评管理平台</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2 px-2">专业、便捷、可信赖的心理健康测评管理系统</p>
        </div>

        {/* 登录表单 */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-gray-200/50 dark:shadow-gray-900/50 p-6 sm:p-8 border border-gray-200/80 dark:border-gray-700/80">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 tracking-tight">账号登录</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input pl-10"
                  placeholder="请输入用户名"
                  required
                  disabled={isSubmitting || isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="请输入密码"
                  required
                  disabled={isSubmitting || isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                验证码
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    className="input"
                    placeholder="计算结果"
                    required
                    disabled={isSubmitting || isLoading}
                    autoComplete="off"
                  />
                </div>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600">
                  <span className="text-lg font-mono font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                    {captcha.question}
                  </span>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    disabled={isSubmitting || isLoading}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="刷新验证码"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-600">记住我</span>
              </label>
              <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
                忘记密码？
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:from-primary-600 hover:to-primary-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {isSubmitting || isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  登录中...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  登录
                </>
              )}
            </button>
          </form>

        </div>

        {/* 辅助链接 */}
        <div className="mt-6 space-y-4">
          {/* 回到主页按钮 */}
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-4 px-6 py-5 bg-transparent hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 rounded-xl font-extrabold text-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] group"
          >
            {/* 图标和文字 */}
            <div className="flex items-center gap-4">
              <Home className="w-7 h-7" />
              <span className="text-xl font-extrabold tracking-wide">回到主页</span>
            </div>
            
            {/* 装饰箭头 */}
            <div className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>
          
          {/* 注册链接 */}
          <div className="text-center text-sm text-gray-600">
            还没有账号？
            <Link to="/register" className="text-secondary-600 hover:underline ml-1 font-medium">
              立即注册
            </Link>
          </div>
        </div>

        {/* 页脚 */}
        <p className="text-center text-xs text-gray-400 mt-4">
          © 2025 MIND CUBE 心理测评管理平台. 保留所有权利.
        </p>
      </div>
    </div>
  )
}




