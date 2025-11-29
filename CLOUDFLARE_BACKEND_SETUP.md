# Cloudflare Workers 后端部署指南

本项目现在使用 Cloudflare Pages Functions 实现后端 API，前后端都部署在 Cloudflare 上。

## 📋 前置要求

1. Cloudflare 账号
2. Cloudflare Pages 项目已创建
3. Wrangler CLI 已安装（可选，用于本地开发）

## 🚀 部署步骤

### 1. 创建 KV 命名空间

KV 用于数据持久化存储。

#### 方法 1：通过 Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入你的账号，点击 **Workers & Pages**
3. 点击 **KV** 标签页
4. 点击 **Create a namespace**
5. 输入名称，例如：`DB` 或 `psychological-assessment-db`
6. 记录下命名空间的 **ID**

#### 方法 2：通过 Wrangler CLI

```bash
# 创建生产环境命名空间
wrangler kv:namespace create "DB"

# 创建预览环境命名空间
wrangler kv:namespace create "DB" --preview
```

### 2. 配置 KV 绑定

在 Cloudflare Dashboard 中：

1. 进入你的 **Pages** 项目
2. 进入 **Settings** > **Functions**
3. 找到 **KV namespace bindings**
4. 点击 **Add binding**
5. 配置：
   - **Variable name**: `DB`
   - **KV namespace**: 选择你创建的命名空间

或者，更新 `wrangler.toml` 文件中的 KV 配置：

```toml
[[kv_namespaces]]
binding = "DB"
id = "your-production-kv-namespace-id"

[[kv_namespaces]]
binding = "DB"
preview_id = "your-preview-kv-namespace-id"
```

### 3. 配置环境变量

在 Cloudflare Dashboard 中：

1. 进入你的 **Pages** 项目
2. 进入 **Settings** > **Environment Variables**
3. 添加以下环境变量（可选，用于生产环境）：

```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

⚠️ **重要**：`JWT_SECRET` 应该是一个随机生成的、足够长的字符串，用于 JWT Token 签名。

### 4. 部署到 Cloudflare Pages

#### 方法 1：通过 Git 集成（推荐）

1. 将代码推送到 Git 仓库（GitHub、GitLab 等）
2. 在 Cloudflare Dashboard 中连接你的仓库
3. Cloudflare 会自动构建和部署

构建命令：
```bash
npm run build
```

构建输出目录：`dist`

#### 方法 2：通过 Wrangler CLI

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 部署到 Cloudflare Pages
npx wrangler pages deploy dist
```

### 5. 初始化默认管理员账号

部署完成后，你需要创建一个默认管理员账号。可以通过以下方式：

#### 方法 1：通过 Cloudflare Dashboard 手动创建

1. 进入 Cloudflare Dashboard > Workers & Pages > KV
2. 选择你的命名空间
3. 手动添加以下键值对：

**键**: `user:admin-default`
**值**:
```json
{
  "id": "admin-default",
  "username": "admin",
  "email": "admin@example.com",
  "password": "hashed-password",
  "name": "管理员",
  "role": "admin",
  "status": "active",
  "remainingQuota": 1000,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

⚠️ **注意**：密码需要是哈希后的值。可以使用在线工具或本地脚本生成。

#### 方法 2：通过 API 注册后手动激活

1. 先通过前端注册一个账号
2. 然后在 KV 中手动将该账号的 `role` 改为 `admin`，`status` 改为 `active`

#### 方法 3：创建一个初始化脚本

创建一个 Cloudflare Worker 脚本用于初始化数据（待实现）

## 📁 文件结构

```
functions/
├── _middleware.js          # 中间件（处理 SPA 路由和 API 路由）
├── api/
│   └── [[path]].js        # API 主路由处理器
└── utils/
    ├── jwt.js             # JWT 工具函数
    ├── db.js              # 数据库操作（KV）
    ├── auth.js            # 认证中间件
    └── response.js        # 响应格式工具
```

## 🔧 本地开发

### 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 登录 Cloudflare

```bash
wrangler login
```

### 本地运行（需要配置 KV）

```bash
# 使用本地 KV（数据存储在本地）
wrangler pages dev dist

# 或使用远程 KV
wrangler pages dev dist --kv DB=your-kv-namespace-id
```

## 📝 API 路由

所有 API 路由都以 `/api` 开头：

- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/logout` - 登出
- `POST /api/auth/refresh` - 刷新 Token
- `POST /api/auth/change-password` - 修改密码

- `GET /api/users` - 获取用户列表（管理员）
- `GET /api/users/:id` - 获取用户详情（管理员）
- `PUT /api/users/:id` - 更新用户信息（管理员）
- `PATCH /api/users/:id/status` - 更新用户状态（管理员）
- `DELETE /api/users/:id` - 删除用户（管理员）

- `POST /api/links/generate` - 生成链接
- `GET /api/links` - 获取链接列表
- `GET /api/links/:id` - 获取链接详情
- `PATCH /api/links/:id/status` - 更新链接状态
- `DELETE /api/links/:id` - 删除链接

- `POST /api/admin/questionnaires/import` - 导入题库（管理员）
- `GET /api/admin/questionnaires` - 获取题库列表（管理员）
- `GET /api/admin/questionnaires/:type` - 获取题库详情（管理员）
- `PATCH /api/admin/questionnaires/:type/publish-status` - 更新上架状态（管理员）
- `DELETE /api/admin/questionnaires/:type` - 删除题库（管理员）
- `GET /api/questionnaires/available` - 获取可用问卷列表（公开）

- `GET /api/dashboard/stats` - 获取统计数据
- `GET /api/dashboard/chart?period=7d` - 获取图表数据
- `GET /api/dashboard/realtime` - 获取实时统计

- `GET /api/notifications` - 获取通知列表
- `GET /api/notifications/unread-count` - 获取未读数量
- `PATCH /api/notifications/:id/read` - 标记已读
- `POST /api/notifications/mark-all-read` - 标记全部已读
- `DELETE /api/notifications/:id` - 删除通知

## ⚠️ 注意事项

1. **数据持久化**：使用 Cloudflare KV 存储数据，KV 有读写次数限制（免费版有限制）

2. **JWT 安全**：生产环境必须设置强壮的 `JWT_SECRET`

3. **密码安全**：当前实现的密码哈希比较简单，生产环境建议使用更安全的方法（如 bcrypt）

4. **CORS**：当前配置允许所有来源（`*`），生产环境应该限制特定域名

5. **错误处理**：所有 API 错误都会返回统一的 JSON 格式

6. **KV 限制**：
   - 单个值最大 25MB
   - 免费版每天有读写次数限制
   - 读写延迟可能比传统数据库高

## 🔒 安全建议

1. 在生产环境中：
   - 使用强壮的 `JWT_SECRET`
   - 实现更安全的密码哈希（bcrypt）
   - 限制 CORS 来源
   - 添加速率限制
   - 添加请求验证

2. 考虑升级到 Cloudflare D1（SQL 数据库）以获得更好的性能和更丰富的查询功能

## 🐛 故障排除

### KV 未配置错误

如果看到 "KV store not configured" 警告，说明 KV 命名空间未正确绑定。请检查：
1. KV 命名空间是否已创建
2. 绑定名称是否与代码中一致（`DB`）
3. Cloudflare Dashboard 中的绑定配置是否正确

### API 路由 404

检查：
1. `functions/api/[[path]].js` 文件是否存在
2. 构建后 `dist/functions/` 目录是否正确
3. middleware 是否正确放行 `/api/*` 路由

### CORS 错误

检查 API 响应是否包含正确的 CORS 头。

## 📚 相关文档

- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/platform/functions/)
- [Cloudflare KV](https://developers.cloudflare.com/kv/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

