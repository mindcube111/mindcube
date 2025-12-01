# 推送 Functions 文件到 GitHub
# 在 PowerShell 中运行此脚本

# 切换到项目目录
cd "C:\Users\26872\Desktop\心理网站编写\02 管理器"

Write-Host "当前目录: $(Get-Location)" -ForegroundColor Green

# 检查 functions 文件是否存在
if (Test-Path "functions/_middleware.js") {
    Write-Host "✅ functions 文件存在" -ForegroundColor Green
} else {
    Write-Host "❌ functions 文件不存在！" -ForegroundColor Red
    exit 1
}

# 添加 functions 文件
Write-Host "`n正在添加 functions 文件..." -ForegroundColor Yellow
git add functions/
git add wrangler.toml

# 检查状态
Write-Host "`n检查 Git 状态..." -ForegroundColor Yellow
git status --short functions/

# 提交
Write-Host "`n提交更改..." -ForegroundColor Yellow
git commit -m "Add Cloudflare Functions backend files"

# 推送
Write-Host "`n推送到 GitHub..." -ForegroundColor Yellow
git push

Write-Host "`n✅ 完成！" -ForegroundColor Green

















