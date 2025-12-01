import { Copy, Gift, Link2, Share2, Users } from 'lucide-react'
import { mockInvite } from '@/data/mockData'
import { formatDate } from '@/utils/formatters'

export default function Invite() {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(mockInvite.inviteUrl)
    alert('邀请链接已复制')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">邀请推广</h1>
          <p className="text-gray-600 mt-2">分享邀请码，邀请合作伙伴一起管理测评</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          分享出去
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary-50 text-primary-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">累计邀请</p>
            <p className="text-2xl font-semibold text-gray-900">{mockInvite.totalInvited} 人</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-full bg-secondary-50 text-secondary-600">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">奖励总额</p>
            <p className="text-2xl font-semibold text-gray-900">¥{mockInvite.totalReward}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-full bg-emerald-50 text-emerald-600">
            <Link2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">创建时间</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatDate(mockInvite.createdAt, 'yyyy-MM-dd')}
            </p>
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">邀请码</p>
          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-xl bg-gray-50 font-mono text-lg tracking-widest">
              {mockInvite.inviteCode}
            </div>
            <button onClick={() => navigator.clipboard.writeText(mockInvite.inviteCode)} className="btn-secondary">
              复制
            </button>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-1">邀请链接</p>
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <input
              value={mockInvite.inviteUrl}
              readOnly
              className="input font-mono text-sm"
            />
            <div className="flex gap-2">
              <button onClick={handleCopy} className="btn-primary flex items-center gap-2">
                <Copy className="w-4 h-4" />
                复制链接
              </button>
              <button className="btn-secondary flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                创建海报
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}









