# 一键提交修复代码

Write-Host "=== 提交 Cloudflare Middleware 修复代码 ===" -ForegroundColor Cyan
Write-Host ""

# 如果当前在 functions 目录，切换到父目录
if ((Get-Location).Path -match "functions$") {
    Write-Host "检测到在 functions 目录，切换到项目根目录..." -ForegroundColor Yellow
    Set-Location ..
}

$currentDir = Get-Location
Write-Host "当前目录: $currentDir" -ForegroundColor Yellow
Write-Host ""

# 检查是否是 Git 仓库
if (-not (Test-Path ".git")) {
    Write-Host "❌ 当前目录不是 Git 仓库！" -ForegroundColor Red
    Write-Host ""
    Write-Host "请切换到包含 .git 文件夹的项目根目录" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "提示：如果你在 functions 目录，运行 'cd ..' 切换到项目根目录" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ 找到 Git 仓库" -ForegroundColor Green
Write-Host ""

# 显示当前状态
Write-Host "当前 Git 状态：" -ForegroundColor Yellow
git status --short
Write-Host ""

# 询问是否继续
$response = Read-Host "是否继续提交？(Y/N)"
if ($response -ne "Y" -and $response -ne "y") {
    Write-Host "已取消" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "添加文件..." -ForegroundColor Yellow

# 添加所有更改
git add -A

Write-Host ""
Write-Host "提交更改..." -ForegroundColor Yellow

# 提交
$commitMessage = @"
优化 Cloudflare Pages Middleware - 修复 ERR_CONNECTION_CLOSED 问题

- 添加多层错误处理机制
- 增强静态资源检测（支持更多文件类型，大小写不敏感）
- 添加详细的错误日志
- 改进响应处理逻辑，防止连接关闭
"@

git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ 提交成功！" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "推送到远程仓库..." -ForegroundColor Yellow
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 推送成功！" -ForegroundColor Green
        Write-Host ""
        Write-Host "Cloudflare Pages 将自动检测到新提交并开始部署。" -ForegroundColor Cyan
        Write-Host "请等待 1-3 分钟后访问网站检查是否修复了问题。" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ 推送失败，请检查网络连接或 Git 配置" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "⚠️ 提交失败或没有更改需要提交" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "详细状态：" -ForegroundColor Yellow
    git status
}

Write-Host ""
Write-Host "=== 完成 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

