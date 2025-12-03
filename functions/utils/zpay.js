/**
 * ZPAY 易支付回调 & 签名工具（后端）
 * KEY 从运行环境变量中获取，避免写死在代码或前端
 */

const DEFAULT_GATEWAY = 'https://zpayz.cn'

export function getZPayConfig(env = {}) {
  const PID = env?.ZPAY_PID
  const KEY = env?.ZPAY_KEY
  const GATEWAY = env?.ZPAY_GATEWAY || DEFAULT_GATEWAY

  if (!PID || !KEY) {
    throw new Error('ZPAY_PID 或 ZPAY_KEY 未配置')
  }

  return { PID, KEY, GATEWAY }
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

function cmn(q, a, b, x, s, t) {
  a = (a + q + x + t) | 0
  return (((a << s) | (a >>> (32 - s))) + b) | 0
}

function ff(a, b, c, d, x, s, t) {
  return cmn((b & c) | (~b & d), a, b, x, s, t)
}
function gg(a, b, c, d, x, s, t) {
  return cmn((b & d) | (c & ~d), a, b, x, s, t)
}
function hh(a, b, c, d, x, s, t) {
  return cmn(b ^ c ^ d, a, b, x, s, t)
}
function ii(a, b, c, d, x, s, t) {
  return cmn(c ^ (b | ~d), a, b, x, s, t)
}

function md5cycle(x, k) {
  let [a, b, c, d] = x

  a = ff(a, b, c, d, k[0], 7, -680876936)
  d = ff(d, a, b, c, k[1], 12, -389564586)
  c = ff(c, d, a, b, k[2], 17, 606105819)
  b = ff(b, c, d, a, k[3], 22, -1044525330)
  a = ff(a, b, c, d, k[4], 7, -176418897)
  d = ff(d, a, b, c, k[5], 12, 1200080426)
  c = ff(c, d, a, b, k[6], 17, -1473231341)
  b = ff(b, c, d, a, k[7], 22, -45705983)
  a = ff(a, b, c, d, k[8], 7, 1770035416)
  d = ff(d, a, b, c, k[9], 12, -1958414417)
  c = ff(c, d, a, b, k[10], 17, -42063)
  b = ff(b, c, d, a, k[11], 22, -1990404162)
  a = ff(a, b, c, d, k[12], 7, 1804603682)
  d = ff(d, a, b, c, k[13], 12, -40341101)
  c = ff(c, d, a, b, k[14], 17, -1502002290)
  b = ff(b, c, d, a, k[15], 22, 1236535329)

  a = gg(a, b, c, d, k[1], 5, -165796510)
  d = gg(d, a, b, c, k[6], 9, -1069501632)
  c = gg(c, d, a, b, k[11], 14, 643717713)
  b = gg(b, c, d, a, k[0], 20, -373897302)
  a = gg(a, b, c, d, k[5], 5, -701558691)
  d = gg(d, a, b, c, k[10], 9, 38016083)
  c = gg(c, d, a, b, k[15], 14, -660478335)
  b = gg(b, c, d, a, k[4], 20, -405537848)
  a = gg(a, b, c, d, k[9], 5, 568446438)
  d = gg(d, a, b, c, k[14], 9, -1019803690)
  c = gg(c, d, a, b, k[3], 14, -187363961)
  b = gg(b, c, d, a, k[8], 20, 1163531501)
  a = gg(a, b, c, d, k[13], 5, -1444681467)
  d = gg(d, a, b, c, k[2], 9, -51403784)
  c = gg(c, d, a, b, k[7], 14, 1735328473)
  b = gg(b, c, d, a, k[12], 20, -1926607734)

  a = hh(a, b, c, d, k[5], 4, -378558)
  d = hh(d, a, b, c, k[8], 11, -2022574463)
  c = hh(c, d, a, b, k[11], 16, 1839030562)
  b = hh(b, c, d, a, k[14], 23, -35309556)
  a = hh(a, b, c, d, k[1], 4, -1530992060)
  d = hh(d, a, b, c, k[4], 11, 1272893353)
  c = hh(c, d, a, b, k[7], 16, -155497632)
  b = hh(b, c, d, a, k[10], 23, -1094730640)
  a = hh(a, b, c, d, k[13], 4, 681279174)
  d = hh(d, a, b, c, k[0], 11, -358537222)
  c = hh(c, d, a, b, k[3], 16, -722521979)
  b = hh(b, c, d, a, k[6], 23, 76029189)
  a = hh(a, b, c, d, k[9], 4, -640364487)
  d = hh(d, a, b, c, k[12], 11, -421815835)
  c = hh(c, d, a, b, k[15], 16, 530742520)
  b = hh(b, c, d, a, k[2], 23, -995338651)

  a = ii(a, b, c, d, k[0], 6, -198630844)
  d = ii(d, a, b, c, k[7], 10, 1126891415)
  c = ii(c, d, a, b, k[14], 15, -1416354905)
  b = ii(b, c, d, a, k[5], 21, -57434055)
  a = ii(a, b, c, d, k[12], 6, 1700485571)
  d = ii(d, a, b, c, k[3], 10, -1894986606)
  c = ii(c, d, a, b, k[10], 15, -1051523)
  b = ii(b, c, d, a, k[1], 21, -2054922799)
  a = ii(a, b, c, d, k[8], 6, 1873313359)
  d = ii(d, a, b, c, k[15], 10, -30611744)
  c = ii(c, d, a, b, k[6], 15, -1560198380)
  b = ii(b, c, d, a, k[13], 21, 1309151649)
  a = ii(a, b, c, d, k[4], 6, -145523070)
  d = ii(d, a, b, c, k[11], 10, -1120210379)
  c = ii(c, d, a, b, k[2], 15, 718787259)
  b = ii(b, c, d, a, k[9], 21, -343485551)

  x[0] = (x[0] + a) | 0
  x[1] = (x[1] + b) | 0
  x[2] = (x[2] + c) | 0
  x[3] = (x[3] + d) | 0
}

function md5blk(str) {
  const blocks = []
  for (let i = 0; i < 64; i += 4) {
    blocks[i >> 2] =
      str.charCodeAt(i) +
      (str.charCodeAt(i + 1) << 8) +
      (str.charCodeAt(i + 2) << 16) +
      (str.charCodeAt(i + 3) << 24)
  }
  return blocks
}

function md51(str) {
  const n = str.length
  const state = [1732584193, -271733879, -1732584194, 271733878]
  let i
  for (i = 64; i <= n; i += 64) {
    md5cycle(state, md5blk(str.substring(i - 64, i)))
  }
  const tail = new Array(16).fill(0)
  const remaining = str.substring(i - 64)
  for (let j = 0; j < remaining.length; j++) {
    tail[j >> 2] |= remaining.charCodeAt(j) << ((j % 4) << 3)
  }
  tail[(remaining.length >> 2)] |= 0x80 << ((remaining.length % 4) << 3)
  if (remaining.length > 55) {
    md5cycle(state, tail)
    tail.fill(0)
  }
  tail[14] = n * 8
  md5cycle(state, tail)
  return state
}

function rhex(n) {
  const s = '0123456789abcdef'
  let output = ''
  for (let j = 0; j < 4; j++) {
    output += s.charAt((n >> (j * 8 + 4)) & 0x0f) + s.charAt((n >> (j * 8)) & 0x0f)
  }
  return output
}

function safeUtf8(str) {
  return unescape(encodeURIComponent(str))
}

function md5(str) {
  return md51(safeUtf8(str)).map(rhex).join('')
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

