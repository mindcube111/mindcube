/**
 * 用户协议页面
 */

import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function UserAgreement() {
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
            MIND CUBE 用户协议
          </h1>

          <div className="prose prose-lg max-w-none dark:prose-invert">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 mb-6 rounded">
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                特别提示：
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                请您务必仔细阅读并充分理解本协议全部条款，尤其是加粗标注的免责条款、服务边界、数据处理等核心内容。您的注册、登录、使用行为即视为您已完全接受本协议约束。如您不同意任何条款，应立即停止使用本平台服务。
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">一、 接受协议</h2>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>1.1</strong> 本平台（"MIND CUBE 心理测评平台"）为用户提供心理测评相关的信息参考服务，本协议是您与平台运营方（以下简称 "我们"）之间的法律约定。
              </p>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>1.2</strong> 您确认：在使用本服务前已审慎阅读本协议全部内容，理解各项条款的法律含义，尤其是免责条款、风险告知等对您权利义务有重大影响的内容，并自愿接受本协议约束。
              </p>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>1.3</strong> 若您不同意本协议任何内容，唯一权利是立即终止访问、注销账号并停止使用全部服务，双方权利义务自您停止使用时终止（已产生的合法权利义务除外）。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">二、 服务性质与责任豁免（核心条款）</h2>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>2.1 服务边界明确：</strong>本平台提供的心理测评、分析报告、文章、建议等所有内容（统称 "服务内容"），仅为用户自我探索、兴趣参考及娱乐用途，绝非专业医疗诊断、心理治疗、法律咨询或职业规划建议。本平台及相关工作人员均不具备精神科执业医师资质，不提供任何诊疗类服务。
              </p>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>2.2 风险告知与承诺：</strong>您明确知晓并承诺：
              </p>
              <ul className="list-disc pl-6 mb-3 text-gray-700 dark:text-gray-300 space-y-2">
                <li>心理测评结果受个人状态、作答态度等多种因素影响，仅为参考，不具备科学性、准确性的绝对担保；</li>
                <li>不会将测评结果作为医疗诊断、教育录取、就业录用、法律决策、重大财务安排等关键事项的依据；</li>
                <li>若您存在心理痛苦、情绪异常或自伤、伤人风险，将立即停止依赖本平台，主动联系线下正规医疗机构（如精神卫生中心、三甲医院心理科）或拨打心理援助热线寻求专业帮助。</li>
              </ul>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong className="text-red-600 dark:text-red-400">2.3 责任豁免（加粗提示）：</strong>您充分理解并同意，因以下情形导致的任何直接或间接损失（包括但不限于精神困扰、决策失误、财产损失等），本平台不承担任何法律责任（无论基于合同、侵权或其他法律关系）：
              </p>
              <ul className="list-disc pl-6 mb-3 text-gray-700 dark:text-gray-300 space-y-2">
                <li>您对服务内容的依赖、解读或使用行为；</li>
                <li>服务内容存在的错误、遗漏或不适配性（因平台故意或重大过失导致的除外）；</li>
                <li>不可抗力、网络故障、第三方技术问题等非平台可控因素导致的服务延迟、中断或终止；</li>
                <li>您自身泄露账号凭证、授权他人使用账号导致的损失；</li>
                <li>您未遵守本协议约定使用服务产生的后果。</li>
              </ul>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>2.4 免责边界：</strong>本协议免责条款不适用以下情形：
              </p>
              <ul className="list-disc pl-6 mb-3 text-gray-700 dark:text-gray-300 space-y-2">
                <li>因平台故意或重大过失导致的用户人身损害或重大财产损失；</li>
                <li>违反《个人信息保护法》规定导致的敏感信息泄露；</li>
                <li>法律明确规定不得免责的其他情形。</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">三、 用户陈述与保证</h2>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>3.1</strong> 您承诺并保证：
              </p>
              <ul className="list-disc pl-6 mb-3 text-gray-700 dark:text-gray-300 space-y-2">
                <li>已年满 18 周岁；若为未成年人，必须在监护人全程知情、书面同意并陪同使用的前提下访问本平台，且监护人需对使用行为及后果承担连带责任；</li>
                <li>理解心理测评的局限性，知晓其不能替代专业诊断或咨询；</li>
                <li>不会利用本平台服务从事违法违规活动，不会将服务内容用于商业传播或其他侵权用途；</li>
                <li>若发现自身或他人存在自伤、伤人风险，将立即停止使用并向相关部门报告。</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">四、 账号与数据</h2>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>4.1 账号管理：</strong>您应妥善保管账号密码、验证码等凭证，对账号下的所有操作行为承担全部责任。因凭证泄露、他人盗用导致的损失，由您自行承担；您发现账号异常应立即通知我们，我们将协助采取冻结账号等合理措施，但不承担未及时处理导致的扩大部分损失。
              </p>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>4.2 数据安全：</strong>我们将采取行业标准的技术与管理措施（如加密存储、访问权限控制）保护您的数据安全，但不保证数据传输与存储的绝对安全性（互联网传输存在固有风险）。您同意自行承担数据丢失、未授权访问的合理风险，但因我们未履行基本安全保障义务导致的泄露除外。
              </p>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>4.3 数据使用限制：</strong>您的测评数据、作答记录等信息仅用于为您提供服务、优化产品功能，未经您单独同意，不会用于其他商业用途（匿名化聚合数据除外）。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">五、 服务变更与终止</h2>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>5.1</strong> 我们有权根据法律法规变化、业务调整等情况，修改、暂停或终止部分或全部服务，但应提前 7 日通过平台公告、站内信等方式通知您（紧急情况除外）。
              </p>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>5.2</strong> 服务终止后，我们将停止收集您的新信息，并在合理期限内对您的个人信息进行删除或匿名化处理（法律法规要求保留的除外）。您应在服务终止通知期内备份个人数据，逾期未备份导致的损失由您自行承担。
              </p>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>5.3</strong> 因您违反本协议约定或法律法规规定，我们有权单方终止服务，且不承担任何责任。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">六、 管辖法律与争议解决</h2>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>6.1</strong> 本协议适用中华人民共和国法律（不包括冲突法规则）。
              </p>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>6.2</strong> 因本协议引起的或与本协议相关的任何争议，双方应首先友好协商解决；协商不成的，任何一方均有权向本平台运营公司所在地有管辖权的人民法院提起诉讼。
              </p>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>6.3</strong> 您同意：争议解决过程中，除争议事项外，双方应继续履行本协议其他条款。您自愿放弃以集体诉讼、代表人诉讼等形式主张权利的权利，但个人单独提起诉讼的权利不受限制。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">七、 其他条款</h2>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>7.1</strong> 本协议未尽事宜，适用《个人信息保护法》《民法典》《网络安全法》等相关法律法规规定。
              </p>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>7.2</strong> 本协议的任何修改、补充，将通过平台公告、站内信等方式通知您，修改后的协议自通知指定生效日期起生效。若您在修改后继续使用服务，视为接受修改后的协议；若您不同意修改，应立即停止使用服务。
              </p>
              
              <p className="mb-3 text-gray-700 dark:text-gray-300">
                <strong>7.3</strong> 本协议自您首次注册或使用本平台服务之日起生效，有效期至您注销账号且停止使用全部服务之日止。
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

