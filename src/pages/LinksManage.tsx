import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Search, Filter, Copy, Download, RefreshCw, Trash2, CheckSquare, Square, FileText, ChevronUp, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

import { Link, LinkStatus } from '@/types'
import { loadLinks, getLinkStats, batchDeleteLinks, batchUpdateLinkStatus, deleteLink } from '@/utils/links'
import { formatDate } from '@/utils/formatters'
import { useAuth } from '@/contexts/AuthContext'
import { useConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import SearchInput from '@/components/SearchInput'
import Pagination from '@/components/Pagination'

// 统一的状态样式配置（参考 QuestionnaireManage 的风格）
const statusConfig: Record<LinkStatus, { label: string; badge: string }> = {
  unused: { 
    label: '未使用', 
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' 
  },
  used: { 
    label: '已使用', 
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' 
  },
  expired: { 
    label: '已过期', 
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' 
  },
  disabled: { 
    label: '已禁用', 
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' 
  },
}

type SortField = 'createdAt' | 'usedAt' | 'questionnaireType' | 'status'
type SortDirection = 'asc' | 'desc'

const PAGE_SIZE = 12

export default function LinksManage() {
  const { accounts } = useAuth()
  const { showConfirm, DialogComponent } = useConfirmDialog()

  const [links, setLinks] = useState<Link[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<LinkStatus | 'all'>('all')
  const [createdBy, setCreatedBy] = useState('')
  const [page, setPage] = useState(1)
  const [stats, setStats] = useState(() => getLinkStats())
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const refresh = useCallback(() => {
    const loaded = loadLinks()
    setLinks(loaded)
    setStats(getLinkStats())
    setSelected([])
  }, [])

  useEffect(() => {
    refresh()
    const handler = () => refresh()
    window.addEventListener('links-updated', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('links-updated', handler)
      window.removeEventListener('storage', handler)
    }
  }, [refresh])

  const filtered = useMemo(() => {
    let result = links.filter((link) => {
      const matchesSearch =
        searchTerm === '' ||
        link.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.questionnaireType.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || link.status === statusFilter
      const matchesCreator = createdBy === '' || link.createdBy === createdBy
      return matchesSearch && matchesStatus && matchesCreator
    })

    // 排序
    result = [...result].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'createdAt':
          aValue = a.createdAt
          bValue = b.createdAt
          break
        case 'usedAt':
          aValue = a.usedAt || 0
          bValue = b.usedAt || 0
          break
        case 'questionnaireType':
          aValue = a.questionnaireType
          bValue = b.questionnaireType
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [links, searchTerm, statusFilter, createdBy, sortField, sortDirection])

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }, [sortField, sortDirection])

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, statusFilter, createdBy])

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    if (selected.length === paged.length) {
      setSelected([])
    } else {
      setSelected(paged.map((link) => link.id))
    }
  }

  const confirmDelete = async (ids: string[]) => {
    const ok = await showConfirm('删除链接', `确认删除选中的 ${ids.length} 个链接吗？`, {
      confirmText: '删除',
    })
    if (!ok) return
    const deleted = ids.length === 1 ? deleteLink(ids[0]) : batchDeleteLinks(ids)
    if (deleted) {
      toast.success('删除成功')
      refresh()
    } else {
      toast.error('删除失败，请稍后再试')
    }
  }

  const changeStatus = (status: LinkStatus, ids: string[]) => {
    const count = batchUpdateLinkStatus(ids, status)
    if (count > 0) {
      toast.success(`已更新 ${count} 个链接状态`)
      refresh()
    }
  }

  const exportCSV = () => {
    if (filtered.length === 0) {
      toast.error('没有可导出的数据')
      return
    }
    const header = '链接,问卷类型,状态,生成时间,使用时间,报告ID'
    const rows = filtered.map((link) =>
      [
        link.url,
        link.questionnaireType,
        statusConfig[link.status].label,
        formatDate(link.createdAt),
        link.usedAt ? formatDate(link.usedAt) : '-',
        link.reportId ?? '-',
      ].join(','),
    )
    const blob = new Blob([`${header}\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `链接列表_${new Date().toISOString().split('T')[0]}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {DialogComponent}

      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">链接管理</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">管理所有生成的测试链接，查看使用状态和报告详情。</p>
      </header>

      {/* 顶部功能模块卡片：快速搜索 / 状态筛选 / 报告查看 */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">快速搜索</p>
            <p className="text-xs text-gray-500 mt-1">支持按链接、问卷类型等条件快速查找。</p>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-successLight/20 text-success">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">状态筛选</p>
            <p className="text-xs text-gray-500 mt-1">按状态、创建者等条件一键筛选链接。</p>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">报告查看</p>
            <p className="text-xs text-gray-500 mt-1">直接查看测试结果和详细报告。</p>
          </div>
        </div>
      </section>

      {/* 搜索 & 筛选区 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm space-y-3 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center">
          <div className="flex-1 min-w-0">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="搜索链接URL或问卷类型..."
              suggestions={links.slice(0, 5).map((link) => link.questionnaireType)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <label className="input flex items-center gap-2 text-xs sm:text-sm">
              <Filter className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as LinkStatus | 'all')}
                className="bg-transparent flex-1 outline-none text-xs sm:text-sm"
              >
                <option value="all">全部状态</option>
                <option value="unused">未使用</option>
                <option value="used">已使用</option>
                <option value="expired">已过期</option>
                <option value="disabled">已禁用</option>
              </select>
            </label>
            <select value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} className="input text-xs sm:text-sm">
              <option value="">全部创建者</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.username}
                </option>
              ))}
            </select>
            <button onClick={exportCSV} className="btn-secondary flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4">
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">导出 CSV</span>
              <span className="sm:hidden">导出</span>
            </button>
            <button onClick={refresh} className="btn-secondary flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4">
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">刷新</span>
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          共 {filtered.length} 条结果
          {selected.length > 0 && <span className="ml-2 text-primary-600">已选择 {selected.length} 条</span>}
        </p>
      </section>

      {selected.length > 0 && (
        <section className="rounded-2xl border border-primary-200 bg-primary-50 dark:bg-primary-900/20 p-3 sm:p-4 shadow-sm flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="font-medium text-primary-900 dark:text-primary-100 text-sm sm:text-base">批量操作：</span>
          <button className="btn-secondary text-xs sm:text-sm flex items-center gap-1 px-2 sm:px-3" onClick={() => changeStatus('unused', selected)}>
            <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4" /> 
            <span className="hidden sm:inline">设为未使用</span>
            <span className="sm:hidden">未使用</span>
          </button>
          <button className="btn-secondary text-xs sm:text-sm flex items-center gap-1 px-2 sm:px-3" onClick={() => changeStatus('disabled', selected)}>
            <Square className="w-3 h-3 sm:w-4 sm:h-4" /> 
            <span className="hidden sm:inline">禁用</span>
          </button>
          <button
            className="btn-secondary text-xs sm:text-sm flex items-center gap-1 text-danger hover:bg-dangerLight px-2 sm:px-3"
            onClick={() => confirmDelete(selected)}
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" /> 
            <span className="hidden sm:inline">删除</span>
          </button>
          <button className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 px-2 sm:px-3" onClick={() => setSelected([])}>
            取消选择
          </button>
        </section>
      )}

      {/* 链接列表表格 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-2 sm:p-4 shadow-sm overflow-x-auto dark:border-gray-700 dark:bg-gray-900">
        {paged.length === 0 ? (
          <EmptyState
            title="暂无链接"
            description='还没有生成过测试链接，点击"链接生成"即可创建。'
            action={
              <RouterLink className="btn-primary" to="/links/generate">
                去生成
              </RouterLink>
            }
          />
        ) : (
          <table className="w-full text-xs sm:text-sm min-w-[600px]">
            <thead>
              <tr className="border-b bg-muted text-left text-gray-500 dark:text-gray-400">
                <th className="py-2 sm:py-3 px-2 sm:px-3 w-8 sm:w-10">
                  <button onClick={toggleSelectAll} title="全选/取消" className="p-1">
                    {selected.length === paged.length && paged.length > 0 ? (
                      <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 text-primary-600" />
                    ) : (
                      <Square className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="py-2 sm:py-3 px-2 sm:px-3">链接</th>
                <th className="py-2 sm:py-3 px-2 sm:px-3 hidden sm:table-cell">问卷类型</th>
                <th className="py-2 sm:py-3 px-2 sm:px-3">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    状态
                    {sortField === 'status' && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                      )
                    )}
                  </button>
                </th>
                <th className="py-2 sm:py-3 px-2 sm:px-3 hidden md:table-cell">
                  <button
                    onClick={() => handleSort('createdAt')}
                    className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    生成时间
                    {sortField === 'createdAt' && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                      )
                    )}
                  </button>
                </th>
                <th className="py-2 sm:py-3 px-2 sm:px-3 hidden lg:table-cell">
                  <button
                    onClick={() => handleSort('usedAt')}
                    className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    使用时间
                    {sortField === 'usedAt' && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                      )
                    )}
                  </button>
                </th>
                <th className="py-2 sm:py-3 px-2 sm:px-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((link) => (
                <tr key={link.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-2 px-2 sm:px-3">
                    <input 
                      type="checkbox" 
                      checked={selected.includes(link.id)} 
                      onChange={() => toggleSelect(link.id)}
                      className="w-3 h-3 sm:w-4 sm:h-4"
                    />
                  </td>
                  <td className="py-2 px-2 sm:px-3">
                    <code className="text-xs break-all font-mono">{link.url}</code>
                    <div className="sm:hidden text-xs text-gray-500 mt-1">{link.questionnaireType}</div>
                  </td>
                  <td className="py-2 px-2 sm:px-3 hidden sm:table-cell">{link.questionnaireType}</td>
                  <td className="py-2 px-2 sm:px-3">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${statusConfig[link.status].badge}`}>
                      {statusConfig[link.status].label}
                    </span>
                  </td>
                  <td className="py-2 px-2 sm:px-3 text-gray-600 dark:text-gray-400 hidden md:table-cell text-xs sm:text-sm">
                    {formatDate(link.createdAt, 'MM-dd HH:mm')}
                  </td>
                  <td className="py-2 px-2 sm:px-3 text-gray-600 dark:text-gray-400 hidden lg:table-cell text-xs sm:text-sm">
                    {link.usedAt ? formatDate(link.usedAt, 'MM-dd HH:mm') : '-'}
                  </td>
                  <td className="py-2 px-2 sm:px-3">
                    <div className="flex gap-2 sm:gap-3 justify-end text-primary-600">
                      <button onClick={() => navigator.clipboard.writeText(link.url)} title="复制链接" className="p-1 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded">
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() =>
                          link.reportId ? window.open(`/reports/${link.reportId}`, '_blank') : toast('尚无报告')
                        }
                        title="查看报告"
                        className="p-1 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded"
                      >
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button 
                        onClick={() => confirmDelete([link.id])} 
                        title="删除" 
                        className="text-danger p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* 底部统计卡片区 */}
      <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">总链接数</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.total ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">已使用</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.used ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">未使用</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.unused ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">已过期</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.expired ?? 0}</p>
        </div>
      </section>

      {filtered.length > PAGE_SIZE && (
        <Pagination
          currentPage={page}
          pageSize={PAGE_SIZE}
          totalItems={filtered.length}
          totalPages={Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}

