/**
 * 认证中间件和工具函数
 */

import { extractToken, verifyToken } from './jwt.js'
import { unauthorizedResponse } from './response.js'

/**
 * 验证请求的认证状态
 */
export async function verifyAuth(request, env = {}) {
  const token = extractToken(request)
  if (!token) {
    return { valid: false, error: unauthorizedResponse('缺少认证 Token') }
  }

  const payload = verifyToken(token, env)
  if (!payload) {
    return { valid: false, error: unauthorizedResponse('Token 无效或已过期') }
  }

  return { valid: true, userId: payload.userId, userRole: payload.role }
}

/**
 * 检查是否为管理员
 */
export async function requireAdmin(request, env = {}) {
  const authResult = await verifyAuth(request, env)
  if (!authResult.valid) {
    return authResult
  }

  if (authResult.userRole !== 'admin') {
    return {
      valid: false,
      error: unauthorizedResponse('需要管理员权限'),
    }
  }

  return authResult
}

/**
 * 密码哈希（简化版，生产环境应使用更安全的方法）
 */
export function hashPassword(password) {
  // 简单的哈希（实际应使用 bcrypt 或类似库）
  // 这里仅作为示例，生产环境需要更安全的实现
  return btoa(password).replace(/=/g, '')
}

/**
 * 验证密码
 */
export function verifyPassword(password, hashedPassword) {
  return hashPassword(password) === hashedPassword
}




















