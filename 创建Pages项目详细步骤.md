# 🚀 创建 Cloudflare Pages 项目详细步骤

让我们一步步创建 Pages 项目并配置 KV 绑定。

---

## 📍 第一步：找到 Pages 菜单

### 在 Cloudflare Dashboard 中：

1. **看左侧菜单栏**
   - 找到 **"计算和 AI" (Compute and AI)** 部分（你现在应该能看到，因为你在 Workers 页面）
   - 展开它

2. **找到 "Workers 和 Pages"**
   - 点击进入

3. **你会看到两个标签或选项：**
   - **Workers**（你刚才看的）
   - **Pages** ← 点击这个

---

## 📦 第二步：创建 Pages 项目

### 步骤 1：进入 Pages

1. **点击 "Pages" 标签或菜单项**
   - 你会看到 Pages 项目列表（可能是空的）

2. **点击 "Create a project"（创建项目）** 按钮
   - 通常在右上角或页面中间

---

### 步骤 2：选择连接方式

你会看到两个选项：

#### 选项 A：Connect to Git（连接 Git 仓库）- **推荐** ⭐

如果你已经将代码推送到 GitHub/GitLab/Bitbucket：

1. **点击 "Connect to Git"**
2. **授权 Cloudflare 访问你的 Git 账号**
   - 选择 GitHub/GitLab/Bitbucket
   - 点击 "Authorize" 授权
3. **选择你的仓库**
   - 从列表中找到你的项目仓库
   - 点击选择

#### 选项 B：Upload assets（上传文件）- 手动部署

如果你想手动上传：

1. **点击 "Upload assets"**
2. **跳过此选项**（不推荐，Git 集成更方便）

---

### 步骤 3：配置项目设置

选择仓库后，会看到配置页面：

#### 📝 填写以下信息：

1. **Project name（项目名称）**
   ```
   psychological-assessment-platform
   ```
   或任意你喜欢的名称

2. **Production branch（生产分支）**
   ```
   main
   ```
   或 `master`（根据你的 Git 分支名称）

3. **Framework preset（框架预设）**
   ```
   Vite
   ```
   或选择 "None"（因为我们自定义构建）

4. **Build command（构建命令）**
   ```
   npm run build
   ```

5. **Build output directory（构建输出目录）**
   ```
   dist
   ```

6. **Root directory（根目录）**
   ```
   /
   ```
   或者如果项目在子目录，填写子目录路径

#### ✅ 检查配置

确保配置类似这样：
```
Project name: psychological-assessment-platform
Production branch: main
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: /
```

---

### 步骤 4：保存并部署

1. **点击 "Save and Deploy"（保存并部署）** 按钮

2. **等待部署完成**
   - Cloudflare 会自动：
     - 安装依赖（`npm install`）
     - 构建项目（`npm run build`）
     - 部署到 Cloudflare Pages

3. **首次部署可能需要 3-5 分钟**

---

## 🔗 第三步：绑定 KV 命名空间

部署开始后，我们就可以绑定 KV 了：

### 步骤 1：进入项目设置

1. **等待部署开始后**（或部署完成后）
2. **点击你的 Pages 项目名称**
3. **点击顶部的 "Settings"（设置）** 标签

### 步骤 2：进入 Functions 设置

1. **在左侧菜单中**，找到并点击 **"Functions"**

### 步骤 3：添加 KV 绑定

1. **向下滚动**，找到 **"KV namespace bindings"**（KV 命名空间绑定）部分

2. **点击 "+ Add binding"（添加绑定）** 按钮

3. **填写绑定信息：**
   ```
   Variable name: DB
   KV namespace: mindcube（从下拉菜单选择）
   ```

4. **点击 "Save"（保存）**

### 步骤 4：添加预览环境绑定（可选）

1. **在同一个页面**，找到 **"Preview"** 标签或预览环境选项
2. **再次点击 "+ Add binding"**
3. **填写相同信息**
4. **保存**

---

## 🔐 第四步：配置环境变量（可选但推荐）

### 步骤 1：回到 Settings

1. **在 Settings 页面**，找到 **"Environment Variables"（环境变量）**

### 步骤 2：添加 JWT_SECRET

1. **点击 "+ Add variable"（添加变量）**

2. **填写：**
   ```
   Variable name: JWT_SECRET
   Value: [生成一个随机字符串，至少32个字符]
   Environment: Production 和 Preview（两个都勾选）
   ```

3. **生成随机字符串的方法：**
   - Windows PowerShell：
     ```powershell
     [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
     ```
   - 或者使用在线工具生成

4. **点击 "Save"**

---

## ✅ 第五步：验证配置

### 检查清单：

- [ ] Pages 项目已创建
- [ ] 项目正在部署或已部署完成
- [ ] KV 绑定已添加（Variable name: `DB`）
- [ ] 预览环境 KV 绑定已添加（可选）
- [ ] JWT_SECRET 环境变量已配置（可选）

---

## 📝 如果还没有 Git 仓库

### 快速创建 GitHub 仓库：

1. **在项目根目录打开终端**

2. **初始化 Git（如果还没有）：**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. **在 GitHub 创建新仓库**
   - 访问：https://github.com/new
   - 创建新仓库

4. **推送代码：**
   ```bash
   git remote add origin https://github.com/你的用户名/仓库名.git
   git branch -M main
   git push -u origin main
   ```

5. **然后在 Cloudflare Pages 中选择这个仓库**

---

## 🎯 部署完成后的下一步

1. ✅ **等待部署完成**
   - 在 Deployments 标签查看部署状态

2. ✅ **获取部署 URL**
   - 部署完成后会显示项目 URL，例如：
   ```
   https://psychological-assessment-platform.pages.dev
   ```

3. ✅ **初始化管理员账号**
   - 参考 `详细部署步骤.md` 中的"初始化管理员账号"部分

---

## 🆘 常见问题

### 问题 1：找不到 Pages 菜单

**解决方法：**
- 确保账号有 Pages 权限
- 刷新页面
- 尝试直接访问：https://dash.cloudflare.com/pages

### 问题 2：部署失败

**可能原因：**
- 构建命令错误
- 缺少依赖
- 代码有错误

**解决方法：**
- 查看部署日志
- 检查构建配置
- 本地先运行 `npm run build` 测试

### 问题 3：找不到 KV 绑定选项

**解决方法：**
- 确保在 Settings > Functions 页面
- 向下滚动查找
- 等待项目部署完成后再配置

---

## 💡 提示

- **首次部署会较慢**：Cloudflare 需要安装依赖和构建
- **后续部署会更快**：只部署更新的部分
- **每次推送代码到 Git**：Cloudflare 会自动重新部署

---

现在开始创建 Pages 项目吧！🚀

