/**
 * 动画列表组件
 * 为列表项添加进入动画
 */

import { ReactNode, useEffect, useRef, useState } from 'react'

interface AnimatedListProps {
  children: ReactNode[]
  className?: string
}

export default function AnimatedList({ children, className = '' }: AnimatedListProps) {
  const [visibleItems, setVisibleItems] = useState<number[]>([])
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    // 使用 IntersectionObserver 实现渐进式显示
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0')
            setVisibleItems((prev) => {
              if (!prev.includes(index)) {
                return [...prev, index]
              }
              return prev
            })
            observerRef.current?.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )

    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  useEffect(() => {
    // 观察所有子元素
    if (observerRef.current) {
      const elements = document.querySelectorAll('[data-list-item]')
      elements.forEach((el) => {
        observerRef.current?.observe(el)
      })
    }
  }, [children])

  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          data-index={index}
          data-list-item
          className={
            visibleItems.includes(index)
              ? 'animate-slide-up'
              : 'opacity-0 translate-y-2'
          }
          style={{
            animationDelay: `${index * 0.05}s`,
            animationFillMode: 'both',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

