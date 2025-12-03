/**
 * 统一日志管理工具
 * 根据环境变量控制日志输出，生产环境可发送到日志服务
 */

const isDev = import.meta.env.DEV
const isProd = import.meta.env.PROD

interface LogContext {
  [key: string]: any
}

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * 日志接口
 */
interface LogEntry {
  level: LogLevel
  message: string
  context?: LogContext
  timestamp: string
  url?: string
  userAgent?: string
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 100 // 内存中最多保留的日志数量

  /**
   * 记录日志
   */
  private log(level: LogLevel, message: string, context?: LogContext) {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
    }

    // 开发环境输出到控制台
    if (isDev) {
      const consoleMethod = {
        [LogLevel.DEBUG]: console.debug,
        [LogLevel.INFO]: console.info,
        [LogLevel.WARN]: console.warn,
        [LogLevel.ERROR]: console.error,
      }[level]

      consoleMethod(`[${level.toUpperCase()}]`, message, context || '')
    }

    // 生产环境只记录错误
    if (isProd && level === LogLevel.ERROR) {
      this.logs.push(entry)
      if (this.logs.length > this.maxLogs) {
        this.logs.shift()
      }

      // 可以在这里发送到错误追踪服务
      // this.sendToErrorService(entry)
    }

    // 开发环境也保存到内存（用于调试）
    if (isDev) {
      this.logs.push(entry)
      if (this.logs.length > this.maxLogs) {
        this.logs.shift()
      }
    }
  }

  /**
   * Debug 日志（仅开发环境）
   */
  debug(message: string, context?: LogContext) {
    if (isDev) {
      this.log(LogLevel.DEBUG, message, context)
    }
  }

  /**
   * Info 日志（仅开发环境）
   */
  info(message: string, context?: LogContext) {
    if (isDev) {
      this.log(LogLevel.INFO, message, context)
    }
  }

  /**
   * Warning 日志
   */
  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context)
  }

  /**
   * Error 日志（所有环境）
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext: LogContext = {
      ...context,
      error: error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error,
    }
    this.log(LogLevel.ERROR, message, errorContext)
  }

  /**
   * 获取所有日志（用于调试）
   */
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  /**
   * 清空日志
   */
  clear() {
    this.logs = []
  }

  /**
   * 导出日志（用于调试或发送到服务器）
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

// 导出单例
export const logger = new Logger()

// 兼容 console 的 API（可选，用于逐步迁移）
export const consoleLogger = {
  log: (message: string, ...args: any[]) => logger.debug(message, { args }),
  info: (message: string, ...args: any[]) => logger.info(message, { args }),
  warn: (message: string, ...args: any[]) => logger.warn(message, { args }),
  error: (message: string, ...args: any[]) => logger.error(message, args[0], { args: args.slice(1) }),
}











