# ⚡ 快速创建 Pages 项目（简化版）

## 🎯 3 个简单步骤

### 1️⃣ 进入 Pages

**在 Cloudflare Dashboard 左侧菜单：**
- 展开 **"计算和 AI"**
- 点击 **"Workers 和 Pages"**
- 点击 **"Pages"** 标签

### 2️⃣ 创建项目

1. 点击 **"Create a project"**
2. 选择 **"Connect to Git"**
3. 授权并选择你的仓库
4. 配置：
   ```
   项目名称: psychological-assessment-platform
   分支: main
   构建命令: npm run build
   输出目录: dist
   ```
5. 点击 **"Save and Deploy"**

### 3️⃣ 绑定 KV

1. 项目创建后，点击项目名称
2. **Settings** > **Functions**
3. 找到 **"KV namespace bindings"**
4. **+ Add binding**：
   - Variable name: `DB`
   - KV namespace: `mindcube`
5. 保存

---

## ✅ 完成！

现在你可以：
- 访问你的网站 URL
- 等待自动部署
- 开始使用后端 API

