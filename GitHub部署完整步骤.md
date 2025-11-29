# 🚀 使用 GitHub 部署到 Cloudflare Pages 完整步骤

你有 GitHub 账号，这是最好的部署方式！

---

## 📋 第一步：将代码推送到 GitHub

### 步骤 1：检查项目是否已经是 Git 仓库

在项目目录打开 PowerShell，运行：

```powershell
git status
```

#### 如果不是 Git 仓库：
```powershell
# 初始化 Git
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Add Cloudflare Functions backend"
```

#### 如果已经是 Git 仓库：
直接进行下一步。

---

### 步骤 2：在 GitHub 创建新仓库

1. **访问**: https://github.com/new
2. **填写信息**：
   - **Repository name**: `psychological-assessment-platform`（或你喜欢的名称）
   - **Description**: 可选，例如："心理测评管理平台"
   - **Visibility**: 选择 Public 或 Private
   - ⚠️ **不要勾选** "Add a README file"、"Add .gitignore"、"Choose a license"（因为你的项目已经有这些）
3. **点击 "Create repository"**

---

### 步骤 3：推送代码到 GitHub

GitHub 创建仓库后，会显示推送命令，在 PowerShell 中运行：

```powershell
# 添加远程仓库（替换成你的实际仓库地址）
git remote add origin https://github.com/你的GitHub用户名/psychological-assessment-platform.git

# 重命名分支为 main（如果还不是）
git branch -M main

# 推送代码
git push -u origin main
```

**注意**：如果提示需要登录，可能需要：
- 输入 GitHub 用户名和密码（或个人访问令牌 Personal Access Token）

---

## 🌐 第二步：在 Cloudflare 连接 GitHub 仓库

### 方法 A：从当前页面继续

你看到的页面有两个选项。虽然标题说的是 Workers，但我们可以试试：

1. **点击 "导入现有 Git 存储库"（Import existing Git repository）** 右侧的 **"开始使用"** 按钮
2. 授权 GitHub 访问
3. 选择你的仓库

### 方法 B：直接访问 Pages（推荐）

如果上面的方法不对，尝试：

1. **在浏览器地址栏输入**：
   ```
   https://dash.cloudflare.com/pages
   ```
   或
   ```
   https://dash.cloudflare.com/pages/new
   ```

2. **这会直接打开 Pages 创建页面**

---

### 步骤 3：连接 GitHub 仓库

1. **授权 Cloudflare 访问 GitHub**
   - 选择 GitHub
   - 点击 "Authorize Cloudflare"
   - 授权访问你的仓库

2. **选择仓库**
   - 从列表中找到 `psychological-assessment-platform`
   - 点击选择

3. **配置项目设置**
   ```
   Project name: psychological-assessment-platform
   Production branch: main
   Framework preset: Vite（或选择 None）
   Build command: npm run build
   Build output directory: dist
   Root directory: /（根目录）
   ```

4. **点击 "Save and Deploy"**

---

## 🔗 第三步：绑定 KV（部署开始后）

1. **等待部署开始**（或部署完成）

2. **进入项目设置**
   - 点击你的项目名称
   - 点击 **"Settings"**

3. **绑定 KV**
   - 点击 **"Functions"**
   - 找到 **"KV namespace bindings"**
   - 点击 **"+ Add binding"**
   - 填写：
     - Variable name: `DB`
     - KV namespace: `mindcube`
   - 保存

---

## ✅ 完成！

部署完成后，你会得到一个 URL，例如：
```
https://psychological-assessment-platform.pages.dev
```

---

## 🆘 常见问题

### 问题 1：Git 推送时要求登录

**解决方法**：
- 使用 Personal Access Token（个人访问令牌）代替密码
- 创建方法：GitHub Settings > Developer settings > Personal access tokens > Generate new token

### 问题 2：找不到 Pages 创建入口

**解决方法**：
- 直接访问：https://dash.cloudflare.com/pages/new
- 或从左侧菜单：计算和 AI > Workers 和 Pages > 点击右上角"创建应用程序" > 寻找 Pages 选项

### 问题 3：授权后看不到仓库

**解决方法**：
- 检查仓库是否为 Private（私有仓库需要授权访问）
- 刷新页面
- 重新授权

---

现在开始第一步：将代码推送到 GitHub！🚀

