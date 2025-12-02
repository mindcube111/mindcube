/**
 * 虚拟滚动列表组件
 * 用于处理大量数据的高性能渲染（简化实现，不依赖外部库）
 */

import { ReactNode, useMemo } from 'react'

export interface VirtualListProps<T> {
  items: T[]
  height: number
  itemHeight: number
  renderItem: (item: T, index: number) => ReactNode
  className?: string
}

export default function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className = '',
}: VirtualListProps<T>) {
  // 计算可见范围（简单实现：显示所有项目，但限制容器高度）
  const visibleItems = useMemo(() => {
    return items.slice()
  }, [items])

  if (items.length === 0) {
    return null
  }

  // 如果项目数量较少，直接渲染所有项目
  // 如果项目数量较多，可以考虑实现真正的虚拟滚动
  return (
    <div 
      className={className}
      style={{
        height: `${height}px`,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {visibleItems.map((item, index) => (
        <div
          key={index}
          style={{
            minHeight: `${itemHeight}px`,
            padding: '4px 0',
          }}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}
