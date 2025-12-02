/**
 * 统一错误处理工具函数
 * 提供统一的错误处理和格式化
 */

export interface ErrorInfo {
  message: string
  code?: string
  details?: Record<string, any>
  timestamp: string
}

export class AppError extends Error {
  code?: string
  details?: Record<string, any>
  statusCode?: number

  constructor(message: string, code?: string, details?: Record<string, any>, statusCode?: number) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
    this.statusCode = statusCode
    Error.captureStackTrace?.(this, AppError)
  }
}

/**
 * 错误类型枚举
 */
export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  AUTH = 'AUTH_ERROR',
  PERMISSION = 'PERMISSION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR',
}

/**
 * 格式化错误信息
 */
export function formatError(error: unknown): ErrorInfo {
  const timestamp = new Date().toISOString()

  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      details: error.details,
      timestamp,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: ErrorType.UNKNOWN,
      timestamp,
    }
  }

  if (typeof error === 'string') {
    return {
      message: error,
      code: ErrorType.UNKNOWN,
      timestamp,
    }
  }

  return {
    message: '发生未知错误',
    code: ErrorType.UNKNOWN,
    timestamp,
  }
}

/**
 * 获取用户友好的错误消息
 */
export function getUserFriendlyMessage(error: unknown): string {
  const errorInfo = formatError(error)

  // 根据错误代码返回友好消息
  switch (errorInfo.code) {
    case ErrorType.NETWORK:
      return '网络连接失败，请检查网络设置后重试'
    case ErrorType.VALIDATION:
      return errorInfo.message || '输入数据验证失败，请检查后重试'
    case ErrorType.AUTH:
      return '身份验证失败，请重新登录'
    case ErrorType.PERMISSION:
      return '您没有权限执行此操作'
    case ErrorType.NOT_FOUND:
      return '请求的资源不存在'
    case ErrorType.SERVER:
      return '服务器错误，请稍后重试'
    default:
      return errorInfo.message || '操作失败，请稍后重试'
  }
}

/**
 * 记录错误（可用于发送到错误追踪服务）
 */
export function logError(error: unknown, context?: Record<string, any>) {
  const errorInfo = formatError(error)
  
  console.error('Error logged:', {
    ...errorInfo,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
  })

  // 可以在这里发送错误到错误追踪服务（如 Sentry）
  // if (window.Sentry) {
  //   window.Sentry.captureException(error, {
  //     extra: context,
  //   })
  // }
}

/**
 * 处理并显示错误
 */
export function handleError(error: unknown, context?: Record<string, any>) {
  logError(error, context)
  return getUserFriendlyMessage(error)
}

