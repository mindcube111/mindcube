# 推送到 GitHub 仓库脚本
# 仓库地址: https://github.com/mindcube111/mindcube

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        推送到 GitHub 仓库                                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 确认当前目录
$currentDir = Get-Location
Write-Host "当前目录: $currentDir" -ForegroundColor Gray
Write-Host ""

# 检查是否在正确的项目目录
if (-not (Test-Path "package.json")) {
    Write-Host "❌ 错误: 未找到 package.json，请确保在项目根目录运行此脚本" -ForegroundColor Red
    Write-Host "   项目目录应该是: C:\Users\26872\Desktop\心理网站编写\02 管理器" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ 已确认在项目目录中" -ForegroundColor Green
Write-Host ""

# 检查 .git 目录
if (-not (Test-Path ".git")) {
    Write-Host "⚠️  未检测到 .git 目录，正在初始化 Git 仓库..." -ForegroundColor Yellow
    git init
    Write-Host "✓ Git 仓库已初始化" -ForegroundColor Green
    Write-Host ""
}

# 检查远程仓库
Write-Host "📋 步骤 1/4: 配置远程仓库..." -ForegroundColor Yellow
$remoteUrl = "https://github.com/mindcube111/mindcube.git"
$existingRemote = git remote get-url origin 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "   正在添加远程仓库..." -ForegroundColor Gray
    git remote add origin $remoteUrl
    Write-Host "   ✓ 已添加远程仓库: $remoteUrl" -ForegroundColor Green
} else {
    if ($existingRemote -ne $remoteUrl) {
        Write-Host "   正在更新远程仓库地址..." -ForegroundColor Gray
        git remote set-url origin $remoteUrl
        Write-Host "   ✓ 已更新远程仓库: $remoteUrl" -ForegroundColor Green
    } else {
        Write-Host "   ✓ 远程仓库已配置: $remoteUrl" -ForegroundColor Green
    }
}
Write-Host ""

# 添加所有文件
Write-Host "📋 步骤 2/4: 添加文件到 Git..." -ForegroundColor Yellow
git add -A
Write-Host "   ✓ 文件已添加到暂存区" -ForegroundColor Green
Write-Host ""

# 显示将要提交的文件
Write-Host "即将提交的文件:" -ForegroundColor Cyan
git status --short | Select-Object -First 20
Write-Host ""

# 提交更改
Write-Host "📋 步骤 3/4: 提交更改..." -ForegroundColor Yellow
$commitMessage = "fix: 同步 package-lock.json 并更新项目文件"

# 检查是否有待提交的更改
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "   ℹ️  没有需要提交的更改" -ForegroundColor Gray
} else {
    git commit -m $commitMessage
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ 已提交更改: $commitMessage" -ForegroundColor Green
    } else {
        Write-Host "   ❌ 提交失败" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# 推送到 GitHub
Write-Host "📋 步骤 4/4: 推送到 GitHub..." -ForegroundColor Yellow
Write-Host "   远程仓库: $remoteUrl" -ForegroundColor Gray
Write-Host ""

# 检查当前分支
$currentBranch = git branch --show-current
if ([string]::IsNullOrWhiteSpace($currentBranch)) {
    # 如果还没有分支，创建 main 分支
    $currentBranch = "main"
    git checkout -b $currentBranch 2>&1 | Out-Null
}

Write-Host "   当前分支: $currentBranch" -ForegroundColor Gray
Write-Host ""

# 尝试推送
Write-Host "   正在推送到 origin/$currentBranch..." -ForegroundColor Gray
git push -u origin $currentBranch

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║            ✅ 推送成功！                                 ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "   仓库地址: https://github.com/mindcube111/mindcube" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ 推送失败" -ForegroundColor Red
    Write-Host ""
    Write-Host "可能的原因:" -ForegroundColor Yellow
    Write-Host "   1. 需要先登录 GitHub" -ForegroundColor White
    Write-Host "   2. 仓库权限不足" -ForegroundColor White
    Write-Host "   3. 网络连接问题" -ForegroundColor White
    Write-Host ""
    Write-Host "解决方法:" -ForegroundColor Yellow
    Write-Host "   1. 检查 GitHub 登录状态" -ForegroundColor White
    Write-Host "   2. 确认仓库地址正确" -ForegroundColor White
    Write-Host "   3. 如果仓库不存在，请在 GitHub 上创建仓库" -ForegroundColor White
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""

