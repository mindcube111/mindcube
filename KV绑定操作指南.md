# 🔗 Cloudflare KV 绑定操作指南

你已经创建了 KV 命名空间，现在需要将它绑定到你的 Pages 项目中。

---

## ✅ 你当前的状态

- ✅ KV 命名空间已创建
  - **名称**: `mindcube`
  - **ID**: `d27e1b9f5d6146a9a0ab27b597164be6`

---

## 📋 下一步操作：绑定 KV 到 Pages 项目

### 步骤 1：找到你的 Pages 项目

1. **在 Cloudflare Dashboard 左侧菜单中**
   - 找到 **"构建" (Build)** 部分
   - 点击展开
   - 点击 **"Pages"** 或 **"Workers & Pages"**（如果有的话）

2. **或者在顶部搜索栏**
   - 输入你的项目名称进行搜索

3. **如果还没有 Pages 项目**
   - 需要先创建一个（参考下一步的"创建 Pages 项目"部分）

---

### 步骤 2：进入项目设置

1. **点击你的 Pages 项目名称**进入项目详情页

2. **点击顶部的 "Settings"（设置）标签**

3. **在左侧菜单中找到并点击 "Functions"**

---

### 步骤 3：添加 KV 绑定

在 Functions 设置页面中，向下滚动找到：

#### **"KV namespace bindings"（KV 命名空间绑定）**部分

1. **点击 "+ Add binding"（添加绑定）按钮**

2. **填写绑定信息**：
   - **Variable name（变量名）**: 输入 `DB`
     - ⚠️ **重要**: 必须完全一致，区分大小写！
   
   - **KV namespace（KV 命名空间）**: 
     - 从下拉菜单中选择 `mindcube`
     - 或者你的命名空间名称

3. **点击 "Save"（保存）**

---

### 步骤 4：添加预览环境绑定（可选但推荐）

如果你想要预览环境也能使用 KV：

1. **在同一个页面，找到 "Preview" 标签**或"预览环境"选项

2. **再次点击 "+ Add binding"**

3. **填写相同信息**：
   - **Variable name**: `DB`
   - **KV namespace**: 可以选择同一个 `mindcube`，或者创建一个新的预览命名空间

4. **点击 "Save"**

---

## 📸 操作截图参考

你应该看到类似这样的界面：

```
Functions Settings
├── KV namespace bindings
│   ├── Production
│   │   └── Variable name: DB
│   │       └── KV namespace: mindcube
│   └── Preview
│       └── Variable name: DB
│           └── KV namespace: mindcube
```

---

## ✅ 验证绑定是否成功

绑定成功后，你应该能看到：

- ✅ 在 "KV namespace bindings" 列表中显示你的绑定
- ✅ Variable name 显示为 `DB`
- ✅ KV namespace 显示为 `mindcube`

---

## 🚨 常见问题

### 问题 1：找不到 "KV namespace bindings"

**解决方法**：
- 确保你点击的是 **Pages 项目**，不是 Workers 项目
- 确保在 **Settings > Functions** 页面
- 向下滚动，绑定选项通常在页面下方

### 问题 2：下拉菜单中没有命名空间

**解决方法**：
- 确认 KV 命名空间已经创建
- 刷新页面
- 检查账号权限

### 问题 3：绑定后代码中访问不到

**解决方法**：
- 确认变量名是 `DB`（区分大小写）
- 重新部署项目
- 检查代码中是否使用 `context.env.DB`

---

## 📝 如果还没有 Pages 项目

### 创建新的 Pages 项目

1. **在左侧菜单点击 "Pages"**

2. **点击 "Create a project"（创建项目）**

3. **选择连接方式**：
   - **Connect to Git**（连接 Git 仓库）- 推荐
   - **Upload assets**（上传文件）- 手动部署

4. **如果选择 Git**：
   - 授权访问你的 Git 仓库
   - 选择仓库
   - **Project name**: 输入项目名称，例如：`psychological-assessment-platform`
   - **Production branch**: 通常是 `main` 或 `master`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - 点击 "Save and Deploy"

5. **项目创建后，再回到上面的步骤绑定 KV**

---

## 🎯 绑定完成后的下一步

KV 绑定完成后，继续：

1. ✅ 配置环境变量（JWT_SECRET）
2. ✅ 部署项目
3. ✅ 初始化管理员账号

---

## 💡 提示

- **Variable name 必须一致**: 代码中使用的是 `context.env.DB`，所以变量名必须是 `DB`
- **可以绑定多个 KV**: 如果需要，可以绑定多个 KV 命名空间，使用不同的变量名
- **生产环境和预览环境**: 建议为生产环境和预览环境分别绑定 KV，避免数据混乱

---

## 🆘 需要帮助？

如果遇到问题：
- 检查 Cloudflare Dashboard 的帮助文档
- 查看项目的 `CLOUDFLARE_BACKEND_SETUP.md` 文件
- 确认所有步骤都正确执行

