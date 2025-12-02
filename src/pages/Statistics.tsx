import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { TrendingUp, TrendingDown } from 'lucide-react'

import { loadLinks } from '@/utils/links'
import ChartWrapper from '@/components/ChartWrapper'
import { EmptyState } from '@/components/EmptyState'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from '@/components/LazyChart'

const PIE_COLORS = ['#4A6CF7', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']
const RANGE_OPTIONS: Array<'7d' | '30d' | '90d' | 'all'> = ['7d', '30d', '90d', 'all']

export default function Statistics() {
  const links = loadLinks()
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]>('30d')

  const questionnaireStats = useMemo(() => {
    const map: Record<string, { used: number; unused: number }> = {}
    links.forEach(link => {
      if (!map[link.questionnaireType]) {
        map[link.questionnaireType] = { used: 0, unused: 0 }
      }
      if (link.status === 'used') {
        map[link.questionnaireType].used++
      } else if (link.status === 'unused') {
        map[link.questionnaireType].unused++
      }
    })
    return Object.entries(map).map(([type, data]) => ({
      type,
      ...data,
      total: data.used + data.unused,
      usageRate: data.used === 0 ? 0 : data.used / (data.used + data.unused),
    }))
  }, [links])

  const dailyStats = useMemo(() => {
    const result: Array<{ date: string; created: number; used: number; participationRate: number }> = []
    const now = new Date()
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365
    const template: Record<string, { created: number; used: number }> = {}

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      template[date.toISOString().split('T')[0]] = { created: 0, used: 0 }
    }

    links.forEach(link => {
      const createdKey = new Date(link.createdAt).toISOString().split('T')[0]
      if (template[createdKey]) template[createdKey].created++
      if (link.usedAt) {
        const usedKey = new Date(link.usedAt).toISOString().split('T')[0]
        if (template[usedKey]) template[usedKey].used++
      }
    })

    Object.entries(template).forEach(([key, value]) => {
      const total = value.created + value.used
      result.push({
        date: new Date(key).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        created: value.created,
        used: value.used,
        participationRate: total === 0 ? 0 : value.used / total,
      })
    })

    return result
  }, [links, range])

  const trendInfo = useMemo(() => {
    if (dailyStats.length < 14) return { direction: 'stable', change: 0 } as const
    const recent = dailyStats.slice(-7)
    const previous = dailyStats.slice(-14, -7)
    const average = (items: typeof dailyStats) =>
      items.reduce((sum, item) => sum + item.used, 0) / items.length || 0
    const recentAvg = average(recent)
    const previousAvg = average(previous)
    if (recentAvg > previousAvg) {
      return { direction: 'up', change: ((recentAvg - previousAvg) / previousAvg) * 100 } as const
    }
    if (recentAvg < previousAvg) {
      return { direction: 'down', change: previousAvg === 0 ? 0 : ((recentAvg - previousAvg) / previousAvg) * 100 } as const
    }
    return { direction: 'stable', change: 0 } as const
  }, [dailyStats])

  if (links.length === 0) {
    return (
      <EmptyState
        title="暂无统计数据"
        description="生成一些链接后即可查看使用趋势、问卷分布等统计信息。"
        action={
          <RouterLink to="/links/generate" className="btn-primary">
            前往生成
          </RouterLink>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">统计分析</h1>
          <p className="text-gray-600 mt-2">查看问卷使用情况、参与率趋势等核心指标。</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {RANGE_OPTIONS.map(option => (
            <button
              key={option}
              onClick={() => setRange(option)}
              className={`px-4 py-2 rounded-xl border text-sm font-medium ${
                range === option ? 'bg-primary-600 text-white border-primary-600' : 'border-muted text-text'
              }`}
            >
              {option === '7d' ? '最近7天' : option === '30d' ? '最近30天' : option === '90d' ? '最近90天' : '全部'}
            </button>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">使用趋势</p>
          <p className="text-2xl font-semibold flex items-center gap-2 mt-2">
            {trendInfo.direction === 'up' && (
              <>
                <TrendingUp className="w-5 h-5 text-success" /> 上升
              </>
            )}
            {trendInfo.direction === 'down' && (
              <>
                <TrendingDown className="w-5 h-5 text-danger" /> 下降
              </>
            )}
            {trendInfo.direction === 'stable' && '稳定'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            较上期变化 {trendInfo.change > 0 ? '+' : ''}
            {trendInfo.change.toFixed(1)}%
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">问卷类型数</p>
          <p className="text-2xl font-semibold mt-2">{questionnaireStats.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">数据区间</p>
          <p className="text-2xl font-semibold mt-2">
            {range === '7d' ? '7 天' : range === '30d' ? '30 天' : range === '90d' ? '90 天' : '全部'}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">问卷使用统计</h2>
          <ChartWrapper minHeight={320}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={questionnaireStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="used" name="已使用" fill="#4A6CF7" />
                <Bar dataKey="unused" name="未使用" fill="#E2E8F0" />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">使用率分布</h2>
          <ChartWrapper minHeight={320}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={questionnaireStats}
                  dataKey="usageRate"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  label={({ type, usageRate }: { type: string; usageRate: number }) =>
                    `${type} ${(usageRate * 100).toFixed(0)}%`
                  }
                >
                  {questionnaireStats.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number | string) => `${(Number(value) * 100).toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">链接使用趋势</h2>
          <ChartWrapper minHeight={320}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyStats}>
                <defs>
                  <linearGradient id="grad-used" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4A6CF7" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#4A6CF7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="used" stroke="#4A6CF7" fill="url(#grad-used)" name="使用数量" />
                <Area type="monotone" dataKey="created" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.15} name="生成数量" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">参与率统计</h2>
          <ChartWrapper minHeight={320}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value: number | string) => `${(Number(value) * 100).toFixed(0)}%`} />
                <Tooltip formatter={(value: number | string) => `${(Number(value) * 100).toFixed(1)}%`} />
                <Bar dataKey="participationRate" fill="#10B981" name="参与率" />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
      </section>
    </div>
  )
}

