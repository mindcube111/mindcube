/**
 * API 服务统一导出
 * 方便统一管理和使用
 */

// 基础客户端
export { apiClient, default } from './client'
export type { ApiResponse, ApiError, RequestConfig } from './client'

// 认证相关
export * from './auth'

// 用户管理
export * from './users'

// 题库管理
export * from './questionnaires'

// 问卷配置管理（主页题目管理）
export * from './questionnaireConfig'

// 链接管理
export * from './links'

// Dashboard 统计
export * from './dashboard'

// 通知管理
export * from './notifications'

