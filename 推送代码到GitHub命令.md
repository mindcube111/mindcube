# 📤 推送代码到 GitHub - 完整命令

你的仓库地址：
```
https://github.com/yo385042-blip/-psychological-assessment-platform.git
```

---

## 🚀 执行步骤

### 步骤 1：添加所有更改并提交

在你的 PowerShell 中运行：

```powershell
# 添加所有文件
git add .

# 提交更改
git commit -m "Add Cloudflare Functions backend API"
```

---

### 步骤 2：添加远程仓库

```powershell
git remote add origin https://github.com/yo385042-blip/-psychological-assessment-platform.git
```

---

### 步骤 3：推送代码到 GitHub

```powershell
git push -u origin main
```

---

## ⚠️ 如果提示需要登录

如果 Git 要求输入用户名和密码：

### 用户名：
```
yo385042-blip
```

### 密码：
使用 **Personal Access Token**（不是 GitHub 密码）

**创建 Token 的方法：**

1. **访问**：https://github.com/settings/tokens
2. **点击**："Generate new token" > "Generate new token (classic)"
3. **填写**：
   - Note: `Cloudflare Deployment`
   - Expiration: 选择过期时间（例如 90 天）
   - **勾选 `repo` 权限**（展开 "repo" 并勾选所有子选项）
4. **点击**："Generate token"（绿色按钮）
5. **复制生成的 token**（只显示一次！务必复制保存）

**推送时**：
- Username: `yo385042-blip`
- Password: 粘贴刚才复制的 token

---

## ✅ 验证推送成功

推送成功后：

1. **访问仓库页面**：
   ```
   https://github.com/yo385042-blip/-psychological-assessment-platform
   ```

2. **你应该能看到**：
   - ✅ 所有文件都已上传
   - ✅ 文件夹结构完整
   - ✅ 不再是空仓库

---

## 🎯 完整命令序列（一键复制）

```powershell
git add .
git commit -m "Add Cloudflare Functions backend API"
git remote add origin https://github.com/yo385042-blip/-psychological-assessment-platform.git
git push -u origin main
```

---

现在开始执行这些命令吧！🚀

