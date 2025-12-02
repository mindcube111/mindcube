# 🌐 Cloudflare Pages 部署地址

## 📍 部署信息

根据 Cloudflare Dashboard 显示：

**项目名称**: 思维立方体 (Mind Cube)

**主域名**: 
- **Cloudflare Pages 地址**: https://mindcube.pages.dev

**自定义域名**: 
- **生产地址**: https://mindcube.top ✅
  - 状态：积极的（Active）
  - SSL：已启用 SSL 🔒

**最后更新**: 3小时前

## 🔗 访问链接

### 主要页面（使用自定义域名）
- **首页**: https://mindcube.top
- **登录页**: https://mindcube.top/login
- **注册页**: https://mindcube.top/register
- **仪表盘**: https://mindcube.top/dashboard

### API 接口（使用自定义域名）
- **可用问卷**: https://mindcube.top/api/questionnaires/available
- **健康检查**: https://mindcube.top/api/health
- **用户信息**: https://mindcube.top/api/users/me

### 备用地址（Cloudflare Pages 默认域名）
- **首页**: https://mindcube.pages.dev
- **API 测试**: https://mindcube.pages.dev/api/questionnaires/available

## 🔍 查看其他域名

要查看所有配置的域名：

1. 登录 Cloudflare Dashboard
2. 进入 Pages 项目 "思维立方体"
3. 点击 "Settings"（设置）
4. 查看 "Custom domains"（自定义域名）部分

## 🚀 部署方式

### 自动部署（GitHub）
```bash
git add .
git commit -m "更新内容"
git push origin main
# Cloudflare 会自动部署
```

### 手动部署
```bash
npm run deploy:quick
```

## 📝 部署配置

**项目名称**: mindcube  
**GitHub 仓库**: https://github.com/mindcube111/mindcube  
**构建命令**: `npm run build`  
**输出目录**: `dist`

## ✅ 验证部署

访问以下地址验证部署是否正常：

1. **网站首页（自定义域名）**: https://mindcube.top
2. **API 测试**: https://mindcube.top/api/questionnaires/available
3. **备用地址**: https://mindcube.pages.dev

如果都能正常访问，说明部署成功！

## 🔒 SSL 证书状态

- ✅ **SSL 已启用** - 自定义域名 `mindcube.top` 已配置 SSL 证书
- ✅ **HTTPS 访问** - 所有流量已加密
- ✅ **状态正常** - 域名状态为"积极的"（Active）

---

**主要部署地址**: https://mindcube.top  
**备用地址**: https://mindcube.pages.dev

