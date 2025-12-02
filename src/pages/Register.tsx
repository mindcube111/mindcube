import { useState, useMemo, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Mail, Lock, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useConfirmDialog } from '@/components/ConfirmDialog'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { showAlert, showConfirm, DialogComponent } = useConfirmDialog()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [captchaA, setCaptchaA] = useState(() => Math.floor(Math.random() * 5) + 3) // 3-7
  const [captchaB, setCaptchaB] = useState(() => Math.floor(Math.random() * 5) + 2) // 2-6
  const captchaResult = useMemo(() => captchaA * captchaB, [captchaA, captchaB])

  // 重新生成验证码
  const regenerateCaptcha = useCallback(() => {
    setCaptchaA(Math.floor(Math.random() * 5) + 3)
    setCaptchaB(Math.floor(Math.random() * 5) + 2)
    setCaptchaAnswer('')
  }, [])

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (Number(captchaAnswer) !== captchaResult) {
      await showAlert('验证失败', '结果不对，再试一次哦', 'warning')
      setCaptchaAnswer('')
      regenerateCaptcha()
      return
    }
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

  const handleShowAgreements = async (e: React.MouseEvent) => {
    e.preventDefault()
    const agreementText = `
需用户点击“我已阅读并同意”的单独弹窗文本 MIND CUBE 用户协议

特别提示：本协议核心条款已明确告知服务边界及风险，您的注册、登录、使用行为即视为您已完全理解并接受所有责任豁免条款，自愿承担全部使用风险。如您不同意，应立即停止访问本平台。

一、 接受协议

1.1 您确认：已仔细阅读本协议全部内容，尤其是免责条款、风险告知等核心内容，理解其法律含义，自愿接受本协议所有约束。

1.2 若您不同意本协议任何条款，唯一权利是立即终止使用本平台服务，双方无其他权利义务关系。

二、 服务性质与绝对免责（核心条款）

2.1 本平台（“MIND CUBE心理测评平台”）提供的所有内容（测评、报告、文章等），仅为用户自我探索的参考工具（本评估旨在自我探索的地图，而非临床诊断），绝非专业医疗诊断、心理治疗、法律咨询或职业规划建议。本平台及工作人员均不具备精神科执业医师、心理咨询师等相关专业资质，不提供任何诊疗或专业咨询服务。

2.2 您明确知晓并承诺：测评结果受个人状态、作答态度等多种因素影响，不具备科学性、准确性、完整性的任何担保，仅为娱乐及自我参考用途；不会将测评结果作为医疗诊断、教育、就业、法律、财务等任何决策的依据；若您存在心理痛苦、情绪异常或自伤、伤人风险，将立即停止使用本平台，自行联系线下正规医疗机构或心理援助热线寻求专业帮助，与本平台无任何关联。

2.3 您充分理解并同意，在任何情况下，本平台及其运营方、关联方、员工、合作伙伴均不承担任何法律责任（包括但不限于合同责任、侵权责任、违约责任等），无论损失是否因以下情形导致：您对服务内容的依赖、解读、使用或误解；服务内容存在的任何错误、遗漏、不准确或不适配性；服务的延迟、中断、暂停、终止或功能故障；您的账号被盗用、数据泄露（因平台故意泄露除外）；您因使用本服务产生的任何直接、间接、偶然、特殊、后果性或惩罚性损失（包括但不限于精神损害、决策失误、财产损失、人身伤害等）；第三方基于服务内容作出的任何行为或判断。

2.4 本平台无需对服务内容的真实性、合法性、有效性承担任何审核或担保责任，所有服务内容均由用户自行判断使用。

三、 用户陈述与保证

3.1 您承诺并保证：已年满18周岁（未成年人使用需经监护人书面同意，监护人承担全部责任）；完全理解心理测评的局限性，知晓其不能替代专业诊断或咨询，明确本评估旨在自我探索的地图，而非临床诊断；若困扰持续或加重，将自行优先寻求专业心理咨询/治疗支持，与本平台无关；自愿承担使用本平台的全部风险，不会因任何使用结果向本平台主张任何权利。

四、 账号与数据

4.1 您对账号及凭证的安全性负全部责任，因泄露、盗用导致的损失由您自行承担，本平台不承担任何赔偿或协助责任。

4.2 您确认：互联网数据传输与存储存在固有安全风险，本平台无需采取特殊安全保障措施，您自愿承担数据丢失、泄露的全部风险，与本平台无关。

4.3 您的测评数据仅用于生成报告，本平台可自由用于匿名化研究、商业分析等用途，无需另行通知您。

五、 服务变更与终止

5.1 本平台有权随时修改、暂停、终止部分或全部服务，无需提前通知，也无需对您或第三方承担任何责任。

5.2 服务终止后，本平台无义务保留或删除您的任何数据，您需自行提前备份，逾期未备份导致的损失由您自行承担。

六、 管辖法律与争议解决

6.1 本协议适用中华人民共和国法律。

6.2 因本协议引起的任何争议，您同意仅通过向本平台运营公司所在地有管辖权的人民法院提起个人诉讼解决，自愿放弃集体诉讼、代表人诉讼等权利。

七、 其他条款

7.1 本协议未尽事宜，均以“免除本平台责任”为原则解释。

7.2 本平台有权随时更新本协议，更新后无需通知您，您继续使用服务即视为接受更新后的协议。

------------------------------
MIND CUBE 隐私协议

特别提示：您的个人信息（含心理测评敏感信息）由您自行决定是否提供，提供即视为同意本协议所有处理规则，自愿承担信息处理的全部风险。

一、 信息收集与使用

1.1 收集范围：包括您主动提供的账号信息、测评作答记录等，及自动收集的设备、日志信息。

1.2 使用目的：为提供服务、数据分析、商业推广等任何合法用途，您自愿同意本平台无需另行获得您的授权即可使用。

1.3 您确认：本评估旨在自我探索的地图，而非临床诊断；若困扰持续或加重，将自行优先寻求专业心理咨询/治疗支持，与本平台无关。

二、 信息共享与披露

2.1 本平台可根据业务需要，将您的信息共享给任何第三方（包括授权服务商、合作伙伴等），无需另行通知您，您自愿承担信息共享的全部风险。

2.2 本平台可自由使用、披露、商业化处理匿名化、聚合化数据，无需向您支付任何费用。

三、 数据安全与保留

3.1 本平台无需对您的信息安全承担任何保障责任，您确认并同意：信息泄露、丢失等风险由您自行承担，与本平台无关。

3.2 本平台可根据自身需要保留或删除您的信息，无明确保留期限，您注销账号后，本平台无义务删除已共享或留存的信息。

四、 您的权利（受限）

4.1 您仅可访问自身账号基本信息，无权要求删除、更正已用于研究或共享的信息。

4.2 您撤回同意或注销账号后，不影响本平台此前基于您的同意进行的信息处理行为的合法性。

五、 敏感信息特别告知

5.1 您确认：心理测评数据属于高度敏感信息，您自愿提供该等信息，即同意本平台按本协议约定处理，自行承担信息泄露、滥用的全部风险。

5.2 您明确知晓：提供敏感信息可能导致人格尊严受损、隐私泄露等风险，仍自愿提供，与本平台无关。

六、 协议更新

6.1 本平台有权随时更新本协议，更新后无需通知您，您继续使用服务即视为接受更新后的协议。
`

    const confirmed = await showConfirm('MIND CUBE 用户协议与隐私协议', agreementText, {
      confirmText: '我已阅读并同意',
      cancelText: '不同意',
    })

    if (confirmed) {
      setAcceptTerms(true)
    }
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
              width="48"
              height="48"
              loading="eager"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                计算结果： {captchaA} × {captchaB} =
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  className="input pr-24"
                  placeholder="请输入结果"
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                  防机器人，请填写结果
                </span>
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
                <a
                  href="#"
                  onClick={handleShowAgreements}
                  className="text-secondary-600 hover:underline mx-1"
                >
                  《用户协议》
                </a>
                及
                <a
                  href="#"
                  onClick={handleShowAgreements}
                  className="text-secondary-600 hover:underline mx-1"
                >
                  《隐私政策》
                </a>
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

