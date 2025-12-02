/**
 * 输入验证工具函数
 * 统一的验证规则和错误消息
 */

export interface ValidationResult {
  isValid: boolean
  message?: string
}

/**
 * 验证邮箱格式
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, message: '邮箱不能为空' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, message: '请输入有效的邮箱地址' }
  }

  return { isValid: true }
}

/**
 * 验证密码强度
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, message: '密码不能为空' }
  }

  if (password.length < 6) {
    return { isValid: false, message: '密码长度至少6位' }
  }

  if (password.length > 50) {
    return { isValid: false, message: '密码长度不能超过50位' }
  }

  return { isValid: true }
}

/**
 * 验证用户名
 */
export function validateUsername(username: string): ValidationResult {
  if (!username) {
    return { isValid: false, message: '用户名不能为空' }
  }

  if (username.length < 3) {
    return { isValid: false, message: '用户名长度至少3位' }
  }

  if (username.length > 20) {
    return { isValid: false, message: '用户名长度不能超过20位' }
  }

  const usernameRegex = /^[a-zA-Z0-9_]+$/
  if (!usernameRegex.test(username)) {
    return { isValid: false, message: '用户名只能包含字母、数字和下划线' }
  }

  return { isValid: true }
}

/**
 * 验证文件类型
 */
export function validateFileType(file: File, allowedTypes: string[]): ValidationResult {
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, message: `不支持的文件类型，仅支持: ${allowedTypes.join(', ')}` }
  }

  return { isValid: true }
}

/**
 * 验证文件大小
 */
export function validateFileSize(file: File, maxSize: number): ValidationResult {
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2)
    return { isValid: false, message: `文件大小不能超过 ${maxSizeMB}MB` }
  }

  return { isValid: true }
}

/**
 * 验证 URL
 */
export function validateUrl(url: string): ValidationResult {
  if (!url) {
    return { isValid: false, message: 'URL 不能为空' }
  }

  try {
    new URL(url)
    return { isValid: true }
  } catch {
    return { isValid: false, message: '请输入有效的 URL' }
  }
}

/**
 * 验证数字范围
 */
export function validateNumberRange(
  value: number,
  min?: number,
  max?: number
): ValidationResult {
  if (min !== undefined && value < min) {
    return { isValid: false, message: `数值不能小于 ${min}` }
  }

  if (max !== undefined && value > max) {
    return { isValid: false, message: `数值不能大于 ${max}` }
  }

  return { isValid: true }
}

/**
 * 验证必填字段
 */
export function validateRequired(value: any, fieldName: string = '字段'): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, message: `${fieldName}不能为空` }
  }

  if (typeof value === 'string' && value.trim() === '') {
    return { isValid: false, message: `${fieldName}不能为空` }
  }

  return { isValid: true }
}

/**
 * 验证文本长度
 */
export function validateTextLength(
  text: string,
  min?: number,
  max?: number,
  fieldName: string = '文本'
): ValidationResult {
  if (min !== undefined && text.length < min) {
    return { isValid: false, message: `${fieldName}长度不能少于 ${min} 个字符` }
  }

  if (max !== undefined && text.length > max) {
    return { isValid: false, message: `${fieldName}长度不能超过 ${max} 个字符` }
  }

  return { isValid: true }
}

/**
 * 验证标签文本（用于特性标签等）
 */
export function validateTagText(text: string): ValidationResult {
  if (!text || text.trim() === '') {
    return { isValid: false, message: '标签不能为空' }
  }

  if (text.length > 20) {
    return { isValid: false, message: '标签长度不能超过 20 个字符' }
  }

  return { isValid: true }
}

