# 修复 Cloudflare 部署错误

## 问题描述

Cloudflare Pages 部署时遇到错误：

```
npm error Missing: crypto-js@4.2.0 from lock file
npm error `npm ci` can only install packages when your package.json and package-lock.json or npm-shrinkwrap.json are in sync.
```

## 问题原因

`package.json` 和 `package-lock.json` 文件不同步。`package.json` 中声明了 `crypto-js@4.2.0`，但 `package-lock.json` 中缺少该包的完整锁定信息。

## 解决方案

### 步骤 1：重新生成 package-lock.json

在项目目录中执行：

```powershell
# 删除旧的 package-lock.json
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# 重新安装依赖以生成新的 package-lock.json
npm install
```

### 步骤 2：验证 crypto-js 已包含

检查 package-lock.json 是否包含 crypto-js：

```powershell
# 检查是否包含 crypto-js
Select-String -Path package-lock.json -Pattern "crypto-js"
```

### 步骤 3：提交并推送

```powershell
# 添加更新后的 package-lock.json
git add package-lock.json

# 提交更改
git commit -m "fix: 同步 package-lock.json 以包含 crypto-js 依赖"

# 推送到 GitHub
git push origin main
```

## 完整命令序列

```powershell
# 1. 删除并重新生成 package-lock.json
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install

# 2. 验证安装
npm ls crypto-js

# 3. 添加并提交
git add package-lock.json
git commit -m "fix: 同步 package-lock.json 以包含所有依赖"

# 4. 推送到 GitHub
git push origin main
```

## 验证修复

推送后，Cloudflare 会自动重新部署。检查部署日志，应该看到：

```
Success: Installing project dependencies
```

而不是之前的错误。

## 预防措施

以后添加新依赖时，建议：

1. 在 `package.json` 中添加依赖
2. 运行 `npm install` 自动更新 `package-lock.json`
3. 提交 `package.json` 和 `package-lock.json` 一起提交

```powershell
# 添加新依赖的完整流程
npm install 新包名
git add package.json package-lock.json
git commit -m "feat: 添加新依赖"
git push origin main
```







