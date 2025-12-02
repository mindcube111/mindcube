/**
 * API 主路由处理器
 * 处理所有 /api/* 的请求
 */

import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '../utils/response.js'
import { verifyAuth, requireAdmin, hashPassword, verifyPassword } from '../utils/auth.js'
import { generateToken } from '../utils/jwt.js'
import { UserDB, LinkDB, QuestionnaireDB, NotificationDB, OrderDB } from '../utils/db.js'
import { getZPayConfig, createZPaySign, verifyCallbackSign, getPackageConfig } from '../utils/zpay.js'

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
    orders: new OrderDB(mockKV),
  }
}

/**
 * 路由处理器
 */
export async function onRequest(context) {
  const { request, env, params } = context
  const { path } = params || {}
  const url = new URL(request.url)
  const pathSegments = (path || '').split('/').filter(Boolean)
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

  // 支付回调（无需认证）
  if (resource === 'zpay' && action === 'notify') {
    const config = getZPayConfig(env)
    return handleZPayNotify(request, db, config)
  }

  // 认证相关路由（不需要认证）
  if (resource === 'auth') {
    return handleAuthRoutes(action, method, request, db, env)
  }

  // 公开的问卷列表（不需要认证）
  if (resource === 'questionnaires' && action === 'available') {
    return handleAvailableQuestionnaires(db)
  }

  // 统一检查：所有 /admin/* 路径必须要求管理员权限
  if (resource === 'admin') {
    const adminResult = await requireAdmin(request, env)
    if (!adminResult.valid) {
      return adminResult.error
    }
    // 继续处理 admin 路由（如果有的话）
    // 这里可以根据 action 进一步路由到不同的处理器
    // 例如：/api/admin/users -> handleAdminUserRoutes
    // 目前先返回 404，后续可以扩展
    return notFoundResponse('Admin API 路由不存在')
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
    
    case 'zpay':
      return handleZPayRoutes(action, method, request, db, env, userId, userRole)
    
    case 'orders':
      return handleOrderRoutes(action, rest, method, request, db, userId, userRole)
    
    default:
      return notFoundResponse('API 路由不存在')
  }
}

/**
 * ZPAY 支付回调处理（notify_url）
 * 文档要求：
 * - 接收 GET 请求参数
 * - 验证签名
 * - 校验金额
 * - 处理业务逻辑后返回纯文本 "success"
 */
async function handleZPayNotify(request, db, zpayConfig) {
  const url = new URL(request.url)
  const searchParams = url.searchParams

  // 1. 验证签名
  const verifyResult = await verifyCallbackSign(searchParams, zpayConfig.KEY)
  if (!verifyResult.valid) {
    console.warn('ZPAY 回调签名校验失败:', verifyResult.error)
    return new Response(verifyResult.error || '签名校验失败', { status: 400 })
  }

  // 2. 解析核心参数
  const tradeStatus = searchParams.get('trade_status') || ''
  const outTradeNo = searchParams.get('out_trade_no') || ''
  const money = searchParams.get('money') || ''
  const param = searchParams.get('param') || ''
  const buyer = searchParams.get('buyer') || ''

  // 只有 TRADE_SUCCESS 才认为支付成功
  if (tradeStatus !== 'TRADE_SUCCESS') {
    console.warn('ZPAY 回调状态非成功:', tradeStatus, outTradeNo)
    return new Response('ignore', { status: 200 })
  }

  // 3. TODO: 在这里根据 out_trade_no 找到你本地的订单 / 套餐购买记录
  //    然后校验金额 money 是否与订单金额一致，防止伪造：
  const order = await db.orders.getOrderByOutTradeNo(outTradeNo)
  if (!order) {
    console.warn('ZPAY 回调：未找到本地订单', outTradeNo)
    // 安全起见，这里不返回 success，保持回调重试，方便你后续排查
    return new Response('order not found', { status: 404 })
  }

  const callbackAmountNum = Number(money)
  const callbackCents = Number.isFinite(callbackAmountNum) ? Math.round(callbackAmountNum * 100) : NaN

  if (!Number.isFinite(callbackCents) || order.amountCents !== callbackCents) {
    console.error('ZPAY 回调：金额不一致', {
      outTradeNo,
      orderAmount: order.amount,
      orderAmountCents: order.amountCents,
      callbackAmount: money,
      callbackCents,
    })
    return new Response('amount mismatch', { status: 400 })
  }

  // 4. 更新订单状态为“已支付”，记录支付时间和买家信息
  const paidAt = new Date().toISOString()
  const updatedOrder = await db.orders.updateOrder(order.id, {
    status: 'paid',
    paidAt,
    buyer,
  })

  // 5. 根据套餐为对应用户增加额度（如果有 userId 和 packageId）
  if (order.userId && order.packageId) {
    const pkgConfig = getPackageConfig(order.packageId)
    if (pkgConfig) {
      const user = await db.users.getUserById(order.userId)
      if (user) {
        let quotaDelta = 0
        if (pkgConfig.unlimited) {
          // 年费不限量套餐，这里简单设置为一个很大的额度，具体策略可按需调整
          quotaDelta = 1000000
        } else {
          quotaDelta = pkgConfig.quota || 0
        }

        const newQuota = (user.remainingQuota || 0) + quotaDelta
        await db.users.updateUser(order.userId, {
          remainingQuota: newQuota,
        })
      }
    }
  }

  console.log('ZPAY 支付成功回调（已更新订单并尝试增加额度）：', {
    outTradeNo,
    money,
    param,
    orderId: updatedOrder?.id,
  })

  // 5. 按文档要求返回纯文本 success
  return new Response('success', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

/**
 * 创建支付订单（在跳转到 ZPAY 之前调用）
 * 前端会传入：outTradeNo、amount、packageId、packageName、userId
 */
async function handleOrderCreate(request, db) {
  const body = await request.json().catch(() => ({}))
  const { outTradeNo, amount, packageId, packageName } = body || {}

  if (!outTradeNo || !amount || !packageId) {
    return errorResponse('缺少必要参数：outTradeNo / amount / packageId', 400)
  }

  const pkg = getPackageConfig(packageId)
  const amountNum = Number(amount)

  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return errorResponse('金额不合法', 400)
  }

  // 如果能找到套餐配置，顺便校验一下价格是否一致（仅做告警，不强制）
  if (pkg && pkg.price && pkg.price !== amountNum) {
    console.warn('订单价格与套餐配置不一致', {
      packageId,
      configPrice: pkg.price,
      amountNum,
    })
  }

  const order = await db.orders.createOrder({
    outTradeNo,
    amount: amountNum,
    packageId,
    packageName: packageName || pkg?.name || '',
    // userId 将在路由层强制设置，防止前端伪造
    status: 'pending',
  })

  return successResponse(order, '订单创建成功')
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
  
  if (action === 'me' && method === 'GET' && userId) {
    return handleGetCurrentUser(userId, db)
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
 * 登录处理
 */
async function handleLogin(request, db, env) {
  const body = await request.json()
  const { username, password } = body

  if (!username || !password) {
    return errorResponse('用户名和密码不能为空', 400)
  }

  const user = await db.users.getUserByUsername(username)
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
  const { username, email, password, name } = body

  if (!username || !email || !password) {
    return errorResponse('用户名、邮箱和密码不能为空', 400)
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

/**
 * 订单路由处理
 * - GET /api/orders         获取当前用户的订单列表（管理员可查看全部或指定用户）
 * - GET /api/orders/:outTradeNo  根据订单号获取订单详情
 */
async function handleOrderRoutes(action, rest, method, request, db, userId, userRole) {
  // 创建订单（需要已登录用户）
  if (action === 'create' && method === 'POST') {
    const baseResponse = await handleOrderCreate(request, db)
    // 将 userId 强行写入订单（通过二次更新），防止前端伪造 userId
    try {
      const cloned = baseResponse.clone()
      const data = await cloned.json().catch(() => null)
      if (data?.success && data.data?.id && userId) {
        await db.orders.updateOrder(data.data.id, { userId })
      }
    } catch (e) {
      console.warn('更新订单 userId 失败：', e)
    }
    return baseResponse
  }

  // 根据订单号获取订单详情
  if (action && rest.length === 0 && method === 'GET') {
    const outTradeNo = action
    const order = await db.orders.getOrderByOutTradeNo(outTradeNo)
    
    if (!order) {
      return notFoundResponse('订单不存在')
    }

    // 权限检查：非管理员只能查看自己的订单
    if (userRole !== 'admin' && order.userId !== userId) {
      return unauthorizedResponse('无权访问该订单')
    }

    return successResponse(order)
  }

  // 获取订单列表
  if (!action && method === 'GET') {
    const url = new URL(request.url)
    const targetUserId = url.searchParams.get('userId')

    let ordersIndex = []
    const indexRaw = await db.orders.kv.get(db.orders.orderIndexKey)
    if (indexRaw) {
      try {
        ordersIndex = JSON.parse(indexRaw)
      } catch {
        ordersIndex = []
      }
    }

    const allOrders = await Promise.all(
      ordersIndex.map((id) => db.orders.getOrderById(id)),
    )
    const validOrders = allOrders.filter(Boolean)

    // 非管理员：只能看自己的订单
    let filtered = validOrders
    if (userRole !== 'admin') {
      filtered = validOrders.filter((o) => o.userId === userId)
    } else if (targetUserId) {
      filtered = validOrders.filter((o) => o.userId === targetUserId)
    }

    // 按时间倒序
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return successResponse({
      orders: filtered,
      total: filtered.length,
    })
  }

  return notFoundResponse('订单路由不存在')
}

/**
 * ZPAY 路由处理（签名在后端完成）
 * - POST /api/zpay/prepare  准备支付参数，返回 submit_url 和签名后的表单字段
 */
async function handleZPayRoutes(action, method, request, db, env, userId, userRole) {
  if (action === 'prepare' && method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const { name, money, outTradeNo, notifyUrl, returnUrl, param } = body || {}

    if (!name || !money || !outTradeNo || !notifyUrl || !returnUrl) {
      return errorResponse('缺少必要参数：name / money / outTradeNo / notifyUrl / returnUrl', 400)
    }

    const amountNum = Number(money)
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return errorResponse('金额不合法', 400)
    }

    const zpayConfig = getZPayConfig(env)
    const baseParams = {
      name,
      money: amountNum.toFixed(2),
      type: 'alipay',
      out_trade_no: outTradeNo,
      notify_url: notifyUrl,
      pid: zpayConfig.PID,
      param: param || '',
      return_url: returnUrl,
      sign_type: 'MD5',
    }

    const sign = await createZPaySign(baseParams, zpayConfig.KEY)

    const allParams = {
      ...baseParams,
      sign,
    }

    return successResponse(
      {
        submitUrl: `${zpayConfig.GATEWAY}/submit.php`,
        params: allParams,
      },
      '支付参数生成成功',
    )
  }

  return notFoundResponse('ZPAY 路由不存在')
}


