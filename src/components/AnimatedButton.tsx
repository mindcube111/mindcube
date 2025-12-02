/**
 * 带动画效果的按钮组件
 * 提供操作成功动画反馈
 */

import { motion, HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'

export interface AnimatedButtonProps extends HTMLMotionProps<'button'> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'danger'
  showSuccessAnimation?: boolean
  className?: string
}

export default function AnimatedButton({
  children,
  variant = 'primary',
  showSuccessAnimation = false,
  className = '',
  ...props
}: AnimatedButtonProps) {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'bg-success text-white hover:bg-success/90',
    danger: 'bg-danger text-white hover:bg-danger/90',
  }

  return (
    <motion.button
      className={`${variantClasses[variant]} ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      animate={
        showSuccessAnimation
          ? {
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }
          : {}
      }
      transition={
        showSuccessAnimation
          ? {
              duration: 0.5,
              ease: 'easeInOut',
            }
          : {
              duration: 0.2,
            }
      }
      {...props}
    >
      {children}
    </motion.button>
  )
}

