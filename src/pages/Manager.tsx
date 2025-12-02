/**
 * 管理器页面
 * 统一的管理功能入口
 */

import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import {
  Users,
  UploadCloud,
  Database,
  FileText,
  Download,
  Settings,
  BarChart3,
  Shield,
  Archive,
  ClipboardList,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface ManagerCard {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  path?: string
  roles?: Array<'admin' | 'user'>
  color: string
  subItems?: Array<{
    title: string
    path: string
    icon: React.ComponentType<{ className?: string }>
  }>
}

const managerCards: ManagerCard[] = [
  {
    title: '用户管理',
    description: '管理用户账号、审核新用户、调整用户额度',
    icon: Users,
    path: '/admin/users',
    roles: ['admin'],
    color: 'bg-blue-500',
  },
  {
    title: '题目管理',
    description: '统一管理题目导入、批量导入、链接题目和主页题目展示',
    icon: Database,
    roles: ['admin'],
    color: 'bg-purple-500',
    subItems: [
      {
        title: '题目导入',
        path: '/admin/questions/import',
        icon: UploadCloud,
      },
      {
        title: '批量导入',
        path: '/links/batch-import',
        icon: UploadCloud,
      },
      {
        title: '链接题目管理',
        path: '/admin/questions/manage',
        icon: Database,
      },
      {
        title: '主页题目管理',
        path: '/admin/questionnaires/manage',
        icon: FileText,
      },
    ],
  },
  {
    title: '数据管理',
    description: '报告、导出、日志和备份管理',
    icon: Archive,
    roles: ['admin'],
    color: 'bg-indigo-500',
    subItems: [
      {
        title: '报告管理',
        path: '/admin/reports',
        icon: FileText,
      },
      {
        title: '导出历史',
        path: '/admin/export-history',
        icon: Download,
      },
      {
        title: '操作日志',
        path: '/admin/audit',
        icon: Shield,
      },
      {
        title: '数据备份',
        path: '/admin/backup',
        icon: Archive,
      },
    ],
  },
  {
    title: '链接管理',
    description: '管理所有生成的测试链接',
    icon: ClipboardList,
    path: '/links/manage',
    color: 'bg-cyan-500',
  },
  {
    title: '数据统计',
    description: '查看详细的数据统计分析',
    icon: BarChart3,
    path: '/statistics',
    color: 'bg-pink-500',
  },
  {
    title: '系统设置',
    description: '系统配置和参数设置',
    icon: Settings,
    path: '/profile',
    color: 'bg-gray-500',
  },
]

export default function Manager() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  // 根据用户角色过滤卡片
  const availableCards = managerCards.filter((card) => {
    if (!card.roles) return true
    return card.roles.includes(user?.role || 'user')
  })

  const toggleCard = (title: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(title)) {
      newExpanded.delete(title)
    } else {
      newExpanded.add(title)
    }
    setExpandedCards(newExpanded)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">管理器</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
          统一的管理功能入口，快速访问各项管理功能
        </p>
      </div>

      {/* 管理功能卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {availableCards.map((card) => {
          const Icon = card.icon
          const isExpanded = expandedCards.has(card.title)
          const hasSubItems = card.subItems && card.subItems.length > 0

          return (
            <div
              key={card.path || card.title}
              className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200"
            >
              {hasSubItems ? (
                <>
                  <button
                    onClick={() => toggleCard(card.title)}
                    className="w-full p-4 sm:p-6 text-left"
                  >
                    {/* 图标背景 */}
                    <div className={`${card.color} w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>

                    {/* 标题和描述 */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                          {card.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {card.description}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </button>

                  {/* 子菜单 */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                      {card.subItems?.map((subItem) => {
                        const SubIcon = subItem.icon
                        return (
                          <button
                            key={subItem.path}
                            onClick={() => navigate(subItem.path)}
                            className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-left"
                          >
                            <SubIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                            <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium">
                              {subItem.title}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => card.path && navigate(card.path)}
                  className="w-full p-4 sm:p-6 text-left"
                >
                  {/* 图标背景 */}
                  <div className={`${card.color} w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>

                  {/* 标题和描述 */}
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {card.description}
                  </p>

                  {/* 悬停效果指示器 */}
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  </div>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* 快速统计 */}
      {user?.role === 'admin' && (
        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">总用户数</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">-</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">总题目数</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">-</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">总报告数</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">-</div>
          </div>
        </div>
      )}
    </div>
  )
}

