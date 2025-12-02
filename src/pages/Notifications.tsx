import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCircle, AlertTriangle, Info, Gift, X, Eye } from 'lucide-react'
import { Notification } from '@/types'
import { mockNotifications } from '@/data/mockData'
import { formatDate } from '@/utils/formatters'
import { useConfirmDialog } from '@/components/ConfirmDialog'
import { useAuth } from '@/contexts/AuthContext'
import { addAuditLog } from '@/utils/audit'
import { notificationService } from '@/utils/notifications'
import { useApiCache } from '@/hooks/useApiCache'
import { getNotificationList, getUnreadCount } from '@/services/api/notifications'

const notificationIcons = {
  completed: CheckCircle,
  'quota-warning': AlertTriangle,
  'system-update': Info,
  promotion: Gift,
}

const notificationColors = {
  completed: 'bg-successLight text-success border-success/40',
  'quota-warning': 'bg-warningLight text-warning border-warning/40',
  'system-update': 'bg-secondary-50 text-secondary-600 border-secondary-200',
  promotion: 'bg-amber-50 text-amber-600 border-amber-200',
}

export default function Notifications() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const { showConfirm, showAlert, DialogComponent } = useConfirmDialog()
  const previousUnreadRef = useRef(0)

  // 使用缓存 hook 获取通知列表
  const { data: notificationData, mutate: refreshNotifications } = useApiCache({
    key: 'notifications-list',
    fetcher: () => getNotificationList({ page: 1, pageSize: 100 }),
    cacheTime: 60 * 1000, // 1分钟缓存
    revalidateOnFocus: true,
  })

  // 使用缓存 hook 获取未读数量
  const { data: unreadData, mutate: refreshUnreadCount } = useApiCache({
    key: 'notifications-unread-count',
    fetcher: getUnreadCount,
    cacheTime: 30 * 1000, // 30秒缓存
    revalidateOnFocus: true,
  })

  // 更新通知列表
  useEffect(() => {
    if (notificationData?.data?.notifications) {
      setNotifications(notificationData.data.notifications)
    }
  }, [notificationData])

  // 定时刷新（每60秒）
  useEffect(() => {
    const interval = setInterval(() => {
      refreshNotifications(true)
      refreshUnreadCount(true)
    }, 60000)
    return () => clearInterval(interval)
  }, [refreshNotifications, refreshUnreadCount])

  // 请求通知权限
  useEffect(() => {
    notificationService.requestPermission()
  }, [])

  // 监听新通知并显示浏览器通知
  useEffect(() => {
    const unread = notifications.filter(n => !n.read)
    if (unread.length > previousUnreadRef.current) {
      const latest = unread[0]
      notificationService.showNewNotification(latest.title, latest.message)
    }
    previousUnreadRef.current = unread.length
  }, [notifications])

  // 使用缓存的未读数量，如果没有则从通知列表计算
  const unreadCount = unreadData?.data?.count ?? notifications.filter(n => !n.read).length

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    if (user) {
      addAuditLog({
        userId: user.id,
        username: user.name,
        action: '标记所有通知为已读',
        target: 'notifications',
        targetType: 'system',
      })
    }
    await showAlert('操作成功', '所有通知已标记为已读', 'success')
  }

  const handleMarkRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    if (user) {
      addAuditLog({
        userId: user.id,
        username: user.name,
        action: '标记通知为已读',
        target: id,
        targetType: 'system',
      })
    }
  }

  const handleViewReport = (notification: Notification) => {
    if (notification.reportId) {
      // 显示浏览器通知
      notificationService.showNewReport(notification.title, notification.reportId)
      navigate(`/reports/${notification.reportId}`)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(
      '确认删除',
      '确定要删除这条通知吗？',
      { destructive: true }
    )
    if (confirmed) {
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (user) {
        addAuditLog({
          userId: user.id,
          username: user.name,
          action: '删除通知',
          target: id,
          targetType: 'system',
        })
      }
    }
  }

  return (
    <div className="space-y-6">
      {DialogComponent}
      
      <div className="flex items-center justify-between text-text">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">通知中心</h1>
          <p className="text-gray-600 mt-2">查看平台动态和测评完成通知，及时了解系统状态</p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllRead} 
            className="btn-secondary flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            全部已读
          </button>
        )}
      </div>

      {/* 通知类型说明 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-successLight border border-success/30">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <h3 className="font-semibold text-success text-sm">测评完成</h3>
          </div>
          <p className="text-xs text-success/80">用户完成测评时推送</p>
        </div>
        <div className="card bg-warningLight border border-warning/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h3 className="font-semibold text-warning text-sm">额度预警</h3>
          </div>
          <p className="text-xs text-warning/80">额度不足时提醒</p>
        </div>
        <div className="card bg-secondary-50 border border-secondary-200">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5 text-secondary-600" />
            <h3 className="font-semibold text-secondary-700 text-sm">系统更新</h3>
          </div>
          <p className="text-xs text-secondary-500">平台功能更新通知</p>
        </div>
        <div className="card bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-700 text-sm">活动推广</h3>
          </div>
          <p className="text-xs text-amber-600">优惠活动和推广信息</p>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-50 rounded-lg">
              <Bell className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">总通知数</div>
              <div className="text-2xl font-bold">{notifications.length}</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">未读通知</div>
              <div className="text-2xl font-bold text-yellow-600">{unreadCount}</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">已读通知</div>
              <div className="text-2xl font-bold text-green-600">
                {notifications.filter(n => n.read).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 通知列表 */}
      <div className="space-y-3">
        {notifications.map((notification) => {
          const Icon = notificationIcons[notification.type]
          const colorClass = notificationColors[notification.type]

          return (
            <div
              key={notification.id}
              className={`card border-l-4 ${colorClass} ${!notification.read ? 'bg-blue-50/40' : ''} py-3`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 text-base">{notification.title}</h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm mt-0.5">{notification.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{formatDate(notification.createdAt)}</span>
                      {notification.metadata?.location && (
                        <span>📍 {notification.metadata.location}</span>
                      )}
                    </div>
                    {notification.reportId && (
                      <button
                        onClick={() => handleViewReport(notification)}
                        className="mt-2 text-primary-600 hover:text-primary-700 flex items-center gap-1 text-xs"
                      >
                        <Eye className="w-4 h-4" />
                        查看详细报告
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkRead(notification.id)}
                      className="hover:text-gray-600"
                      title="标记为已读"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="hover:text-red-600"
                    title="删除"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {notifications.length === 0 && (
        <div className="card text-center py-12">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">暂无通知</p>
        </div>
      )}
    </div>
  )
}

