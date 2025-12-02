/**
 * API 统一类型定义
 * 所有 API 响应和请求的类型定义
 */

/**
 * 通用 API 响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  code?: number
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/**
 * 用户相关类型
 */
export interface User {
  id: string
  username: string
  email: string
  name: string
  avatar?: string
  role: 'admin' | 'user'
  status: 'active' | 'pending' | 'disabled'
  createdAt: string
  updatedAt?: string
  remainingQuota: number
  totalQuota?: number
  totalUsedQuota?: number
  totalRecharge?: number
  lastLoginAt?: string
}

export interface UserListResponse {
  users: User[]
  total: number
  page: number
  pageSize: number
}

/**
 * 订单相关类型
 */
export interface Order {
  id: string
  outTradeNo: string
  amount: number
  amountCents?: number
  packageId?: string
  packageName?: string
  questionnaireType?: string
  userId?: string
  linkId?: string
  status: 'pending' | 'paid' | 'failed'
  createdAt: string
  paidAt?: string
  buyer?: string
}

export interface OrderListResponse {
  orders: Order[]
  total: number
}

/**
 * 链接相关类型
 */
export interface Link {
  id: string
  url: string
  questionnaireType: string
  status: 'unused' | 'used' | 'expired' | 'disabled'
  createdAt: string
  usedAt?: string
  expiredAt?: string
  reportId?: string
  createdBy?: string
}

export interface LinkListResponse {
  links: Link[]
  total: number
  page: number
  pageSize: number
}

/**
 * 通知相关类型
 */
export type NotificationType = 'completed' | 'quota-warning' | 'system-update' | 'promotion'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: string
  reportId?: string
}

export interface NotificationListResponse {
  notifications: Notification[]
  total: number
  unreadCount: number
  page: number
  pageSize: number
}

/**
 * Dashboard 统计类型
 */
export interface DashboardStatsResponse {
  totalLinks: number
  remainingQuota: number
  todayUsedLinks: number
  unusedLinks: number
  participationRate: number
  questionnaireSummary: Array<{
    type: string
    totalLinks: number
    usedLinks: number
    completionRate: number
  }>
}

export interface ChartDataResponse {
  data: Array<{
    name: string
    链接数: number
    使用率: number
  }>
  period: '7d' | '15d' | '30d'
}

/**
 * 问卷相关类型
 */
export interface Questionnaire {
  type: string
  title: string
  description: string
  questions: any[]
  dimensions?: any[]
  questionCount: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export interface QuestionnaireListResponse {
  questionnaires: Questionnaire[]
  total: number
}





