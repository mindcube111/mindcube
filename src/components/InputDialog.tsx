/**
 * 输入对话框组件
 * 用于获取用户输入的对话框
 */

import { AlertCircle, Info, X } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

export interface InputDialogProps {
  open: boolean
  title: string
  message?: string
  placeholder?: string
  type?: 'text' | 'number'
  defaultValue?: string | number
  confirmText?: string
  cancelText?: string
  onConfirm?: (value: string) => void
  onCancel?: () => void
  onClose?: () => void
  validate?: (value: string) => string | null // 返回错误信息，null 表示验证通过
}

export default function InputDialog({
  open,
  title,
  message,
  placeholder = '请输入',
  type = 'text',
  defaultValue = '',
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  onClose,
  validate,
}: InputDialogProps) {
  const [value, setValue] = useState<string>(String(defaultValue || ''))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValue(String(defaultValue || ''))
      setError(null)
    }
  }, [open, defaultValue])

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
    const validationError = validate ? validate(value) : null
    if (validationError) {
      setError(validationError)
      return
    }

    if (onConfirm) {
      onConfirm(value)
    }
    if (onClose) {
      onClose()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    if (error) {
      setError(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirm()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 对话框头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Info className="w-6 h-6 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 对话框内容 */}
        <div className="p-6">
          {message && (
            <p className="text-gray-700 mb-4 whitespace-pre-line">{message}</p>
          )}
          <input
            type={type}
            value={value}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            autoFocus
            className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
              error ? 'border-danger' : 'border-gray-300'
            }`}
          />
          {error && (
            <div className="flex items-center gap-2 mt-2 text-danger text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* 对话框底部 */}
        <div className="flex gap-3 p-6 border-t border-gray-200 justify-end">
          <button
            onClick={handleCancel}
            className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook for using input dialog
 */
export function useInputDialog() {
  const [dialogState, setDialogState] = useState<{
    open: boolean
    props: Omit<InputDialogProps, 'open' | 'onClose'>
  }>({
    open: false,
    props: {
      title: '',
      placeholder: '请输入',
      type: 'text',
    },
  })

  const showInput = useCallback(
    (
      title: string,
      options?: {
        message?: string
        placeholder?: string
        type?: 'text' | 'number'
        defaultValue?: string | number
        confirmText?: string
        cancelText?: string
        validate?: (value: string) => string | null
      }
    ): Promise<string | null> => {
      return new Promise((resolve) => {
        setDialogState({
          open: true,
          props: {
            title,
            message: options?.message,
            placeholder: options?.placeholder || '请输入',
            type: options?.type || 'text',
            defaultValue: options?.defaultValue || '',
            confirmText: options?.confirmText || '确认',
            cancelText: options?.cancelText || '取消',
            validate: options?.validate,
            onConfirm: (value: string) => {
              setDialogState((prev) => ({ ...prev, open: false }))
              resolve(value)
            },
            onCancel: () => {
              setDialogState((prev) => ({ ...prev, open: false }))
              resolve(null)
            },
          },
        })
      })
    },
    []
  )

  const InputDialogComponent = (
    <InputDialog
      {...dialogState.props}
      open={dialogState.open}
      onClose={() => {
        setDialogState((prev) => ({ ...prev, open: false }))
        if (dialogState.props.onCancel) {
          dialogState.props.onCancel()
        }
      }}
    />
  )

  return {
    showInput,
    InputDialogComponent,
  }
}






