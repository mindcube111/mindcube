/**
 * 认证中间件和工具函数
 */

import { extractToken, verifyToken } from './jwt.js'
import { unauthorizedResponse } from './response.js'

const encoder = new TextEncoder()
const HASH_VERSION = 'pbkdf2-v1'
const HASH_ITERATIONS = 150000
const SALT_LENGTH = 16

export async function verifyAuth(request, env = {}) {
  const token = extractToken(request)
  if (!token) {
    return { valid: false, error: unauthorizedResponse('缺少认证 Token') }
  }

  const payload = await verifyToken(token, env)
  if (!payload) {
    return { valid: false, error: unauthorizedResponse('Token 无效或已过期') }
  }

  return { valid: true, userId: payload.userId, userRole: payload.role }
}

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

function bufferToHex(buffer) {
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToUint8Array(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes
}

async function deriveKey(password, salt, iterations) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )

  return new Uint8Array(derivedBits)
}

function timingSafeEqualUint8(a, b) {
  if (a.length !== b.length) {
    return false
  }
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i]
  }
  return diff === 0
}

function isLegacyHash(hash) {
  return /^[A-Za-z0-9+/]+={0,2}$/.test(hash)
}

export async function hashPassword(password) {
  if (!password) {
    throw new Error('密码不能为空')
  }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const derivedKey = await deriveKey(password, salt, HASH_ITERATIONS)
  return `${HASH_VERSION}:${HASH_ITERATIONS}:${bufferToHex(salt)}:${bufferToHex(derivedKey)}`
}

export async function verifyPassword(password, hashedPassword) {
  if (!hashedPassword) {
    return false
  }

  if (isLegacyHash(hashedPassword)) {
    try {
      return btoa(password).replace(/=/g, '') === hashedPassword
    } catch {
      return false
    }
  }

  const parts = hashedPassword.split(':')
  if (parts.length !== 4 || parts[0] !== HASH_VERSION) {
    return false
  }
  const iterations = Number(parts[1])
  const salt = hexToUint8Array(parts[2])
  const storedHash = hexToUint8Array(parts[3])
  const derivedKey = await deriveKey(password, salt, iterations)
  return timingSafeEqualUint8(storedHash, derivedKey)
}




















