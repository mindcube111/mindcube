import { format } from 'date-fns'

export const formatDate = (date: string | Date, pattern = 'yyyy-MM-dd HH:mm') => {
  return format(new Date(date), pattern)
}

export const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-CN')
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
}

export const formatPercentage = (value: number, decimals = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`
}

export const formatCurrency = (amount: number, decimals = 2): string => {
  return `¥${amount.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export const generateTestLink = (id: string): string => {
  const baseUrl = window.location.origin
  return `${baseUrl}/test/${id}`
}








