/**
 * 导出历史记录页面
 * 查看和管理所有数据导出记录
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Download, FileText, Trash2, RefreshCw, Search, Filter, Calendar, ChevronUp, ChevronDown } from 'lucide-react'
import { useConfirmDialog } from '@/components/ConfirmDialog'
import { formatDate } from '@/utils/formatters'
import { 
  loadExportHistory, 
  deleteExportHistory, 
  clearExportHistory,
  ExportHistory 
} from '@/utils/exportHistory'
import { exportToExcel } from '@/utils/export'
import toast from 'react-hot-toast'

type SortField = 'timestamp' | 'username' | 'exportType' | 'format' | 'recordCount'
type SortDirection = 'asc' | 'desc'

const EXPORT_TYPE_LABELS: Record<ExportHistory['exportType'], string> = {
  links: '链接列表',
  logs: '操作日志',
  statistics: '统计数据',
  reports: '报告列表',
  users: '用户列表',
}

const FORMAT_LABELS: Record<ExportHistory['format'], string> = {
  excel: 'Excel',
  csv: 'CSV',
  pdf: 'PDF',
  json: 'JSON',
}

export default function ExportHistoryPage() {
  const [history, setHistory] = useState<ExportHistory[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [formatFilter, setFormatFilter] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('timestamp')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const { showConfirm, showAlert, DialogComponent } = useConfirmDialog()

  // 加载导出历史
  const loadHistory = useCallback(() => {
    const allHistory = loadExportHistory()
    setHistory(allHistory)
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // 筛选和排序历史记录
  const filteredHistory = useMemo(() => {
    let result = history.filter(item => {
      const matchesSearch = !searchTerm ||
        item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        EXPORT_TYPE_LABELS[item.exportType].toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = !typeFilter || item.exportType === typeFilter
      const matchesFormat = !formatFilter || item.format === formatFilter

      const itemDate = new Date(item.timestamp).getTime()
      const matchesStartDate = !startDate || itemDate >= new Date(startDate).setHours(0, 0, 0, 0)
      const matchesEndDate = !endDate || itemDate <= new Date(endDate).setHours(23, 59, 59, 999)

      return matchesSearch && matchesType && matchesFormat && matchesStartDate && matchesEndDate
    })

    // 排序
    result = [...result].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime()
          bValue = new Date(b.timestamp).getTime()
          break
        case 'username':
          aValue = a.username
          bValue = b.username
          break
        case 'exportType':
          aValue = a.exportType
          bValue = b.exportType
          break
        case 'format':
          aValue = a.format
          bValue = b.format
          break
        case 'recordCount':
          aValue = a.recordCount
          bValue = b.recordCount
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [history, searchTerm, typeFilter, formatFilter, startDate, endDate, sortField, sortDirection])

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }, [sortField, sortDirection])

  // 统计信息
  const stats = useMemo(() => {
    return {
      total: history.length,
      byType: history.reduce((acc, item) => {
        acc[item.exportType] = (acc[item.exportType] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      totalRecords: history.reduce((sum, item) => sum + item.recordCount, 0),
    }
  }, [history])

  const handleDelete = useCallback(async (historyId: string) => {
    const confirmed = await showConfirm(
      '确认删除',
      '确定要删除这条导出记录吗？',
      { destructive: true }
    )

    if (confirmed) {
      const success = deleteExportHistory(historyId)
      if (success) {
        loadHistory()
        toast.success('删除成功')
      } else {
        toast.error('删除失败')
      }
    }
  }, [showConfirm, loadHistory])

  const handleClearAll = useCallback(async () => {
    const confirmed = await showConfirm(
      '确认清空',
      '确定要清空所有导出历史记录吗？此操作无法撤销。',
      { destructive: true }
    )

    if (confirmed) {
      clearExportHistory()
      loadHistory()
      toast.success('已清空所有导出历史')
    }
  }, [showConfirm, loadHistory])

  const handleExportHistory = useCallback(() => {
    if (filteredHistory.length === 0) {
      showAlert('提示', '没有可导出的记录', 'warning')
      return
    }

    const data = filteredHistory.map(item => ({
      '导出时间': formatDate(item.timestamp),
      '导出者': item.username,
      '导出类型': EXPORT_TYPE_LABELS[item.exportType],
      '文件格式': FORMAT_LABELS[item.format],
      '文件名': item.filename,
      '记录数': item.recordCount,
    }))

    try {
      const filename = `导出历史_${new Date().toISOString().split('T')[0]}`
      exportToExcel(data, filename)
      toast.success('导出历史已导出为Excel文件')
    } catch (error) {
      toast.error('导出失败，请重试')
      console.error('导出错误:', error)
    }
  }, [filteredHistory, showAlert])

  // 获取所有导出类型
  const exportTypes = useMemo(() => {
    return Array.from(new Set(history.map(item => item.exportType)))
  }, [history])

  return (
    <div className="space-y-6">
      {DialogComponent}

      <div>
        <h1 className="text-3xl font-bold text-gray-900">导出历史记录</h1>
        <p className="text-gray-600 mt-2">查看和管理所有数据导出操作的历史记录</p>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <Download className="w-5 h-5 text-primary-600" />
            <p className="text-sm text-gray-600">总导出次数</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-gray-600">总记录数</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.totalRecords.toLocaleString()}</p>
        </div>
        <div className="card col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <Filter className="w-5 h-5 text-green-600" />
            <p className="text-sm text-gray-600">导出类型分布</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {exportTypes.slice(0, 4).map(type => (
              <span key={type} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                {EXPORT_TYPE_LABELS[type]}: {stats.byType[type] || 0}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索文件名、导出者..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input"
            >
              <option value="">全部类型</option>
              {exportTypes.map(type => (
                <option key={type} value={type}>{EXPORT_TYPE_LABELS[type]}</option>
              ))}
            </select>
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="input"
            >
              <option value="">全部格式</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
              <option value="json">JSON</option>
            </select>
          </div>
        </div>

        {/* 时间范围筛选 */}
        <div className="flex items-center gap-3 pt-3 border-t">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500">时间范围：</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input text-sm py-1.5"
            max={endDate || new Date().toISOString().split('T')[0]}
          />
          <span className="text-xs text-gray-400">至</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input text-sm py-1.5"
            min={startDate || undefined}
            max={new Date().toISOString().split('T')[0]}
          />
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              清除
            </button>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 justify-end mt-4 pt-4 border-t">
          <button
            onClick={loadHistory}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button
            onClick={handleExportHistory}
            className="btn-primary flex items-center gap-2"
            disabled={filteredHistory.length === 0}
          >
            <Download className="w-4 h-4" />
            导出历史
          </button>
          <button
            onClick={handleClearAll}
            className="btn-danger flex items-center gap-2"
            disabled={history.length === 0}
          >
            <Trash2 className="w-4 h-4" />
            清空所有
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          共找到 <span className="font-semibold text-gray-700">{filteredHistory.length}</span> 条记录
        </p>
      </div>

      {/* 历史记录列表 */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  <button
                    onClick={() => handleSort('timestamp')}
                    className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                  >
                    导出时间
                    {sortField === 'timestamp' && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  <button
                    onClick={() => handleSort('username')}
                    className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                  >
                    导出者
                    {sortField === 'username' && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  <button
                    onClick={() => handleSort('exportType')}
                    className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                  >
                    导出类型
                    {sortField === 'exportType' && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  <button
                    onClick={() => handleSort('format')}
                    className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                  >
                    文件格式
                    {sortField === 'format' && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">文件名</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  <button
                    onClick={() => handleSort('recordCount')}
                    className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                  >
                    记录数
                    {sortField === 'recordCount' && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {formatDate(item.timestamp)}
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {item.username}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                      {EXPORT_TYPE_LABELS[item.exportType]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                      {FORMAT_LABELS[item.format]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700 truncate max-w-xs" title={item.filename}>
                    {item.filename}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {item.recordCount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-danger hover:text-dangerLight"
                      title="删除记录"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredHistory.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              暂无导出历史记录
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


