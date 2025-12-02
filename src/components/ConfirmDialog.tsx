/**
 * 统一的确认对话框组件
 * 用于替换 alert 和 confirm
 */

import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react'
import { useState, useCallback } from 'react'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  type?: 'confirm' | 'alert' | 'info' | 'success' | 'warning'
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
  onClose?: () => void
  destructive?: boolean // 是否为危险操作（红色确认按钮）
}

export default function ConfirmDialog({
  open,
  title,
  message,
  type = 'confirm',
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  onClose,
  destructive = false,
}: ConfirmDialogProps) {
  if (!open) return null

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    if (onClose) {
      onClose()
    }
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    if (onClose) {
      onClose()
    }
  }

  const handleBackdropClick = () => {
    if (type === 'alert' || type === 'info' || type === 'success' || type === 'warning') {
      handleCancel()
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'warning':
      case 'alert':
        return <AlertTriangle className="w-6 h-6 text-warning" />
      case 'success':
        return <CheckCircle className="w-6 h-6 text-success" />
      case 'info':
        return <Info className="w-6 h-6 text-primary-600" />
      default:
        return <AlertTriangle className="w-6 h-6 text-primary-600" />
    }
  }

  const getConfirmButtonClass = () => {
    if (destructive) {
      return 'bg-danger text-white hover:bg-danger/90'
    }
    return 'bg-primary-600 text-white hover:bg-primary-700'
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 对话框头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {getIcon()}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          {(type === 'info' || type === 'success' || type === 'alert' || type === 'warning') && (
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 对话框内容 */}
        <div className="p-6">
          <p className="text-gray-700 whitespace-pre-line">{message}</p>
        </div>

        {/* 对话框底部 */}
        <div
          className={`flex gap-3 p-6 border-t border-gray-200 ${
            type === 'confirm' ? 'justify-end' : 'justify-center'
          }`}
        >
          {type === 'confirm' && (
            <>
              <button
                onClick={handleCancel}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-6 py-2.5 rounded-xl transition-colors font-medium ${getConfirmButtonClass()}`}
              >
                {confirmText}
              </button>
            </>
          )}
          {(type === 'alert' || type === 'info' || type === 'success' || type === 'warning') && (
            <button
              onClick={handleConfirm || handleCancel}
              className="px-6 py-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium"
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Hook for using confirm dialog
 */
export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<{
    open: boolean
    props: Omit<ConfirmDialogProps, 'open' | 'onClose'>
  }>({
    open: false,
    props: {
      title: '',
      message: '',
      type: 'confirm',
    },
  })

  const showConfirm = useCallback((
    title: string,
    message: string,
    options?: {
      type?: ConfirmDialogProps['type']
      confirmText?: string
      cancelText?: string
      destructive?: boolean
    }
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        props: {
          title,
          message,
          type: options?.type || 'confirm',
          confirmText: options?.confirmText || '确认',
          cancelText: options?.cancelText || '取消',
          destructive: options?.destructive || false,
          onConfirm: () => {
            setDialogState((prev) => ({ ...prev, open: false }))
            resolve(true)
          },
          onCancel: () => {
            setDialogState((prev) => ({ ...prev, open: false }))
            resolve(false)
          },
        },
      })
    })
  }, [])

  const showAlert = useCallback((
    title: string,
    message: string,
    type: 'alert' | 'info' | 'success' | 'warning' = 'info'
  ): Promise<void> => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        props: {
          title,
          message,
          type,
          confirmText: '确定',
          onConfirm: () => {
            setDialogState((prev) => ({ ...prev, open: false }))
            resolve()
          },
        },
      })
    })
  }, [])

  const DialogComponent = (
    <ConfirmDialog
      {...dialogState.props}
      open={dialogState.open}
      onClose={() => setDialogState((prev) => ({ ...prev, open: false }))}
    />
  )

  return {
    showConfirm,
    showAlert,
    DialogComponent,
  }
}

