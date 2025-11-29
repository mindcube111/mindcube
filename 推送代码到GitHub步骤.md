# 📤 推送代码到 GitHub 步骤

你的项目已经是 Git 仓库，现在需要提交更改并推送到 GitHub。

---

## 🎯 第一步：提交所有更改

在你的 PowerShell 中运行以下命令：

### 1. 添加所有更改的文件

```powershell
git add .
```

这会添加：
- ✅ 新创建的后端文件（functions/api/, functions/utils/ 等）
- ✅ 修改的文件（functions/_middleware.js, index.html 等）
- ✅ 删除的文件（旧的文档）
- ✅ 新的文档文件

### 2. 提交更改

```powershell
git commit -m "Add Cloudflare Functions backend API"
```

### 3. 检查是否有远程仓库

```powershell
git remote -v
```

- **如果显示 URL**：说明已经有远程仓库，直接跳到"推送代码"步骤
- **如果没有显示**：需要先创建 GitHub 仓库并添加远程地址

---

## 🆕 第二步：创建 GitHub 仓库（如果还没有）

### 1. 访问 GitHub

打开浏览器，访问：https://github.com/new

### 2. 创建新仓库

- **Repository name**: `psychological-assessment-platform`
- **Description**: 可选，例如："心理测评管理平台"
- **Visibility**: 
  - Public（公开，免费）
  - Private（私有，免费账号也可以创建私有仓库）
- ⚠️ **不要勾选**：
  - ❌ Add a README file
  - ❌ Add .gitignore
  - ❌ Choose a license

### 3. 点击 "Create repository"

---

## 📤 第三步：添加远程仓库并推送

### 如果还没有远程仓库：

在 PowerShell 中运行（**替换成你的实际仓库地址**）：

```powershell
# 添加远程仓库（替换成你的 GitHub 用户名和仓库名）
git remote add origin https://github.com/你的GitHub用户名/psychological-assessment-platform.git

# 推送代码
git push -u origin main
```

### 如果已经有远程仓库：

直接推送：

```powershell
git push
```

或者如果是第一次推送到这个分支：

```powershell
git push -u origin main
```

---

## 🔐 如果提示需要登录

如果 Git 要求输入用户名和密码：

### 方法 1：使用 Personal Access Token（推荐）

1. **创建 Token**：
   - 访问：https://github.com/settings/tokens
   - 点击 "Generate new token" > "Generate new token (classic)"
   - 填写名称，选择过期时间
   - 勾选 `repo` 权限
   - 点击 "Generate token"
   - **复制生成的 token**（只显示一次，务必保存）

2. **使用 Token 登录**：
   - 用户名：你的 GitHub 用户名
   - 密码：粘贴刚才复制的 token

### 方法 2：使用 GitHub Desktop（更简单）

下载 GitHub Desktop：
- https://desktop.github.com/
- 用 GitHub Desktop 推送代码更方便

---

## ✅ 验证推送成功

推送成功后，访问你的 GitHub 仓库：
```
https://github.com/你的用户名/psychological-assessment-platform
```

你应该能看到所有文件都已上传。

---

## 🎯 推送完成后的下一步

推送成功后，回到 Cloudflare：

1. 刷新 Cloudflare 页面
2. 在 "导入现有 Git 存储库" 点击 "开始使用"
3. 授权 GitHub 访问
4. 选择你的仓库
5. 配置项目并部署

---

现在开始执行这些命令！🚀

