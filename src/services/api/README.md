# API 服务层文档

## 概述

本项目提供了完整的 API 服务层，用于与后端服务器进行数据交互。所有 API 调用都通过统一的客户端进行，支持自动认证、错误处理和请求拦截。

## 目录结构

```
src/services/api/
├── client.ts          # API 客户端基础配置
├── auth.ts            # 认证相关 API
├── users.ts           # 用户管理 API
├── questionnaires.ts  # 题库管理 API
├── links.ts           # 链接管理 API
├── dashboard.ts       # Dashboard 统计 API
├── notifications.ts   # 通知管理 API
├── index.ts           # 统一导出
└── README.md          # 本文档
```

## 快速开始

### 1. 配置 API 基础 URL

在项目根目录创建 `.env` 文件（或 `.env.local`），设置 API 基础 URL：

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

如果不设置，默认使用 `/api`（相对路径）。

### 2. 使用示例

```typescript
import { login, getUserList, generateLinks } from '@/services/api'

// 登录
const loginResult = await login({
  username: 'admin',
  password: 'admin123'
})

if (loginResult.success) {
  console.log('登录成功', loginResult.data)
}

// 获取用户列表
const userList = await getUserList({
  page: 1,
  pageSize: 10,
  role: 'user'
})

// 生成链接
const linkResult = await generateLinks({
  questionnaireType: 'SCL-90',
  quantity: 5
})
```

## API 模块说明

### 1. 认证 API (`auth.ts`)

#### `login(credentials: LoginRequest)`
用户登录

**请求参数：**
```typescript
{
  username: string
  password: string
}
```

**返回：**
```typescript
{
  success: boolean
  message?: string
  data?: {
    token: string
    user: User
    expiresIn?: number
  }
}
```

#### `register(data: RegisterRequest)`
用户注册

#### `logout()`
用户登出

#### `getCurrentUser()`
获取当前用户信息

#### `refreshToken()`
刷新 Token

#### `changePassword(data: ChangePasswordRequest)`
修改密码

---

### 2. 用户管理 API (`users.ts`)

**注意：** 以下接口仅管理员可用

#### `getUserList(params?: UserListParams)`
获取用户列表

**请求参数：**
```typescript
{
  page?: number          // 页码，默认 1
  pageSize?: number      // 每页数量，默认 10
  search?: string        // 搜索关键词
  role?: 'admin' | 'user' // 角色筛选
  status?: 'active' | 'disabled' // 状态筛选
}
```

#### `getUserById(userId: string)`
获取单个用户详情

#### `updateUserStatus(data: UpdateUserStatusRequest)`
更新用户状态（启用/禁用）

#### `updateUser(data: UpdateUserRequest)`
更新用户信息

#### `deleteUser(userId: string)`
删除用户

#### `batchDeleteUsers(userIds: string[])`
批量删除用户

#### `resetUserPassword(userId: string)`
重置用户密码（管理员操作）

---

### 3. 题库管理 API (`questionnaires.ts`)

#### `importQuestionnaire(data: ImportQuestionnaireRequest)`
导入问卷题库

**请求参数：**
```typescript
{
  type: QuestionnaireType
  questions: QuestionnaireData
  description?: string
}
```

#### `getQuestionnaireList(params?)`
获取问卷题库列表

#### `getQuestionnaire(type: QuestionnaireType)`
获取单个问卷题库详情

#### `updatePublishStatus(data: UpdatePublishStatusRequest)`
更新问卷上架状态

**请求参数：**
```typescript
{
  type: QuestionnaireType
  isPublished: boolean
}
```

#### `renameQuestionnaire(data: RenameQuestionnaireRequest)`
重命名问卷类型

#### `deleteQuestionnaire(type: QuestionnaireType)`
删除问卷题库

#### `getAvailableQuestionnaires()`
获取可用的问卷类型列表（仅已上架的）

---

### 4. 链接管理 API (`links.ts`)

#### `generateLinks(data: GenerateLinkRequest)`
生成测试链接

**请求参数：**
```typescript
{
  questionnaireType: QuestionnaireType
  quantity?: number      // 生成数量，默认 1
  expiresAt?: string     // 过期时间（ISO 8601）
  customPrefix?: string  // 自定义链接前缀
}
```

#### `getLinkList(params?: LinkListParams)`
获取链接列表

#### `getLinkById(linkId: string)`
获取单个链接详情

#### `updateLinkStatus(data: UpdateLinkStatusRequest)`
更新链接状态

#### `batchUpdateLinkStatus(data: BatchUpdateLinkStatusRequest)`
批量更新链接状态

#### `deleteLink(linkId: string)`
删除链接

#### `batchDeleteLinks(linkIds: string[])`
批量删除链接

#### `getLinkStats(linkId: string)`
获取链接统计信息

---

### 5. Dashboard 统计 API (`dashboard.ts`)

#### `getDashboardStats()`
获取 Dashboard 统计数据

**返回：**
```typescript
{
  success: boolean
  data?: {
    totalLinks: number
    remainingQuota: number
    todayUsedLinks: number
    unusedLinks: number
    participationRate: number
    questionnaireSummary: Array<{
      type: string
      totalLinks: number
      usedLinks: number
      completionRate: number
    }>
  }
}
```

#### `getChartData(period: '7d' | '15d' | '30d')`
获取图表数据

#### `getRealtimeStats()`
获取实时统计数据

---

### 6. 通知管理 API (`notifications.ts`)

#### `getNotificationList(params?: NotificationListParams)`
获取通知列表

#### `getUnreadCount()`
获取未读通知数量

#### `markNotificationRead(notificationId: string)`
标记通知为已读

#### `markNotificationsRead(data: MarkReadRequest)`
批量标记通知为已读

#### `markAllNotificationsRead()`
标记所有通知为已读

#### `deleteNotification(notificationId: string)`
删除通知

#### `batchDeleteNotifications(notificationIds: string[])`
批量删除通知

---

## 认证机制

API 客户端会自动处理认证：

1. **Token 存储**：登录成功后，Token 会自动保存到 `localStorage` 的 `user` 对象中
2. **自动添加请求头**：所有请求（除登录、注册外）会自动在请求头中添加 `Authorization: Bearer <token>`
3. **Token 过期处理**：如果收到 401 响应，会自动清除 Token 并跳转到登录页
4. **Token 刷新**：可以使用 `refreshToken()` 方法刷新过期的 Token

## 错误处理

所有 API 调用都返回统一格式：

```typescript
{
  success: boolean
  data?: T
  message?: string
  code?: number
}
```

**常见错误码：**
- `401`：未授权，需要重新登录
- `403`：没有权限访问该资源
- `500+`：服务器错误

**错误处理示例：**

```typescript
const result = await login({ username: 'admin', password: 'wrong' })

if (!result.success) {
  console.error('登录失败：', result.message)
  // 显示错误提示给用户
}
```

## 请求超时

默认请求超时时间为 30 秒，可以在调用时自定义：

```typescript
import { apiClient } from '@/services/api'

await apiClient.get('/some-endpoint', {
  timeout: 60000 // 60 秒
})
```

## 环境变量

可以在 `.env` 文件中配置以下环境变量：

- `VITE_API_BASE_URL`：API 基础 URL（默认：`/api`）
- `VITE_IMPORT_ENDPOINT`：题库导入接口地址（可选，已在 QuestionImport 中使用）

## 后端接口规范

为了使前端 API 服务正常工作，后端需要遵循以下规范：

### 1. 响应格式

所有接口应该返回统一的 JSON 格式：

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

或错误响应：

```json
{
  "success": false,
  "message": "错误信息",
  "code": 400
}
```

### 2. 认证机制

- 使用 JWT Bearer Token
- Token 通过 `Authorization` 请求头传递：`Authorization: Bearer <token>`
- 401 状态码表示未授权或 Token 过期

### 3. 分页参数

分页接口应该支持以下查询参数：
- `page`：页码（从 1 开始）
- `pageSize`：每页数量

响应应包含：
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

## 注意事项

1. **开发环境**：在开发环境中，如果后端未启动，API 调用会失败。可以使用 Mock 数据或 Mock Service Worker (MSW) 进行前端开发。

2. **CORS**：确保后端配置了正确的 CORS 策略，允许前端域名访问。

3. **HTTPS**：生产环境建议使用 HTTPS 协议。

4. **Token 安全**：Token 存储在 localStorage 中，虽然方便但安全性较低。对于高安全要求的应用，建议考虑使用 httpOnly Cookie。

## 下一步

1. 根据实际后端接口调整 API 路径和参数
2. 添加请求/响应拦截器（如日志记录）
3. 实现请求重试机制
4. 添加请求缓存（如使用 React Query）
5. 实现 WebSocket 连接以支持实时数据更新

