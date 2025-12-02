# GitHub 远程仓库配置脚本
# 使用方法：根据你的需求选择合适的配置方式

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("https", "ssh", "token")]
    [string]$Method = "https",
    
    [Parameter(Mandatory=$false)]
    [string]$Repository = "mindcube111/mindcube",
    
    [Parameter(Mandatory=$false)]
    [string]$Branch = "master"
)

$ErrorActionPreference = "Stop"

Write-Host "`n🔧 GitHub 远程仓库配置工具" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

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
Write-Host "`n📋 当前远程仓库配置：" -ForegroundColor Yellow
git remote -v 2>$null

# 删除旧的远程配置
Write-Host "`n🗑️  删除旧的远程配置..." -ForegroundColor Yellow
git remote remove origin 2>$null
Write-Host "✅ 已删除旧配置" -ForegroundColor Green

# 根据方法配置
switch ($Method) {
    "https" {
        Write-Host "`n🔗 配置 HTTPS 方式（使用 Git Credential Manager）" -ForegroundColor Cyan
        $repoUrl = "https://github.com/$Repository.git"
        git remote add origin $repoUrl
        Write-Host "✅ 已添加 HTTPS 远程仓库：$repoUrl" -ForegroundColor Green
        Write-Host "`n💡 提示：首次推送时需要输入 GitHub 用户名和 Personal Access Token" -ForegroundColor Yellow
    }
    
    "ssh" {
        Write-Host "`n🔐 配置 SSH 方式" -ForegroundColor Cyan
        $repoUrl = "git@github.com:$Repository.git"
        git remote add origin $repoUrl
        Write-Host "✅ 已添加 SSH 远程仓库：$repoUrl" -ForegroundColor Green
        Write-Host "`n💡 提示：请确保已配置 SSH 密钥并添加到 GitHub" -ForegroundColor Yellow
    }
    
    "token" {
        Write-Host "`n🔑 配置 HTTPS + Token 方式" -ForegroundColor Cyan
        $token = Read-Host "请输入你的 GitHub Personal Access Token"
        $username = Read-Host "请输入你的 GitHub 用户名"
        
        if ([string]::IsNullOrWhiteSpace($token) -or [string]::IsNullOrWhiteSpace($username)) {
            Write-Host "❌ Token 和用户名不能为空" -ForegroundColor Red
            exit 1
        }
        
        $repoUrl = "https://${username}:${token}@github.com/$Repository.git"
        git remote add origin $repoUrl
        Write-Host "✅ 已添加带 Token 的远程仓库" -ForegroundColor Green
        Write-Host "⚠️  注意：Token 已保存在 Git 配置中，请妥善保管" -ForegroundColor Yellow
    }
}

# 显示新配置
Write-Host "`n📋 新的远程仓库配置：" -ForegroundColor Yellow
git remote -v

# 显示下一步操作
Write-Host "`n📝 下一步操作：" -ForegroundColor Cyan
Write-Host "1. 检查当前分支：" -ForegroundColor White
Write-Host "   git branch" -ForegroundColor Gray
Write-Host "`n2. 推送代码到 GitHub：" -ForegroundColor White
Write-Host "   git push -u origin $Branch" -ForegroundColor Gray
Write-Host "`n3. 如果推送失败，可能需要：" -ForegroundColor White
Write-Host "   - 检查分支名称（master 或 main）" -ForegroundColor Gray
Write-Host "   - 配置认证凭据" -ForegroundColor Gray
Write-Host "   - 查看详细文档：GitHub连接配置方案.md" -ForegroundColor Gray

Write-Host "`n✅ 配置完成！" -ForegroundColor Green

