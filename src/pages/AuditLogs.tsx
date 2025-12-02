import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Download, RefreshCw, Trash2, User, Mail, Calendar, FileText } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { loadAuditLogs, clearAuditLogs, exportAuditLogs, OperationLog } from '@/utils/audit'
import { formatDate } from '@/utils/formatters'
import { useConfirmDialog } from '@/components/ConfirmDialog'

export default function AuditLogs() {
  const { accounts } = useAuth()
  const navigate = useNavigate()
  const { showConfirm, showAlert, DialogComponent } = useConfirmDialog()

  const [logs, setLogs] = useState<OperationLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<OperationLog[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [targetTypeFilter, setTargetTypeFilter] = useState('')
  const [userIdFilter, setUserIdFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const userMap = useMemo(() => {
    const map = new Map<string, (typeof accounts)[number]>()
    accounts.forEach(account => map.set(account.id, account))
    return map
  }, [accounts])

  const refreshLogs = useCallback(() => {
    const allLogs = loadAuditLogs()
    setLogs(allLogs)

    let filtered = allLogs

    if (searchTerm) {
      filtered = filtered.filter(log => {
        const account = userMap.get(log.userId)
        const email = account?.email ?? ''
        const term = searchTerm.toLowerCase()
        return (
          log.username.toLowerCase().includes(term) ||
          log.action.toLowerCase().includes(term) ||
          log.target.toLowerCase().includes(term) ||
          email.toLowerCase().includes(term) ||
          log.userId.toLowerCase().includes(term)
        )
      })
    }

    if (actionFilter) {
      filtered = filtered.filter(log => log.action === actionFilter)
    }
    if (targetTypeFilter) {
      filtered = filtered.filter(log => log.targetType === targetTypeFilter)
    }
    if (userIdFilter) {
      filtered = filtered.filter(log => log.userId === userIdFilter)
    }
    if (startDate) {
      filtered = filtered.filter(log => log.timestamp >= startDate)
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setDate(end.getDate() + 1)
      filtered = filtered.filter(log => new Date(log.timestamp) < end)
    }

    setFilteredLogs(filtered)
  }, [searchTerm, actionFilter, targetTypeFilter, userIdFilter, startDate, endDate, userMap])

  useEffect(() => {
    refreshLogs()
    const handler = () => refreshLogs()
    window.addEventListener('audit-logs-updated', handler)
    return () => window.removeEventListener('audit-logs-updated', handler)
  }, [refreshLogs])

  const handleClear = async () => {
    const confirmed = await showConfirm('确认清除', '确定要清除所有操作日志吗？此操作无法撤销。', {
      destructive: true,
    })
    if (!confirmed) return

    clearAuditLogs()
    refreshLogs()
    await showAlert('清除成功', '所有操作日志已清除', 'success')
  }

  const handleExport = async () => {
    try {
      const csv = exportAuditLogs(filteredLogs)
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `操作日志_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
      showAlert('导出成功', '操作日志已导出为 CSV 文件', 'success')
    } catch (error) {
      showAlert('导出失败', error instanceof Error ? error.message : '导出过程中出现错误', 'alert')
    }
  }

  const uniqueActions = useMemo(() => Array.from(new Set(logs.map(log => log.action))), [logs])
  const uniqueTargetTypes = useMemo(() => Array.from(new Set(logs.map(log => log.targetType))), [logs])

  return (
    <div className="space-y-6">
      {DialogComponent}

      <header>
        <h1 className="text-3xl font-bold text-gray-900">操作日志</h1>
        <p className="text-gray-600 mt-2">查看系统所有操作记录，支持审计和追踪</p>
      </header>

      <section className="card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="搜索用户名、邮箱、操作、目标..."
              className="input pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select className="input" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
              <option value="">全部操作</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
            <select className="input" value={targetTypeFilter} onChange={e => setTargetTypeFilter(e.target.value)}>
              <option value="">全部类型</option>
              {uniqueTargetTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select className="input" value={userIdFilter} onChange={e => setUserIdFilter(e.target.value)}>
              <option value="">全部用户</option>
              {Array.from(userMap.values()).map(account => (
                <option key={account.id} value={account.id}>
                  {account.username} ({account.email})
                </option>
              ))}
            </select>
            <button className="btn-secondary flex items-center gap-2" onClick={handleExport}>
              <Download className="w-4 h-4" />
              导出
            </button>
            <button className="btn-secondary flex items-center gap-2" onClick={refreshLogs}>
              <RefreshCw className="w-4 h-4" />
              刷新
            </button>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              时间范围：
            </div>
            <input type="date" className="input text-sm py-1.5" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <span className="text-xs text-gray-400">至</span>
            <input type="date" className="input text-sm py-1.5" value={endDate} onChange={e => setEndDate(e.target.value)} />
            {(startDate || endDate) && (
              <button className="text-xs text-primary-600" onClick={() => {
                setStartDate('')
                setEndDate('')
              }}>
                清除
              </button>
            )}
            <span className="text-xs text-gray-500 ml-auto">
              共 <strong>{filteredLogs.length}</strong> 条日志
            </span>
            <button className="text-sm text-danger flex items-center gap-1" onClick={handleClear}>
              <Trash2 className="w-4 h-4" />
              清除所有日志
            </button>
          </div>
        </div>
      </section>

      <section className="card -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-8 rounded-none sm:rounded-2xl">
        <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-8 px-4 sm:px-6 lg:px-8">
          <table className="w-full text-xs sm:text-sm min-w-[600px]">
            <thead>
              <tr className="border-b bg-muted text-gray-600 dark:text-gray-400">
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left">时间</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left">用户</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left">操作</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left hidden md:table-cell">目标</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left hidden lg:table-cell">类型</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left hidden xl:table-cell">详情</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.slice(0, 100).map(log => {
                const account = userMap.get(log.userId)
                return (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                      {formatDate(log.timestamp, 'MM-dd HH:mm')}
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      <div
                        className="cursor-pointer rounded-lg p-1 sm:p-2 -m-1 sm:-m-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => account && navigate(`/admin/users/${account.id}`)}
                        title={account ? `查看 ${account.email}` : '用户不存在'}
                      >
                        <div className="flex items-center gap-1 sm:gap-2 text-gray-900 dark:text-white">
                          <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-xs sm:text-sm truncate">{log.username}</span>
                          {account && (
                            <span className={`px-1 sm:px-1.5 py-0.5 text-xs rounded flex-shrink-0 ${account.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>
                              {account.role === 'admin' ? '管理员' : '用户'}
                            </span>
                          )}
                        </div>
                        {account ? (
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{account.email}</span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">用户ID：{log.userId}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      <span className="px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-700 dark:text-gray-300 hidden md:table-cell text-xs sm:text-sm truncate max-w-[150px]">
                      {log.target}
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell">
                      <span className="px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {log.targetType}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 hidden xl:table-cell">
                      {log.details ? (
                        <button 
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1 p-1 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded text-xs sm:text-sm" 
                          onClick={() => showAlert('操作详情', JSON.stringify(log.details, null, 2), 'info')}
                        >
                          <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">查看</span>
                        </button>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredLogs.length === 0 && <div className="text-center text-gray-500 py-12">暂无操作日志</div>}
        {filteredLogs.length > 100 && <div className="text-center text-sm text-gray-500 mt-4">仅显示最近 100 条日志，共 {filteredLogs.length} 条</div>}
      </section>
    </div>
  )
}







