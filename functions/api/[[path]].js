/**
 * API 主路由处理器
 * 处理所有 /api/* 的请求
 */

import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '../utils/response.js'
import { verifyAuth, requireAdmin, hashPassword, verifyPassword } from '../utils/auth.js'
import { generateToken, extractToken, verifyToken } from '../utils/jwt.js'
import { UserDB, LinkDB, QuestionnaireDB, NotificationDB, OrderDB } from '../utils/db.js'
import { md5Sign, verifyMd5Sign } from '../utils/zpay.js'

// 初始化数据库实例（KV 会在运行时从环境变量获取）
function getDB(context) {
  // 尝试从环境变量获取 KV 绑定
  // Cloudflare Pages Functions 中，KV 绑定名称应该与 wrangler.toml 中的 binding 名称一致
  const kv = context.env.DB || context.env.KV_STORE || context.env.KV || {}
  
  // 如果 KV 未配置，返回一个模拟的存储（仅用于开发测试）
  if (!kv || typeof kv.get !== 'function') {
    console.warn('⚠️ KV store not configured, using in-memory storage (data will not persist)')
    // 返回一个简单的内存存储实现
    return getInMemoryDB()
  }
  
  return {
    users: new UserDB(kv),
    links: new LinkDB(kv),
    questionnaires: new QuestionnaireDB(kv),
    notifications: new NotificationDB(kv),
    orders: new OrderDB(kv),
  }
}

// 简单的内存存储（仅用于开发，数据不会持久化）
let inMemoryStore = {}
function getInMemoryDB() {
  const mockKV = {
    get: async (key) => inMemoryStore[key] || null,
    put: async (key, value) => { inMemoryStore[key] = value },
    delete: async (key) => { delete inMemoryStore[key] },
  }
  
  return {
    users: new UserDB(mockKV),
    links: new LinkDB(mockKV),
    questionnaires: new QuestionnaireDB(mockKV),
    notifications: new NotificationDB(mockKV),
  }
}

/**
 * 路由处理器
 */
export async function onRequest(context) {
  const { request, env, params } = context
  const { path } = params || {}
  const url = new URL(request.url)

  // 在 Pages Functions 中，[[path]] 参数在某些版本/场景下可能是字符串或数组
  // 为避免运行时错误，这里统一规范化为字符串
  const rawPath =
    Array.isArray(path) ? path.join('/') : typeof path === 'string' ? path : ''

  const pathSegments = rawPath.split('/').filter(Boolean)
  const method = request.method

  const db = getDB(context)

  try {
    // CORS 处理
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    // 路由分发
    const response = await routeHandler(pathSegments, method, request, db, env)
    
    // 添加 CORS 头
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return response
  } catch (error) {
    console.error('API Error:', error)
    return errorResponse(error.message || '服务器内部错误', 500, 500)
  }
}

/**
 * 路由处理器
 */
async function routeHandler(pathSegments, method, request, db, env) {
  const [resource, action, ...rest] = pathSegments

  // 添加调试日志（帮助诊断路由问题）
  console.log('路由调试:', {
    pathSegments,
    resource,
    action,
    method,
    url: request.url,
    rawPath: pathSegments.join('/')
  })

  // 支付相关路由（部分开放）
  if (resource === 'payment') {
    console.log('进入支付路由处理:', { action, method })
    return handlePaymentRoutes(action, method, request, db, env)
  }

  // 认证相关路由（不需要认证）
  if (resource === 'auth') {
    console.log('进入认证路由处理:', { action, method })
    return handleAuthRoutes(action, method, request, db, env)
  }

  // 公开的问卷列表（不需要认证）
  if (resource === 'questionnaires' && action === 'available') {
    return handleAvailableQuestionnaires(db)
  }

  // 其他路由需要认证
  const authResult = await verifyAuth(request, env)
  if (!authResult.valid) {
    return authResult.error
  }

  const userId = authResult.userId
  const userRole = authResult.userRole

  // 根据资源类型路由
  switch (resource) {
    case 'auth':
      return handleAuthRoutes(action, method, request, db, env, userId)
    
    case 'users':
      if (userRole !== 'admin') {
        return unauthorizedResponse('需要管理员权限')
      }
      return handleUserRoutes(action, rest, method, request, db, userId)
    
    case 'links':
      return handleLinkRoutes(action, rest, method, request, db, userId, userRole)
    
    case 'questionnaires':
      if (userRole !== 'admin') {
        return unauthorizedResponse('需要管理员权限')
      }
      return handleQuestionnaireRoutes(action, rest, method, request, db)
    
    case 'dashboard':
      return handleDashboardRoutes(action, method, request, db, userId)
    
    case 'notifications':
      return handleNotificationRoutes(action, rest, method, request, db, userId)
    
    default:
      return notFoundResponse('API 路由不存在')
  }
}

/**
 * 认证路由处理
 */
async function handleAuthRoutes(action, method, request, db, env, userId = null) {
  if (action === 'login' && method === 'POST') {
    return handleLogin(request, db, env)
  }
  
  if (action === 'register' && method === 'POST') {
    return handleRegister(request, db)
  }
  
  // /api/auth/me 允许未认证访问（返回未登录状态或用户信息）
  if (action === 'me' && method === 'GET') {
    // 尝试从 token 中获取用户信息
    const token = extractToken(request)
    
    if (token) {
      const payload = verifyToken(token, env)
      if (payload && payload.userId) {
        // 有有效的 token，返回用户信息
        return handleGetCurrentUser(payload.userId, db)
      }
    }
    
    // 没有 token 或 token 无效，返回未登录状态（但保持成功响应格式）
    return successResponse(null, '未登录')
  }
  
  if (action === 'logout' && method === 'POST') {
    return successResponse(null, '登出成功')
  }
  
  if (action === 'refresh' && method === 'POST') {
    return handleRefreshToken(request, db, env)
  }
  
  if (action === 'change-password' && method === 'POST' && userId) {
    return handleChangePassword(request, userId, db)
  }

  return notFoundResponse('认证路由不存在')
}

/**
 * 支付路由处理（易支付）
 * - /api/payment/create  前端创建支付链接
 * - /api/payment/notify  易支付异步通知回调
 */
async function handlePaymentRoutes(action, method, request, db, env) {
  // 尝试多种方式读取环境变量（兼容不同的 Cloudflare 环境）
  const pid = env.ZPAY_PID || env.VITE_ZPAY_PID
  let key = env.ZPAY_KEY || env.VITE_ZPAY_KEY

  // 获取所有相关环境变量键（用于诊断）
  const allEnvKeys = Object.keys(env)
  const relatedKeys = allEnvKeys.filter(k => 
    k.includes('ZPAY') || k.includes('PAY') || k.includes('KEY') || k.includes('PID')
  )

  // 详细的配置检查和日志
  console.log('=== 支付配置深度诊断 ===')
  console.log('环境变量信息:', {
    total_env_keys: allEnvKeys.length,
    related_env_keys: relatedKeys.join(', ') || '未找到相关环境变量',
    pid_exists: !!pid,
    pid_type: typeof pid,
    pid_value: pid ? (pid.length > 8 ? pid.substring(0, 4) + '...' + pid.substring(pid.length - 4) : pid) : '未设置',
    key_exists: !!key,
    key_type: typeof key,
    key_length: key ? key.length : 0,
    key_preview: key ? (key.length > 8 ? key.substring(0, 6) + '...' + key.substring(key.length - 4) : key.substring(0, 10)) : '未设置',
    key_is_string: typeof key === 'string'
  })

  // 检查 KEY 是否为占位符
  let isPlaceholder = false
  let detectedPlaceholder = null
  if (key && typeof key === 'string') {
    const placeholderPatterns = [
      { pattern: '商户KEY', name: '商户KEY' },
      { pattern: '你的', name: '你的' },
      { pattern: 'your', name: 'your' },
      { pattern: 'example', name: 'example' },
      { pattern: 'placeholder', name: 'placeholder' },
      { pattern: 'test', name: 'test' },
      { pattern: 'demo', name: 'demo' },
      { pattern: 'change', name: 'change' }
    ]
    
    for (const { pattern, name } of placeholderPatterns) {
      if (key.toLowerCase().includes(pattern.toLowerCase())) {
        isPlaceholder = true
        detectedPlaceholder = name
        break
      }
    }
  }

  console.log('KEY 验证详情:', {
    key_exists: !!key,
    key_type: typeof key,
    key_length: key ? key.length : 0,
    key_trimmed_length: key && typeof key === 'string' ? key.trim().length : 0,
    is_placeholder: isPlaceholder,
    detected_placeholder: detectedPlaceholder,
    key_first_10_chars: key && typeof key === 'string' ? key.substring(0, 10) : 'N/A',
    key_last_10_chars: key && typeof key === 'string' && key.length > 10 ? key.substring(key.length - 10) : 'N/A',
    key_full_preview: key && typeof key === 'string' && key.length <= 50 ? key : (key ? key.substring(0, 20) + '...' + key.substring(key.length - 10) : 'N/A')
  })

  if (!pid || !key) {
    console.error('❌ 支付配置错误: ZPAY_PID 或 ZPAY_KEY 未配置', {
      pid: !!pid,
      key: !!key,
      available_env_keys: relatedKeys.join(', ') || '无相关环境变量',
      all_env_key_sample: allEnvKeys.slice(0, 5).join(', ')
    })
    return errorResponse(
      '支付配置未完成：ZPAY_PID 或 ZPAY_KEY 环境变量未配置。\n\n' +
      '请检查：\n' +
      '1. Cloudflare Dashboard → Settings → Variables 中是否已配置这两个变量\n' +
      '2. 变量名称拼写是否正确（区分大小写）\n' +
      '3. 如果已配置，请重新部署 Worker（环境变量修改后必须重新部署才能生效）',
      500
    )
  }
  
  if (typeof key !== 'string' || key.trim() === '' || isPlaceholder) {
    console.error('❌ 支付配置错误: ZPAY_KEY 是占位符或无效值', {
      key_type: typeof key,
      key_length: key ? key.length : 0,
      key_preview: key ? key.substring(0, 20) : '未设置',
      is_placeholder: isPlaceholder,
      detected_placeholder: detectedPlaceholder,
      key_full_value: key && typeof key === 'string' && key.length <= 100 ? key : (key ? key.substring(0, 30) + '...' : 'N/A')
    })
    return errorResponse(
      `支付配置错误：检测到 ZPAY_KEY 环境变量的值仍然是占位符（检测到：${detectedPlaceholder || '未知占位符'}）。\n\n` +
      `当前 KEY 值预览：${key ? (key.length > 30 ? key.substring(0, 30) + '...' : key) : '未设置'}\n\n` +
      `请执行以下步骤修复：\n` +
      `1. 登录 Cloudflare Dashboard → 您的项目 → Settings → Variables\n` +
      `2. 找到 ZPAY_KEY 变量，检查当前值\n` +
      `3. 如果值是"商户KEY"等占位符，请更新为易支付后台的真实密钥值\n` +
      `4. 从易支付后台复制真实密钥：https://zpayz.cn\n` +
      `5. 粘贴到 ZPAY_KEY 的值中，确保完全一致\n` +
      `6. 保存环境变量\n` +
      `7. ⚠️ 重要：重新部署 Worker（在 Deployments 页面点击"重新部署"，或推送代码触发自动部署）\n\n` +
      `注意：环境变量修改后必须重新部署才能生效！`,
      500
    )
  }
  
  // 检查 KEY 长度（真实的密钥通常是32位或更长）
  if (key.length < 20) {
    console.error('❌ 支付配置错误: ZPAY_KEY 长度太短', {
      key_length: key.length,
      key_preview: key.substring(0, 20),
      expected_length: '通常为32位或更长'
    })
    return errorResponse(
      `支付配置错误：商户密钥长度异常（当前：${key.length}位，通常应为32位或更长）。\n\n` +
      `请确认使用的是易支付后台的真实密钥值，而不是占位符或示例值。`,
      500
    )
  }
  
  console.log('✅ 支付配置验证通过')

  // 创建支付链接：返回签名后的 submit.php URL，由前端重定向
  if (action === 'create' && method === 'POST') {
    const body = await request.json()
    const {
      name,
      money,
      out_trade_no,
      notify_url,
      return_url,
      type = 'alipay',
      param = '',
    } = body || {}

    if (!name || !money || !out_trade_no || !notify_url || !return_url) {
      return errorResponse('缺少必要参数', 400)
    }

    // 构建签名参数（按易支付要求：ASCII 顺序，不能有空值）
    const baseParams = {}
    
    // 按 ASCII 顺序添加参数（易支付要求参数按字母顺序排序）
    // 注意：只添加非空值
    if (money !== undefined && money !== null && money !== '') baseParams.money = String(money)
    if (name !== undefined && name !== null && name !== '') baseParams.name = String(name)
    if (notify_url !== undefined && notify_url !== null && notify_url !== '') baseParams.notify_url = String(notify_url)
    if (out_trade_no !== undefined && out_trade_no !== null && out_trade_no !== '') baseParams.out_trade_no = String(out_trade_no)
    if (param !== undefined && param !== null && param !== '') baseParams.param = String(param)
    if (pid !== undefined && pid !== null && pid !== '') baseParams.pid = String(pid)
    if (return_url !== undefined && return_url !== null && return_url !== '') baseParams.return_url = String(return_url)
    if (type !== undefined && type !== null && type !== '') baseParams.type = String(type)
    
    // 记录构建的参数（用于调试）
    console.log('构建的签名参数:', {
      param_keys: Object.keys(baseParams).sort().join(', '),
      param_count: Object.keys(baseParams).length,
      money: baseParams.money,
      name: baseParams.name?.substring(0, 30),
      notify_url: baseParams.notify_url,
      out_trade_no: baseParams.out_trade_no,
      param: baseParams.param,
      pid: baseParams.pid,
      return_url: baseParams.return_url,
      type: baseParams.type
    })

    // 注意：KEY 验证已在函数开头完成，这里不需要重复验证
    // 但为了安全，再次确认（防止代码路径绕过）
    if (!key || typeof key !== 'string' || key.trim() === '' || key.includes('商户KEY')) {
      console.error('❌ 签名前 KEY 验证失败（这不应该发生，说明之前的验证被绕过）')
      return errorResponse('支付配置错误：商户密钥配置无效，请检查环境变量并重新部署', 500)
    }
    
    // 额外检查占位符
    const placeholderCheck = ['商户KEY', '你的', 'your', 'example'].some(pattern => 
      key.toLowerCase().includes(pattern.toLowerCase())
    )
    
    if (placeholderCheck) {
      console.error('支付配置错误: ZPAY_KEY 是占位符', {
        key_preview: key.substring(0, 10),
        key_length: key.length
      })
      return errorResponse('支付配置错误：ZPAY_KEY 环境变量值仍然是占位符（如"商户KEY"），请更新为易支付后台的真实密钥值，并重新部署Worker', 500)
    }
    
    if (key.length < 10) {
      console.error('支付配置错误: ZPAY_KEY 长度太短，可能是无效值', {
        key_length: key.length
      })
      return errorResponse('支付配置错误：商户密钥长度无效，请使用易支付后台的真实密钥值', 500)
    }

    // 创建本地订单（pending）
    await db.orders.createOrder({
      outTradeNo: out_trade_no,
      name,
      money,
      questionnaireType: param,
      payType: type,
      status: 'pending',
    })

    // 生成签名（签名函数会自动按 ASCII 排序并过滤空值）
    const sign = md5Sign(baseParams, key)
    
    // 构建支付 URL
    const url = new URL('https://zpayz.cn/submit.php')
    // 添加所有参数（签名函数已确保参数正确）
    Object.entries(baseParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v))
      }
    })
    url.searchParams.set('sign', sign)
    url.searchParams.set('sign_type', 'MD5')
    
    // 调试日志（不输出敏感信息）
    console.log('支付参数:', {
      money: baseParams.money,
      name: baseParams.name,
      out_trade_no: baseParams.out_trade_no,
      pid: baseParams.pid,
      type: baseParams.type,
      key_length: key ? key.length : 0,
      key_valid: key && !key.includes('商户KEY') && !key.includes('你的')
    })
    
    // 调试日志（不输出敏感信息）
    console.log('支付参数:', {
      money: baseParams.money,
      name: baseParams.name,
      out_trade_no: baseParams.out_trade_no,
      pid: baseParams.pid ? '已设置' : '未设置',
      type: baseParams.type,
      sign_type: 'MD5',
      key_length: key ? key.length : 0
    })

    return successResponse({
      payUrl: url.toString(),
    })
  }

  // 易支付异步通知回调（notify_url）
  if (action === 'notify' && method === 'GET') {
    const url = new URL(request.url)
    const params = Object.fromEntries(url.searchParams.entries())

    // 验证签名
    const valid = verifyMd5Sign(params, key)
    if (!valid) {
      return new Response('invalid sign', { status: 400 })
    }

    const { trade_status, out_trade_no, trade_no } = params
    if (trade_status === 'TRADE_SUCCESS') {
      // 根据 out_trade_no 查找订单
      if (out_trade_no) {
        const order = await db.orders.getOrderByOutTradeNo(out_trade_no)
        if (order && order.status !== 'paid') {
          // 为该订单生成一次性测试链接
          const link = await db.links.createLink({
            url: `${env.PUBLIC_BASE_URL || 'https://example.com'}/test/${order.outTradeNo}`,
            questionnaireType: order.questionnaireType,
            createdBy: order.userId || null,
            source: 'zpay',
          })

          await db.orders.updateOrder(order.id, {
            status: 'paid',
            tradeNo: trade_no,
            paidAt: new Date().toISOString(),
            linkId: link.id,
          })
        }
      }

      return new Response('success', { status: 200 })
    }

    return new Response('ignored', { status: 200 })
  }

  // 订单查询（前端 return_url 轮询使用）
  if (action === 'order-status' && method === 'GET') {
    const url = new URL(request.url)
    const outTradeNo = url.searchParams.get('out_trade_no')
    if (!outTradeNo) {
      return errorResponse('缺少 out_trade_no', 400)
    }

    const order = await db.orders.getOrderByOutTradeNo(outTradeNo)
    if (!order) {
      return errorResponse('订单不存在', 404)
    }

    return successResponse({
      outTradeNo: order.outTradeNo,
      status: order.status,
      questionnaireType: order.questionnaireType,
      linkId: order.linkId || null,
    })
  }

  return notFoundResponse('支付路由不存在')
}

/**
 * 登录处理
 */
async function handleLogin(request, db, env) {
  const body = await request.json()
  const { username, password, captchaAnswer, captchaId } = body

  if (!username || !password) {
    return errorResponse('用户名和密码不能为空', 400)
  }

  // 验证验证码
  if (!captchaAnswer || captchaId === undefined) {
    return errorResponse('请输入验证码', 400)
  }

  // 从请求头或会话中获取验证码答案（这里简化处理，实际应该从会话存储中获取）
  // 由于 Cloudflare Workers 不支持会话，我们使用简单的验证方式
  // 在生产环境中，应该使用 KV 存储验证码ID和答案的映射
  // 这里为了简化，我们接受验证码ID和答案，并在前端验证后传入后端
  // 后端再次验证答案是否为数字且在合理范围内（防止简单绕过）
  const answerNum = parseInt(String(captchaAnswer).trim(), 10)
  if (isNaN(answerNum) || answerNum < 0 || answerNum > 1000) {
    return errorResponse('验证码格式错误', 400)
  }

  let user = await db.users.getUserByUsername(username)

  // 如果还没有任何用户，并且使用默认管理员账号登录，则自动创建一个管理员账号
  // 方便首次部署后直接使用：admin / admin123
  if (!user) {
    const allUsers = await db.users.getAllUsers()
    if (allUsers.length === 0 && username === 'admin' && password === 'admin123') {
      user = await db.users.createUser({
        username: 'admin',
        email: 'admin@example.com',
        password: hashPassword('admin123'),
        name: '管理员',
        role: 'admin',
        status: 'active',
        remainingQuota: 9999,
      })
    }
  }

  if (!user) {
    return errorResponse('用户名或密码错误', 401)
  }

  // 验证密码（简化版，实际应该比较哈希）
  if (!verifyPassword(password, user.password)) {
    return errorResponse('用户名或密码错误', 401)
  }

  if (user.status !== 'active') {
    return errorResponse('该账号尚未通过管理员审核或已被禁用，请联系管理员', 403)
  }

  // 生成 Token
  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7天过期
  }, env)

  // 返回用户信息（不包含密码）
  const { password: _, ...userWithoutPassword } = user

  return successResponse({
    token,
    user: userWithoutPassword,
    expiresIn: 7 * 24 * 60 * 60,
  })
}

/**
 * 注册处理
 */
async function handleRegister(request, db) {
  const body = await request.json()
  const { username, email, password, name, captchaAnswer, captchaId } = body

  if (!username || !email || !password) {
    return errorResponse('用户名、邮箱和密码不能为空', 400)
  }

  // 验证验证码
  if (!captchaAnswer || captchaId === undefined) {
    return errorResponse('请输入验证码', 400)
  }

  // 验证验证码格式
  const answerNum = parseInt(String(captchaAnswer).trim(), 10)
  if (isNaN(answerNum) || answerNum < 0 || answerNum > 1000) {
    return errorResponse('验证码格式错误', 400)
  }

  // 检查用户名是否已存在
  const existingUser = await db.users.getUserByUsername(username)
  if (existingUser) {
    return errorResponse('用户名已存在', 400)
  }

  // 检查邮箱是否已存在
  const existingEmail = await db.users.getUserByEmail(email)
  if (existingEmail) {
    return errorResponse('邮箱已被注册', 400)
  }

  // 创建新用户
  const newUser = await db.users.createUser({
    username,
    email,
    password: hashPassword(password),
    name: name || username,
    role: 'user',
    status: 'pending', // 需要管理员审核
    remainingQuota: 0,
  })

  return successResponse({
    message: '注册成功，请等待管理员审核',
    userId: newUser.id,
  }, '注册成功，请等待管理员审核')
}

/**
 * 获取当前用户信息
 */
async function handleGetCurrentUser(userId, db) {
  const user = await db.users.getUserById(userId)
  if (!user) {
    return errorResponse('用户不存在', 404)
  }

  const { password: _, ...userWithoutPassword } = user
  return successResponse(userWithoutPassword)
}

/**
 * 刷新 Token
 */
async function handleRefreshToken(request, db, env) {
  const authResult = await verifyAuth(request, env)
  if (!authResult.valid) {
    return authResult.error
  }

  const user = await db.users.getUserById(authResult.userId)
  if (!user) {
    return errorResponse('用户不存在', 404)
  }

  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  }, env)

  return successResponse({ token })
}

/**
 * 修改密码
 */
async function handleChangePassword(request, userId, db) {
  const body = await request.json()
  const { currentPassword, newPassword } = body

  if (!currentPassword || !newPassword) {
    return errorResponse('当前密码和新密码不能为空', 400)
  }

  const user = await db.users.getUserById(userId)
  if (!user) {
    return errorResponse('用户不存在', 404)
  }

  if (!verifyPassword(currentPassword, user.password)) {
    return errorResponse('当前密码错误', 400)
  }

  await db.users.updateUser(userId, {
    password: hashPassword(newPassword),
  })

  return successResponse(null, '密码修改成功')
}

/**
 * 用户路由处理（管理员）
 */
async function handleUserRoutes(action, rest, method, request, db, currentUserId) {
  // 获取用户列表
  if (!action && method === 'GET') {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
    const search = url.searchParams.get('search') || ''
    const role = url.searchParams.get('role')
    const status = url.searchParams.get('status')

    let users = await db.users.getAllUsers()

    // 过滤
    if (search) {
      users = users.filter(u => 
        u.username.includes(search) || 
        u.email.includes(search) || 
        (u.name && u.name.includes(search))
      )
    }
    if (role) {
      users = users.filter(u => u.role === role)
    }
    if (status) {
      users = users.filter(u => u.status === status)
    }

    const total = users.length
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginatedUsers = users.slice(start, end).map(u => {
      const { password: _, ...userWithoutPassword } = u
      return userWithoutPassword
    })

    return successResponse({
      users: paginatedUsers,
      total,
      page,
      pageSize,
    })
  }

  // 获取单个用户
  if (action && rest.length === 0 && method === 'GET') {
    const user = await db.users.getUserById(action)
    if (!user) {
      return notFoundResponse('用户不存在')
    }
    const { password: _, ...userWithoutPassword } = user
    return successResponse(userWithoutPassword)
  }

  // 更新用户状态
  if (action && rest[0] === 'status' && method === 'PATCH') {
    const userId = action
    const body = await request.json()
    const { status } = body

    const updatedUser = await db.users.updateUser(userId, { status })
    if (!updatedUser) {
      return notFoundResponse('用户不存在')
    }

    const { password: _, ...userWithoutPassword } = updatedUser
    return successResponse(userWithoutPassword, '用户状态更新成功')
  }

  // 更新用户信息
  if (action && rest.length === 0 && method === 'PUT') {
    const userId = action
    const body = await request.json()
    
    const updatedUser = await db.users.updateUser(userId, body)
    if (!updatedUser) {
      return notFoundResponse('用户不存在')
    }

    const { password: _, ...userWithoutPassword } = updatedUser
    return successResponse(userWithoutPassword, '用户信息更新成功')
  }

  // 删除用户
  if (action && rest.length === 0 && method === 'DELETE') {
    await db.users.deleteUser(action)
    return successResponse(null, '用户删除成功')
  }

  // 批量删除用户
  if (action === 'batch-delete' && method === 'POST') {
    const body = await request.json()
    const { userIds } = body
    
    await Promise.all(userIds.map(id => db.users.deleteUser(id)))
    return successResponse(null, '批量删除成功')
  }

  // 重置用户密码
  if (action && rest[0] === 'reset-password' && method === 'POST') {
    const userId = action
    const newPassword = Math.random().toString(36).substring(2, 10)
    
    await db.users.updateUser(userId, {
      password: hashPassword(newPassword),
    })

    return successResponse({ newPassword }, '密码重置成功')
  }

  return notFoundResponse('用户路由不存在')
}

/**
 * 获取可用问卷列表（公开）
 */
async function handleAvailableQuestionnaires(db) {
  const questionnaires = await db.questionnaires.getAllQuestionnaires()
  const available = questionnaires
    .filter(q => q.isPublished)
    .map(q => ({
      type: q.type,
      title: q.title,
      description: q.description,
      questionCount: q.questions?.length || 0,
      isPublished: q.isPublished,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
    }))

  return successResponse(available)
}

/**
 * 链接路由处理
 */
async function handleLinkRoutes(action, rest, method, request, db, userId, userRole) {
  // 生成链接
  if (action === 'generate' && method === 'POST') {
    const body = await request.json()
    const { questionnaireType, quantity = 1, expiresAt, customPrefix } = body

    if (!questionnaireType) {
      return errorResponse('问卷类型不能为空', 400)
    }

    // 检查问卷是否存在
    const questionnaire = await db.questionnaires.getQuestionnaire(questionnaireType)
    if (!questionnaire || !questionnaire.isPublished) {
      return errorResponse('问卷不存在或未上架', 400)
    }

    // 检查用户额度
    const user = await db.users.getUserById(userId)
    if (user.remainingQuota < quantity) {
      return errorResponse('额度不足', 400)
    }

    // 生成链接
    const links = []
    const baseUrl = new URL(request.url).origin
    for (let i = 0; i < quantity; i++) {
      const linkId = `link-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const linkUrl = `${baseUrl}/test/${linkId}`
      
      const link = await db.links.createLink({
        url: linkUrl,
        questionnaireType,
        status: 'unused',
        createdBy: userId,
        expiredAt: expiresAt || null,
      })
      
      links.push({
        id: link.id,
        url: link.url,
        questionnaireType: link.questionnaireType,
        status: link.status,
        createdAt: link.createdAt,
        expiredAt: link.expiredAt,
      })
    }

    // 扣除用户额度
    await db.users.updateUser(userId, {
      remainingQuota: user.remainingQuota - quantity,
    })

    return successResponse({
      links,
      total: links.length,
    }, '链接生成成功')
  }

  // 获取链接列表
  if (!action && method === 'GET') {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
    const status = url.searchParams.get('status')
    const questionnaireType = url.searchParams.get('questionnaireType')

    let links = await db.links.getAllLinks(userId)

    // 过滤
    if (status) {
      links = links.filter(l => l.status === status)
    }
    if (questionnaireType) {
      links = links.filter(l => l.questionnaireType === questionnaireType)
    }

    // 排序（最新的在前）
    links.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    const total = links.length
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginatedLinks = links.slice(start, end)

    return successResponse({
      links: paginatedLinks,
      total,
      page,
      pageSize,
    })
  }

  // 获取单个链接
  if (action && rest.length === 0 && method === 'GET') {
    const link = await db.links.getLinkById(action)
    if (!link) {
      return notFoundResponse('链接不存在')
    }

    // 检查权限
    if (link.createdBy !== userId && userRole !== 'admin') {
      return unauthorizedResponse('无权访问该链接')
    }

    return successResponse(link)
  }

  // 更新链接状态
  if (action && rest[0] === 'status' && method === 'PATCH') {
    const linkId = action
    const body = await request.json()
    const { status } = body

    const link = await db.links.getLinkById(linkId)
    if (!link) {
      return notFoundResponse('链接不存在')
    }

    if (link.createdBy !== userId && userRole !== 'admin') {
      return unauthorizedResponse('无权修改该链接')
    }

    const updatedLink = await db.links.updateLink(linkId, { status })
    return successResponse(updatedLink, '链接状态更新成功')
  }

  // 删除链接
  if (action && rest.length === 0 && method === 'DELETE') {
    const link = await db.links.getLinkById(action)
    if (!link) {
      return notFoundResponse('链接不存在')
    }

    if (link.createdBy !== userId && userRole !== 'admin') {
      return unauthorizedResponse('无权删除该链接')
    }

    await db.links.deleteLink(action)
    return successResponse(null, '链接删除成功')
  }

  // 批量更新链接状态
  if (action === 'batch-update-status' && method === 'PATCH') {
    const body = await request.json()
    const { linkIds, status } = body

    for (const linkId of linkIds) {
      const link = await db.links.getLinkById(linkId)
      if (link && (link.createdBy === userId || userRole === 'admin')) {
        await db.links.updateLink(linkId, { status })
      }
    }

    return successResponse(null, '批量更新成功')
  }

  // 批量删除链接
  if (action === 'batch-delete' && method === 'POST') {
    const body = await request.json()
    const { linkIds } = body

    for (const linkId of linkIds) {
      const link = await db.links.getLinkById(linkId)
      if (link && (link.createdBy === userId || userRole === 'admin')) {
        await db.links.deleteLink(linkId)
      }
    }

    return successResponse(null, '批量删除成功')
  }

  // 获取链接统计
  if (action && rest[0] === 'stats' && method === 'GET') {
    const linkId = action
    const link = await db.links.getLinkById(linkId)
    
    if (!link) {
      return notFoundResponse('链接不存在')
    }

    // 简化版统计（实际应从报告数据计算）
    return successResponse({
      totalViews: link.usedAt ? 1 : 0,
      totalCompletions: link.status === 'used' ? 1 : 0,
      completionRate: link.status === 'used' ? 100 : 0,
    })
  }

  return notFoundResponse('链接路由不存在')
}

/**
 * 题库路由处理（管理员）
 */
async function handleQuestionnaireRoutes(action, rest, method, request, db) {
  // 导入题库
  if (action === 'import' && method === 'POST') {
    const body = await request.json()
    const { type, questions, description } = body

    if (!type || !questions) {
      return errorResponse('问卷类型和题目数据不能为空', 400)
    }

    const questionnaireData = {
      type,
      title: questions.title || type,
      description: description || questions.description || '',
      questions: questions.questions || [],
      dimensions: questions.dimensions || [],
      questionCount: (questions.questions || []).length,
    }

    const saved = await db.questionnaires.createOrUpdateQuestionnaire(questionnaireData)

    return successResponse({
      type: saved.type,
      questionCount: saved.questionCount,
      importedAt: saved.updatedAt,
    }, '题库导入成功')
  }

  // 获取题库列表
  if (!action && method === 'GET') {
    const questionnaires = await db.questionnaires.getAllQuestionnaires()
    
    const list = questionnaires.map(q => ({
      type: q.type,
      title: q.title,
      description: q.description,
      questionCount: q.questions?.length || 0,
      isPublished: q.isPublished,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
    }))

    return successResponse({
      questionnaires: list,
      total: list.length,
    })
  }

  // 获取单个题库
  if (action && rest.length === 0 && method === 'GET') {
    const type = decodeURIComponent(action)
    const questionnaire = await db.questionnaires.getQuestionnaire(type)
    
    if (!questionnaire) {
      return notFoundResponse('题库不存在')
    }

    return successResponse(questionnaire)
  }

  // 更新上架状态
  if (action && rest[0] === 'publish-status' && method === 'PATCH') {
    const type = decodeURIComponent(action)
    const body = await request.json()
    const { isPublished } = body

    const questionnaire = await db.questionnaires.getQuestionnaire(type)
    if (!questionnaire) {
      return notFoundResponse('题库不存在')
    }

    const updated = await db.questionnaires.createOrUpdateQuestionnaire({
      ...questionnaire,
      isPublished,
    })

    return successResponse(updated, `问卷已${isPublished ? '上架' : '下架'}`)
  }

  // 重命名问卷
  if (action && rest[0] === 'rename' && method === 'PATCH') {
    const oldType = decodeURIComponent(action)
    const body = await request.json()
    const { newType } = body

    const questionnaire = await db.questionnaires.getQuestionnaire(oldType)
    if (!questionnaire) {
      return notFoundResponse('题库不存在')
    }

    // 创建新类型的问卷
    await db.questionnaires.createOrUpdateQuestionnaire({
      ...questionnaire,
      type: newType,
    })

    // 删除旧类型的问卷
    await db.questionnaires.deleteQuestionnaire(oldType)

    return successResponse(null, '问卷重命名成功')
  }

  // 删除题库
  if (action && rest.length === 0 && method === 'DELETE') {
    const type = decodeURIComponent(action)
    await db.questionnaires.deleteQuestionnaire(type)
    return successResponse(null, '问卷删除成功')
  }

  return notFoundResponse('题库路由不存在')
}

/**
 * Dashboard 路由处理
 */
async function handleDashboardRoutes(action, method, request, db, userId) {
  // 获取统计数据
  if (action === 'stats' && method === 'GET') {
    const user = await db.users.getUserById(userId)
    const links = await db.links.getAllLinks(userId)
    
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const todayUsedLinks = links.filter(l => {
      if (!l.usedAt) return false
      return new Date(l.usedAt) >= todayStart
    }).length

    const unusedLinks = links.filter(l => l.status === 'unused').length
    const totalUsed = links.filter(l => l.status === 'used').length
    const participationRate = links.length > 0 
      ? Math.round((totalUsed / links.length) * 100) 
      : 0

    // 按问卷类型统计
    const questionnaires = await db.questionnaires.getAllQuestionnaires()
    const questionnaireSummary = questionnaires.map(q => {
      const typeLinks = links.filter(l => l.questionnaireType === q.type)
      const usedLinks = typeLinks.filter(l => l.status === 'used').length
      const completionRate = typeLinks.length > 0
        ? Math.round((usedLinks / typeLinks.length) * 100)
        : 0

      return {
        type: q.type,
        totalLinks: typeLinks.length,
        usedLinks,
        completionRate,
      }
    })

    return successResponse({
      totalLinks: links.length,
      remainingQuota: user.remainingQuota,
      todayUsedLinks,
      unusedLinks,
      participationRate,
      questionnaireSummary,
    })
  }

  // 获取图表数据
  if (action === 'chart' && method === 'GET') {
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || '7d'
    
    const links = await db.links.getAllLinks(userId)
    const days = period === '7d' ? 7 : period === '15d' ? 15 : 30
    
    // 简化版图表数据（实际应该按日期分组统计）
    const data = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayLinks = links.filter(l => {
        const linkDate = l.createdAt.split('T')[0]
        return linkDate === dateStr
      })

      data.push({
        name: dateStr,
        链接数: dayLinks.length,
        使用率: dayLinks.length > 0
          ? Math.round((dayLinks.filter(l => l.status === 'used').length / dayLinks.length) * 100)
          : 0,
      })
    }

    return successResponse({
      data,
      period,
    })
  }

  // 获取实时统计
  if (action === 'realtime' && method === 'GET') {
    const user = await db.users.getUserById(userId)
    const links = await db.links.getAllLinks(userId)
    
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const todayUsedLinks = links.filter(l => {
      if (!l.usedAt) return false
      return new Date(l.usedAt) >= todayStart
    }).length

    return successResponse({
      remainingQuota: user.remainingQuota,
      todayUsedLinks,
    })
  }

  return notFoundResponse('Dashboard 路由不存在')
}

/**
 * 通知路由处理
 */
async function handleNotificationRoutes(action, rest, method, request, db, userId) {
  // 获取通知列表
  if (!action && method === 'GET') {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
    const type = url.searchParams.get('type')
    const read = url.searchParams.get('read')

    let notifications = await db.notifications.getUserNotifications(userId)

    // 过滤
    if (type) {
      notifications = notifications.filter(n => n.type === type)
    }
    if (read !== null && read !== undefined) {
      const isRead = read === 'true'
      notifications = notifications.filter(n => n.read === isRead)
    }

    const total = notifications.length
    const unreadCount = notifications.filter(n => !n.read).length
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginatedNotifications = notifications.slice(start, end)

    return successResponse({
      notifications: paginatedNotifications,
      total,
      unreadCount,
      page,
      pageSize,
    })
  }

  // 获取未读数量
  if (action === 'unread-count' && method === 'GET') {
    const notifications = await db.notifications.getUserNotifications(userId)
    const unreadCount = notifications.filter(n => !n.read).length

    return successResponse({ count: unreadCount })
  }

  // 标记通知为已读
  if (action && rest[0] === 'read' && method === 'PATCH') {
    const notificationId = action
    await db.notifications.updateNotification(notificationId, { read: true })
    return successResponse(null, '已标记为已读')
  }

  // 批量标记为已读
  if (action === 'mark-read' && method === 'PATCH') {
    const body = await request.json()
    const { notificationIds } = body

    await Promise.all(
      notificationIds.map(id => 
        db.notifications.updateNotification(id, { read: true })
      )
    )

    return successResponse({ markedCount: notificationIds.length }, '批量标记成功')
  }

  // 标记全部为已读
  if (action === 'mark-all-read' && method === 'POST') {
    const notifications = await db.notifications.getUserNotifications(userId)
    const unreadNotifications = notifications.filter(n => !n.read)

    await Promise.all(
      unreadNotifications.map(n => 
        db.notifications.updateNotification(n.id, { read: true })
      )
    )

    return successResponse({ markedCount: unreadNotifications.length }, '已标记全部为已读')
  }

  // 删除通知
  if (action && rest.length === 0 && method === 'DELETE') {
    await db.notifications.deleteNotification(action)
    return successResponse(null, '通知删除成功')
  }

  // 批量删除通知
  if (action === 'batch-delete' && method === 'POST') {
    const body = await request.json()
    const { notificationIds } = body

    await Promise.all(
      notificationIds.map(id => db.notifications.deleteNotification(id))
    )

    return successResponse(null, '批量删除成功')
  }

  return notFoundResponse('通知路由不存在')
}


