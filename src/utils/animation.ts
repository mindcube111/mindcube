/**
 * 动画工具函数
 * 提供常用的动画效果和过渡
 */

/**
 * 成功动画类名
 */
export const ANIMATION_CLASSES = {
  SUCCESS: 'animate-bounce',
  FADE_IN: 'animate-fade-in',
  SLIDE_UP: 'animate-slide-up',
  SCALE: 'animate-scale',
} as const

/**
 * 操作成功动画效果
 */
export function createSuccessAnimation(element: HTMLElement) {
  element.classList.add('animate-bounce')
  setTimeout(() => {
    element.classList.remove('animate-bounce')
  }, 1000)
}

/**
 * 淡入动画
 */
export function fadeIn(element: HTMLElement, duration: number = 300) {
  element.style.opacity = '0'
  element.style.transition = `opacity ${duration}ms ease-in`
  
  requestAnimationFrame(() => {
    element.style.opacity = '1'
  })
}

/**
 * 滑入动画
 */
export function slideIn(element: HTMLElement, direction: 'up' | 'down' | 'left' | 'right' = 'up', duration: number = 300) {
  const transforms = {
    up: 'translateY(20px)',
    down: 'translateY(-20px)',
    left: 'translateX(20px)',
    right: 'translateX(-20px)',
  }

  element.style.opacity = '0'
  element.style.transform = transforms[direction]
  element.style.transition = `all ${duration}ms ease-out`

  requestAnimationFrame(() => {
    element.style.opacity = '1'
    element.style.transform = 'translate(0, 0)'
  })
}

