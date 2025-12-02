# 🚀 Cloudflare 部署命令

## 📋 快速部署命令

### 方式一：一键部署（推荐）

**Windows PowerShell:**
```powershell
npm run deploy
```

**或直接运行脚本:**
```powershell
.\scripts\deploy.ps1
```

**或双击运行:**
```
deploy.bat
```

### 方式二：快速部署（需要已安装 Wrangler）

```bash
npm run deploy:quick
```

或

```bash
npm run deploy:cloudflare
```

### 方式三：手动部署命令

```bash
# 1. 构建项目
npm run build

# 2. 部署到 Cloudflare Pages
wrangler pages deploy dist --project-name=psychological-assessment-platform
```

## 🔧 部署前准备

### 1. 安装 Wrangler CLI（如果还没有）

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

这会打开浏览器，让您登录 Cloudflare 账号。

## 📝 完整部署步骤

### 步骤 1: 构建项目

```bash
npm run build
```

这会：
- ✅ 使用 Vite 打包项目
- ✅ 复制 Functions 文件到 `dist/functions`

### 步骤 2: 验证构建产物

检查 `dist` 目录是否包含：
- ✅ `dist/index.html`
- ✅ `dist/assets/` (JS/CSS 文件)
- ✅ `dist/functions/_middleware.js`
- ✅ `dist/functions/api/[[path]].js`

### 步骤 3: 部署到 Cloudflare

```bash
wrangler pages deploy dist --project-name=psychological-assessment-platform
```

## 🎯 一键部署命令（完整流程）

如果您想使用交互式部署脚本（推荐首次部署）：

```bash
# Windows PowerShell
npm run deploy:ps1

# 或跨平台
npm run deploy
```

这个命令会：
1. ✅ 检查 Node.js 环境
2. ✅ 检查并安装依赖
3. ✅ 清理旧构建
4. ✅ 构建项目
5. ✅ 验证构建产物
6. ✅ 检查 Wrangler CLI
7. ✅ 提供部署选项（自动/手动）

## 🔍 验证部署

部署成功后，访问：

- **网站地址**: `https://psychological-assessment-platform.pages.dev`
- **API 测试**: `https://psychological-assessment-platform.pages.dev/api/questionnaires/available`

## 🛠️ 常见问题

### Q: 提示 "wrangler: command not found"

**解决方案：**
```bash
npm install -g wrangler
```

### Q: 提示需要登录

**解决方案：**
```bash
wrangler login
```

### Q: 部署失败

**解决方案：**
1. 确保已构建项目: `npm run build`
2. 检查 `dist` 目录是否存在
3. 确认项目名称正确: `psychological-assessment-platform`
4. 查看错误信息并修复

### Q: 如何更新部署？

**解决方案：**
重新运行部署命令即可：
```bash
npm run deploy:quick
```

## 📚 其他部署方式

### 通过 Cloudflare Dashboard 部署

1. 访问 https://dash.cloudflare.com/
2. 进入 Pages > Create a project
3. 选择 "Upload assets"
4. 上传 `dist` 目录

### 通过 Git 自动部署

1. 在 Cloudflare Dashboard 中创建 Pages 项目
2. 选择 "Connect to Git"
3. 授权并选择您的仓库
4. 配置构建设置：
   - Build command: `npm run build`
   - Build output directory: `dist`
5. 每次推送代码会自动部署

---

**推荐命令：** `npm run deploy` （首次部署）或 `npm run deploy:quick` （快速部署）




