import { ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import ErrorBoundary from './ErrorBoundary'

interface RouteBoundaryProps {
  children: ReactNode
  title?: string
}

function RouteFallback({ title }: { title: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dangerLight/70">
          <AlertTriangle className="w-8 h-8 text-danger" />
        </div>
        <div>
          <p className="text-2xl font-semibold text-gray-900">{title}加载失败</p>
          <p className="text-gray-600 mt-1">我们已经记录了该异常，请稍后再试。</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => window.location.reload()}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          刷新页面
        </button>
        <Link to="/dashboard" className="btn-secondary flex items-center gap-2">
          <Home className="w-4 h-4" />
          返回仪表盘
        </Link>
      </div>
    </div>
  )
}

export default function RouteBoundary({ children, title = '页面' }: RouteBoundaryProps) {
  return (
    <ErrorBoundary fallback={<RouteFallback title={title} />}>
      {children}
    </ErrorBoundary>
  )
}





