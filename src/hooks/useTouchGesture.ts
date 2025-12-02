/**
 * 触摸手势 Hook
 * 支持滑动删除、长按等手势操作
 */

import { useRef, useEffect } from 'react'

interface TouchGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onLongPress?: () => void
  longPressDelay?: number
  swipeThreshold?: number
}

export function useTouchGesture(options: TouchGestureOptions) {
  const elementRef = useRef<HTMLElement>(null)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)

  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onLongPress,
    longPressDelay = 500,
    swipeThreshold = 50,
  } = options

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      }

      // 启动长按定时器
      if (onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          onLongPress()
        }, longPressDelay)
      }
    }

    const handleTouchMove = () => {
      // 移动时取消长按
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      // 取消长按定时器
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }

      if (!touchStartRef.current) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y
      const deltaTime = Date.now() - touchStartRef.current.time

      // 判断滑动
      if (deltaTime < 300) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // 水平滑动
          if (Math.abs(deltaX) > swipeThreshold) {
            if (deltaX > 0 && onSwipeRight) {
              onSwipeRight()
            } else if (deltaX < 0 && onSwipeLeft) {
              onSwipeLeft()
            }
          }
        } else {
          // 垂直滑动
          if (Math.abs(deltaY) > swipeThreshold) {
            if (deltaY > 0 && onSwipeDown) {
              onSwipeDown()
            } else if (deltaY < 0 && onSwipeUp) {
              onSwipeUp()
            }
          }
        }
      }

      touchStartRef.current = null
    }

    element.addEventListener('touchstart', handleTouchStart)
    element.addEventListener('touchmove', handleTouchMove)
    element.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onLongPress, longPressDelay, swipeThreshold])

  return elementRef
}

