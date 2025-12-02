/**
 * 应用常量定义
 * 集中管理所有常量，提升代码可维护性
 */

// LocalStorage 键名
export const STORAGE_KEYS = {
  USER: 'user',
  LINKS: 'test_links',
  AUDIT_LOGS: 'audit_logs',
  BACKUPS: 'system_backups',
  CUSTOM_USERS: 'custom_users',
  QUESTION_TYPES: 'question_import_custom_types',
  PUBLISH_STATE: 'question_publish_state',
  IMPORT_HISTORY: 'question_import_history',
  LINK_EXPORT_PRESETS: 'link_export_presets',
  LINK_EXPORT_SCHEDULES: 'link_export_schedules',
} as const

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 10,
} as const

// 最大限制
export const MAX_ITEMS = {
  AUDIT_LOGS: 10000,
  BACKUPS: 50,
  LINKS_PER_REQUEST: 100,
} as const

// 链接状态配置
export const LINK_STATUS = {
  UNUSED: 'unused',
  USED: 'used',
  EXPIRED: 'expired',
  DISABLED: 'disabled',
} as const

export const LINK_STATUS_LABELS = {
  [LINK_STATUS.UNUSED]: '未使用',
  [LINK_STATUS.USED]: '已使用',
  [LINK_STATUS.EXPIRED]: '已过期',
  [LINK_STATUS.DISABLED]: '已禁用',
} as const

// 用户角色
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const

// 用户状态
export const USER_STATUS = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
} as const

// 通知类型
export const NOTIFICATION_TYPES = {
  COMPLETED: 'completed',
  QUOTA_WARNING: 'quota-warning',
  SYSTEM_UPDATE: 'system-update',
  PROMOTION: 'promotion',
} as const

// 时间范围选项
export const TIME_RANGES = {
  DAYS_7: '7d',
  DAYS_15: '15d',
  DAYS_30: '30d',
  ALL: 'all',
} as const

// 路由路径
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  LINKS_GENERATE: '/links/generate',
  LINKS_MANAGE: '/links/manage',
  PACKAGES: '/packages',
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile',
  STATISTICS: '/statistics',
  REPORTS: '/reports/:id',
  ADMIN_USERS: '/admin/users',
  ADMIN_QUESTIONS_IMPORT: '/admin/questions/import',
  ADMIN_AUDIT: '/admin/audit',
  ADMIN_BACKUP: '/admin/backup',
} as const

// 默认值
export const DEFAULTS = {
  QUANTITY: 1,
  QUOTA: 480,
  PAGE_SIZE: 50,
} as const

// API 配置（如果将来使用）
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '',
  TIMEOUT: 30000,
} as const

// ZPAY 支付配置（仅支持支付宝，前端不保存密钥）
export const ZPAY_CONFIG = {
  GATEWAY: 'https://zpayz.cn',
  PID: '2025120114591699',
} as const

// 文件上传配置
export const FILE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['application/json', 'text/plain', 'application/typescript'],
} as const

// 导出文件名模板
export const EXPORT_FILENAME = {
  LINKS: '链接列表',
  DASHBOARD: 'Dashboard统计',
  AUDIT_LOGS: '操作日志',
  BACKUP: '数据备份',
} as const


