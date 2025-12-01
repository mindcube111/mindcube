// 用户信息
export interface User {
  id: string
  username: string
  email: string
  name: string
  avatar?: string
  role: 'admin' | 'user'
  status?: 'active' | 'pending' | 'disabled'
  createdAt: string
  updatedAt?: string
  remainingQuota: number
  totalQuota?: number
  totalUsedQuota?: number
  totalRecharge?: number
  lastLoginAt?: string
  isDefault?: boolean
  token?: string // 认证 Token（仅前端存储使用）
}

// 链接状态
export type LinkStatus = 'unused' | 'used' | 'expired' | 'disabled'

// 问卷类型
export type BuiltInQuestionnaireType = 'SCL-90' | 'MBTI' | 'Holland'
export type QuestionnaireType = BuiltInQuestionnaireType | (string & {})

// 链接信息
export interface Link {
  id: string
  url: string
  questionnaireType: QuestionnaireType
  status: LinkStatus
  createdAt: string
  usedAt?: string
  expiredAt?: string
  reportId?: string
  createdBy?: string // 创建者用户ID
}

// 套餐类型
export interface Package {
  id: string
  name: string
  quota: number
  price: number
  originalPrice?: number
  description: string
  recommended?: boolean
  unlimited?: boolean
}

// 通知类型
export type NotificationType = 'completed' | 'quota-warning' | 'system-update' | 'promotion'

// 通知信息
export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: string
  linkId?: string
  reportId?: string
  metadata?: Record<string, any>
}

// 仪表盘统计数据
export interface DashboardStats {
  totalLinks: number
  remainingQuota: number
  todayUsedLinks: number
  unusedLinks: number
  participationRate: number
}

// 反馈建议
export interface Feedback {
  id: string
  type: 'bug' | 'feature' | 'experience' | 'data'
  title: string
  content: string
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'completed'
  reward?: number
  createdAt: string
  updatedAt: string
}

// 邀请信息
export interface Invite {
  id: string
  inviteCode: string
  inviteUrl: string
  totalInvited: number
  totalReward: number
  createdAt: string
}

// 报告信息
export interface Report {
  id: string
  linkId: string
  questionnaireType: QuestionnaireType
  totalScore: number
  scores: Record<string, number>
  completedAt: string
  location?: string
}

// 题目选项
export interface QuestionOption {
  value: number | string
  label: string
}

// 题目信息
export interface Question {
  id: string
  number: number
  text: string
  options?: QuestionOption[]
  category?: string // 题目所属维度/类别
  required?: boolean
}

// 问卷题目数据
export interface QuestionnaireData {
  type: QuestionnaireType
  title: string
  description: string
  questions: Question[]
  dimensions?: string[] // 评估维度
}





