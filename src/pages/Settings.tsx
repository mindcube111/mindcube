import { useState } from 'react'
import { Bell, Shield, Moon, Sun, Save, LogOut, CheckCircle } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const { logout } = useAuth()

  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    sms: false,
    system: true,
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const handlePreferenceChange = (key: keyof typeof notificationPrefs) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handlePasswordSave = () => {
    setPasswordError('')
    setPasswordSuccess('')

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('请填写完整信息')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('新密码至少8位')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('两次输入的新密码不一致')
      return
    }

    // TODO: 调用密码更新 API
    setPasswordSuccess('密码已更新')
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">账户设置</h1>
        <p className="text-gray-600 mt-2">控制通知偏好、主题和安全设置</p>
      </div>

      {/* 主题设置 */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <Sun className="w-5 h-5 text-primary-500" />
          <div>
            <h2 className="text-lg font-semibold">主题模式</h2>
            <p className="text-sm text-gray-500">选择适合您的界面亮度</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border ${
              theme === 'light' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-700'
            } flex items-center gap-3 justify-center`}
          >
            <Sun className="w-5 h-5" />
            浅色模式
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border ${
              theme === 'dark' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-700'
            } flex items-center gap-3 justify-center`}
          >
            <Moon className="w-5 h-5" />
            深色模式
          </button>
        </div>
      </div>

      {/* 通知设置 */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-secondary-500" />
          <div>
            <h2 className="text-lg font-semibold">通知偏好</h2>
            <p className="text-sm text-gray-500">决定哪些渠道接收通知</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { key: 'email', label: '邮件通知', description: '账户提醒、报告完成、额度告警等' },
            { key: 'sms', label: '短信通知', description: '紧急任务、额度预警' },
            { key: 'system', label: '站内通知', description: '推荐使用，实时同步重要事件' },
          ].map((pref) => (
            <label
              key={pref.key}
              className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-primary-200"
            >
              <input
                type="checkbox"
                checked={notificationPrefs[pref.key as keyof typeof notificationPrefs]}
                onChange={() => handlePreferenceChange(pref.key as keyof typeof notificationPrefs)}
                className="mt-1 accent-primary-500 w-5 h-5"
              />
              <div>
                <p className="font-medium text-gray-900">{pref.label}</p>
                <p className="text-sm text-gray-500">{pref.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 安全设置 */}
      <div className="card space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-danger" />
          <div>
            <h2 className="text-lg font-semibold">账户安全</h2>
            <p className="text-sm text-gray-500">定期更新密码并检查会话安全</p>
          </div>
        </div>

        <div className="space-y-3">
          {passwordError && (
            <div className="text-sm text-danger bg-dangerLight/60 border border-dangerLight text-left px-3 py-2 rounded-lg">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="text-sm text-success bg-success/10 border border-success/30 text-left px-3 py-2 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {passwordSuccess}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="password"
              placeholder="当前密码"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="input"
            />
            <input
              type="password"
              placeholder="新密码（至少8位）"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="input"
            />
            <input
              type="password"
              placeholder="确认新密码"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="input"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={handlePasswordSave} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              保存密码
            </button>
            <button
              onClick={() => {
                setPasswordForm({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                })
                setPasswordError('')
                setPasswordSuccess('')
              }}
              className="btn-secondary"
            >
              取消
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-muted p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-medium text-gray-900">退出其他会话</p>
            <p className="text-sm text-gray-500 mt-1">若发现异常登录，可立刻退出所有设备</p>
          </div>
          <button className="btn-secondary">退出所有设备</button>
        </div>

        <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-semibold text-danger">退出登录</p>
            <p className="text-sm text-danger/80 mt-1">完成设置后，安全退出当前账户</p>
          </div>
          <button onClick={logout} className="btn-danger flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            退出当前账户
          </button>
        </div>
      </div>
    </div>
  )
}










