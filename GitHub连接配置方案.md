# GitHub 连接配置方案

## 当前配置状态

当前远程仓库配置为：
```
origin  https://github.com/mindcube111/mindcube.git
```

## 方案一：使用 HTTPS + Personal Access Token（推荐，简单）

### 步骤 1：在 GitHub 创建 Personal Access Token

1. 登录 GitHub，点击右上角头像 → **Settings**
2. 左侧菜单选择 **Developer settings**
3. 选择 **Personal access tokens** → **Tokens (classic)**
4. 点击 **Generate new token** → **Generate new token (classic)**
5. 设置：
   - **Note**: 填写说明（如：Windows Git Push）
   - **Expiration**: 选择有效期（建议选择 90 days 或 No expiration）
   - **Select scopes**: 勾选 `repo`（全选 repository 权限）
6. 点击 **Generate token**
7. **重要**：复制生成的 token（只显示一次，务必保存）

### 步骤 2：配置 Git 远程仓库（使用 Token）

在项目目录执行：

```powershell
# 进入项目目录
cd "C:\Users\26872\Desktop\心理网站编写\02 管理器"

# 查看当前远程配置
git remote -v

# 删除旧的远程配置
git remote remove origin

# 添加新的远程仓库（将 YOUR_TOKEN 替换为你的 token，USERNAME 替换为你的 GitHub 用户名）
git remote add origin https://YOUR_TOKEN@github.com/mindcube111/mindcube.git

# 或者使用用户名+token的方式（推荐，更安全）
git remote add origin https://USERNAME:YOUR_TOKEN@github.com/mindcube111/mindcube.git
```

### 步骤 3：测试推送

```powershell
git push origin master
```

或者如果主分支是 main：
```powershell
git push origin main
```

---

## 方案二：使用 HTTPS + Git Credential Manager（推荐，最方便）

### 步骤 1：安装 Git Credential Manager

如果还没有安装，下载并安装：
- 下载地址：https://github.com/git-ecosystem/git-credential-manager/releases

### 步骤 2：配置远程仓库

```powershell
# 进入项目目录
cd "C:\Users\26872\Desktop\心理网站编写\02 管理器"

# 删除旧的远程配置
git remote remove origin

# 添加远程仓库（标准 HTTPS 地址）
git remote add origin https://github.com/mindcube111/mindcube.git

# 设置凭据管理器
git config --global credential.helper manager
```

### 步骤 3：首次推送时输入凭据

当你执行 `git push` 时：
- **Username**: 输入你的 GitHub 用户名
- **Password**: 输入你的 **Personal Access Token**（不是密码！）

Git Credential Manager 会自动保存凭据，以后就不需要再输入了。

---

## 方案三：使用 SSH（最安全，推荐长期使用）

### 步骤 1：检查是否已有 SSH 密钥

```powershell
# 检查是否存在 SSH 密钥
ls ~/.ssh/id_rsa.pub
```

如果文件不存在，继续下一步；如果存在，可以直接使用。

### 步骤 2：生成 SSH 密钥

```powershell
# 生成新的 SSH 密钥（将 your_email@example.com 替换为你的 GitHub 邮箱）
ssh-keygen -t ed25519 -C "your_email@example.com"

# 按提示操作：
# - 按 Enter 接受默认文件位置
# - 设置密码（可选，建议设置）
```

### 步骤 3：将 SSH 密钥添加到 SSH 代理

```powershell
# 启动 SSH 代理
Start-Service ssh-agent

# 添加密钥到 SSH 代理
ssh-add ~/.ssh/id_ed25519
```

### 步骤 4：复制公钥并添加到 GitHub

```powershell
# 复制公钥内容（会在剪贴板中）
Get-Content ~/.ssh/id_ed25519.pub | Set-Clipboard

# 或者直接显示
cat ~/.ssh/id_ed25519.pub
```

然后：
1. 登录 GitHub，点击右上角头像 → **Settings**
2. 左侧菜单选择 **SSH and GPG keys**
3. 点击 **New SSH key**
4. **Title**: 填写说明（如：Windows PC）
5. **Key**: 粘贴刚才复制的公钥内容
6. 点击 **Add SSH key**

### 步骤 5：测试 SSH 连接

```powershell
# 测试连接
ssh -T git@github.com
```

应该看到类似消息：
```
Hi username! You've successfully authenticated, but GitHub does not provide shell access.
```

### 步骤 6：配置 Git 远程仓库为 SSH

```powershell
# 进入项目目录
cd "C:\Users\26872\Desktop\心理网站编写\02 管理器"

# 删除旧的远程配置
git remote remove origin

# 添加 SSH 远程仓库
git remote add origin git@github.com:mindcube111/mindcube.git

# 查看配置
git remote -v
```

### 步骤 7：测试推送

```powershell
git push origin master
```

---

## 方案四：修改现有远程 URL（不改协议，只改配置）

如果你只想修改当前的 HTTPS 配置：

```powershell
# 进入项目目录
cd "C:\Users\26872\Desktop\心理网站编写\02 管理器"

# 查看当前配置
git remote -v

# 修改远程 URL（如果需要更换仓库地址）
git remote set-url origin https://github.com/mindcube111/mindcube.git

# 或者使用 SSH 方式
git remote set-url origin git@github.com:mindcube111/mindcube.git
```

---

## 快速配置脚本（PowerShell）

创建一个 PowerShell 脚本来自动配置：

```powershell
# 配置 GitHub 远程仓库
# 使用方法：根据你的选择修改下面的变量

$REPO_URL = "https://github.com/mindcube111/mindcube.git"
# 或者使用 SSH：
# $REPO_URL = "git@github.com:mindcube111/mindcube.git"

$BRANCH = "master"
# 或者 "main"，根据你的仓库主分支名称

# 进入项目目录
Set-Location "C:\Users\26872\Desktop\心理网站编写\02 管理器"

# 删除旧的远程配置
git remote remove origin 2>$null

# 添加新的远程配置
git remote add origin $REPO_URL

# 显示配置结果
Write-Host "✅ 远程仓库已配置：" -ForegroundColor Green
git remote -v

Write-Host "`n📝 使用以下命令推送代码：" -ForegroundColor Cyan
Write-Host "git push -u origin $BRANCH" -ForegroundColor Yellow
```

---

## 常见问题解决

### 问题 1：推送时提示认证失败

**解决方案**：
- 检查是否使用了正确的 Personal Access Token（不是密码）
- 检查 token 是否过期
- 重新生成 token 并更新配置

### 问题 2：提示 "remote origin already exists"

**解决方案**：
```powershell
# 先删除旧配置
git remote remove origin

# 再添加新配置
git remote add origin [新的URL]
```

### 问题 3：SSH 连接超时

**解决方案**：
- 检查网络是否正常
- 检查防火墙设置
- 使用 `ssh -T git@github.com -v` 查看详细连接信息

### 问题 4：分支名称不匹配（master vs main）

**解决方案**：
```powershell
# 查看远程分支
git branch -r

# 推送时指定分支映射
git push origin master:main

# 或者重命名本地分支
git branch -m master main
git push -u origin main
```

---

## 推荐配置顺序

1. **新手/快速配置**：方案二（HTTPS + Git Credential Manager）
2. **安全长期使用**：方案三（SSH）
3. **临时/一次性**：方案一（HTTPS + Token）

---

## 验证配置

配置完成后，使用以下命令验证：

```powershell
# 查看远程仓库配置
git remote -v

# 测试连接（SSH）
ssh -T git@github.com

# 或测试推送（HTTPS）
git push origin master --dry-run
```

---

**注意**：选择一种方案后，记得删除或注释掉其他方案，避免混淆。

