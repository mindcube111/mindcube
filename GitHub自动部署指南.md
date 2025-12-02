# 🔗 GitHub 自动部署指南

## 📍 当前部署信息

**GitHub 仓库**: https://github.com/mindcube111/mindcube

**当前部署地址**: https://54258fd9.psychological-assessment-platform-6sw.pages.dev

**项目名称**: psychological-assessment-platform

## 🚀 配置 GitHub 自动部署

### 步骤 1: 连接 GitHub 仓库到 Cloudflare Pages

1. **登录 Cloudflare Dashboard**
   - 访问 https://dash.cloudflare.com/
   - 进入您的账户

2. **进入 Pages 项目**
   - 点击左侧菜单 "Workers & Pages"
   - 找到 `psychological-assessment-platform` 项目
   - 点击进入项目

3. **连接 Git 仓库**
   - 点击 "Settings"（设置）标签
   - 找到 "Builds & deployments"（构建和部署）部分
   - 点击 "Connect to Git"
   - 选择 GitHub
   - 授权 Cloudflare 访问您的 GitHub 账户
   - 选择仓库：`mindcube111/mindcube`
   - 选择分支：`main`（或您的主分支）

### 步骤 2: 配置构建设置

在 "Builds & deployments" 部分配置：

**构建设置：**
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/`（如果项目在仓库根目录）
  - 如果项目在子目录，例如 `02 管理器`，则填写：`02 管理器`

**环境变量（如需要）：**
- `NODE_VERSION`: `18`（推荐）
- 其他环境变量根据需要添加

### 步骤 3: 保存并部署

1. 点击 "Save and Deploy"（保存并部署）
2. Cloudflare 会自动：
   - 克隆您的 GitHub 仓库
   - 安装依赖
   - 运行构建命令
   - 部署到 Pages

3. 等待构建完成（通常 2-5 分钟）

## ✅ 自动部署已配置

配置完成后，每次您推送代码到 GitHub，Cloudflare 会自动：

1. ✅ 检测到新的提交
2. ✅ 自动触发构建
3. ✅ 部署最新版本

## 🔄 使用自动部署

### 更新代码并部署

```bash
# 1. 修改代码
# ... 编辑文件 ...

# 2. 提交更改
git add .
git commit -m "更新内容描述"

# 3. 推送到 GitHub
git push origin main

# 4. Cloudflare 会自动检测并部署！
```

### 查看部署状态

1. **在 Cloudflare Dashboard**
   - 进入项目页面
   - 查看 "Deployments"（部署）标签
   - 可以看到所有部署历史和状态

2. **在 GitHub**
   - 每次部署会在 GitHub Actions 中显示（如果配置了）
   - 提交记录会显示部署状态

## 🌐 部署地址

### 生产环境地址

部署成功后，您的网站地址为：

**主域名**: `https://psychological-assessment-platform.pages.dev`

**预览地址**: 每次部署会生成一个预览地址，格式为：
`https://[commit-hash].psychological-assessment-platform.pages.dev`

### 自定义域名（可选）

如果需要使用自定义域名：

1. 在 Cloudflare Dashboard 中进入项目设置
2. 点击 "Custom domains"（自定义域名）
3. 添加您的域名
4. 按照提示配置 DNS 记录

## 📋 部署检查清单

配置自动部署前，请确认：

- [ ] GitHub 仓库已推送所有必要文件
- [ ] `functions/` 目录已提交到 GitHub
- [ ] `wrangler.toml` 文件已提交
- [ ] `package.json` 包含正确的构建脚本
- [ ] 项目可以在本地成功构建 (`npm run build`)

## 🔍 验证部署

部署完成后，访问：

- **网站首页**: https://psychological-assessment-platform.pages.dev
- **API 测试**: https://psychological-assessment-platform.pages.dev/api/questionnaires/available

## 🛠️ 常见问题

### Q: 构建失败怎么办？

**检查：**
1. 查看 Cloudflare Dashboard 中的构建日志
2. 确认构建命令正确：`npm run build`
3. 确认输出目录正确：`dist`
4. 检查 Node.js 版本是否兼容

**解决：**
- 在环境变量中设置 `NODE_VERSION=18`
- 检查 `package.json` 中的依赖是否正确
- 查看构建日志中的具体错误信息

### Q: Functions 不工作？

**检查：**
1. 确认 `functions/` 目录已推送到 GitHub
2. 确认构建脚本包含 `copy-functions`
3. 在 Cloudflare Dashboard 中查看 Functions 状态

**解决：**
- 确保 `package.json` 中的 `build` 脚本包含 `copy-functions`
- 检查 `dist/functions` 目录是否在构建输出中

### Q: 如何回滚到之前的版本？

**方法：**
1. 在 Cloudflare Dashboard 中进入 "Deployments"
2. 找到之前的成功部署
3. 点击 "Retry deployment"（重新部署）

### Q: 如何禁用自动部署？

**方法：**
1. 在项目设置中找到 "Builds & deployments"
2. 点击 "Disconnect Git repository"（断开 Git 仓库连接）
3. 之后需要手动部署

## 📚 相关文档

- [部署指南](部署指南.md)
- [Cloudflare 部署命令](Cloudflare部署命令.md)
- [部署命令说明](部署命令说明.md)

## 🎯 快速参考

**GitHub 仓库**: https://github.com/mindcube111/mindcube

**当前部署地址**: https://54258fd9.psychological-assessment-platform-6sw.pages.dev

**生产地址**: https://psychological-assessment-platform.pages.dev

**配置自动部署后，只需 `git push` 即可自动部署！** 🚀




