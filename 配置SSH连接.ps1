# GitHub SSH 连接配置脚本
# 方案三：SSH（最安全）

$ErrorActionPreference = "Stop"

Write-Host "`n🔐 GitHub SSH 连接配置" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# 步骤 1：检查 SSH 密钥
Write-Host "`n📋 步骤 1：检查 SSH 密钥..." -ForegroundColor Yellow

$ed25519Key = "$env:USERPROFILE\.ssh\id_ed25519.pub"
$rsaKey = "$env:USERPROFILE\.ssh\id_rsa.pub"
$hasKey = $false
$keyPath = ""

if (Test-Path $ed25519Key) {
    Write-Host "✅ 找到 ed25519 密钥" -ForegroundColor Green
    $keyPath = $ed25519Key
    $hasKey = $true
} elseif (Test-Path $rsaKey) {
    Write-Host "✅ 找到 RSA 密钥" -ForegroundColor Green
    $keyPath = $rsaKey
    $hasKey = $true
} else {
    Write-Host "❌ 未找到 SSH 密钥，需要生成新密钥" -ForegroundColor Red
    Write-Host "`n🔑 开始生成新的 SSH 密钥..." -ForegroundColor Yellow
    
    $email = Read-Host "请输入你的 GitHub 邮箱地址"
    if ([string]::IsNullOrWhiteSpace($email)) {
        Write-Host "❌ 邮箱地址不能为空" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "`n正在生成密钥（使用 ed25519 算法）..." -ForegroundColor Yellow
    Write-Host "提示：按 Enter 接受默认文件位置，可以设置密码（可选）" -ForegroundColor Gray
    
    ssh-keygen -t ed25519 -C $email
    
    $keyPath = $ed25519Key
    $hasKey = Test-Path $keyPath
}

if (-not $hasKey) {
    Write-Host "❌ 密钥生成失败或未找到密钥文件" -ForegroundColor Red
    exit 1
}

# 步骤 2：显示公钥内容
Write-Host "`n📋 步骤 2：显示 SSH 公钥（请复制此内容添加到 GitHub）" -ForegroundColor Yellow
Write-Host "-" * 50 -ForegroundColor Gray

$publicKey = Get-Content $keyPath
Write-Host $publicKey -ForegroundColor White

Write-Host "-" * 50 -ForegroundColor Gray

# 尝试自动复制到剪贴板
try {
    $publicKey | Set-Clipboard
    Write-Host "✅ 公钥已自动复制到剪贴板！" -ForegroundColor Green
} catch {
    Write-Host "⚠️  无法自动复制到剪贴板，请手动复制上面的内容" -ForegroundColor Yellow
}

# 步骤 3：添加密钥到 SSH 代理
Write-Host "`n📋 步骤 3：配置 SSH 代理..." -ForegroundColor Yellow

try {
    # 启动 SSH 代理服务
    $sshAgent = Get-Service ssh-agent -ErrorAction SilentlyContinue
    if ($sshAgent -and $sshAgent.Status -ne 'Running') {
        Write-Host "启动 SSH 代理服务..." -ForegroundColor Gray
        Start-Service ssh-agent -ErrorAction SilentlyContinue
    }
    
    # 添加密钥到 SSH 代理
    $privateKeyPath = $keyPath -replace '\.pub$', ''
    if (Test-Path $privateKeyPath) {
        Write-Host "添加密钥到 SSH 代理..." -ForegroundColor Gray
        ssh-add $privateKeyPath 2>$null
        Write-Host "✅ SSH 代理配置完成" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  SSH 代理配置跳过（不影响使用）" -ForegroundColor Yellow
}

# 步骤 4：提示添加到 GitHub
Write-Host "`n📋 步骤 4：将公钥添加到 GitHub" -ForegroundColor Yellow
Write-Host "请按照以下步骤操作：" -ForegroundColor White
Write-Host ""
Write-Host "1. 打开浏览器，访问：" -ForegroundColor Cyan
Write-Host "   https://github.com/settings/keys" -ForegroundColor White
Write-Host ""
Write-Host "2. 点击 'New SSH key' 按钮" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. 填写信息：" -ForegroundColor Cyan
Write-Host "   - Title: 填写说明（如：Windows PC）" -ForegroundColor White
Write-Host "   - Key: 粘贴上面显示的公钥（已复制到剪贴板）" -ForegroundColor White
Write-Host ""
Write-Host "4. 点击 'Add SSH key' 按钮" -ForegroundColor Cyan
Write-Host ""

$continue = Read-Host "完成以上步骤后，按 Enter 继续测试连接..."

# 步骤 5：测试 SSH 连接
Write-Host "`n📋 步骤 5：测试 SSH 连接到 GitHub..." -ForegroundColor Yellow

Write-Host "正在测试连接..." -ForegroundColor Gray
$testResult = ssh -T git@github.com 2>&1

if ($testResult -match "successfully authenticated") {
    Write-Host "✅ SSH 连接成功！" -ForegroundColor Green
    Write-Host $testResult -ForegroundColor Gray
} else {
    Write-Host "⚠️  SSH 连接测试结果：" -ForegroundColor Yellow
    Write-Host $testResult -ForegroundColor Gray
    Write-Host ""
    Write-Host "如果连接失败，请检查：" -ForegroundColor Yellow
    Write-Host "1. 公钥是否已正确添加到 GitHub" -ForegroundColor White
    Write-Host "2. 网络连接是否正常" -ForegroundColor White
    Write-Host "3. 防火墙设置是否阻止 SSH 连接（端口 22）" -ForegroundColor White
    
    $continueAnyway = Read-Host "`n是否继续配置远程仓库？(y/n)"
    if ($continueAnyway -ne 'y' -and $continueAnyway -ne 'Y') {
        exit 0
    }
}

# 步骤 6：配置 Git 远程仓库为 SSH
Write-Host "`n📋 步骤 6：配置 Git 远程仓库为 SSH..." -ForegroundColor Yellow

# 进入项目目录
$projectPath = "C:\Users\26872\Desktop\心理网站编写\02 管理器"
if (Test-Path $projectPath) {
    Set-Location $projectPath
    Write-Host "✅ 已进入项目目录" -ForegroundColor Green
} else {
    Write-Host "❌ 项目目录不存在：$projectPath" -ForegroundColor Red
    exit 1
}

# 显示当前配置
Write-Host "`n当前远程仓库配置：" -ForegroundColor Gray
git remote -v

# 删除旧的远程配置
Write-Host "`n删除旧的远程配置..." -ForegroundColor Gray
git remote remove origin 2>$null

# 添加 SSH 远程仓库
$repoUrl = "git@github.com:mindcube111/mindcube.git"
Write-Host "添加 SSH 远程仓库：$repoUrl" -ForegroundColor Gray
git remote add origin $repoUrl

# 显示新配置
Write-Host "`n✅ 新的远程仓库配置：" -ForegroundColor Green
git remote -v

# 步骤 7：显示下一步操作
Write-Host "`n📝 下一步操作：" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 检查当前分支：" -ForegroundColor White
Write-Host "   git branch" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 推送代码到 GitHub：" -ForegroundColor White
Write-Host "   git push -u origin master" -ForegroundColor Gray
Write-Host "   或者（如果主分支是 main）：" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ SSH 配置完成！" -ForegroundColor Green
Write-Host ""

# 可选：打开 GitHub SSH 设置页面
$openBrowser = Read-Host "是否打开 GitHub SSH 设置页面？(y/n)"
if ($openBrowser -eq 'y' -or $openBrowser -eq 'Y') {
    Start-Process "https://github.com/settings/keys"
}

