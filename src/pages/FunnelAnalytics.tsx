/**
 * 转化漏斗分析页面
 * 展示用户从首页访问到完成测评的转化率
 */

import { useState, useEffect, useMemo } from 'react'
import { Calendar, TrendingDown, Users, Target } from 'lucide-react'
import { analytics, FunnelStep } from '@/utils/analytics'
import ChartWrapper from '@/components/ChartWrapper'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from '@/components/LazyChart'

const STEP_LABELS: Record<FunnelStep, string> = {
  [FunnelStep.HOME_VISIT]: '首页访问',
  [FunnelStep.CARD_SELECT]: '选择卡片',
  [FunnelStep.PAYMENT_PAGE]: '支付页',
  [FunnelStep.PAYMENT_SUCCESS]: '支付成功',
  [FunnelStep.TEST_COMPLETE]: '完成测评',
}

const COLORS = ['#4A6CF7', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']

export default function FunnelAnalytics() {
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [funnelData, setFunnelData] = useState<any>(null)

  useEffect(() => {
    loadFunnelData()
  }, [startDate, endDate])

  const loadFunnelData = () => {
    const data = analytics.getFunnelData(startDate || undefined, endDate || undefined)
    setFunnelData(data)
  }

  // 准备漏斗图数据
  const funnelChartData = useMemo(() => {
    if (!funnelData) return []
    
    return Object.values(FunnelStep).map((step, index) => ({
      name: STEP_LABELS[step],
      value: funnelData.stepCounts[step],
      conversionRate: funnelData.conversionRates[step],
      dropOffRate: funnelData.dropOffRates[step],
      color: COLORS[index % COLORS.length],
    }))
  }, [funnelData])

  // 准备转化率折线图数据
  const conversionChartData = useMemo(() => {
    if (!funnelData) return []
    
    return Object.values(FunnelStep).map((step) => ({
      name: STEP_LABELS[step],
      转化率: funnelData.conversionRates[step],
      流失率: funnelData.dropOffRates[step],
    }))
  }, [funnelData])

  if (!funnelData) {
    return (
      <div className="space-y-6">
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">转化漏斗分析</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
            追踪用户从首页访问到完成测评的完整流程
          </p>
        </div>
        
        {/* 日期筛选 */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={startDate ? startDate.toISOString().split('T')[0] : ''}
            onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <span className="text-gray-500">至</span>
          <input
            type="date"
            value={endDate ? endDate.toISOString().split('T')[0] : ''}
            onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">总访问量</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {funnelData.totalVisits.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">完成测评</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {funnelData.stepCounts[FunnelStep.TEST_COMPLETE].toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">整体转化率</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {funnelData.conversionRates[FunnelStep.TEST_COMPLETE].toFixed(2)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">总会话数</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {funnelData.totalSessions.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 漏斗图 */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">转化漏斗</h2>
        <ChartWrapper minHeight={400}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={funnelChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'value') return [`${value} 人`, '人数']
                  if (name === 'conversionRate') return [`${value.toFixed(2)}%`, '转化率']
                  return [value, name]
                }}
              />
              <Legend />
              <Bar dataKey="value" fill="#4A6CF7" name="人数">
                {funnelChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* 转化率和流失率折线图 */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">转化率趋势</h2>
        <ChartWrapper minHeight={300}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={conversionChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="转化率" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="流失率" 
                stroke="#EF4444" 
                strokeWidth={2}
                dot={{ fill: '#EF4444', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* 详细数据表格 */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">详细数据</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">步骤</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">人数</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">转化率</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">流失率</th>
              </tr>
            </thead>
            <tbody>
              {funnelChartData.map((item, index) => (
                <tr 
                  key={index}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-gray-900 dark:text-white">{item.name}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900 dark:text-white font-medium">
                    {item.value.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className={`font-medium ${
                      item.conversionRate >= 80 ? 'text-green-600 dark:text-green-400' :
                      item.conversionRate >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {item.conversionRate.toFixed(2)}%
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className={`font-medium ${
                      item.dropOffRate <= 10 ? 'text-green-600 dark:text-green-400' :
                      item.dropOffRate <= 30 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {item.dropOffRate.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}











