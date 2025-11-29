# 提交 Cloudflare Middleware 修复代码脚本

Write-Host "=== 提交 Middleware 修复代码 ===" -ForegroundColor Cyan
Write-Host ""

# 获取当前脚本所在目录
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "当前目录: $scriptDir" -ForegroundColor Yellow
Write-Host ""

# 检查是否是 Git 仓库
if (-not (Test-Path ".git")) {
    Write-Host "❌ 当前目录不是 Git 仓库！" -ForegroundColor Red
    Write-Host ""
    Write-Host "请告诉我你的 Git 仓库目录路径，或者："
    Write-Host "1. 在包含 .git 目录的文件夹中运行此脚本"
    Write-Host "2. 或者告诉我你的项目文件夹路径"
    exit 1
}

Write-Host "✅ 找到 Git 仓库" -ForegroundColor Green
Write-Host ""

# 检查 Git 状态
Write-Host "检查 Git 状态..." -ForegroundColor Yellow
git status --short
Write-Host ""

# 显示需要添加的文件
Write-Host "准备添加以下文件：" -ForegroundColor Yellow

# 检查 files/_middleware.js
if (Test-Path "functions/_middleware.js") {
    Write-Host "  ✅ functions/_middleware.js" -ForegroundColor Green
    git add functions/_middleware.js
} else {
    Write-Host "  ❌ functions/_middleware.js 不存在" -ForegroundColor Red
}

# 检查是否删除 _redirects 文件（如果需要）
if (Test-Path "public/_redirects") {
    Write-Host "  ⚠️  public/_redirects 文件仍然存在" -ForegroundColor Yellow
    Write-Host "  是否删除？(根据之前的分析，_redirects 可能与 Middleware 冲突)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "提交更改..." -ForegroundColor Yellow

# 提交更改
$commitMessage = "优化 Cloudflare Pages Middleware - 修复 ERR_CONNECTION_CLOSED 问题

- 添加多层错误处理机制
- 增强静态资源检测（支持更多文件类型，大小写不敏感）
- 添加详细的错误日志
- 改进响应处理逻辑，防止连接关闭"

git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ 提交成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "现在推送到远程仓库..." -ForegroundColor Yellow
    Write-Host ""
    
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 推送成功！" -ForegroundColor Green
        Write-Host ""
        Write-Host "Cloudflare Pages 将自动检测到新提交并开始部署。" -ForegroundColor Cyan
        Write-Host "请等待 1-3 分钟后访问网站检查是否修复了 ERR_CONNECTION_CLOSED 问题。" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ 推送失败" -ForegroundColor Red
        Write-Host "请检查网络连接或 Git 远程配置" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "❌ 提交失败或没有更改需要提交" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "当前状态：" -ForegroundColor Yellow
    git status
}

Write-Host ""
Write-Host "=== 完成 ===" -ForegroundColor Cyan

