/**
 * 数据库操作工具
 * 使用 Cloudflare KV 作为数据存储
 */

/**
 * 生成唯一 ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 用户相关操作
 */
export class UserDB {
  constructor(kv) {
    this.kv = kv
    this.userPrefix = 'user:'
    this.userIndexKey = 'users:index'
  }

  async getUserById(userId) {
    const data = await this.kv.get(`${this.userPrefix}${userId}`)
    return data ? JSON.parse(data) : null
  }

  async getUserByUsername(username) {
    const users = await this.getAllUsers()
    return users.find(u => u.username === username) || null
  }

  async getUserByEmail(email) {
    const users = await this.getAllUsers()
    return users.find(u => u.email === email) || null
  }

  async getAllUsers() {
    const index = await this.kv.get(this.userIndexKey)
    if (!index) {
      return []
    }
    const userIds = JSON.parse(index)
    const users = await Promise.all(
      userIds.map(id => this.getUserById(id))
    )
    return users.filter(Boolean)
  }

  async createUser(user) {
    const userId = generateId()
    const newUser = {
      ...user,
      id: userId,
      createdAt: new Date().toISOString(),
      remainingQuota: user.remainingQuota || 0,
    }
    
    await this.kv.put(`${this.userPrefix}${userId}`, JSON.stringify(newUser))
    
    // 更新索引
    const index = await this.kv.get(this.userIndexKey)
    const userIds = index ? JSON.parse(index) : []
    userIds.push(userId)
    await this.kv.put(this.userIndexKey, JSON.stringify(userIds))
    
    return newUser
  }

  async updateUser(userId, updates) {
    const user = await this.getUserById(userId)
    if (!user) {
      return null
    }
    
    const updatedUser = {
      ...user,
      ...updates,
      id: userId,
    }
    
    await this.kv.put(`${this.userPrefix}${userId}`, JSON.stringify(updatedUser))
    return updatedUser
  }

  async deleteUser(userId) {
    await this.kv.delete(`${this.userPrefix}${userId}`)
    
    // 更新索引
    const index = await this.kv.get(this.userIndexKey)
    if (index) {
      const userIds = JSON.parse(index).filter(id => id !== userId)
      await this.kv.put(this.userIndexKey, JSON.stringify(userIds))
    }
  }
}

/**
 * 链接相关操作
 */
export class LinkDB {
  constructor(kv) {
    this.kv = kv
    this.linkPrefix = 'link:'
    this.linkIndexKey = 'links:index'
    this.userLinksPrefix = 'user:links:'
  }

  async getLinkById(linkId) {
    const data = await this.kv.get(`${this.linkPrefix}${linkId}`)
    return data ? JSON.parse(data) : null
  }

  async getAllLinks(userId = null) {
    const index = await this.kv.get(this.linkIndexKey)
    if (!index) {
      return []
    }
    const linkIds = JSON.parse(index)
    const links = await Promise.all(
      linkIds.map(id => this.getLinkById(id))
    )
    const validLinks = links.filter(Boolean)
    
    if (userId) {
      return validLinks.filter(link => link.createdBy === userId)
    }
    return validLinks
  }

  async createLink(link) {
    const linkId = generateId()
    const newLink = {
      ...link,
      id: linkId,
      createdAt: new Date().toISOString(),
      status: link.status || 'unused',
    }
    
    await this.kv.put(`${this.linkPrefix}${linkId}`, JSON.stringify(newLink))
    
    // 更新索引
    const index = await this.kv.get(this.linkIndexKey)
    const linkIds = index ? JSON.parse(index) : []
    linkIds.push(linkId)
    await this.kv.put(this.linkIndexKey, JSON.stringify(linkIds))
    
    // 更新用户链接索引
    if (newLink.createdBy) {
      const userLinksKey = `${this.userLinksPrefix}${newLink.createdBy}`
      const userLinks = await this.kv.get(userLinksKey)
      const linkIds = userLinks ? JSON.parse(userLinks) : []
      linkIds.push(linkId)
      await this.kv.put(userLinksKey, JSON.stringify(linkIds))
    }
    
    return newLink
  }

  async updateLink(linkId, updates) {
    const link = await this.getLinkById(linkId)
    if (!link) {
      return null
    }
    
    const updatedLink = {
      ...link,
      ...updates,
      id: linkId,
    }
    
    await this.kv.put(`${this.linkPrefix}${linkId}`, JSON.stringify(updatedLink))
    return updatedLink
  }

  async deleteLink(linkId) {
    const link = await this.getLinkById(linkId)
    await this.kv.delete(`${this.linkPrefix}${linkId}`)
    
    // 更新索引
    const index = await this.kv.get(this.linkIndexKey)
    if (index) {
      const linkIds = JSON.parse(index).filter(id => id !== linkId)
      await this.kv.put(this.linkIndexKey, JSON.stringify(linkIds))
    }
    
    // 更新用户链接索引
    if (link?.createdBy) {
      const userLinksKey = `${this.userLinksPrefix}${link.createdBy}`
      const userLinks = await this.kv.get(userLinksKey)
      if (userLinks) {
        const linkIds = JSON.parse(userLinks).filter(id => id !== linkId)
        await this.kv.put(userLinksKey, JSON.stringify(linkIds))
      }
    }
  }

  async createLinks(links) {
    return Promise.all(links.map(link => this.createLink(link)))
  }
}

/**
 * 题库相关操作
 */
export class QuestionnaireDB {
  constructor(kv) {
    this.kv = kv
    this.questionnairePrefix = 'questionnaire:'
    this.questionnaireIndexKey = 'questionnaires:index'
  }

  async getQuestionnaire(type) {
    const data = await this.kv.get(`${this.questionnairePrefix}${type}`)
    return data ? JSON.parse(data) : null
  }

  async getAllQuestionnaires() {
    const index = await this.kv.get(this.questionnaireIndexKey)
    if (!index) {
      return []
    }
    const types = JSON.parse(index)
    const questionnaires = await Promise.all(
      types.map(type => this.getQuestionnaire(type))
    )
    return questionnaires.filter(Boolean)
  }

  async createOrUpdateQuestionnaire(questionnaire) {
    const existing = await this.getQuestionnaire(questionnaire.type)
    
    const questionnaireData = {
      ...questionnaire,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished: questionnaire.isPublished ?? existing?.isPublished ?? false,
    }
    
    await this.kv.put(`${this.questionnairePrefix}${questionnaire.type}`, JSON.stringify(questionnaireData))
    
    // 更新索引
    const index = await this.kv.get(this.questionnaireIndexKey)
    const types = index ? JSON.parse(index) : []
    if (!types.includes(questionnaire.type)) {
      types.push(questionnaire.type)
      await this.kv.put(this.questionnaireIndexKey, JSON.stringify(types))
    }
    
    return questionnaireData
  }

  async deleteQuestionnaire(type) {
    await this.kv.delete(`${this.questionnairePrefix}${type}`)
    
    // 更新索引
    const index = await this.kv.get(this.questionnaireIndexKey)
    if (index) {
      const types = JSON.parse(index).filter(t => t !== type)
      await this.kv.put(this.questionnaireIndexKey, JSON.stringify(types))
    }
  }
}

/**
 * 通知相关操作
 */
export class NotificationDB {
  constructor(kv) {
    this.kv = kv
    this.notificationPrefix = 'notification:'
    this.userNotificationsPrefix = 'user:notifications:'
  }

  async getNotificationById(notificationId) {
    const data = await this.kv.get(`${this.notificationPrefix}${notificationId}`)
    return data ? JSON.parse(data) : null
  }

  async getUserNotifications(userId) {
    const key = `${this.userNotificationsPrefix}${userId}`
    const data = await this.kv.get(key)
    if (!data) {
      return []
    }
    const notificationIds = JSON.parse(data)
    const notifications = await Promise.all(
      notificationIds.map(id => this.getNotificationById(id))
    )
    return notifications.filter(Boolean).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    )
  }

  async createNotification(notification) {
    const notificationId = generateId()
    const newNotification = {
      ...notification,
      id: notificationId,
      read: false,
      createdAt: new Date().toISOString(),
    }
    
    await this.kv.put(`${this.notificationPrefix}${notificationId}`, JSON.stringify(newNotification))
    
    // 更新用户通知索引
    if (newNotification.userId) {
      const key = `${this.userNotificationsPrefix}${newNotification.userId}`
      const data = await this.kv.get(key)
      const notificationIds = data ? JSON.parse(data) : []
      notificationIds.push(notificationId)
      await this.kv.put(key, JSON.stringify(notificationIds))
    }
    
    return newNotification
  }

  async updateNotification(notificationId, updates) {
    const notification = await this.getNotificationById(notificationId)
    if (!notification) {
      return null
    }
    
    const updatedNotification = {
      ...notification,
      ...updates,
      id: notificationId,
    }
    
    await this.kv.put(`${this.notificationPrefix}${notificationId}`, JSON.stringify(updatedNotification))
    return updatedNotification
  }

  async deleteNotification(notificationId) {
    const notification = await this.getNotificationById(notificationId)
    await this.kv.delete(`${this.notificationPrefix}${notificationId}`)
    
    // 更新用户通知索引
    if (notification?.userId) {
      const key = `${this.userNotificationsPrefix}${notification.userId}`
      const data = await this.kv.get(key)
      if (data) {
        const notificationIds = JSON.parse(data).filter(id => id !== notificationId)
        await this.kv.put(key, JSON.stringify(notificationIds))
      }
    }
  }
}

/**
 * 测评报告相关操作
 * 主要用于存储通过公开测试链接提交的答卷结果
 */
export class ReportDB {
  constructor(kv) {
    this.kv = kv
    this.reportPrefix = 'report:'
    this.reportIndexKey = 'reports:index'
    this.linkReportsPrefix = 'link:reports:'
  }

  async getReportById(reportId) {
    const data = await this.kv.get(`${this.reportPrefix}${reportId}`)
    return data ? JSON.parse(data) : null
  }

  async getReportsByLinkId(linkId) {
    const key = `${this.linkReportsPrefix}${linkId}`
    const data = await this.kv.get(key)
    if (!data) {
      return []
    }
    const reportIds = JSON.parse(data)
    const reports = await Promise.all(reportIds.map(id => this.getReportById(id)))
    return reports.filter(Boolean)
  }

  async getAllReports() {
    const index = await this.kv.get(this.reportIndexKey)
    if (!index) {
      return []
    }
    const ids = JSON.parse(index)
    const reports = await Promise.all(ids.map(id => this.getReportById(id)))
    return reports.filter(Boolean)
  }

  async createReport(report) {
    const reportId = generateId()
    const now = new Date().toISOString()
    const newReport = {
      ...report,
      id: reportId,
      createdAt: now,
      completedAt: report.completedAt || now,
    }

    await this.kv.put(`${this.reportPrefix}${reportId}`, JSON.stringify(newReport))

    // 全局索引
    const index = await this.kv.get(this.reportIndexKey)
    const ids = index ? JSON.parse(index) : []
    ids.push(reportId)
    await this.kv.put(this.reportIndexKey, JSON.stringify(ids))

    // 按链接索引
    if (newReport.linkId) {
      const key = `${this.linkReportsPrefix}${newReport.linkId}`
      const data = await this.kv.get(key)
      const linkReports = data ? JSON.parse(data) : []
      linkReports.push(reportId)
      await this.kv.put(key, JSON.stringify(linkReports))
    }

    return newReport
  }
}

/**
 * 订单相关操作（支付订单）
 */
export class OrderDB {
  constructor(kv) {
    this.kv = kv
    this.orderPrefix = 'order:'
    this.orderIndexKey = 'orders:index'
    this.outTradeIndexPrefix = 'order:out_trade_no:'
  }

  async getOrderById(orderId) {
    const data = await this.kv.get(`${this.orderPrefix}${orderId}`)
    return data ? JSON.parse(data) : null
  }

  async getOrderByOutTradeNo(outTradeNo) {
    const key = `${this.outTradeIndexPrefix}${outTradeNo}`
    const orderId = await this.kv.get(key)
    if (!orderId) return null
    return this.getOrderById(orderId)
  }

  async createOrder(order) {
    try {
      const orderId = generateId()
      const now = new Date().toISOString()
      const amountNum = Number(order.amount || 0)
      const amountCents = Number.isFinite(amountNum) ? Math.round(amountNum * 100) : 0
      const newOrder = {
        ...order,
        id: orderId,
        status: order.status || 'pending', // pending | paid | failed
        createdAt: now,
        amount: amountNum,
        amountCents,
      }

      // 检查 KV 是否可用
      if (!this.kv || typeof this.kv.put !== 'function') {
        throw new Error('KV 存储未配置或不可用')
      }

      await this.kv.put(`${this.orderPrefix}${orderId}`, JSON.stringify(newOrder))

      // 索引：全部订单
      const index = await this.kv.get(this.orderIndexKey)
      let orderIds = []
      if (index) {
        try {
          orderIds = JSON.parse(index)
          if (!Array.isArray(orderIds)) {
            orderIds = []
          }
        } catch (e) {
          console.warn('解析订单索引失败，使用空数组:', e)
          orderIds = []
        }
      }
      orderIds.push(orderId)
      await this.kv.put(this.orderIndexKey, JSON.stringify(orderIds))

      // 索引：按 out_trade_no 快速查找
      if (newOrder.outTradeNo) {
        await this.kv.put(`${this.outTradeIndexPrefix}${newOrder.outTradeNo}`, orderId)
      }

      return newOrder
    } catch (error) {
      console.error('创建订单失败:', error)
      throw new Error(`创建订单失败: ${error.message || '未知错误'}`)
    }
  }

  async updateOrder(orderId, updates) {
    const order = await this.getOrderById(orderId)
    if (!order) return null

    const updated = {
      ...order,
      ...updates,
      id: orderId,
    }

    await this.kv.put(`${this.orderPrefix}${orderId}`, JSON.stringify(updated))

    // 如果更新了 outTradeNo，刷新索引
    if (updates.outTradeNo && updates.outTradeNo !== order.outTradeNo) {
      if (order.outTradeNo) {
        await this.kv.delete(`${this.outTradeIndexPrefix}${order.outTradeNo}`)
      }
      await this.kv.put(`${this.outTradeIndexPrefix}${updates.outTradeNo}`, orderId)
    }

    return updated
  }
}

