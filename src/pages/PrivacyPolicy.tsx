/**
 * 隐私政策页面
 */

import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* 返回按钮 */}
        <Link
          to="/register"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回注册</span>
        </Link>

        {/* 协议内容 */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-gray-200/50 dark:shadow-gray-900/50 p-6 sm:p-8 md:p-10 border border-gray-200/80 dark:border-gray-700/80">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-6">
            MIND CUBE 隐私协议
          </h1>

          <div className="prose prose-lg max-w-none dark:prose-invert">
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-6 rounded">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                特别提示：
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                您的心理测评数据属于高度敏感个人信息，本协议将明确告知信息收集、使用、共享的全部规则，请您仔细阅读并确认同意后再提供相关信息。
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">一、 信息收集与使用</h2>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>1.1 收集范围：</strong>
              </p>
              <ul className="list-disc pl-6 mb-3 text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>主动提供信息：</strong>账号注册信息（手机号、邮箱等）、人口学信息（性别、年龄等自愿填写内容）、测评作答记录、反馈建议等；</li>
                <li><strong>自动收集信息：</strong>设备型号、操作系统、IP 地址、使用日志（访问时间、浏览内容等），仅用于服务优化与安全验证，不收集无关个人信息。</li>
              </ul>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>1.2 使用目的（明确且必要）：</strong>
              </p>
              <ul className="list-disc pl-6 mb-3 text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>核心目的：</strong>为您提供测评服务、生成报告、维护账号安全；</li>
                <li><strong>附加目的：</strong>数据分析与研究（需匿名化处理）、服务优化（如根据使用习惯调整功能）、合规要求的信息留存；</li>
                <li>所有信息使用均遵循 "最小必要" 原则，不超出本协议约定范围使用信息。</li>
              </ul>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>1.3</strong> 您同意：若提供敏感信息（如心理状态描述、测评作答记录），即视为同意我们按本协议约定处理该等信息，且您已自行权衡提供该等信息的风险与收益。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">二、 信息共享与披露</h2>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>2.1 禁止出售：</strong>我们绝不会将您的个人可识别信息出售给任何第三方。
              </p>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>2.2 有限共享（无需单独同意的情形）：</strong>
              </p>
              <ul className="list-disc pl-6 mb-3 text-gray-700 dark:text-gray-300 space-y-2">
                <li>遵守法律法规、司法机关或行政部门的合法要求；</li>
                <li>保护我们或他人的合法权利、财产或安全（如应对欺诈、自伤风险等紧急情况）；</li>
                <li>平台合并、收购、破产清算时，将信息转移给受让方（受让方需继续履行隐私保护义务）；</li>
                <li>与授权服务商共享（如数据存储、技术支持），但需与服务商签订保密协议，要求其仅为提供服务目的使用信息，且我们将对服务商的行为进行合理监督（因服务商故意或重大过失导致的泄露，我们将协助您追责，但不承担最终赔偿责任）。</li>
              </ul>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>2.3 匿名化数据使用：</strong>我们可自由使用、披露和商业化处理经过去标识化、聚合化的非个人可识别数据（如整体测评趋势分析），该等数据无法关联到您的个人身份。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">三、 数据安全与保留</h2>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>3.1 安全保障：</strong>我们采取加密存储、访问权限控制、安全审计等行业通用措施保护您的信息，但因互联网传输的固有风险，不保证绝对安全。您同意自行承担合理的安全风险，但我们未履行基本安全保障义务的除外。
              </p>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>3.2 数据保留：</strong>
              </p>
              <ul className="list-disc pl-6 mb-3 text-gray-700 dark:text-gray-300 space-y-2">
                <li>个人信息保留至实现本协议目的所需的合理期限，或法律规定的最低保留期限；</li>
                <li>您注销账号后，我们将在 15 个工作日内对您的个人信息进行删除或匿名化处理（法律法规要求保留、已共享给第三方且无法追溯删除的除外），并向您提供注销完成的确认通知。</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">四、 您的权利与行使方式</h2>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>4.1 信息权利：</strong>您有权通过账号设置页面访问、更正、补充您的个人信息；有权申请删除账号内的测评记录（已用于匿名化研究的除外）。
              </p>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>4.2 权利行使：</strong>您可通过平台客服渠道提交权利行使申请，我们将在 15 个工作日内回复处理结果（复杂情况可延长至 30 个工作日，需提前告知）。
              </p>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>4.3 撤回同意：</strong>您可通过注销账号撤回对信息收集、使用的全部同意，但已基于您的同意产生的合法数据处理行为不受影响。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">五、 敏感信息特别告知</h2>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>5.1</strong> 您确认：心理测评数据（包括作答记录、状态描述等）属于《个人信息保护法》规定的敏感个人信息，一旦泄露可能导致您的人格尊严受损或人身、财产安全受到危害。
              </p>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>5.2</strong> 您自愿提供该等敏感信息，并明确同意我们按本协议约定进行收集、存储、使用和匿名化处理；若您不愿提供，可选择不参与相关测评，但可能无法使用部分服务功能。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">六、 协议更新</h2>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>6.1</strong> 我们有权根据法律法规变化或业务需要更新本协议，更新后将通过平台公告、站内信等方式通知您，并明确标注更新日期。
              </p>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>6.2</strong> 若您在更新后继续使用服务，视为接受更新后的协议；若您不同意，应立即停止使用服务并注销账号，否则视为默认同意。
              </p>
            </section>
          </div>

          {/* 返回按钮 */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:from-primary-600 hover:to-primary-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回注册</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

