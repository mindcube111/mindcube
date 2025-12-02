/**
 * Error Boundary 组件
 * 捕获子组件树中的 JavaScript 错误，显示降级 UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { logger } from '@/utils/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 使用统一的日志系统记录错误
    logger.error('Error caught by ErrorBoundary', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    })
    
    // 记录错误信息
    this.setState({
      error,
      errorInfo,
    })

    // 可以在这里发送错误报告到错误追踪服务（如 Sentry）
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     contexts: {
    //       react: {
    //         componentStack: errorInfo.componentStack,
    //       },
    //     },
    //   })
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorFallbackWrapper
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  onReset: () => void
}

function ErrorFallback({ error, errorInfo, onReset }: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="card max-w-2xl w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-danger/10 rounded-full mb-4">
            <AlertTriangle className="w-10 h-10 text-danger" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">出现错误</h1>
          <p className="text-gray-600">
            应用遇到了一个意外错误，我们已经记录了这个问题
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 mb-2">
            <span className="font-semibold">错误信息：</span>
            {error?.message || '未知错误'}
          </p>
          
          {error && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-primary-600 hover:text-primary-700 mt-2"
            >
              {showDetails ? '隐藏' : '显示'}详细信息
            </button>
          )}

          {showDetails && errorInfo && (
            <div className="mt-4 p-3 bg-gray-900 text-gray-100 rounded text-xs font-mono overflow-auto max-h-60">
              <div className="mb-2">
                <span className="text-red-400">Error:</span> {error?.message}
              </div>
              <div className="text-gray-400">
                <pre className="whitespace-pre-wrap">
                  {errorInfo.componentStack}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onReset}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            刷新页面
          </button>
          <Link
            to="/dashboard"
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            返回首页
          </Link>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>如果问题持续存在，请联系技术支持</p>
        </div>
      </div>
    </div>
  )
}

// 包装器以使用 Link 组件
function ErrorFallbackWrapper(props: ErrorFallbackProps) {
  return <ErrorFallback {...props} />
}

export default ErrorBoundaryClass

