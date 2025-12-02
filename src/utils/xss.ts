/**
 * XSS 防护工具
 * 用于清理和验证用户输入，防止 XSS 攻击
 */

import DOMPurify from 'dompurify'

/**
 * 清理 HTML 内容，防止 XSS
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') return dirty
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  })
}

/**
 * 清理纯文本（移除所有 HTML 标签）
 */
export function sanitizeText(dirty: string): string {
  if (typeof window === 'undefined') return dirty
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] })
}

/**
 * 验证 URL 是否安全
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    // 只允许 http 和 https 协议
    return ['http:', 'https:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}

/**
 * 转义 HTML 特殊字符
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

