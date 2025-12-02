var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// utils/jwt.js
function getJWTSecret(env) {
  return env?.JWT_SECRET || "your-jwt-secret-key-change-in-production";
}
__name(getJWTSecret, "getJWTSecret");
function base64UrlEncode(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
__name(base64UrlEncode, "base64UrlEncode");
function base64UrlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return atob(str);
}
__name(base64UrlDecode, "base64UrlDecode");
function generateToken(payload, env = {}) {
  const JWT_SECRET = getJWTSecret(env);
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = base64UrlEncode(
    JSON.stringify({ header: encodedHeader, payload: encodedPayload, secret: getJWTSecret(env) })
  );
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
__name(generateToken, "generateToken");
function verifyToken(token, env = {}) {
  const JWT_SECRET = getJWTSecret(env);
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    const [encodedHeader, encodedPayload, signature] = parts;
    const secret = getJWTSecret(env);
    const expectedSignature = base64UrlEncode(
      JSON.stringify({ header: encodedHeader, payload: encodedPayload, secret })
    );
    if (signature !== expectedSignature) {
      return null;
    }
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && payload.exp < Date.now() / 1e3) {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}
__name(verifyToken, "verifyToken");
function extractToken(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
__name(extractToken, "extractToken");

// utils/auth.js
async function verifyAuth(request, env = {}) {
  const token = extractToken(request);
  if (!token) {
    return { valid: false, error: (void 0)("\u7F3A\u5C11\u8BA4\u8BC1 Token") };
  }
  const payload = verifyToken(token, env);
  if (!payload) {
    return { valid: false, error: (void 0)("Token \u65E0\u6548\u6216\u5DF2\u8FC7\u671F") };
  }
  return { valid: true, userId: payload.userId, userRole: payload.role };
}
__name(verifyAuth, "verifyAuth");
async function requireAdmin(request, env = {}) {
  const authResult = await verifyAuth(request, env);
  if (!authResult.valid) {
    return authResult;
  }
  if (authResult.userRole !== "admin") {
    return {
      valid: false,
      error: (void 0)("\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650")
    };
  }
  return authResult;
}
__name(requireAdmin, "requireAdmin");
function hashPassword(password) {
  return btoa(password).replace(/=/g, "");
}
__name(hashPassword, "hashPassword");
function verifyPassword(password, hashedPassword) {
  return hashPassword(password) === hashedPassword;
}
__name(verifyPassword, "verifyPassword");

// utils/db.js
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
__name(generateId, "generateId");
var UserDB = class {
  static {
    __name(this, "UserDB");
  }
  constructor(kv) {
    this.kv = kv;
    this.userPrefix = "user:";
    this.userIndexKey = "users:index";
  }
  async getUserById(userId) {
    const data = await this.kv.get(`${this.userPrefix}${userId}`);
    return data ? JSON.parse(data) : null;
  }
  async getUserByUsername(username) {
    const users = await this.getAllUsers();
    return users.find((u) => u.username === username) || null;
  }
  async getUserByEmail(email) {
    const users = await this.getAllUsers();
    return users.find((u) => u.email === email) || null;
  }
  async getAllUsers() {
    const index = await this.kv.get(this.userIndexKey);
    if (!index) {
      return [];
    }
    const userIds = JSON.parse(index);
    const users = await Promise.all(
      userIds.map((id) => this.getUserById(id))
    );
    return users.filter(Boolean);
  }
  async createUser(user) {
    const userId = generateId();
    const newUser = {
      ...user,
      id: userId,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      remainingQuota: user.remainingQuota || 0
    };
    await this.kv.put(`${this.userPrefix}${userId}`, JSON.stringify(newUser));
    const index = await this.kv.get(this.userIndexKey);
    const userIds = index ? JSON.parse(index) : [];
    userIds.push(userId);
    await this.kv.put(this.userIndexKey, JSON.stringify(userIds));
    return newUser;
  }
  async updateUser(userId, updates) {
    const user = await this.getUserById(userId);
    if (!user) {
      return null;
    }
    const updatedUser = {
      ...user,
      ...updates,
      id: userId
    };
    await this.kv.put(`${this.userPrefix}${userId}`, JSON.stringify(updatedUser));
    return updatedUser;
  }
  async deleteUser(userId) {
    await this.kv.delete(`${this.userPrefix}${userId}`);
    const index = await this.kv.get(this.userIndexKey);
    if (index) {
      const userIds = JSON.parse(index).filter((id) => id !== userId);
      await this.kv.put(this.userIndexKey, JSON.stringify(userIds));
    }
  }
};
var LinkDB = class {
  static {
    __name(this, "LinkDB");
  }
  constructor(kv) {
    this.kv = kv;
    this.linkPrefix = "link:";
    this.linkIndexKey = "links:index";
    this.userLinksPrefix = "user:links:";
  }
  async getLinkById(linkId) {
    const data = await this.kv.get(`${this.linkPrefix}${linkId}`);
    return data ? JSON.parse(data) : null;
  }
  async getAllLinks(userId = null) {
    const index = await this.kv.get(this.linkIndexKey);
    if (!index) {
      return [];
    }
    const linkIds = JSON.parse(index);
    const links = await Promise.all(
      linkIds.map((id) => this.getLinkById(id))
    );
    const validLinks = links.filter(Boolean);
    if (userId) {
      return validLinks.filter((link) => link.createdBy === userId);
    }
    return validLinks;
  }
  async createLink(link) {
    const linkId = generateId();
    const newLink = {
      ...link,
      id: linkId,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: link.status || "unused"
    };
    await this.kv.put(`${this.linkPrefix}${linkId}`, JSON.stringify(newLink));
    const index = await this.kv.get(this.linkIndexKey);
    const linkIds = index ? JSON.parse(index) : [];
    linkIds.push(linkId);
    await this.kv.put(this.linkIndexKey, JSON.stringify(linkIds));
    if (newLink.createdBy) {
      const userLinksKey = `${this.userLinksPrefix}${newLink.createdBy}`;
      const userLinks = await this.kv.get(userLinksKey);
      const linkIds2 = userLinks ? JSON.parse(userLinks) : [];
      linkIds2.push(linkId);
      await this.kv.put(userLinksKey, JSON.stringify(linkIds2));
    }
    return newLink;
  }
  async updateLink(linkId, updates) {
    const link = await this.getLinkById(linkId);
    if (!link) {
      return null;
    }
    const updatedLink = {
      ...link,
      ...updates,
      id: linkId
    };
    await this.kv.put(`${this.linkPrefix}${linkId}`, JSON.stringify(updatedLink));
    return updatedLink;
  }
  async deleteLink(linkId) {
    const link = await this.getLinkById(linkId);
    await this.kv.delete(`${this.linkPrefix}${linkId}`);
    const index = await this.kv.get(this.linkIndexKey);
    if (index) {
      const linkIds = JSON.parse(index).filter((id) => id !== linkId);
      await this.kv.put(this.linkIndexKey, JSON.stringify(linkIds));
    }
    if (link?.createdBy) {
      const userLinksKey = `${this.userLinksPrefix}${link.createdBy}`;
      const userLinks = await this.kv.get(userLinksKey);
      if (userLinks) {
        const linkIds = JSON.parse(userLinks).filter((id) => id !== linkId);
        await this.kv.put(userLinksKey, JSON.stringify(linkIds));
      }
    }
  }
  async createLinks(links) {
    return Promise.all(links.map((link) => this.createLink(link)));
  }
};
var QuestionnaireDB = class {
  static {
    __name(this, "QuestionnaireDB");
  }
  constructor(kv) {
    this.kv = kv;
    this.questionnairePrefix = "questionnaire:";
    this.questionnaireIndexKey = "questionnaires:index";
  }
  async getQuestionnaire(type) {
    const data = await this.kv.get(`${this.questionnairePrefix}${type}`);
    return data ? JSON.parse(data) : null;
  }
  async getAllQuestionnaires() {
    const index = await this.kv.get(this.questionnaireIndexKey);
    if (!index) {
      return [];
    }
    const types = JSON.parse(index);
    const questionnaires = await Promise.all(
      types.map((type) => this.getQuestionnaire(type))
    );
    return questionnaires.filter(Boolean);
  }
  async createOrUpdateQuestionnaire(questionnaire) {
    const existing = await this.getQuestionnaire(questionnaire.type);
    const questionnaireData = {
      ...questionnaire,
      createdAt: existing?.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      isPublished: questionnaire.isPublished ?? existing?.isPublished ?? false
    };
    await this.kv.put(`${this.questionnairePrefix}${questionnaire.type}`, JSON.stringify(questionnaireData));
    const index = await this.kv.get(this.questionnaireIndexKey);
    const types = index ? JSON.parse(index) : [];
    if (!types.includes(questionnaire.type)) {
      types.push(questionnaire.type);
      await this.kv.put(this.questionnaireIndexKey, JSON.stringify(types));
    }
    return questionnaireData;
  }
  async deleteQuestionnaire(type) {
    await this.kv.delete(`${this.questionnairePrefix}${type}`);
    const index = await this.kv.get(this.questionnaireIndexKey);
    if (index) {
      const types = JSON.parse(index).filter((t) => t !== type);
      await this.kv.put(this.questionnaireIndexKey, JSON.stringify(types));
    }
  }
};
var NotificationDB = class {
  static {
    __name(this, "NotificationDB");
  }
  constructor(kv) {
    this.kv = kv;
    this.notificationPrefix = "notification:";
    this.userNotificationsPrefix = "user:notifications:";
  }
  async getNotificationById(notificationId) {
    const data = await this.kv.get(`${this.notificationPrefix}${notificationId}`);
    return data ? JSON.parse(data) : null;
  }
  async getUserNotifications(userId) {
    const key = `${this.userNotificationsPrefix}${userId}`;
    const data = await this.kv.get(key);
    if (!data) {
      return [];
    }
    const notificationIds = JSON.parse(data);
    const notifications = await Promise.all(
      notificationIds.map((id) => this.getNotificationById(id))
    );
    return notifications.filter(Boolean).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }
  async createNotification(notification) {
    const notificationId = generateId();
    const newNotification = {
      ...notification,
      id: notificationId,
      read: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.kv.put(`${this.notificationPrefix}${notificationId}`, JSON.stringify(newNotification));
    if (newNotification.userId) {
      const key = `${this.userNotificationsPrefix}${newNotification.userId}`;
      const data = await this.kv.get(key);
      const notificationIds = data ? JSON.parse(data) : [];
      notificationIds.push(notificationId);
      await this.kv.put(key, JSON.stringify(notificationIds));
    }
    return newNotification;
  }
  async updateNotification(notificationId, updates) {
    const notification = await this.getNotificationById(notificationId);
    if (!notification) {
      return null;
    }
    const updatedNotification = {
      ...notification,
      ...updates,
      id: notificationId
    };
    await this.kv.put(`${this.notificationPrefix}${notificationId}`, JSON.stringify(updatedNotification));
    return updatedNotification;
  }
  async deleteNotification(notificationId) {
    const notification = await this.getNotificationById(notificationId);
    await this.kv.delete(`${this.notificationPrefix}${notificationId}`);
    if (notification?.userId) {
      const key = `${this.userNotificationsPrefix}${notification.userId}`;
      const data = await this.kv.get(key);
      if (data) {
        const notificationIds = JSON.parse(data).filter((id) => id !== notificationId);
        await this.kv.put(key, JSON.stringify(notificationIds));
      }
    }
  }
};
var OrderDB = class {
  static {
    __name(this, "OrderDB");
  }
  constructor(kv) {
    this.kv = kv;
    this.orderPrefix = "order:";
    this.orderIndexKey = "orders:index";
    this.outTradeIndexPrefix = "order:out_trade_no:";
  }
  async getOrderById(orderId) {
    const data = await this.kv.get(`${this.orderPrefix}${orderId}`);
    return data ? JSON.parse(data) : null;
  }
  async getOrderByOutTradeNo(outTradeNo) {
    const key = `${this.outTradeIndexPrefix}${outTradeNo}`;
    const orderId = await this.kv.get(key);
    if (!orderId) return null;
    return this.getOrderById(orderId);
  }
  async createOrder(order) {
    const orderId = generateId();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const amountNum = Number(order.amount || 0);
    const amountCents = Number.isFinite(amountNum) ? Math.round(amountNum * 100) : 0;
    const newOrder = {
      ...order,
      id: orderId,
      status: order.status || "pending",
      // pending | paid | failed
      createdAt: now,
      amount: amountNum,
      amountCents
    };
    await this.kv.put(`${this.orderPrefix}${orderId}`, JSON.stringify(newOrder));
    const index = await this.kv.get(this.orderIndexKey);
    const orderIds = index ? JSON.parse(index) : [];
    orderIds.push(orderId);
    await this.kv.put(this.orderIndexKey, JSON.stringify(orderIds));
    if (newOrder.outTradeNo) {
      await this.kv.put(`${this.outTradeIndexPrefix}${newOrder.outTradeNo}`, orderId);
    }
    return newOrder;
  }
  async updateOrder(orderId, updates) {
    const order = await this.getOrderById(orderId);
    if (!order) return null;
    const updated = {
      ...order,
      ...updates,
      id: orderId
    };
    await this.kv.put(`${this.orderPrefix}${orderId}`, JSON.stringify(updated));
    if (updates.outTradeNo && updates.outTradeNo !== order.outTradeNo) {
      if (order.outTradeNo) {
        await this.kv.delete(`${this.outTradeIndexPrefix}${order.outTradeNo}`);
      }
      await this.kv.put(`${this.outTradeIndexPrefix}${updates.outTradeNo}`, orderId);
    }
    return updated;
  }
};

// utils/zpay.js
var ZPAY_BASE_CONFIG = {
  PID: "2025120114591699",
  GATEWAY: "https://zpayz.cn"
};
function getZPayConfig(env) {
  const keyFromEnv = env?.ZPAY_KEY;
  if (!keyFromEnv) {
    console.warn("ZPAY_KEY \u672A\u5728\u73AF\u5883\u53D8\u91CF\u4E2D\u914D\u7F6E\uFF0C\u5C06\u5BFC\u81F4\u7B7E\u540D\u548C\u9A8C\u7B7E\u5931\u8D25");
  }
  return {
    ...ZPAY_BASE_CONFIG,
    KEY: keyFromEnv || ""
  };
}
__name(getZPayConfig, "getZPayConfig");
var PACKAGE_CONFIG = {
  basic: {
    id: "basic",
    name: "\u57FA\u7840\u5957\u9910",
    quota: 600,
    price: 99,
    unlimited: false
  },
  standard: {
    id: "standard",
    name: "\u6807\u51C6\u5957\u9910",
    quota: 1300,
    price: 199,
    unlimited: false
  },
  professional: {
    id: "professional",
    name: "\u4E13\u4E1A\u5957\u9910",
    quota: 2300,
    price: 299,
    unlimited: false
  },
  flagship: {
    id: "flagship",
    name: "\u65D7\u8230\u5957\u9910",
    quota: 5500,
    price: 599,
    unlimited: false
  },
  yearly: {
    id: "yearly",
    name: "\u5E74\u8D39\u5957\u9910",
    quota: 0,
    price: 1688,
    unlimited: true
  }
};
function getPackageConfig(packageId) {
  if (!packageId) return null;
  return PACKAGE_CONFIG[packageId] || null;
}
__name(getPackageConfig, "getPackageConfig");
async function md5(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(md5, "md5");
async function createZPaySign(params, key) {
  const filtered = {};
  Object.keys(params).forEach((k) => {
    const value = params[k];
    if (k === "sign" || k === "sign_type") return;
    if (value === void 0 || value === null || value === "") return;
    filtered[k] = String(value);
  });
  const sortedKeys = Object.keys(filtered).sort();
  const signStr = sortedKeys.map((k) => `${k}=${filtered[k]}`).join("&") + key;
  return md5(signStr);
}
__name(createZPaySign, "createZPaySign");
async function verifyCallbackSign(searchParams, key) {
  const receivedSign = searchParams.get("sign") || "";
  const signType = searchParams.get("sign_type") || "MD5";
  if (!receivedSign) {
    return { valid: false, error: "\u7F3A\u5C11\u7B7E\u540D\u53C2\u6570 sign" };
  }
  if (signType.toUpperCase() !== "MD5") {
    return { valid: false, error: "\u4E0D\u652F\u6301\u7684\u7B7E\u540D\u7C7B\u578B" };
  }
  const paramsObj = {};
  for (const [key2, value] of searchParams.entries()) {
    paramsObj[key2] = value;
  }
  const expectedSign = await createZPaySign(paramsObj, key);
  if (expectedSign !== receivedSign) {
    return { valid: false, error: "\u7B7E\u540D\u6821\u9A8C\u5931\u8D25" };
  }
  return { valid: true };
}
__name(verifyCallbackSign, "verifyCallbackSign");

// api/[[path]].js
function getDB(context) {
  const kv = context.env.DB || context.env.KV_STORE || context.env.KV || {};
  if (!kv || typeof kv.get !== "function") {
    console.warn("\u26A0\uFE0F KV store not configured, using in-memory storage (data will not persist)");
    return getInMemoryDB();
  }
  return {
    users: new UserDB(kv),
    links: new LinkDB(kv),
    questionnaires: new QuestionnaireDB(kv),
    notifications: new NotificationDB(kv),
    orders: new OrderDB(kv)
  };
}
__name(getDB, "getDB");
var inMemoryStore = {};
function getInMemoryDB() {
  const mockKV = {
    get: /* @__PURE__ */ __name(async (key) => inMemoryStore[key] || null, "get"),
    put: /* @__PURE__ */ __name(async (key, value) => {
      inMemoryStore[key] = value;
    }, "put"),
    delete: /* @__PURE__ */ __name(async (key) => {
      delete inMemoryStore[key];
    }, "delete")
  };
  return {
    users: new UserDB(mockKV),
    links: new LinkDB(mockKV),
    questionnaires: new QuestionnaireDB(mockKV),
    notifications: new NotificationDB(mockKV),
    orders: new OrderDB(mockKV)
  };
}
__name(getInMemoryDB, "getInMemoryDB");
async function onRequest(context) {
  const { request, env, params } = context;
  const { path } = params || {};
  const url = new URL(request.url);
  const pathSegments = (path || "").split("/").filter(Boolean);
  const method = request.method;
  const db = getDB(context);
  try {
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });
    }
    const response = await routeHandler(pathSegments, method, request, db, env);
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return response;
  } catch (error) {
    console.error("API Error:", error);
    return (void 0)(error.message || "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF", 500, 500);
  }
}
__name(onRequest, "onRequest");
async function routeHandler(pathSegments, method, request, db, env) {
  const [resource, action, ...rest] = pathSegments;
  if (resource === "zpay" && action === "notify") {
    const config = getZPayConfig(env);
    return handleZPayNotify(request, db, config);
  }
  if (resource === "auth") {
    return handleAuthRoutes(action, method, request, db, env);
  }
  if (resource === "questionnaires" && action === "available") {
    return handleAvailableQuestionnaires(db);
  }
  if (resource === "admin") {
    const adminResult = await requireAdmin(request, env);
    if (!adminResult.valid) {
      return adminResult.error;
    }
    return (void 0)("Admin API \u8DEF\u7531\u4E0D\u5B58\u5728");
  }
  const authResult = await verifyAuth(request, env);
  if (!authResult.valid) {
    return authResult.error;
  }
  const userId = authResult.userId;
  const userRole = authResult.userRole;
  switch (resource) {
    case "auth":
      return handleAuthRoutes(action, method, request, db, env, userId);
    case "users":
      if (userRole !== "admin") {
        return (void 0)("\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650");
      }
      return handleUserRoutes(action, rest, method, request, db, userId);
    case "links":
      return handleLinkRoutes(action, rest, method, request, db, userId, userRole);
    case "questionnaires":
      if (userRole !== "admin") {
        return (void 0)("\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650");
      }
      return handleQuestionnaireRoutes(action, rest, method, request, db);
    case "dashboard":
      return handleDashboardRoutes(action, method, request, db, userId);
    case "notifications":
      return handleNotificationRoutes(action, rest, method, request, db, userId);
    case "zpay":
      return handleZPayRoutes(action, method, request, db, env, userId, userRole);
    case "orders":
      return handleOrderRoutes(action, rest, method, request, db, userId, userRole);
    default:
      return (void 0)("API \u8DEF\u7531\u4E0D\u5B58\u5728");
  }
}
__name(routeHandler, "routeHandler");
async function handleZPayNotify(request, db, zpayConfig) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const verifyResult = await verifyCallbackSign(searchParams, zpayConfig.KEY);
  if (!verifyResult.valid) {
    console.warn("ZPAY \u56DE\u8C03\u7B7E\u540D\u6821\u9A8C\u5931\u8D25:", verifyResult.error);
    return new Response(verifyResult.error || "\u7B7E\u540D\u6821\u9A8C\u5931\u8D25", { status: 400 });
  }
  const tradeStatus = searchParams.get("trade_status") || "";
  const outTradeNo = searchParams.get("out_trade_no") || "";
  const money = searchParams.get("money") || "";
  const param = searchParams.get("param") || "";
  const buyer = searchParams.get("buyer") || "";
  if (tradeStatus !== "TRADE_SUCCESS") {
    console.warn("ZPAY \u56DE\u8C03\u72B6\u6001\u975E\u6210\u529F:", tradeStatus, outTradeNo);
    return new Response("ignore", { status: 200 });
  }
  const order = await db.orders.getOrderByOutTradeNo(outTradeNo);
  if (!order) {
    console.warn("ZPAY \u56DE\u8C03\uFF1A\u672A\u627E\u5230\u672C\u5730\u8BA2\u5355", outTradeNo);
    return new Response("order not found", { status: 404 });
  }
  const callbackAmountNum = Number(money);
  const callbackCents = Number.isFinite(callbackAmountNum) ? Math.round(callbackAmountNum * 100) : NaN;
  if (!Number.isFinite(callbackCents) || order.amountCents !== callbackCents) {
    console.error("ZPAY \u56DE\u8C03\uFF1A\u91D1\u989D\u4E0D\u4E00\u81F4", {
      outTradeNo,
      orderAmount: order.amount,
      orderAmountCents: order.amountCents,
      callbackAmount: money,
      callbackCents
    });
    return new Response("amount mismatch", { status: 400 });
  }
  const paidAt = (/* @__PURE__ */ new Date()).toISOString();
  const updatedOrder = await db.orders.updateOrder(order.id, {
    status: "paid",
    paidAt,
    buyer
  });
  if (order.userId && order.packageId) {
    const pkgConfig = getPackageConfig(order.packageId);
    if (pkgConfig) {
      const user = await db.users.getUserById(order.userId);
      if (user) {
        let quotaDelta = 0;
        if (pkgConfig.unlimited) {
          quotaDelta = 1e6;
        } else {
          quotaDelta = pkgConfig.quota || 0;
        }
        const newQuota = (user.remainingQuota || 0) + quotaDelta;
        await db.users.updateUser(order.userId, {
          remainingQuota: newQuota
        });
      }
    }
  }
  console.log("ZPAY \u652F\u4ED8\u6210\u529F\u56DE\u8C03\uFF08\u5DF2\u66F4\u65B0\u8BA2\u5355\u5E76\u5C1D\u8BD5\u589E\u52A0\u989D\u5EA6\uFF09\uFF1A", {
    outTradeNo,
    money,
    param,
    orderId: updatedOrder?.id
  });
  return new Response("success", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}
__name(handleZPayNotify, "handleZPayNotify");
async function handleOrderCreate(request, db) {
  const body = await request.json().catch(() => ({}));
  const { outTradeNo, amount, packageId, packageName } = body || {};
  if (!outTradeNo || !amount || !packageId) {
    return (void 0)("\u7F3A\u5C11\u5FC5\u8981\u53C2\u6570\uFF1AoutTradeNo / amount / packageId", 400);
  }
  const pkg = getPackageConfig(packageId);
  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return (void 0)("\u91D1\u989D\u4E0D\u5408\u6CD5", 400);
  }
  if (pkg && pkg.price && pkg.price !== amountNum) {
    console.warn("\u8BA2\u5355\u4EF7\u683C\u4E0E\u5957\u9910\u914D\u7F6E\u4E0D\u4E00\u81F4", {
      packageId,
      configPrice: pkg.price,
      amountNum
    });
  }
  const order = await db.orders.createOrder({
    outTradeNo,
    amount: amountNum,
    packageId,
    packageName: packageName || pkg?.name || "",
    // userId 将在路由层强制设置，防止前端伪造
    status: "pending"
  });
  return (void 0)(order, "\u8BA2\u5355\u521B\u5EFA\u6210\u529F");
}
__name(handleOrderCreate, "handleOrderCreate");
async function handleAuthRoutes(action, method, request, db, env, userId = null) {
  if (action === "login" && method === "POST") {
    return handleLogin(request, db, env);
  }
  if (action === "register" && method === "POST") {
    return handleRegister(request, db);
  }
  if (action === "me" && method === "GET" && userId) {
    return handleGetCurrentUser(userId, db);
  }
  if (action === "logout" && method === "POST") {
    return (void 0)(null, "\u767B\u51FA\u6210\u529F");
  }
  if (action === "refresh" && method === "POST") {
    return handleRefreshToken(request, db, env);
  }
  if (action === "change-password" && method === "POST" && userId) {
    return handleChangePassword(request, userId, db);
  }
  return (void 0)("\u8BA4\u8BC1\u8DEF\u7531\u4E0D\u5B58\u5728");
}
__name(handleAuthRoutes, "handleAuthRoutes");
async function handleLogin(request, db, env) {
  const body = await request.json();
  const { username, password } = body;
  if (!username || !password) {
    return (void 0)("\u7528\u6237\u540D\u548C\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A", 400);
  }
  const user = await db.users.getUserByUsername(username);
  if (!user) {
    return (void 0)("\u7528\u6237\u540D\u6216\u5BC6\u7801\u9519\u8BEF", 401);
  }
  if (!verifyPassword(password, user.password)) {
    return (void 0)("\u7528\u6237\u540D\u6216\u5BC6\u7801\u9519\u8BEF", 401);
  }
  if (user.status !== "active") {
    return (void 0)("\u8BE5\u8D26\u53F7\u5C1A\u672A\u901A\u8FC7\u7BA1\u7406\u5458\u5BA1\u6838\u6216\u5DF2\u88AB\u7981\u7528\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458", 403);
  }
  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1e3) + 7 * 24 * 60 * 60
    // 7天过期
  }, env);
  const { password: _, ...userWithoutPassword } = user;
  return (void 0)({
    token,
    user: userWithoutPassword,
    expiresIn: 7 * 24 * 60 * 60
  });
}
__name(handleLogin, "handleLogin");
async function handleRegister(request, db) {
  const body = await request.json();
  const { username, email, password, name } = body;
  if (!username || !email || !password) {
    return (void 0)("\u7528\u6237\u540D\u3001\u90AE\u7BB1\u548C\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A", 400);
  }
  const existingUser = await db.users.getUserByUsername(username);
  if (existingUser) {
    return (void 0)("\u7528\u6237\u540D\u5DF2\u5B58\u5728", 400);
  }
  const existingEmail = await db.users.getUserByEmail(email);
  if (existingEmail) {
    return (void 0)("\u90AE\u7BB1\u5DF2\u88AB\u6CE8\u518C", 400);
  }
  const newUser = await db.users.createUser({
    username,
    email,
    password: hashPassword(password),
    name: name || username,
    role: "user",
    status: "pending",
    // 需要管理员审核
    remainingQuota: 0
  });
  return (void 0)({
    message: "\u6CE8\u518C\u6210\u529F\uFF0C\u8BF7\u7B49\u5F85\u7BA1\u7406\u5458\u5BA1\u6838",
    userId: newUser.id
  }, "\u6CE8\u518C\u6210\u529F\uFF0C\u8BF7\u7B49\u5F85\u7BA1\u7406\u5458\u5BA1\u6838");
}
__name(handleRegister, "handleRegister");
async function handleGetCurrentUser(userId, db) {
  const user = await db.users.getUserById(userId);
  if (!user) {
    return (void 0)("\u7528\u6237\u4E0D\u5B58\u5728", 404);
  }
  const { password: _, ...userWithoutPassword } = user;
  return (void 0)(userWithoutPassword);
}
__name(handleGetCurrentUser, "handleGetCurrentUser");
async function handleRefreshToken(request, db, env) {
  const authResult = await verifyAuth(request, env);
  if (!authResult.valid) {
    return authResult.error;
  }
  const user = await db.users.getUserById(authResult.userId);
  if (!user) {
    return (void 0)("\u7528\u6237\u4E0D\u5B58\u5728", 404);
  }
  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1e3) + 7 * 24 * 60 * 60
  }, env);
  return (void 0)({ token });
}
__name(handleRefreshToken, "handleRefreshToken");
async function handleChangePassword(request, userId, db) {
  const body = await request.json();
  const { currentPassword, newPassword } = body;
  if (!currentPassword || !newPassword) {
    return (void 0)("\u5F53\u524D\u5BC6\u7801\u548C\u65B0\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A", 400);
  }
  const user = await db.users.getUserById(userId);
  if (!user) {
    return (void 0)("\u7528\u6237\u4E0D\u5B58\u5728", 404);
  }
  if (!verifyPassword(currentPassword, user.password)) {
    return (void 0)("\u5F53\u524D\u5BC6\u7801\u9519\u8BEF", 400);
  }
  await db.users.updateUser(userId, {
    password: hashPassword(newPassword)
  });
  return (void 0)(null, "\u5BC6\u7801\u4FEE\u6539\u6210\u529F");
}
__name(handleChangePassword, "handleChangePassword");
async function handleUserRoutes(action, rest, method, request, db, currentUserId) {
  if (!action && method === "GET") {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
    const search = url.searchParams.get("search") || "";
    const role = url.searchParams.get("role");
    const status = url.searchParams.get("status");
    let users = await db.users.getAllUsers();
    if (search) {
      users = users.filter(
        (u) => u.username.includes(search) || u.email.includes(search) || u.name && u.name.includes(search)
      );
    }
    if (role) {
      users = users.filter((u) => u.role === role);
    }
    if (status) {
      users = users.filter((u) => u.status === status);
    }
    const total = users.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedUsers = users.slice(start, end).map((u) => {
      const { password: _, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
    return (void 0)({
      users: paginatedUsers,
      total,
      page,
      pageSize
    });
  }
  if (action && rest.length === 0 && method === "GET") {
    const user = await db.users.getUserById(action);
    if (!user) {
      return (void 0)("\u7528\u6237\u4E0D\u5B58\u5728");
    }
    const { password: _, ...userWithoutPassword } = user;
    return (void 0)(userWithoutPassword);
  }
  if (action && rest[0] === "status" && method === "PATCH") {
    const userId = action;
    const body = await request.json();
    const { status } = body;
    const updatedUser = await db.users.updateUser(userId, { status });
    if (!updatedUser) {
      return (void 0)("\u7528\u6237\u4E0D\u5B58\u5728");
    }
    const { password: _, ...userWithoutPassword } = updatedUser;
    return (void 0)(userWithoutPassword, "\u7528\u6237\u72B6\u6001\u66F4\u65B0\u6210\u529F");
  }
  if (action && rest.length === 0 && method === "PUT") {
    const userId = action;
    const body = await request.json();
    const updatedUser = await db.users.updateUser(userId, body);
    if (!updatedUser) {
      return (void 0)("\u7528\u6237\u4E0D\u5B58\u5728");
    }
    const { password: _, ...userWithoutPassword } = updatedUser;
    return (void 0)(userWithoutPassword, "\u7528\u6237\u4FE1\u606F\u66F4\u65B0\u6210\u529F");
  }
  if (action && rest.length === 0 && method === "DELETE") {
    await db.users.deleteUser(action);
    return (void 0)(null, "\u7528\u6237\u5220\u9664\u6210\u529F");
  }
  if (action === "batch-delete" && method === "POST") {
    const body = await request.json();
    const { userIds } = body;
    await Promise.all(userIds.map((id) => db.users.deleteUser(id)));
    return (void 0)(null, "\u6279\u91CF\u5220\u9664\u6210\u529F");
  }
  if (action && rest[0] === "reset-password" && method === "POST") {
    const userId = action;
    const newPassword = Math.random().toString(36).substring(2, 10);
    await db.users.updateUser(userId, {
      password: hashPassword(newPassword)
    });
    return (void 0)({ newPassword }, "\u5BC6\u7801\u91CD\u7F6E\u6210\u529F");
  }
  return (void 0)("\u7528\u6237\u8DEF\u7531\u4E0D\u5B58\u5728");
}
__name(handleUserRoutes, "handleUserRoutes");
async function handleAvailableQuestionnaires(db) {
  const questionnaires = await db.questionnaires.getAllQuestionnaires();
  const available = questionnaires.filter((q) => q.isPublished).map((q) => ({
    type: q.type,
    title: q.title,
    description: q.description,
    questionCount: q.questions?.length || 0,
    isPublished: q.isPublished,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt
  }));
  return (void 0)(available);
}
__name(handleAvailableQuestionnaires, "handleAvailableQuestionnaires");
async function handleLinkRoutes(action, rest, method, request, db, userId, userRole) {
  if (action === "generate" && method === "POST") {
    const body = await request.json();
    const { questionnaireType, quantity = 1, expiresAt, customPrefix } = body;
    if (!questionnaireType) {
      return (void 0)("\u95EE\u5377\u7C7B\u578B\u4E0D\u80FD\u4E3A\u7A7A", 400);
    }
    const questionnaire = await db.questionnaires.getQuestionnaire(questionnaireType);
    if (!questionnaire || !questionnaire.isPublished) {
      return (void 0)("\u95EE\u5377\u4E0D\u5B58\u5728\u6216\u672A\u4E0A\u67B6", 400);
    }
    const user = await db.users.getUserById(userId);
    if (user.remainingQuota < quantity) {
      return (void 0)("\u989D\u5EA6\u4E0D\u8DB3", 400);
    }
    const links = [];
    const baseUrl = new URL(request.url).origin;
    for (let i = 0; i < quantity; i++) {
      const linkId = `link-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const linkUrl = `${baseUrl}/test/${linkId}`;
      const link = await db.links.createLink({
        url: linkUrl,
        questionnaireType,
        status: "unused",
        createdBy: userId,
        expiredAt: expiresAt || null
      });
      links.push({
        id: link.id,
        url: link.url,
        questionnaireType: link.questionnaireType,
        status: link.status,
        createdAt: link.createdAt,
        expiredAt: link.expiredAt
      });
    }
    await db.users.updateUser(userId, {
      remainingQuota: user.remainingQuota - quantity
    });
    return (void 0)({
      links,
      total: links.length
    }, "\u94FE\u63A5\u751F\u6210\u6210\u529F");
  }
  if (!action && method === "GET") {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
    const status = url.searchParams.get("status");
    const questionnaireType = url.searchParams.get("questionnaireType");
    let links = await db.links.getAllLinks(userId);
    if (status) {
      links = links.filter((l) => l.status === status);
    }
    if (questionnaireType) {
      links = links.filter((l) => l.questionnaireType === questionnaireType);
    }
    links.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = links.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedLinks = links.slice(start, end);
    return (void 0)({
      links: paginatedLinks,
      total,
      page,
      pageSize
    });
  }
  if (action && rest.length === 0 && method === "GET") {
    const link = await db.links.getLinkById(action);
    if (!link) {
      return (void 0)("\u94FE\u63A5\u4E0D\u5B58\u5728");
    }
    if (link.createdBy !== userId && userRole !== "admin") {
      return (void 0)("\u65E0\u6743\u8BBF\u95EE\u8BE5\u94FE\u63A5");
    }
    return (void 0)(link);
  }
  if (action && rest[0] === "status" && method === "PATCH") {
    const linkId = action;
    const body = await request.json();
    const { status } = body;
    const link = await db.links.getLinkById(linkId);
    if (!link) {
      return (void 0)("\u94FE\u63A5\u4E0D\u5B58\u5728");
    }
    if (link.createdBy !== userId && userRole !== "admin") {
      return (void 0)("\u65E0\u6743\u4FEE\u6539\u8BE5\u94FE\u63A5");
    }
    const updatedLink = await db.links.updateLink(linkId, { status });
    return (void 0)(updatedLink, "\u94FE\u63A5\u72B6\u6001\u66F4\u65B0\u6210\u529F");
  }
  if (action && rest.length === 0 && method === "DELETE") {
    const link = await db.links.getLinkById(action);
    if (!link) {
      return (void 0)("\u94FE\u63A5\u4E0D\u5B58\u5728");
    }
    if (link.createdBy !== userId && userRole !== "admin") {
      return (void 0)("\u65E0\u6743\u5220\u9664\u8BE5\u94FE\u63A5");
    }
    await db.links.deleteLink(action);
    return (void 0)(null, "\u94FE\u63A5\u5220\u9664\u6210\u529F");
  }
  if (action === "batch-update-status" && method === "PATCH") {
    const body = await request.json();
    const { linkIds, status } = body;
    for (const linkId of linkIds) {
      const link = await db.links.getLinkById(linkId);
      if (link && (link.createdBy === userId || userRole === "admin")) {
        await db.links.updateLink(linkId, { status });
      }
    }
    return (void 0)(null, "\u6279\u91CF\u66F4\u65B0\u6210\u529F");
  }
  if (action === "batch-delete" && method === "POST") {
    const body = await request.json();
    const { linkIds } = body;
    for (const linkId of linkIds) {
      const link = await db.links.getLinkById(linkId);
      if (link && (link.createdBy === userId || userRole === "admin")) {
        await db.links.deleteLink(linkId);
      }
    }
    return (void 0)(null, "\u6279\u91CF\u5220\u9664\u6210\u529F");
  }
  if (action && rest[0] === "stats" && method === "GET") {
    const linkId = action;
    const link = await db.links.getLinkById(linkId);
    if (!link) {
      return (void 0)("\u94FE\u63A5\u4E0D\u5B58\u5728");
    }
    return (void 0)({
      totalViews: link.usedAt ? 1 : 0,
      totalCompletions: link.status === "used" ? 1 : 0,
      completionRate: link.status === "used" ? 100 : 0
    });
  }
  return (void 0)("\u94FE\u63A5\u8DEF\u7531\u4E0D\u5B58\u5728");
}
__name(handleLinkRoutes, "handleLinkRoutes");
async function handleQuestionnaireRoutes(action, rest, method, request, db) {
  if (action === "import" && method === "POST") {
    const body = await request.json();
    const { type, questions, description } = body;
    if (!type || !questions) {
      return (void 0)("\u95EE\u5377\u7C7B\u578B\u548C\u9898\u76EE\u6570\u636E\u4E0D\u80FD\u4E3A\u7A7A", 400);
    }
    const questionnaireData = {
      type,
      title: questions.title || type,
      description: description || questions.description || "",
      questions: questions.questions || [],
      dimensions: questions.dimensions || [],
      questionCount: (questions.questions || []).length
    };
    const saved = await db.questionnaires.createOrUpdateQuestionnaire(questionnaireData);
    return (void 0)({
      type: saved.type,
      questionCount: saved.questionCount,
      importedAt: saved.updatedAt
    }, "\u9898\u5E93\u5BFC\u5165\u6210\u529F");
  }
  if (!action && method === "GET") {
    const questionnaires = await db.questionnaires.getAllQuestionnaires();
    const list = questionnaires.map((q) => ({
      type: q.type,
      title: q.title,
      description: q.description,
      questionCount: q.questions?.length || 0,
      isPublished: q.isPublished,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt
    }));
    return (void 0)({
      questionnaires: list,
      total: list.length
    });
  }
  if (action && rest.length === 0 && method === "GET") {
    const type = decodeURIComponent(action);
    const questionnaire = await db.questionnaires.getQuestionnaire(type);
    if (!questionnaire) {
      return (void 0)("\u9898\u5E93\u4E0D\u5B58\u5728");
    }
    return (void 0)(questionnaire);
  }
  if (action && rest[0] === "publish-status" && method === "PATCH") {
    const type = decodeURIComponent(action);
    const body = await request.json();
    const { isPublished } = body;
    const questionnaire = await db.questionnaires.getQuestionnaire(type);
    if (!questionnaire) {
      return (void 0)("\u9898\u5E93\u4E0D\u5B58\u5728");
    }
    const updated = await db.questionnaires.createOrUpdateQuestionnaire({
      ...questionnaire,
      isPublished
    });
    return (void 0)(updated, `\u95EE\u5377\u5DF2${isPublished ? "\u4E0A\u67B6" : "\u4E0B\u67B6"}`);
  }
  if (action && rest[0] === "rename" && method === "PATCH") {
    const oldType = decodeURIComponent(action);
    const body = await request.json();
    const { newType } = body;
    const questionnaire = await db.questionnaires.getQuestionnaire(oldType);
    if (!questionnaire) {
      return (void 0)("\u9898\u5E93\u4E0D\u5B58\u5728");
    }
    await db.questionnaires.createOrUpdateQuestionnaire({
      ...questionnaire,
      type: newType
    });
    await db.questionnaires.deleteQuestionnaire(oldType);
    return (void 0)(null, "\u95EE\u5377\u91CD\u547D\u540D\u6210\u529F");
  }
  if (action && rest.length === 0 && method === "DELETE") {
    const type = decodeURIComponent(action);
    await db.questionnaires.deleteQuestionnaire(type);
    return (void 0)(null, "\u95EE\u5377\u5220\u9664\u6210\u529F");
  }
  return (void 0)("\u9898\u5E93\u8DEF\u7531\u4E0D\u5B58\u5728");
}
__name(handleQuestionnaireRoutes, "handleQuestionnaireRoutes");
async function handleDashboardRoutes(action, method, request, db, userId) {
  if (action === "stats" && method === "GET") {
    const user = await db.users.getUserById(userId);
    const links = await db.links.getAllLinks(userId);
    const now = /* @__PURE__ */ new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayUsedLinks = links.filter((l) => {
      if (!l.usedAt) return false;
      return new Date(l.usedAt) >= todayStart;
    }).length;
    const unusedLinks = links.filter((l) => l.status === "unused").length;
    const totalUsed = links.filter((l) => l.status === "used").length;
    const participationRate = links.length > 0 ? Math.round(totalUsed / links.length * 100) : 0;
    const questionnaires = await db.questionnaires.getAllQuestionnaires();
    const questionnaireSummary = questionnaires.map((q) => {
      const typeLinks = links.filter((l) => l.questionnaireType === q.type);
      const usedLinks = typeLinks.filter((l) => l.status === "used").length;
      const completionRate = typeLinks.length > 0 ? Math.round(usedLinks / typeLinks.length * 100) : 0;
      return {
        type: q.type,
        totalLinks: typeLinks.length,
        usedLinks,
        completionRate
      };
    });
    return (void 0)({
      totalLinks: links.length,
      remainingQuota: user.remainingQuota,
      todayUsedLinks,
      unusedLinks,
      participationRate,
      questionnaireSummary
    });
  }
  if (action === "chart" && method === "GET") {
    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "7d";
    const links = await db.links.getAllLinks(userId);
    const days = period === "7d" ? 7 : period === "15d" ? 15 : 30;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = /* @__PURE__ */ new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayLinks = links.filter((l) => {
        const linkDate = l.createdAt.split("T")[0];
        return linkDate === dateStr;
      });
      data.push({
        name: dateStr,
        \u94FE\u63A5\u6570: dayLinks.length,
        \u4F7F\u7528\u7387: dayLinks.length > 0 ? Math.round(dayLinks.filter((l) => l.status === "used").length / dayLinks.length * 100) : 0
      });
    }
    return (void 0)({
      data,
      period
    });
  }
  if (action === "realtime" && method === "GET") {
    const user = await db.users.getUserById(userId);
    const links = await db.links.getAllLinks(userId);
    const now = /* @__PURE__ */ new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayUsedLinks = links.filter((l) => {
      if (!l.usedAt) return false;
      return new Date(l.usedAt) >= todayStart;
    }).length;
    return (void 0)({
      remainingQuota: user.remainingQuota,
      todayUsedLinks
    });
  }
  return (void 0)("Dashboard \u8DEF\u7531\u4E0D\u5B58\u5728");
}
__name(handleDashboardRoutes, "handleDashboardRoutes");
async function handleNotificationRoutes(action, rest, method, request, db, userId) {
  if (!action && method === "GET") {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
    const type = url.searchParams.get("type");
    const read = url.searchParams.get("read");
    let notifications = await db.notifications.getUserNotifications(userId);
    if (type) {
      notifications = notifications.filter((n) => n.type === type);
    }
    if (read !== null && read !== void 0) {
      const isRead = read === "true";
      notifications = notifications.filter((n) => n.read === isRead);
    }
    const total = notifications.length;
    const unreadCount = notifications.filter((n) => !n.read).length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedNotifications = notifications.slice(start, end);
    return (void 0)({
      notifications: paginatedNotifications,
      total,
      unreadCount,
      page,
      pageSize
    });
  }
  if (action === "unread-count" && method === "GET") {
    const notifications = await db.notifications.getUserNotifications(userId);
    const unreadCount = notifications.filter((n) => !n.read).length;
    return (void 0)({ count: unreadCount });
  }
  if (action && rest[0] === "read" && method === "PATCH") {
    const notificationId = action;
    await db.notifications.updateNotification(notificationId, { read: true });
    return (void 0)(null, "\u5DF2\u6807\u8BB0\u4E3A\u5DF2\u8BFB");
  }
  if (action === "mark-read" && method === "PATCH") {
    const body = await request.json();
    const { notificationIds } = body;
    await Promise.all(
      notificationIds.map(
        (id) => db.notifications.updateNotification(id, { read: true })
      )
    );
    return (void 0)({ markedCount: notificationIds.length }, "\u6279\u91CF\u6807\u8BB0\u6210\u529F");
  }
  if (action === "mark-all-read" && method === "POST") {
    const notifications = await db.notifications.getUserNotifications(userId);
    const unreadNotifications = notifications.filter((n) => !n.read);
    await Promise.all(
      unreadNotifications.map(
        (n) => db.notifications.updateNotification(n.id, { read: true })
      )
    );
    return (void 0)({ markedCount: unreadNotifications.length }, "\u5DF2\u6807\u8BB0\u5168\u90E8\u4E3A\u5DF2\u8BFB");
  }
  if (action && rest.length === 0 && method === "DELETE") {
    await db.notifications.deleteNotification(action);
    return (void 0)(null, "\u901A\u77E5\u5220\u9664\u6210\u529F");
  }
  if (action === "batch-delete" && method === "POST") {
    const body = await request.json();
    const { notificationIds } = body;
    await Promise.all(
      notificationIds.map((id) => db.notifications.deleteNotification(id))
    );
    return (void 0)(null, "\u6279\u91CF\u5220\u9664\u6210\u529F");
  }
  return (void 0)("\u901A\u77E5\u8DEF\u7531\u4E0D\u5B58\u5728");
}
__name(handleNotificationRoutes, "handleNotificationRoutes");
async function handleOrderRoutes(action, rest, method, request, db, userId, userRole) {
  if (action === "create" && method === "POST") {
    const baseResponse = await handleOrderCreate(request, db);
    try {
      const cloned = baseResponse.clone();
      const data = await cloned.json().catch(() => null);
      if (data?.success && data.data?.id && userId) {
        await db.orders.updateOrder(data.data.id, { userId });
      }
    } catch (e) {
      console.warn("\u66F4\u65B0\u8BA2\u5355 userId \u5931\u8D25\uFF1A", e);
    }
    return baseResponse;
  }
  if (action && rest.length === 0 && method === "GET") {
    const outTradeNo = action;
    const order = await db.orders.getOrderByOutTradeNo(outTradeNo);
    if (!order) {
      return (void 0)("\u8BA2\u5355\u4E0D\u5B58\u5728");
    }
    if (userRole !== "admin" && order.userId !== userId) {
      return (void 0)("\u65E0\u6743\u8BBF\u95EE\u8BE5\u8BA2\u5355");
    }
    return (void 0)(order);
  }
  if (!action && method === "GET") {
    const url = new URL(request.url);
    const targetUserId = url.searchParams.get("userId");
    let ordersIndex = [];
    const indexRaw = await db.orders.kv.get(db.orders.orderIndexKey);
    if (indexRaw) {
      try {
        ordersIndex = JSON.parse(indexRaw);
      } catch {
        ordersIndex = [];
      }
    }
    const allOrders = await Promise.all(
      ordersIndex.map((id) => db.orders.getOrderById(id))
    );
    const validOrders = allOrders.filter(Boolean);
    let filtered = validOrders;
    if (userRole !== "admin") {
      filtered = validOrders.filter((o) => o.userId === userId);
    } else if (targetUserId) {
      filtered = validOrders.filter((o) => o.userId === targetUserId);
    }
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return (void 0)({
      orders: filtered,
      total: filtered.length
    });
  }
  return (void 0)("\u8BA2\u5355\u8DEF\u7531\u4E0D\u5B58\u5728");
}
__name(handleOrderRoutes, "handleOrderRoutes");
async function handleZPayRoutes(action, method, request, db, env, userId, userRole) {
  if (action === "prepare" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const { name, money, outTradeNo, notifyUrl, returnUrl, param } = body || {};
    if (!name || !money || !outTradeNo || !notifyUrl || !returnUrl) {
      return (void 0)("\u7F3A\u5C11\u5FC5\u8981\u53C2\u6570\uFF1Aname / money / outTradeNo / notifyUrl / returnUrl", 400);
    }
    const amountNum = Number(money);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return (void 0)("\u91D1\u989D\u4E0D\u5408\u6CD5", 400);
    }
    const zpayConfig = getZPayConfig(env);
    const baseParams = {
      name,
      money: amountNum.toFixed(2),
      type: "alipay",
      out_trade_no: outTradeNo,
      notify_url: notifyUrl,
      pid: zpayConfig.PID,
      param: param || "",
      return_url: returnUrl,
      sign_type: "MD5"
    };
    const sign = await createZPaySign(baseParams, zpayConfig.KEY);
    const allParams = {
      ...baseParams,
      sign
    };
    return (void 0)(
      {
        submitUrl: `${zpayConfig.GATEWAY}/submit.php`,
        params: allParams
      },
      "\u652F\u4ED8\u53C2\u6570\u751F\u6210\u6210\u529F"
    );
  }
  return (void 0)("ZPAY \u8DEF\u7531\u4E0D\u5B58\u5728");
}
__name(handleZPayRoutes, "handleZPayRoutes");

// _middleware.js
async function onRequest2(context) {
  const { request, next } = context;
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    if (pathname.startsWith("/api/")) {
      return next();
    }
    if (pathname.startsWith("/assets/") || pathname === "/index.html" || pathname.startsWith("/favicon") || pathname === "/logo-cube.jpg" || /\.(js|css|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot|json|map|webp)$/.test(pathname)) {
      return next();
    }
    const indexUrl = new URL("/index.html", url.origin);
    const indexRequest = new Request(indexUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
    const response = await next(indexRequest);
    if (response && response.ok) {
      return new Response(response.body, {
        status: 200,
        statusText: "OK",
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          ...Object.fromEntries(response.headers.entries())
        }
      });
    }
    return response || next();
  } catch (error) {
    console.error("Middleware error:", error);
    return next();
  }
}
__name(onRequest2, "onRequest");

// ../.wrangler/tmp/pages-lO5bin/functionsRoutes-0.1336767206916024.mjs
var routes = [
  {
    routePath: "/api/:path*",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "",
    middlewares: [onRequest2],
    modules: []
  }
];

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../../AppData/Roaming/npm/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
