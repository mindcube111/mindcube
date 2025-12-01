import { useEffect, useMemo } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Users, Trash2, ShieldCheck, UserMinus, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, formatNumber, formatCurrency } from '@/utils/formatters'
import { useConfirmDialog } from '@/components/ConfirmDialog'
import { useInputDialog } from '@/components/InputDialog'

const statusStyles: Record<'active' | 'disabled' | 'pending', string> = {
  active: 'bg-successLight text-success border border-success/30',
  disabled: 'bg-dangerLight text-danger border-danger/30',
  pending: 'bg-warningLight text-warning border border-warning/30',
}

export default function UserManagement() {
  const navigate = useNavigate()
  const {
    user,
    accounts,
    accountsLoading,
    fetchAccounts,
    clearCustomUsers,
    updateUserStatus,
    updateUserQuota,
  } = useAuth()
  const { showConfirm, showAlert, DialogComponent } = useConfirmDialog()
  const { showInput, InputDialogComponent } = useInputDialog()

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const customAccounts = useMemo(() => accounts.filter((acc) => acc.role !== 'admin'), [accounts])
  const adminAccounts = useMemo(() => accounts.filter((acc) => acc.role === 'admin'), [accounts])

  const handleToggleStatus = async (accountId: string, currentStatus: 'active' | 'disabled') => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active'
    const confirmed = await showConfirm(
      '确认操作',
      `确定要将用户状态更新为"${nextStatus === 'active' ? '启用' : '禁用'}"吗？`
    )
    if (!confirmed) {
      return
    }
    const result = await updateUserStatus(accountId, nextStatus)
    await showAlert(
      result.success ? '操作成功' : '操作失败',
      result.message || (result.success ? '用户状态已更新' : '更新失败，请稍后重试'),
      result.success ? 'success' : 'alert'
    )
  }

  const handleClear = async () => {
    if (customAccounts.length === 0) {
      await showAlert('提示', '当前没有注册用户可清理', 'info')
      return
    }
    const confirmed = await showConfirm(
      '确认清理',
      '确定要清理所有注册用户数据吗？此操作无法恢复。',
      { destructive: true }
    )
    if (!confirmed) {
      return
    }
    const result = await clearCustomUsers()
    await showAlert(
      result.success ? '清理成功' : '清理失败',
      result.message || (result.success ? '已清空注册用户数据' : '操作失败，请稍后重试'),
      result.success ? 'success' : 'alert'
    )
    if (result.success) {
      fetchAccounts()
    }
  }

  const handleAddQuota = async (accountId: string, accountUsername: string, accountRole: 'admin' | 'user') => {
    if (accountRole === 'admin') {
      await showAlert('提示', '管理员账号额度为无限，无需添加额度', 'info')
      return
    }

    const input = await showInput('添加额度', {
      message: `为用户 "${accountUsername}" 添加额度`,
      placeholder: '请输入要添加的额度数量',
      type: 'number',
      defaultValue: '',
      confirmText: '确认添加',
      cancelText: '取消',
      validate: (value) => {
        const num = Number(value)
        if (!value.trim()) {
          return '请输入额度数量'
        }
        if (Number.isNaN(num) || num <= 0) {
          return '请输入大于0的数字'
        }
        if (!Number.isInteger(num)) {
          return '请输入整数'
        }
        return null
      },
    })

    if (input !== null && input !== '') {
      const amount = parseInt(input, 10)
      const result = await updateUserQuota(accountId, amount)
      await showAlert(
        result.success ? '操作成功' : '操作失败',
        result.success
          ? `已为用户 "${accountUsername}" 添加 ${formatNumber(amount)} 条额度`
          : result.message || '额度添加失败，请稍后再试',
        result.success ? 'success' : 'alert'
      )
      if (result.success) {
        fetchAccounts()
      }
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {DialogComponent}
      {InputDialogComponent}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text">用户管理</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">管理员可查看所有账号的状态并管理注册用户数据</p>
        </div>
        <button onClick={handleClear} className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center">
          <Trash2 className="w-4 h-4" />
          <span className="text-sm sm:text-base">清理注册用户数据</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">账号总数</p>
          <p className="text-3xl font-bold text-text mt-2">{accounts.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">注册用户</p>
          <p className="text-3xl font-bold text-secondary-600 mt-2">{customAccounts.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">管理员账号</p>
          <p className="text-3xl font-bold text-gray-600 mt-2">{adminAccounts.length}</p>
        </div>
      </div>

      <div className="card -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-8 rounded-none sm:rounded-2xl">
        <div className="flex items-center justify-between mb-4 px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg sm:text-xl font-semibold text-text flex items-center gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>用户列表</span>
          </h2>
        </div>
        
        {/* 移动端卡片视图 */}
        <div className="block md:hidden px-4 space-y-3">
          {accountsLoading && <p className="text-center text-sm text-gray-500">加载中...</p>}
          {!accountsLoading && accounts.length === 0 && (
            <p className="text-center text-sm text-gray-500">暂无用户数据</p>
          )}
          {!accountsLoading && accounts.map((account) => (
            <div
              key={account.id}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
              onClick={() => navigate(`/admin/users/${account.id}`)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text text-sm truncate">{account.username}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">{account.email}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[account.status || 'active']}`}>
                  {account.status === 'active' ? '正常' : account.status === 'pending' ? '待审核' : '已禁用'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">角色：</span>
                  <span className="text-text ml-1">{account.role === 'admin' ? '管理员' : '普通用户'}</span>
                </div>
                <div>
                  <span className="text-gray-500">剩余额度：</span>
                  <span className="text-text ml-1">
                    {account.role === 'admin' ? (
                      <span className="text-primary-600 font-semibold">无限</span>
                    ) : (
                      `${formatNumber(account.remainingQuota ?? 0)} 条`
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddQuota(account.id, account.username, account.role)
                  }}
                  className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={account.role === 'admin'}
                >
                  <Plus className="w-3 h-3" />
                  添加额度
                </button>
                {account.role !== 'admin' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleStatus(account.id, account.status === 'active' ? 'active' : 'disabled')
                    }}
                    className={`flex items-center gap-1 text-xs ${
                      account.status === 'active'
                        ? 'text-danger hover:text-danger/80'
                        : 'text-success hover:text-success/80'
                    }`}
                  >
                    {account.status === 'active' ? (
                      <>
                        <UserMinus className="w-3 h-3" />
                        禁用
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3 h-3" />
                        启用
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 桌面端表格视图 */}
        <div className="hidden md:block overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-8 px-4 sm:px-6 lg:px-8">
          {accountsLoading ? (
            <div className="py-10 text-center text-gray-500">用户数据加载中...</div>
          ) : accounts.length === 0 ? (
            <div className="py-10 text-center text-gray-500">暂无用户数据</div>
          ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted text-text text-xs sm:text-sm">
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap">用户名</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap hidden md:table-cell">邮箱</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap">角色</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap hidden lg:table-cell">类型</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap hidden xl:table-cell">累计总额度</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap hidden xl:table-cell">累计使用额度</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap">剩余额度</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap">状态</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap hidden lg:table-cell">创建时间</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap hidden xl:table-cell">最近一次在线日期</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap hidden xl:table-cell">累计充值金额</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr
                  key={account.id}
                  className="border-b hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/admin/users/${account.id}`)}
                >
                  <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium text-text text-xs sm:text-sm">{account.username}</td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm hidden md:table-cell">{account.email}</td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">{account.role === 'admin' ? '管理员' : '普通用户'}</td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm hidden lg:table-cell">{account.role === 'admin' ? '系统内置' : '注册用户'}</td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-700 text-xs sm:text-sm hidden xl:table-cell">
                    {account.role === 'admin' ? (
                      <span className="text-primary-600 font-semibold">无限</span>
                    ) : (
                      `${formatNumber(account.totalQuota || account.remainingQuota || 0)} 条`
                    )}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-700 text-xs sm:text-sm hidden xl:table-cell">
                    {account.role === 'admin' ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      `${formatNumber(account.totalUsedQuota || 0)} 条`
                    )}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-700 text-xs sm:text-sm">
                    {account.role === 'admin' ? (
                      <span className="text-primary-600 font-semibold">无限</span>
                    ) : (
                      `${formatNumber(account.remainingQuota ?? 0)} 条`
                    )}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[account.status || 'active']}`}>
                      {account.status === 'active' ? '正常' : account.status === 'pending' ? '待审核' : '已禁用'}
                    </span>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-500 text-xs sm:text-sm hidden lg:table-cell">
                    {formatDate(account.createdAt, 'yyyy-MM-dd')}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-500 text-xs sm:text-sm hidden xl:table-cell">
                    {account.lastLoginAt ? formatDate(account.lastLoginAt, 'yyyy-MM-dd HH:mm') : '—'}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-700 font-medium text-xs sm:text-sm hidden xl:table-cell">
                    {formatCurrency(account.totalRecharge || 0)}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddQuota(account.id, account.username, account.role)
                        }}
                        className="flex items-center gap-1 text-xs sm:text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={account.role === 'admin' ? '管理员账号额度为无限' : '添加额度'}
                        disabled={account.role === 'admin'}
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">添加额度</span>
                        <span className="sm:hidden">添加</span>
                      </button>
                      {account.role !== 'admin' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleStatus(
                              account.id,
                              account.status === 'active' ? 'active' : 'disabled'
                            )
                          }}
                          className={`flex items-center gap-1 text-xs sm:text-sm ${
                            account.status === 'active'
                              ? 'text-danger hover:text-danger/80'
                              : 'text-success hover:text-success/80'
                          }`}
                        >
                          {account.status === 'active' ? (
                            <>
                              <UserMinus className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">禁用</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">启用</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </div>
  )
}






