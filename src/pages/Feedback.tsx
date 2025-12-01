import { useMemo, useState } from 'react'
import { MessageSquare, Filter, Search } from 'lucide-react'
import { mockFeedbacks } from '@/data/mockData'
import type { Feedback as FeedbackType } from '@/types'
import { formatDate } from '@/utils/formatters'

const typeLabels: Record<FeedbackType['type'], string> = {
  bug: '缺陷',
  feature: '功能',
  experience: '体验',
  data: '数据',
}

const statusLabels: Record<FeedbackType['status'], { label: string; className: string }> = {
  pending: { label: '排队中', className: 'bg-gray-100 text-gray-600' },
  reviewing: { label: '评估中', className: 'bg-secondary-50 text-secondary-600' },
  accepted: { label: '已采纳', className: 'bg-primary-50 text-primary-600' },
  rejected: { label: '已驳回', className: 'bg-dangerLight text-danger' },
  completed: { label: '已完成', className: 'bg-success/10 text-success' },
}

export default function Feedback() {
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | FeedbackType['type']>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | FeedbackType['status']>('all')

  const filtered = useMemo(() => {
    return mockFeedbacks.filter((item) => {
      const matchKeyword =
        !keyword ||
        item.title.toLowerCase().includes(keyword.toLowerCase()) ||
        item.content.toLowerCase().includes(keyword.toLowerCase())
      const matchType = typeFilter === 'all' || item.type === typeFilter
      const matchStatus = statusFilter === 'all' || item.status === statusFilter
      return matchKeyword && matchType && matchStatus
    })
  }, [keyword, typeFilter, statusFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">反馈中心</h1>
          <p className="text-gray-600 mt-2">查看用户反馈与需求，跟进处理进度</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          新建反馈
        </button>
      </div>

      <div className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索标题或内容"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="input pl-11"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'feature', 'bug', 'experience', 'data'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-4 py-2 rounded-lg border text-sm ${
                  typeFilter === type ? 'border-primary-500 text-primary-600' : 'border-gray-200 text-gray-600'
                }`}
              >
                {type === 'all' ? '全部类型' : typeLabels[type]}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'reviewing', 'accepted', 'completed', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg border text-sm ${
                  statusFilter === status ? 'border-secondary-500 text-secondary-600' : 'border-gray-200 text-gray-600'
                }`}
              >
                {status === 'all' ? '全部状态' : statusLabels[status].label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter className="w-4 h-4" />
          共筛选到 {filtered.length} 条反馈
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((item) => (
          <div key={item.id} className="card">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">#{item.id}</p>
                <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-600">
                  {typeLabels[item.type]}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusLabels[item.status].className}`}>
                  {statusLabels[item.status].label}
                </span>
                {item.reward && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600">
                    悬赏 ¥{item.reward}
                  </span>
                )}
              </div>
            </div>

            <p className="text-gray-600 leading-relaxed mt-3">{item.content}</p>

            <div className="flex flex-wrap items-center justify-between text-sm text-gray-500 mt-4">
              <div className="flex gap-4">
                <span>创建：{formatDate(item.createdAt, 'yyyy-MM-dd HH:mm')}</span>
                <span>更新：{formatDate(item.updatedAt, 'yyyy-MM-dd HH:mm')}</span>
              </div>
              <div className="flex gap-3">
                <button className="text-primary-600 hover:text-primary-700">标记完成</button>
                <button className="text-secondary-600 hover:text-secondary-700">回复用户</button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="card text-center py-12 text-gray-500">暂无符合条件的反馈</div>
        )}
      </div>
    </div>
  )
}





