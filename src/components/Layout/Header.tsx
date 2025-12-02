/**
 * 页面头部组件
 * 包含主题切换、用户信息等
 */

import { Bell, Settings, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '@/components/ThemeToggle'

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-700/80 shadow-md shadow-gray-200/30 dark:shadow-gray-900/30 sticky top-0 z-30 transition-all duration-200">
      <div className="container-padding">
        <div className="flex items-center justify-between h-16">
          {/* 移动端菜单按钮 */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 active:scale-95"
            aria-label="打开菜单"
          >
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          
          <div className="flex-1 lg:flex-none" />
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 管理器按钮 */}
            <button
              onClick={() => navigate('/manager')}
              className="relative px-3 sm:px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 active:scale-95"
              title="管理器"
              aria-label="管理器"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">管理器</span>
            </button>

            {/* 主题切换 */}
            <ThemeToggle />

            {/* 通知 */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 active:scale-95"
              title="通知"
              aria-label="通知"
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {/* 可以在这里添加未读数量角标 */}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

