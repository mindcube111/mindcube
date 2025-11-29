# 📦 初始化 Git 仓库步骤

在创建 Pages 项目之前，需要先将代码推送到 Git 仓库。

---

## 🚀 快速步骤

### 步骤 1：初始化 Git（已帮你完成）

我已经运行了 `git init`，Git 仓库已初始化。

---

### 步骤 2：创建 .gitignore 文件（如果还没有）

检查是否有 `.gitignore` 文件，如果没有，我们需要创建一个。

---

### 步骤 3：添加并提交代码

在你的 PowerShell 中运行：

```powershell
# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Add Cloudflare Functions backend"
```

---

### 步骤 4：在 GitHub 创建仓库

1. **访问**: https://github.com/new
2. **填写信息**：
   - Repository name: `psychological-assessment-platform`（或你喜欢的名称）
   - 选择 Public 或 Private
   - **不要**勾选 "Initialize this repository with a README"
3. **点击 "Create repository"**

---

### 步骤 5：推送代码到 GitHub

GitHub 会显示推送命令，在你的 PowerShell 中运行：

```powershell
# 添加远程仓库（替换成你的仓库地址）
git remote add origin https://github.com/你的用户名/psychological-assessment-platform.git

# 重命名分支为 main（如果还不是）
git branch -M main

# 推送代码
git push -u origin main
```

**注意**：需要先在 GitHub 登录并授权。

---

### 步骤 6：在 Cloudflare Pages 中连接

1. 回到 Cloudflare Dashboard
2. 进入 Pages
3. Create a project
4. Connect to Git
5. 选择你刚创建的仓库

---

## 🔄 或者：使用上传方式（不推荐但更快）

如果不想用 Git，也可以：

1. 在 Cloudflare Pages 创建项目时选择 **"Upload assets"**
2. 先运行 `npm run build` 构建项目
3. 上传 `dist` 目录

但这种方式每次更新都需要手动上传，不方便。

---

## ✅ 推荐使用 Git

使用 Git 的好处：
- ✅ 自动部署（每次推送代码自动更新）
- ✅ 版本控制
- ✅ 方便管理
- ✅ 可以回滚

建议使用 Git 方式！

