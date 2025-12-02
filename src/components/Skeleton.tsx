/**
 * 加载骨架屏组件
 * 在数据加载时显示占位内容
 */

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-lg" />
      ))}
    </div>
  )
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="card">
          <div className="h-4 bg-gray-200 animate-pulse rounded w-1/3 mb-4" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 animate-pulse rounded" />
            <div className="h-4 bg-gray-200 animate-pulse rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 animate-pulse rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 animate-pulse rounded w-1/3" />
              <div className="h-3 bg-gray-200 animate-pulse rounded w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton({
  inline = false,
  height = 256,
}: {
  inline?: boolean
  height?: number
}) {
  const content = (
    <>
      <div className="h-6 bg-gray-200 animate-pulse rounded w-1/4 mb-6" />
      <div className="bg-gray-200/80 animate-pulse rounded-lg" style={{ height }} />
    </>
  )

  if (inline) {
    return <div className="w-full py-2">{content}</div>
  }

  return <div className="card">{content}</div>
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card">
          <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2 mb-2" />
          <div className="h-8 bg-gray-200 animate-pulse rounded w-1/3 mb-2" />
          <div className="h-3 bg-gray-200 animate-pulse rounded w-full" />
        </div>
      ))}
    </div>
  )
}

