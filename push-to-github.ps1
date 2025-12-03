Param(
    [string]$ProjectPath = "$HOME\Desktop\心理网站编写\02 管理器",
    [string]$Branch = "master"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 准备推送到 GitHub..." -ForegroundColor Cyan

if (-not (Test-Path $ProjectPath)) {
    throw "项目目录不存在：$ProjectPath"
}

Set-Location $ProjectPath

$workingStatus = git status --porcelain
if (-not $workingStatus) {
    Write-Host "⚠️  没有需要提交的文件" -ForegroundColor Yellow
    exit 0
}

Write-Host "📦 添加全部变更..." -ForegroundColor Yellow
git add -A

$commitMessage = Read-Host "请输入提交说明 (留空则使用默认信息)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "chore: 更新项目文件"
}

Write-Host "💾 提交更改: $commitMessage" -ForegroundColor Yellow
git commit -m $commitMessage

Write-Host "📤 推送到分支 $Branch..." -ForegroundColor Yellow
git push origin $Branch

Write-Host "✅ 推送完成！" -ForegroundColor Green






