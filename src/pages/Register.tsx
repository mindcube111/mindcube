import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Mail, Lock, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useConfirmDialog } from '@/components/ConfirmDialog'

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
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      await showAlert('验证失败', '两次输入的密码不一致', 'warning')
      return
    }
    if (!acceptTerms) {
      await showAlert('提示', '请先勾选已阅读并同意用户协议', 'warning')
      return
    }
    setIsSubmitting(true)
    setError('')

    const result = await register({
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password,
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {DialogComponent}
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4 shadow-lg">
            <img
              src="/logo-cube.jpg"
              alt="MIND CUBE Logo"
              className="w-12 h-12 rounded-2xl"
            />
          </div>
          <h1 className="text-3xl font-bold text-text">创建 MIND CUBE心理测评平台 账号</h1>
          <p className="text-gray-600 mt-2">填写信息，立即体验专业的心理测评管理服务</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-muted/60">
          <h2 className="text-xl font-semibold text-text mb-6">注册信息</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  className="input pl-10"
                  placeholder="请输入用户名"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="input pl-10"
                  placeholder="请输入邮箱"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="input pl-10"
                    placeholder="至少 8 位，建议包含字母和数字"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">确认密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className="input pl-10"
                    placeholder="请再次输入密码"
                    required
                    minLength={8}
                  />
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
                <a href="#" className="text-secondary-600 hover:underline mx-1">《用户协议》</a>
                及
                <a href="#" className="text-secondary-600 hover:underline mx-1">《隐私政策》</a>
                。
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
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

