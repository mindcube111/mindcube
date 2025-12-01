// 构造 MD5 签名用的明文字符串（按文档要求：按参数名 ASCII 排序，去掉 sign/sign_type 和空值）
export function buildSignPayload(params) {
  const entries = Object.entries(params)
    .filter(([key, value]) => {
      // 排除 sign、sign_type 和空值
      if (key === 'sign' || key === 'sign_type') return false
      if (value === undefined || value === null || value === '') return false
      return true
    })
    .sort(([a], [b]) => {
      // 按 ASCII 顺序排序（字符串比较）
      return a.localeCompare(b)
    })

  // 构建签名字符串，值需要转为字符串（URL 参数应该保持原始值，不需要额外编码）
  const payload = entries.map(([k, v]) => `${k}=${String(v)}`).join('&')
  
  // 调试日志：记录构建的签名字符串
  console.log('构建签名字符串:', {
    input_params_count: Object.keys(params).length,
    filtered_entries_count: entries.length,
    sorted_keys: entries.map(([k]) => k).join(', '),
    payload_preview: payload.length > 150 ? payload.substring(0, 100) + '...' + payload.substring(payload.length - 20) : payload,
    payload_length: payload.length,
    payload_ends_with: payload.length > 20 ? payload.substring(payload.length - 20) : payload
  })
  
  return payload
}

// 纯 JS 实现的 MD5，兼容 Cloudflare Workers（不能使用 Node 内置 crypto）
// 来源为标准公开实现，做了轻微格式整理以适应 ESM 环境
function md5(raw) {
  function cmn(q, a, b, x, s, t) {
    a = (((a + q) | 0) + ((x + t) | 0)) | 0
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
  function toBytes(str) {
    const utf8 = unescape(encodeURIComponent(str))
    const arr = []
    for (let i = 0; i < utf8.length; i++) {
      arr.push(utf8.charCodeAt(i))
    }
    return arr
  }
  function toHex(num) {
    let s = ''
    for (let j = 0; j < 4; j++) {
      s += ('0' + ((num >> (j * 8)) & 0xff).toString(16)).slice(-2)
    }
    return s
  }

  const x = toBytes(raw)
  const len = x.length
  x.push(0x80)
  while ((x.length % 64) !== 56) {
    x.push(0)
  }

  const bitLen = len * 8
  for (let i = 0; i < 8; i++) {
    x.push((bitLen >>> (i * 8)) & 0xff)
  }

  let a = 0x67452301
  let b = 0xefcdab89
  let c = 0x98badcfe
  let d = 0x10325476

  for (let i = 0; i < x.length; i += 64) {
    const chunk = []
    for (let j = 0; j < 64; j += 4) {
      chunk[j / 4] = x[i + j] | (x[i + j + 1] << 8) | (x[i + j + 2] << 16) | (x[i + j + 3] << 24)
    }

    let aa = a
    let bb = b
    let cc = c
    let dd = d

    a = ff(a, b, c, d, chunk[0], 7, -680876936)
    d = ff(d, a, b, c, chunk[1], 12, -389564586)
    c = ff(c, d, a, b, chunk[2], 17, 606105819)
    b = ff(b, c, d, a, chunk[3], 22, -1044525330)
    a = ff(a, b, c, d, chunk[4], 7, -176418897)
    d = ff(d, a, b, c, chunk[5], 12, 1200080426)
    c = ff(c, d, a, b, chunk[6], 17, -1473231341)
    b = ff(b, c, d, a, chunk[7], 22, -45705983)
    a = ff(a, b, c, d, chunk[8], 7, 1770035416)
    d = ff(d, a, b, c, chunk[9], 12, -1958414417)
    c = ff(c, d, a, b, chunk[10], 17, -42063)
    b = ff(b, c, d, a, chunk[11], 22, -1990404162)
    a = ff(a, b, c, d, chunk[12], 7, 1804603682)
    d = ff(d, a, b, c, chunk[13], 12, -40341101)
    c = ff(c, d, a, b, chunk[14], 17, -1502002290)
    b = ff(b, c, d, a, chunk[15], 22, 1236535329)

    a = gg(a, b, c, d, chunk[1], 5, -165796510)
    d = gg(d, a, b, c, chunk[6], 9, -1069501632)
    c = gg(c, d, a, b, chunk[11], 14, 643717713)
    b = gg(b, c, d, a, chunk[0], 20, -373897302)
    a = gg(a, b, c, d, chunk[5], 5, -701558691)
    d = gg(d, a, b, c, chunk[10], 9, 38016083)
    c = gg(c, d, a, b, chunk[15], 14, -660478335)
    b = gg(b, c, d, a, chunk[4], 20, -405537848)
    a = gg(a, b, c, d, chunk[9], 5, 568446438)
    d = gg(d, a, b, c, chunk[14], 9, -1019803690)
    c = gg(c, d, a, b, chunk[3], 14, -187363961)
    b = gg(b, c, d, a, chunk[8], 20, 1163531501)
    a = gg(a, b, c, d, chunk[13], 5, -1444681467)
    d = gg(d, a, b, c, chunk[2], 9, -51403784)
    c = gg(c, d, a, b, chunk[7], 14, 1735328473)
    b = gg(b, c, d, a, chunk[12], 20, -1926607734)

    a = hh(a, b, c, d, chunk[5], 4, -378558)
    d = hh(d, a, b, c, chunk[8], 11, -2022574463)
    c = hh(c, d, a, b, chunk[11], 16, 1839030562)
    b = hh(b, c, d, a, chunk[14], 23, -35309556)
    a = hh(a, b, c, d, chunk[1], 4, -1530992060)
    d = hh(d, a, b, c, chunk[4], 11, 1272893353)
    c = hh(c, d, a, b, chunk[7], 16, -155497632)
    b = hh(b, c, d, a, chunk[10], 23, -1094730640)
    a = hh(a, b, c, d, chunk[13], 4, 681279174)
    d = hh(d, a, b, c, chunk[0], 11, -358537222)
    c = hh(c, d, a, b, chunk[3], 16, -722521979)
    b = hh(b, c, d, a, chunk[6], 23, 76029189)
    a = hh(a, b, c, d, chunk[9], 4, -640364487)
    d = hh(d, a, b, c, chunk[12], 11, -421815835)
    c = hh(c, d, a, b, chunk[15], 16, 530742520)
    b = hh(b, c, d, a, chunk[2], 23, -995338651)

    a = ii(a, b, c, d, chunk[0], 6, -198630844)
    d = ii(d, a, b, c, chunk[7], 10, 1126891415)
    c = ii(c, d, a, b, chunk[14], 15, -1416354905)
    b = ii(b, c, d, a, chunk[5], 21, -57434055)
    a = ii(a, b, c, d, chunk[12], 6, 1700485571)
    d = ii(d, a, b, c, chunk[3], 10, -1894986606)
    c = ii(c, d, a, b, chunk[10], 15, -1051523)
    b = ii(b, c, d, a, chunk[1], 21, -2054922799)
    a = ii(a, b, c, d, chunk[8], 6, 1873313359)
    d = ii(d, a, b, c, chunk[15], 10, -30611744)
    c = ii(c, d, a, b, chunk[6], 15, -1560198380)
    b = ii(b, c, d, a, chunk[13], 21, 1309151649)
    a = ii(a, b, c, d, chunk[4], 6, -145523070)
    d = ii(d, a, b, c, chunk[11], 10, -1120210379)
    c = ii(c, d, a, b, chunk[2], 15, 718787259)
    b = ii(b, c, d, a, chunk[9], 21, -343485551)

    a = (a + aa) | 0
    b = (b + bb) | 0
    c = (c + cc) | 0
    d = (d + dd) | 0
  }

  return toHex(a) + toHex(b) + toHex(c) + toHex(d)
}

export function md5Sign(params, key) {
  // 步骤1：构建参数串（已按 ASCII 排序，过滤空值）
  const payload = buildSignPayload(params)
  
  // 步骤2：验证 KEY 不能是占位符
  if (!key || typeof key !== 'string' || key.trim() === '') {
    throw new Error('签名失败：商户 KEY 未配置')
  }
  
  // 检查是否为占位符
  const placeholderPatterns = ['商户KEY', '你的', 'your', 'example', 'placeholder', 'test', 'demo']
  const isPlaceholder = placeholderPatterns.some(pattern => 
    key.toLowerCase().includes(pattern.toLowerCase())
  )
  
  if (isPlaceholder) {
    console.error('❌ 签名错误: KEY 是占位符，无法生成正确签名', {
      key_preview: key.substring(0, 30),
      key_length: key.length,
      payload_preview: payload.substring(0, 50) + '...'
    })
    throw new Error(`签名失败：商户 KEY 是占位符（当前值：${key.substring(0, 30)}），请配置真实密钥`)
  }
  
  // 步骤3：直接拼接 KEY 到参数串末尾（无任何分隔符）
  // 正确格式：money=1&name=...&type=alipay + KEY值
  const raw = `${payload}${key}`
  
  // 详细的签名调试日志
  console.log('=== 签名生成详情 ===', {
    step1_payload: payload.substring(0, 100) + (payload.length > 100 ? '...' : ''),
    step2_key_length: key.length,
    step2_key_preview: key.length > 10 ? key.substring(0, 6) + '...' + key.substring(key.length - 4) : key,
    step3_raw_length: raw.length,
    step3_raw_end: raw.length > 50 ? '...' + raw.substring(raw.length - 50) : raw,
    step3_raw_ends_with_key: raw.endsWith(key),
    step4_md5_result: '见下方'
  })
  
  // 步骤4：对最终字符串进行 MD5 加密（32位小写）
  const sign = md5(raw).toLowerCase()
  
  console.log('签名结果:', {
    sign: sign,
    sign_length: sign.length,
    sign_format: 'MD5 32位小写'
  })
  
  return sign
}

export function verifyMd5Sign(params, key) {
  const { sign, sign_type, ...rest } = params
  if (!sign) return false
  try {
    const expected = md5Sign(rest, key)
    return String(sign).toLowerCase() === expected.toLowerCase()
  } catch (error) {
    console.error('验证签名时出错:', error.message)
    return false
  }
}


