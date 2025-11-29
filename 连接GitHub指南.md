# 连接 GitHub 完整指南

## 📋 步骤概览

1. 初始化 Git 仓库
2. 创建 GitHub 仓库
3. 连接本地仓库到 GitHub
4. 推送代码

---

## 步骤 1: 初始化本地 Git 仓库

### 1.1 初始化 Git
```bash
git init
```

### 1.2 配置 Git 用户信息（如果还没配置）
```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

### 1.3 添加文件并创建首次提交
```bash
# 添加所有文件
git add .

# 创建首次提交
git commit -m "初始提交：心理测评管理平台"
```

---

## 步骤 2: 在 GitHub 上创建仓库

### 2.1 登录 GitHub
访问 [github.com](https://github.com) 并登录

### 2.2 创建新仓库
1. 点击右上角的 **"+"** → **"New repository"**
2. 填写仓库信息：
   - **Repository name**: `psychological-assessment-platform`（或你喜欢的名字）
   - **Description**: `MIND CUBE 心理测评管理平台`
   - **Visibility**: 选择 Public 或 Private
   - **不要**勾选 "Initialize this repository with a README"（因为本地已有代码）
3. 点击 **"Create repository"**

### 2.3 获取仓库地址
创建后会显示仓库地址，类似：
- HTTPS: `https://github.com/你的用户名/psychological-assessment-platform.git`
- SSH: `git@github.com:你的用户名/psychological-assessment-platform.git`

---

## 步骤 3: 连接本地仓库到 GitHub

### 方法 1: 使用 HTTPS（推荐，简单）

```bash
# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/psychological-assessment-platform.git

# 验证连接
git remote -v
```

### 方法 2: 使用 SSH（更安全，需要配置 SSH 密钥）

如果你已经配置了 SSH 密钥：
```bash
git remote add origin git@github.com:你的用户名/psychological-assessment-platform.git
```

---

## 步骤 4: 推送代码到 GitHub

### 4.1 推送代码
```bash
# 首次推送（设置上游分支）
git push -u origin main
```

如果遇到分支名问题（可能是 `master` 而不是 `main`）：
```bash
# 重命名分支为 main（如果当前是 master）
git branch -M main

# 然后推送
git push -u origin main
```

### 4.2 如果推送失败（需要认证）

**使用 HTTPS 时：**
- GitHub 现在使用 Personal Access Token（PAT）而不是密码
- 需要创建 Token：
  1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  2. 点击 "Generate new token (classic)"
  3. 勾选 `repo` 权限
  4. 生成后复制 Token
  5. 推送时，用户名输入你的 GitHub 用户名，密码输入 Token

**使用 SSH 时：**
- 需要配置 SSH 密钥（如果还没配置）

---

## 步骤 5: 验证连接

推送成功后：
1. 刷新 GitHub 仓库页面
2. 应该能看到所有代码文件
3. 后续更新代码：
   ```bash
   git add .
   git commit -m "更新说明"
   git push
   ```

---

## 🔧 常见问题

### 问题 1: 推送时提示需要认证
**解决方案**: 使用 Personal Access Token（见步骤 4.2）

### 问题 2: 分支名不匹配
```bash
# 查看当前分支
git branch

# 重命名为 main
git branch -M main

# 推送
git push -u origin main
```

### 问题 3: 远程仓库已存在文件
```bash
# 先拉取远程文件
git pull origin main --allow-unrelated-histories

# 解决冲突后推送
git push -u origin main
```

### 问题 4: 想更换远程仓库地址
```bash
# 删除现有远程仓库
git remote remove origin

# 添加新的远程仓库
git remote add origin https://github.com/新用户名/新仓库名.git
```

---

## 📝 后续操作

### 日常更新代码流程
```bash
# 1. 查看更改
git status

# 2. 添加更改
git add .

# 3. 提交更改
git commit -m "描述你的更改"

# 4. 推送到 GitHub
git push
```

### 查看提交历史
```bash
git log --oneline
```

---

## 🚀 连接 Cloudflare Pages

连接 GitHub 后，可以在 Cloudflare Pages 中：
1. 进入 Cloudflare Dashboard → Pages
2. 点击 "Create a project"
3. 选择 "Connect to Git"
4. 授权 GitHub 访问
5. 选择你的仓库
6. 配置构建设置：
   - Build command: `npm run build`
   - Build output directory: `dist`
7. 点击 "Save and Deploy"

---

## ✅ 检查清单

- [ ] Git 已初始化
- [ ] 已创建首次提交
- [ ] GitHub 仓库已创建
- [ ] 远程仓库已连接
- [ ] 代码已成功推送
- [ ] GitHub 上能看到所有文件

