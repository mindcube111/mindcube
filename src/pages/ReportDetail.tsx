/**
 * 报告详情页面
 * 展示测评结果的详细分析和可视化
 */

import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Share2 } from 'lucide-react'
import { formatDate } from '@/utils/formatters'
import { exportDashboardToPDF } from '@/utils/export'
import toast from 'react-hot-toast'
import { useConfirmDialog } from '@/components/ConfirmDialog'
import ChartWrapper from '@/components/ChartWrapper'
import { escapeHtml } from '@/utils/xss'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from '@/components/LazyChart'

// 模拟报告数据（实际应从API获取）
const mockReport = {
  id: 'r1',
  linkId: '1',
  questionnaireType: 'SCL-90',
  title: 'SCL-90 心理健康症状自评量表',
  completedAt: '2024-01-15T14:20:00',
  totalScore: 85,
  scores: {
    '躯体化': 12,
    '强迫症状': 18,
    '人际关系敏感': 15,
    '抑郁': 20,
    '焦虑': 10,
    '敌对': 8,
    '恐怖': 6,
    '偏执': 8,
    '精神病性': 10,
  },
  location: '北京市',
  interpretation: '您的测评结果显示，整体心理健康状况良好，但在某些维度上需要注意。',
}

const COLORS = ['#4A6CF7', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899', '#14B8A6', '#F97316']

export default function ReportDetail() {
  useParams<{ id: string }>()
  const navigate = useNavigate()

  // 实际应该从API获取报告数据
  const report = mockReport

  if (!report) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate(-1)} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <div className="card text-center py-12">
          <p className="text-gray-500">报告不存在或已被删除</p>
        </div>
      </div>
    )
  }

  // 准备图表数据
  const dimensionData = Object.entries(report.scores).map(([name, value]) => ({
    name,
    value,
  }))

  const { DialogComponent } = useConfirmDialog()

  const handleExportPDF = () => {
    try {
      // 导出报告数据为PDF
      exportDashboardToPDF(
        {
          totalLinks: 1,
          remainingQuota: 0,
          todayUsedLinks: 1,
          unusedLinks: 0,
          participationRate: 1,
        },
        [
          {
            name: report.questionnaireType,
            链接数: 1,
            使用率: 1,
          },
        ],
        `报告_${report.id}_${report.questionnaireType}`
      )
      toast.success('报告已导出为PDF文件')
    } catch (error) {
      toast.error('导出失败，请重试')
      console.error('Export error:', error)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('报告链接已复制到剪贴板', {
        duration: 2000,
      })
      
      // 如果支持 Web Share API，提供原生分享
      if (navigator.share) {
        try {
          await navigator.share({
            title: report.title,
            text: `查看我的${report.questionnaireType}测评报告`,
            url: window.location.href,
          })
        } catch (err) {
          // 用户取消分享，忽略错误
        }
      }
    } catch (error) {
      toast.error('复制失败，请手动复制链接')
      console.error('Share error:', error)
    }
  }

  return (
    <div className="space-y-6">
      {DialogComponent}
      
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <div className="flex gap-2">
          <button onClick={handleShare} className="btn-secondary flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            分享
          </button>
          <button onClick={handleExportPDF} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出PDF
          </button>
        </div>
      </div>

      {/* 报告标题 */}
      <div className="card bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
        <h1 className="text-3xl font-bold mb-2">{escapeHtml(report.title)}</h1>
        <p className="text-white/80">报告ID: {escapeHtml(report.id)}</p>
        <p className="text-white/80">完成时间: {formatDate(report.completedAt)}</p>
        {report.location && (
          <p className="text-white/80">地点: {escapeHtml(report.location)}</p>
        )}
      </div>

      {/* 总分 */}
      <div className="card text-center">
        <p className="text-sm text-gray-600 mb-2">总得分</p>
        <p className="text-5xl font-bold text-primary-600 mb-4">{report.totalScore}</p>
        <p className="text-gray-700">{escapeHtml(report.interpretation)}</p>
      </div>

      {/* 维度得分图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 柱状图 */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">各维度得分</h2>
          <ChartWrapper minHeight={320}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dimensionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4A6CF7" />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>

        {/* 饼图 */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">维度分布</h2>
          <ChartWrapper minHeight={320}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dimensionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name: string; percent: number }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dimensionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
      </div>

      {/* 详细维度分析 */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">详细维度分析</h2>
        <div className="space-y-4">
          {Object.entries(report.scores).map(([dimension, score]) => {
            const maxScore = 40 // 假设每个维度最高40分
            const percentage = (score / maxScore) * 100
            const level = percentage >= 75 ? '高' : percentage >= 50 ? '中' : '低'
            
            return (
              <div key={dimension} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{escapeHtml(dimension)}</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-primary-600">{score}</span>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      percentage >= 75 ? 'bg-dangerLight text-danger' :
                      percentage >= 50 ? 'bg-warningLight text-warning' :
                      'bg-successLight text-success'
                    }`}>
                      {level}风险
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      percentage >= 75 ? 'bg-danger' :
                      percentage >= 50 ? 'bg-warning' :
                      'bg-success'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  得分: {score}/{maxScore} ({percentage.toFixed(1)}%)
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* 建议和说明 */}
      <div className="card bg-blue-50 border border-blue-200">
        <h2 className="text-xl font-semibold text-blue-900 mb-3">建议</h2>
        <p className="text-blue-800">
          本报告仅供参考，如有需要，建议咨询专业心理健康专家。定期进行心理健康评估有助于了解自身状态。
        </p>
      </div>
    </div>
  )
}

