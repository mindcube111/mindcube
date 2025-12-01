import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Mail, Lock, ShieldCheck, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useConfirmDialog } from '@/components/ConfirmDialog'
import { validateUsername, validateEmail, validatePassword } from '@/utils/validation'
import { generateCaptcha, verifyCaptcha, type CaptchaChallenge } from '@/utils/captcha'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { showAlert, DialogComponent } = useConfirmDialog()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [captcha, setCaptcha] = useState<CaptchaChallenge>(generateCaptcha())
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // 刷新验证码
  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha())
    setCaptchaAnswer('')
  }

  // 页面加载时生成验证码
  useEffect(() => {
    refreshCaptcha()
  }, [])

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 清除该字段的错误
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {}

    // 验证用户名
    const usernameValidation = validateUsername(formData.username.trim())
    if (!usernameValidation.isValid) {
      errors.username = usernameValidation.message || '用户名验证失败'
    }

    // 验证邮箱
    const emailValidation = validateEmail(formData.email.trim())
    if (!emailValidation.isValid) {
      errors.email = emailValidation.message || '邮箱验证失败'
    }

    // 验证密码
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.message || '密码验证失败'
    } else if (formData.password.length < 8) {
      errors.password = '密码长度至少8位'
    }

    // 验证确认密码
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致'
    }

    setFieldErrors(errors)
    return { isValid: Object.keys(errors).length === 0, errors }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 表单验证
    const validation = validateForm()
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0]
      if (firstError) {
        await showAlert('验证失败', firstError, 'warning')
      }
      return
    }

    if (!acceptTerms) {
      await showAlert('提示', '请先勾选已阅读并同意用户协议', 'warning')
      return
    }

    // 验证验证码
    if (!captchaAnswer.trim()) {
      await showAlert('提示', '请输入验证码', 'warning')
      return
    }

    const userAnswer = parseInt(captchaAnswer.trim(), 10)
    if (!verifyCaptcha(userAnswer, captcha.answer)) {
      await showAlert('提示', '验证码错误，请重新输入', 'warning')
      refreshCaptcha()
      return
    }

    setIsSubmitting(true)
    setError('')

    const result = await register({
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password,
      captchaAnswer,
      captchaId: captcha.id,
    })

    setIsSubmitting(false)
    if (!result.success) {
      setError(result.message)
      return
    }

    await showAlert('注册成功', '信息已提交，等待管理员审核通过后即可登录。', 'success')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 sm:p-6">
      {DialogComponent}
      <div className="max-w-lg w-full">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-3 sm:mb-4 shadow-lg shadow-primary-500/30">
            <img
              src="/logo-cube.jpg"
              alt="MIND CUBE Logo"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight px-2">创建 MIND CUBE心理测评平台 账号</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2 px-2">填写信息，立即体验专业的心理测评管理服务</p>
        </div>

        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-gray-200/50 dark:shadow-gray-900/50 p-6 sm:p-8 border border-gray-200/80 dark:border-gray-700/80">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">注册信息</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
                <span className="text-gray-500 text-xs ml-1">(3-20位，字母、数字、下划线)</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  className={`input pl-10 ${fieldErrors.username ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="请输入用户名"
                  required
                />
              </div>
              {fieldErrors.username && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`input pl-10 ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="请输入邮箱"
                  required
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密码
                  <span className="text-gray-500 text-xs ml-1">(至少8位)</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className={`input pl-10 ${fieldErrors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="至少 8 位，建议包含字母和数字"
                    required
                    minLength={8}
                  />
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">确认密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className={`input pl-10 ${fieldErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="请再次输入密码"
                    required
                    minLength={8}
                  />
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                )}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="刷新验证码"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              <span>
                我已阅读并同意
                <Link to="/user-agreement" className="text-secondary-600 hover:underline mx-1">《用户协议》</Link>
                及
                <Link to="/privacy-policy" className="text-secondary-600 hover:underline mx-1">《隐私政策》</Link>
                。
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:from-primary-600 hover:to-primary-700 transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  提交中...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  注册账号
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-base font-bold text-gray-600 text-center">
            注册用户联系微信激活：<span className="text-primary-600">Mindcube111</span>
          </div>

          <div className="mt-6 text-sm text-gray-600 text-center">
            已有账号？
            <Link to="/login" className="text-secondary-600 hover:underline ml-1">
              返回登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

