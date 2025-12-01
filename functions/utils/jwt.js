/**
 * JWT 工具函数
 * 用于生成和验证 JWT Token
 */

// JWT 密钥（从环境变量获取，如果没有则使用默认值）
function getJWTSecret(env) {
  return env?.JWT_SECRET || 'your-jwt-secret-key-change-in-production'
}

/**
 * Base64 URL 编码
 */
function base64UrlEncode(str) {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Base64 URL 解码
 */
function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) {
    str += '='
  }
  return atob(str)
}

/**
 * 生成 JWT Token
 */
export function generateToken(payload, env = {}) {
  const JWT_SECRET = getJWTSecret(env)
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  
  // 简单的 HMAC-SHA256 签名（实际生产环境应使用 crypto API）
  const signature = base64UrlEncode(
    JSON.stringify({ header: encodedHeader, payload: encodedPayload, secret: getJWTSecret(env) })
  )

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

/**
 * 验证 JWT Token
 */
export function verifyToken(token, env = {}) {
  const JWT_SECRET = getJWTSecret(env)
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const [encodedHeader, encodedPayload, signature] = parts
    
    // 验证签名（简化版，实际应该使用 crypto API）
    const secret = getJWTSecret(env)
    const expectedSignature = base64UrlEncode(
      JSON.stringify({ header: encodedHeader, payload: encodedPayload, secret })
    )
    
    if (signature !== expectedSignature) {
      return null
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload))
    
    // 检查过期时间
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null
    }

    return payload
  } catch (error) {
    return null
  }
}

/**
 * 从请求中提取 Token
 */
export function extractToken(request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

















