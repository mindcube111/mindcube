# Git 命令快速参考 ✅

## ⚠️ 重要提示

**只输入命令本身，不要复制粘贴整个输出！**

例如：
- ✅ **正确**：只输入 `git remote -v`
- ❌ **错误**：复制粘贴包含 `PS C:\Users\...>` 的整行

---

## 📋 当前配置状态

✅ **远程仓库已配置为 SSH 方式**
```
origin  git@github.com:mindcube111/mindcube.git (fetch)
origin  git@github.com:mindcube111/mindcube.git (push)
```

✅ **使用 `main` 分支**

---

## 🚀 常用 Git 命令

### 查看配置

```powershell
# 查看远程仓库配置（只输入这一行）
git remote -v

# 查看当前分支（只输入这一行）
git branch

# 查看所有分支（只输入这一行）
git branch -a

# 查看当前状态（只输入这一行）
git status
```

### 推送代码

```powershell
# 推送代码到 GitHub（只输入这一行）
git push origin main

# 或者如果已经设置跟踪（只输入这一行）
git push
```

### 拉取代码

```powershell
# 拉取最新代码（只输入这一行）
git pull origin main

# 或者（只输入这一行）
git pull
```

### 添加和提交

```powershell
# 添加所有更改（只输入这一行）
git add .

# 提交更改（只输入这一行，修改提交信息）
git commit -m "你的提交信息"

# 一次性添加、提交和推送（分别输入三行）
git add .
git commit -m "更新说明"
git push origin main
```

---

## ✅ 完整工作流程示例

### 第一次推送代码

```powershell
# 1. 添加文件（只输入这一行）
git add .

# 2. 提交（只输入这一行，修改提交信息）
git commit -m "Initial commit"

# 3. 推送（只输入这一行）
git push origin main
```

### 日常更新代码

```powershell
# 1. 拉取最新代码（只输入这一行）
git pull origin main

# 2. 添加你的更改（只输入这一行）
git add .

# 3. 提交更改（只输入这一行，修改提交信息）
git commit -m "更新功能"

# 4. 推送到 GitHub（只输入这一行）
git push origin main
```

---

## 🔍 问题排查

### 查看 SSH 连接

```powershell
# 测试 SSH 连接（只输入这一行）
ssh -T git@github.com

# 应该看到：
# Hi mindcube111! You've successfully authenticated...
```

### 查看提交历史

```powershell
# 查看最近 5 条提交（只输入这一行）
git log --oneline -5
```

### 查看远程分支

```powershell
# 查看远程分支（只输入这一行）
git branch -r
```

---

## 📝 常用命令速查表

| 操作 | 命令（只输入这一行） |
|------|---------------------|
| 查看远程仓库 | `git remote -v` |
| 查看分支 | `git branch` |
| 查看状态 | `git status` |
| 添加所有文件 | `git add .` |
| 提交更改 | `git commit -m "消息"` |
| 推送代码 | `git push origin main` |
| 拉取代码 | `git pull origin main` |
| 测试 SSH | `ssh -T git@github.com` |

---

## ⚠️ 常见错误避免

### ❌ 不要这样做：

1. **复制粘贴整行输出**
   ```
   PS C:\Users\...> git remote -v  ❌ 不要复制这个
   ```

2. **复制 PowerShell 提示符**
   ```
   PS C:\Users\...>  ❌ 不要复制这个
   ```

3. **复制错误消息并当作命令执行**
   ```
   error: ...  ❌ 这是输出，不是命令
   ```

### ✅ 正确做法：

只复制命令本身：
```
git remote -v  ✅ 只复制这个
git push origin main  ✅ 只复制这个
```

---

## 🎯 当前可用命令

你现在可以直接使用：

```powershell
# 推送代码（只输入这一行）
git push origin main

# 查看状态（只输入这一行）
git status

# 查看远程配置（只输入这一行）
git remote -v
```

---

**记住：在 PowerShell 中，只输入命令本身，不要包含提示符或输出内容！**

