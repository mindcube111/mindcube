import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard,
  Link as LinkIcon,
  ShoppingCart,
  Bell,
  Settings,
  LogOut,
  Users,
  UploadCloud,
  FileText,
  Database,
  BarChart3,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: '仪表盘' },
  { path: '/links/generate', icon: LinkIcon, label: '生成链接' },
  { path: '/links/manage', icon: LinkIcon, label: '链接管理' },
  { path: '/admin/users', icon: Users, label: '用户管理', roles: ['admin'] as Array<'admin' | 'user'> },
  { path: '/statistics', icon: BarChart3, label: '统计分析' },
  { path: '/packages', icon: ShoppingCart, label: '购买套餐' },
  { path: '/notifications', icon: Bell, label: '通知中心' },
  { path: '/admin/questions/import', icon: UploadCloud, label: '题目导入', roles: ['admin'] as Array<'admin' | 'user'> },
  { path: '/links/batch-import', icon: UploadCloud, label: '批量导入', roles: ['admin'] as Array<'admin' | 'user'> },
  { path: '/admin/questions/manage', icon: Database, label: '链接题目管理', roles: ['admin'] as Array<'admin' | 'user'> },
]

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isDataGroupOpen, setIsDataGroupOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="w-64 bg-primary-500 dark:bg-gray-800 text-white shadow-2xl min-h-screen flex flex-col transition-colors">
      <div className="p-6 border-b border-white/20 flex items-center gap-3">
        <img
          src="/logo-cube.jpg"
          alt="MIND CUBE Logo"
          width="40"
          height="40"
          loading="eager"
          className="w-10 h-10 rounded-2xl shadow-lg"
        />
        <div>
          <h1 className="text-2xl font-bold text-white leading-tight">
            <span className="block">MIND CUBE</span>
            <span className="block">心理测评平台</span>
          </h1>
          <p className="text-sm text-white/80 mt-1">专业测评管理系统</p>
        </div>
      </div>
      
      {/* 用户信息 */}
      {user && (
        <div className="p-4 border-b border-white/20 bg-white/10 backdrop-blur">
          <div className="flex items-center gap-3">
            <img
              src={
                user.avatar ||
                'https://api.dicebear.com/7.x/fun-emoji/svg?seed=calm&backgroundColor=fdf2f8&scale=100'
              }
              alt={user.name || user.username}
              width="40"
              height="40"
              loading="lazy"
              className="w-10 h-10 rounded-full object-cover border border-white/40 bg-white"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-white/80 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}
      
      <nav className="flex-1 p-4 overflow-y-auto">
        {navItems
          .filter((item) => {
            if (!item.roles) return true
            if (!user) return false
            return item.roles.includes(user.role)
          })
          .map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all',
                  isActive
                    ? 'bg-white text-primary-600 font-semibold shadow-lg'
                    : 'text-white/80 hover:bg-white/10'
                )
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}

        {/* 数据管理分组，仅管理员可见 */}
        {user?.role === 'admin' && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setIsDataGroupOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-white/90 hover:bg-white/10 transition-colors mb-1"
            >
              <span className="flex items-center gap-3">
                <Database className="w-5 h-5" />
                <span>数据管理</span>
              </span>
              {isDataGroupOpen ? (
                <ChevronUp className="w-4 h-4 text-white/80" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/80" />
              )}
            </button>

            {isDataGroupOpen && (
              <div className="ml-8 mt-1 space-y-1">
                <NavLink
                  to="/admin/reports"
                  onClick={onClose}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-xs',
                      isActive
                        ? 'bg-white text-primary-600 font-semibold shadow-md'
                        : 'text-white/80 hover:bg-white/10'
                    )
                  }
                >
                  <FileText className="w-4 h-4" />
                  <span>报告管理</span>
                </NavLink>
                <NavLink
                  to="/admin/export-history"
                  onClick={onClose}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-xs',
                      isActive
                        ? 'bg-white text-primary-600 font-semibold shadow-md'
                        : 'text-white/80 hover:bg-white/10'
                    )
                  }
                >
                  <Download className="w-4 h-4" />
                  <span>导出历史</span>
                </NavLink>
                <NavLink
                  to="/admin/audit"
                  onClick={onClose}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-xs',
                      isActive
                        ? 'bg-white text-primary-600 font-semibold shadow-md'
                        : 'text-white/80 hover:bg-white/10'
                    )
                  }
                >
                  <FileText className="w-4 h-4" />
                  <span>操作日志</span>
                </NavLink>
                <NavLink
                  to="/admin/backup"
                  onClick={onClose}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-xs',
                      isActive
                        ? 'bg-white text-primary-600 font-semibold shadow-md'
                        : 'text-white/80 hover:bg-white/10'
                    )
                  }
                >
                  <Database className="w-4 h-4" />
                  <span>数据备份</span>
                </NavLink>
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-white/10">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all',
              isActive
                ? 'bg-white text-primary-600 font-semibold shadow-lg'
                : 'text-white/80 hover:bg-white/10'
            )
          }
        >
          <Settings className="w-5 h-5" />
          <span>个人设置</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  )
}
