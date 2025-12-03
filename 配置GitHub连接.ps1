# GitHub 远程仓库配置脚本
# 使用方法：根据你的需求选择合适的配置方式

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("https", "ssh", "token")]
    [string]$Method = "https",
    
    [Parameter(Mandatory=$false)]
    [string]$Repository = "mindcube111/mindcube",
    
    [Parameter(Mandatory=$false)]
    [string]$Branch = "master",

    # 可选：项目路径，不填则使用当前目录
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = $(Get-Location)
)

$ErrorActionPreference = "Stop"

Write-Host "`nGitHub 远程仓库配置工具" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# 进入项目目录
if (Test-Path $ProjectPath) {
    Set-Location $ProjectPath
    Write-Host "已进入项目目录：$ProjectPath" -ForegroundColor Green
} else {
    Write-Host "项目目录不存在：$ProjectPath" -ForegroundColor Red
    exit 1
}

# 显示当前配置
Write-Host ""
Write-Host "当前远程仓库配置：" -ForegroundColor Yellow
git remote -v 2>$null

# 删除旧的远程配置（增加确认）
$existingRemote = git remote -v 2>$null
if ($existingRemote) {
    Write-Host ""
    Write-Host "检测到已有远程配置：" -ForegroundColor Yellow
    $existingRemote
    $confirm = Read-Host "是否删除现有的 origin 并重新配置？(y/n)"
    if ($confirm -eq "y") {
        git remote remove origin 2>$null
        Write-Host "已删除旧配置" -ForegroundColor Green
    } else {
        Write-Host "已保留原有远程配置，后续将覆盖/新增 origin 设置" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "未检测到已有远程配置，无需删除" -ForegroundColor Yellow
}

# 根据方法配置
switch ($Method) {
    "https" {
        Write-Host ""
        Write-Host "配置 HTTPS 方式（使用 Git Credential Manager）" -ForegroundColor Cyan
        $repoUrl = "https://github.com/$Repository.git"
        git remote add origin $repoUrl
        Write-Host "已添加 HTTPS 远程仓库：$repoUrl" -ForegroundColor Green
        Write-Host "提示：首次推送时需要输入 GitHub 用户名和 Personal Access Token" -ForegroundColor Yellow
    }

    "ssh" {
        Write-Host ""
        Write-Host "配置 SSH 方式" -ForegroundColor Cyan
        $repoUrl = "git@github.com:$Repository.git"
        git remote add origin $repoUrl
        Write-Host "已添加 SSH 远程仓库：$repoUrl" -ForegroundColor Green
        Write-Host "提示：请确保已配置 SSH 密钥并添加到 GitHub" -ForegroundColor Yellow
    }

    "token" {
        Write-Host ""
        Write-Host "配置 HTTPS + Personal Access Token（安全方式）" -ForegroundColor Cyan
        $username = Read-Host "请输入你的 GitHub 用户名"
        if ([string]::IsNullOrWhiteSpace($username)) {
            Write-Host "用户名不能为空" -ForegroundColor Red
            exit 1
        }

        $repoUrl = "https://github.com/$Repository.git"
        git remote add origin $repoUrl
        Write-Host "已添加 HTTPS 远程仓库：$repoUrl" -ForegroundColor Green

        try {
            git config --global credential.helper manager-core | Out-Null
            Write-Host "✅ 已启用 Git Credential Manager Core 用于安全保存 Token" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ 无法自动配置 Credential Manager，请确保已安装并手动启用" -ForegroundColor Yellow
        }

        Write-Host "提示：" -ForegroundColor Yellow
        Write-Host "   - 首次推送时，用户名填 $username，密码填 Personal Access Token" -ForegroundColor Gray
        Write-Host "   - Git Credential Manager 会在 Windows 凭据管理器中安全保存 Token" -ForegroundColor Gray
        Write-Host "   - 请勿将 Token 写入远程 URL 或脚本中" -ForegroundColor Gray
    }
}

# 显示新配置
Write-Host ""
Write-Host "新的远程仓库配置：" -ForegroundColor Yellow
git remote -v

# 显示下一步操作
Write-Host ""
Write-Host "下一步操作建议：" -ForegroundColor Cyan
Write-Host "1. 检查当前分支：" -ForegroundColor White
Write-Host "   git branch" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 推送代码到 GitHub：" -ForegroundColor White
Write-Host "   git push -u origin $Branch" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 如果推送失败，可能需要：" -ForegroundColor White
Write-Host "   - 检查分支名称（master 或 main）" -ForegroundColor Gray
Write-Host "   - 配置认证凭据" -ForegroundColor Gray
Write-Host "   - 查看详细文档：GitHub连接配置方案.md" -ForegroundColor Gray

Write-Host ""
Write-Host "配置完成！" -ForegroundColor Green





