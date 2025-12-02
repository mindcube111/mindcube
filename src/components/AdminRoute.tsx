import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface AdminRouteProps {
  children: React.ReactNode
}

/**
 * 管理员路由保护组件
 * 在 ProtectedRoute 的基础上，额外检查用户是否为管理员
 * 
 * 注意：此组件应在 ProtectedRoute 内部使用，因为它只检查角色，不检查登录状态
 */
export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuth()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    // 如果不是管理员，延迟 2 秒后重定向
    if (!isLoading && user?.role !== 'admin') {
      const timer = setTimeout(() => {
        setShouldRedirect(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [user, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  // 检查是否为管理员
  if (user?.role !== 'admin') {
    if (shouldRedirect) {
      return <Navigate to="/dashboard" replace />
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-4">
            <svg
              className="mx-auto h-16 w-16 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">访问被拒绝</h2>
          <p className="text-gray-600 mb-6">
            您没有权限访问此页面。此页面仅限管理员访问。
          </p>
          <p className="text-sm text-gray-500">2 秒后自动跳转到仪表盘...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

