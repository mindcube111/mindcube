/**
 * JWT 工具函数
 * 使用 Web Crypto API 生成/验证符合 HS256 的 JWT
 */

const encoder = new TextEncoder()

function getJWTSecret(env) {
  const secret = env?.JWT_SECRET
  if (!secret || secret === 'your-jwt-secret-key-change-in-production') {
    throw new Error('JWT_SECRET 未配置，无法生成或验证 Token')
  }
  return secret
}

function base64UrlEncodeString(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64UrlEncodeBuffer(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach(b => (binary += String.fromCharCode(b)))
  return base64UrlEncodeString(binary)
}

function base64UrlDecode(str) {
  let input = str.replace(/-/g, '+').replace(/_/g, '/')
  while (input.length % 4) {
    input += '='
  }
  return atob(input)
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) {
    return false
  }
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

async function createSignature(data, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return base64UrlEncodeBuffer(signature)
}

export async function generateToken(payload, env = {}) {
  const secret = getJWTSecret(env)
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = base64UrlEncodeString(JSON.stringify(header))
  const encodedPayload = base64UrlEncodeString(JSON.stringify(payload))
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const signature = await createSignature(signingInput, secret)
  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export async function verifyToken(token, env = {}) {
  try {
    const secret = getJWTSecret(env)
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }
    const [encodedHeader, encodedPayload, signature] = parts
    const signingInput = `${encodedHeader}.${encodedPayload}`
    const expectedSignature = await createSignature(signingInput, secret)
    if (!timingSafeEqual(signature, expectedSignature)) {
      return null
    }
    const payload = JSON.parse(base64UrlDecode(encodedPayload))
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null
    }
    return payload
  } catch (error) {
    console.error('JWT 验证失败:', error)
    return null
  }
}

export function extractToken(request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}




















