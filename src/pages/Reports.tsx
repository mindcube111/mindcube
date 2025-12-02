import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Download, RefreshCw, Trash2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

import { loadReports, deleteReport } from '@/utils/reports'
import { loadLinks } from '@/utils/links'
import { Report } from '@/types'
import { formatDate } from '@/utils/formatters'
import { useConfirmDialog } from '@/components/ConfirmDialog'
import { useAuth } from '@/contexts/AuthContext'
import { exportToExcel } from '@/utils/export'
import { saveExportHistory } from '@/utils/exportHistory'

interface ReportWithLink extends Report {
  linkId: string
  createdAt: string
  usedAt?: string
}

export default function Reports() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showConfirm, showAlert, DialogComponent } = useConfirmDialog()

  const [reports, setReports] = useState<ReportWithLink[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  const loadReportsData = useCallback(() => {
    const allReports = loadReports()
    const links = loadLinks()
    const enriched = allReports.map(report => {
      const link = links.find(l => l.reportId === report.id || l.id === report.linkId)
      return {
        ...report,
        linkId: report.linkId || link?.id || '',
        createdAt: link?.createdAt || report.completedAt,
        usedAt: link?.usedAt,
      }
    })
    setReports(enriched.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()))
  }, [])

  useEffect(() => {
    loadReportsData()
  }, [loadReportsData])

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch =
        !searchTerm ||
        report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.questionnaireType.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = !typeFilter || report.questionnaireType === typeFilter
      const matchesDate = !dateFilter || report.completedAt.startsWith(dateFilter)
      return matchesSearch && matchesType && matchesDate
    })
  }, [reports, searchTerm, typeFilter, dateFilter])

  const questionnaireTypes = useMemo(() => Array.from(new Set(reports.map(r => r.questionnaireType))), [reports])
  const totalCount = reports.length

  const isAllSelected = filteredReports.length > 0 && selected.length === filteredReports.length
  const isIndeterminate = selected.length > 0 && selected.length < filteredReports.length

  const toggleSelectAll = (checked: boolean) => {
    setSelected(checked ? filteredReports.map(r => r.id) : [])
  }

  const toggleSelect = (id: string, checked: boolean) => {
    setSelected(prev => (checked ? [...prev, id] : prev.filter(item => item !== id)))
  }

  const handleViewReport = (reportId: string) => {
    navigate(`/reports/${reportId}`)
  }

  const handleExportSelected = async () => {
    if (selected.length === 0) {
      await showAlert('提示', '请先选择要导出的报告', 'warning')
      return
    }
    if (!user) {
      await showAlert('错误', '用户信息不存在', 'alert')
      return
    }

    const selectedReports = filteredReports.filter(report => selected.includes(report.id))
    const data = selectedReports.map(report => ({
      报告ID: report.id,
      链接ID: report.linkId,
      问卷类型: report.questionnaireType,
      总分: report.totalScore,
      完成时间: formatDate(report.completedAt),
      地点: report.location || 'N/A',
    }))

    try {
      const filename = `报告导出_${new Date().toISOString().split('T')[0]}`
      exportToExcel(data, filename)
      saveExportHistory({
        userId: user.id,
        username: user.name || user.username,
        exportType: 'reports',
        format: 'excel',
        filename: `${filename}.xlsx`,
        recordCount: selectedReports.length,
        details: {
          filters: { searchTerm, typeFilter, dateFilter },
        },
      })
      toast.success(`已导出 ${selectedReports.length} 个报告`)
      setSelected([])
    } catch (error) {
      console.error(error)
      toast.error('导出失败，请重试')
    }
  }

  const handleDelete = async (reportId: string) => {
    const confirmed = await showConfirm('确认删除', '删除后无法恢复，确定要继续吗？', { destructive: true })
    if (!confirmed) return
    if (deleteReport(reportId)) {
      toast.success('报告已删除')
      loadReportsData()
      setSelected(prev => prev.filter(id => id !== reportId))
    } else {
      toast.error('删除失败')
    }
  }

  const handleBatchDelete = async () => {
    if (selected.length === 0) {
      await showAlert('提示', '请选择要删除的报告', 'warning')
      return
    }
    const confirmed = await showConfirm('确认删除', `确定要删除选中的 ${selected.length} 个报告吗？`, {
      destructive: true,
    })
    if (!confirmed) return

    let successCount = 0
    selected.forEach(id => {
      if (deleteReport(id)) successCount++
    })
    loadReportsData()
    setSelected([])
    toast.success(`已删除 ${successCount} 个报告`)
  }

  return (
    <div className="space-y-6">
      {DialogComponent}

      <header>
        <h1 className="text-3xl font-bold text-gray-900">报告管理</h1>
        <p className="text-gray-600 mt-2">集中管理所有测评报告，支持筛选、批量导出</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">报告总数</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{totalCount}</p>
        </div>
        {questionnaireTypes.slice(0, 3).map(type => (
          <div key={type} className="card">
            <p className="text-sm text-gray-500">{type}</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {reports.filter(report => report.questionnaireType === type).length}
            </p>
          </div>
        ))}
      </section>

      <section className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              className="input pl-10"
              placeholder="搜索报告ID或问卷类型..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <select className="input" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">全部类型</option>
              {questionnaireTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="input"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
            <button className="btn-secondary flex items-center gap-2" onClick={loadReportsData}>
              <RefreshCw className="w-4 h-4" />
              刷新
            </button>
            {selected.length > 0 && (
              <>
                <button className="btn-primary flex items-center gap-2" onClick={handleExportSelected}>
                  <Download className="w-4 h-4" />
                  导出选中 ({selected.length})
                </button>
                <button className="btn-danger flex items-center gap-2" onClick={handleBatchDelete}>
                  <Trash2 className="w-4 h-4" />
                  删除选中 ({selected.length})
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="card -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-8 rounded-none sm:rounded-2xl">
        <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-8 px-4 sm:px-6 lg:px-8">
          <table className="w-full text-xs sm:text-sm min-w-[600px]">
            <thead>
              <tr className="border-b bg-muted text-gray-500 dark:text-gray-400">
                <th className="py-2 sm:py-3 px-2 sm:px-4 w-8 sm:w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={input => {
                      if (input) input.indeterminate = isIndeterminate
                    }}
                    onChange={e => toggleSelectAll(e.target.checked)}
                    className="w-3 h-3 sm:w-4 sm:h-4"
                  />
                </th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left">报告ID</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left hidden sm:table-cell">问卷类型</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left">总分</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left hidden md:table-cell">完成时间</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left hidden lg:table-cell">地点</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map(report => {
                const checked = selected.includes(report.id)
                return (
                  <tr key={report.id} className={`border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 ${checked ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      <input 
                        type="checkbox" 
                        checked={checked} 
                        onChange={e => toggleSelect(report.id, e.target.checked)}
                        className="w-3 h-3 sm:w-4 sm:h-4"
                      />
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 font-mono text-xs text-gray-900 dark:text-white">{report.id}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-700 dark:text-gray-300 hidden sm:table-cell">{report.questionnaireType}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-700 dark:text-gray-300 font-semibold">{report.totalScore}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-600 dark:text-gray-400 hidden md:table-cell text-xs sm:text-sm">
                      {formatDate(report.completedAt, 'MM-dd HH:mm')}
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-600 dark:text-gray-400 hidden lg:table-cell">{report.location || '-'}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      <div className="flex gap-2">
                        <button 
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 p-1 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded" 
                          onClick={() => handleViewReport(report.id)}
                          title="查看报告"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button 
                          className="text-danger hover:text-dangerLight p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" 
                          onClick={() => handleDelete(report.id)}
                          title="删除报告"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredReports.length === 0 && <div className="text-center text-gray-500 py-12">暂无报告数据</div>}
      </section>
    </div>
  )
}







