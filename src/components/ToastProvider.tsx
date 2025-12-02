/**
 * Toast 通知提供者
 * 全局通知系统
 */

import { ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '16px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
            style: {
              border: '1px solid #10B981',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
            style: {
              border: '1px solid #EF4444',
            },
          },
          loading: {
            iconTheme: {
              primary: '#4A6CF7',
              secondary: '#fff',
            },
          },
        }}
      />
      {children}
    </>
  )
}

