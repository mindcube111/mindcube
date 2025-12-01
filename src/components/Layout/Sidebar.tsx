import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
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
  Archive,
  CreditCard,
  ExternalLink,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '@/contexts/AuthContext'

interface NavItem {
  path?: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  roles?: Array<'admin' | 'user'>
  action?: 'openPayment' | 'openPackages' // 特殊操作类型
  subItems?: Array<{
    path: string
    label: string
    icon: React.ComponentType<{ className?: string }>
  }>
}

const navItems: NavItem[] = [
  { path: '/dashboard', icon: LayoutDashboard, label: '仪表盘' },
  { path: '/links/generate', icon: LinkIcon, label: '生成链接' },
  { path: '/links/manage', icon: LinkIcon, label: '链接管理' },
  { path: '/statistics', icon: BarChart3, label: '统计分析' },
  { path: '/packages', icon: ShoppingCart, label: '购买套餐' },
  { path: '/admin/users', icon: Users, label: '用户管理', roles: ['admin'] as Array<'admin' | 'user'> },
  { path: '/notifications', icon: Bell, label: '通知中心' },
  {
    icon: Database,
    label: '题目管理',
    roles: ['admin'] as Array<'admin' | 'user'>,
    subItems: [
      { path: '/admin/questions/import', label: '题目导入', icon: UploadCloud },
      { path: '/links/batch-import', label: '批量导入', icon: UploadCloud },
      { path: '/admin/questions/manage', label: '管理器题目管理', icon: Database },
      { path: '/admin/questionnaires/manage', label: '主页题目管理', icon: FileText },
    ],
  },
  {
    icon: Archive,
    label: '数据管理',
    roles: ['admin'] as Array<'admin' | 'user'>,
    subItems: [
      { path: '/admin/reports', label: '报告管理', icon: FileText },
      { path: '/admin/export-history', label: '导出历史', icon: Download },
      { path: '/admin/audit', label: '操作日志', icon: FileText },
      { path: '/admin/backup', label: '数据备份', icon: Database },
    ],
  },
  {
    icon: CreditCard,
    label: '购买套餐',
    roles: ['admin'] as Array<'admin' | 'user'>,
    action: 'openPackages',
  },
]

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleNavClick = () => {
    // 移动端点击导航项后关闭侧边栏
    if (onClose && window.innerWidth < 1024) {
      onClose()
    }
  }

  const toggleItem = (label: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(label)) {
      newExpanded.delete(label)
    } else {
      newExpanded.add(label)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <div className="w-64 bg-primary-500 dark:bg-gray-800 text-white shadow-2xl h-screen flex flex-col transition-colors overflow-y-auto">
      <div className="p-6 border-b border-white/20 flex items-center gap-3">
        <img
          src="/logo-cube.jpg"
          alt="MIND CUBE Logo"
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
              className="w-10 h-10 rounded-full object-cover border border-white/40 bg-white"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-white/90 truncate">{user.email}</p>
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
          const hasSubItems = item.subItems && item.subItems.length > 0
          const hasAction = item.action === 'openPayment'
          const isExpanded = expandedItems.has(item.label)

          // 处理特殊操作（如打开购买套餐页面）
          if (hasAction) {
            const handleAction = () => {
              if (item.action === 'openPackages') {
                // 在新标签页打开购买套餐页面
                const packagesUrl = `${window.location.origin}/packages`
                window.open(packagesUrl, '_blank')
                handleNavClick()
              } else if (item.action === 'openPayment') {
                // 在新标签页打开支付页面
                const paymentUrl = `${window.location.origin}/payment`
                window.open(paymentUrl, '_blank')
                handleNavClick()
              }
            }

            return (
              <button
                key={item.label}
                onClick={handleAction}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all font-medium text-white hover:bg-white/10 w-full text-left'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate text-base flex-1">{item.label}</span>
                <ExternalLink className="w-4 h-4 flex-shrink-0 opacity-70" />
              </button>
            )
          }

          if (hasSubItems) {
            return (
              <div key={item.label} className="mb-2">
                <button
                  onClick={() => toggleItem(item.label)}
                  className={clsx(
                    'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all text-white hover:bg-white/10 font-medium'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate text-base">{item.label}</span>
                  </div>
                  <div className="flex-shrink-0 bg-white/20 rounded-full p-1.5 hover:bg-white/30 transition-colors">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-white" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white" />
                    )}
                  </div>
                </button>
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.subItems?.map((subItem) => {
                      const SubIcon = subItem.icon
                      return (
                        <NavLink
                          key={subItem.path}
                          to={subItem.path}
                          onClick={handleNavClick}
                          className={({ isActive }) =>
                            clsx(
                              'flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm font-medium',
                              isActive
                                ? 'bg-white/30 text-white shadow-md'
                                : 'text-white hover:bg-white/15'
                            )
                          }
                        >
                          <SubIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{subItem.label}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          return (
            <NavLink
              key={item.path}
              to={item.path!}
              onClick={handleNavClick}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all font-medium',
                  isActive
                    ? 'bg-white text-primary-600 font-semibold shadow-lg'
                    : 'text-white hover:bg-white/10'
                )
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate text-base">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all font-medium',
              isActive
                ? 'bg-white text-primary-600 font-semibold shadow-lg'
                : 'text-white hover:bg-white/10'
            )
          }
        >
          <Settings className="w-5 h-5" />
          <span className="text-base">个人设置</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-colors w-full font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-base">退出登录</span>
        </button>
      </div>
    </div>
  )
}
