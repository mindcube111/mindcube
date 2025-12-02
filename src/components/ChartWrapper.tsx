/**
 * 图表包装器组件
 * IntersectionObserver + Suspense 懒加载图表，避免初次渲染阻塞
 */

import { Suspense, ReactNode, useEffect, useRef, useState } from 'react'
import { ChartSkeleton } from './Skeleton'

interface ChartWrapperProps {
  children: ReactNode
  minHeight?: number
}

export default function ChartWrapper({ children, minHeight = 280 }: ChartWrapperProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!containerRef.current || isVisible) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.25 }
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [isVisible])

  return (
    <div ref={containerRef} style={{ minHeight }} className="relative w-full">
      {isVisible ? (
        <Suspense fallback={<ChartSkeleton inline height={Math.max(minHeight - 32, 120)} />}>
          {children}
        </Suspense>
      ) : (
        <ChartSkeleton inline height={Math.max(minHeight - 32, 120)} />
      )}
    </div>
  )
}








