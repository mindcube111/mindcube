/**
 * ZPAY 易支付回调 & 签名工具（后端）
 * KEY 从运行环境变量中获取，避免写死在代码或前端
 */

const ZPAY_BASE_CONFIG = {
  PID: '2025120114591699',
  GATEWAY: 'https://zpayz.cn',
}

function getZPayConfig(env) {
  const keyFromEnv = env?.ZPAY_KEY
  if (!keyFromEnv) {
    console.warn('ZPAY_KEY 未在环境变量中配置，将导致签名和验签失败')
  }
  return {
    ...ZPAY_BASE_CONFIG,
    KEY: keyFromEnv || '',
  }
}

// 与前端 mockPackages 对应的套餐配置（用于回调时计算额度）
const PACKAGE_CONFIG = {
  basic: {
    id: 'basic',
    name: '基础套餐',
    quota: 600,
    price: 99,
    unlimited: false,
  },
  standard: {
    id: 'standard',
    name: '标准套餐',
    quota: 1300,
    price: 199,
    unlimited: false,
  },
  professional: {
    id: 'professional',
    name: '专业套餐',
    quota: 2300,
    price: 299,
    unlimited: false,
  },
  flagship: {
    id: 'flagship',
    name: '旗舰套餐',
    quota: 5500,
    price: 599,
    unlimited: false,
  },
  yearly: {
    id: 'yearly',
    name: '年费套餐',
    quota: 0,
    price: 1688,
    unlimited: true,
  },
}

function getPackageConfig(packageId) {
  if (!packageId) return null
  return PACKAGE_CONFIG[packageId] || null
}

/**
 * 生成 MD5（Cloudflare Workers 环境）
 * 使用 Web Crypto API：SHA-256/MD5 不同，这里我们用一个简单的 polyfill：
 * 实际生产中推荐使用服务器端支持的 MD5 库或改为 HMAC-SHA256
 */
async function md5(message) {
  // 这里使用一个简化实现：通过 SubtleCrypto + TextEncoder
  // 由于 Workers 原生不支持 MD5，这里留作扩展点（目前不在回调侧重算签名）
  // 在回调中我们只按 KEY 和参数重新计算 MD5（可由前端/第三方检查）
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('MD5', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 生成 ZPAY 签名
 * @param {Record<string, string | number | null | undefined>} params
 * @param {string} key 环境中的商户密钥
 * @returns {Promise<string>}
 */
async function createZPaySign(params, key) {
  const filtered = {}

  Object.keys(params).forEach((k) => {
    const value = params[k]
    if (k === 'sign' || k === 'sign_type') return
    if (value === undefined || value === null || value === '') return
    filtered[k] = String(value)
  })

  const sortedKeys = Object.keys(filtered).sort()
  const signStr = sortedKeys.map((k) => `${k}=${filtered[k]}`).join('&') + key

  return md5(signStr)
}

/**
 * 验证回调签名
 * @param {URLSearchParams} searchParams
 * @param {string} key 环境中的商户密钥
 * @returns {Promise<{ valid: boolean, error?: string }>}
 */
async function verifyCallbackSign(searchParams, key) {
  const receivedSign = searchParams.get('sign') || ''
  const signType = searchParams.get('sign_type') || 'MD5'

  if (!receivedSign) {
    return { valid: false, error: '缺少签名参数 sign' }
  }
  if (signType.toUpperCase() !== 'MD5') {
    return { valid: false, error: '不支持的签名类型' }
  }

  const paramsObj = {}
  for (const [key, value] of searchParams.entries()) {
    paramsObj[key] = value
  }

  const expectedSign = await createZPaySign(paramsObj, key)

  if (expectedSign !== receivedSign) {
    return { valid: false, error: '签名校验失败' }
  }

  return { valid: true }
}

export { getZPayConfig, createZPaySign, verifyCallbackSign, getPackageConfig }

