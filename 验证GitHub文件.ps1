# 验证 GitHub 上的 package-lock.json 是否包含 crypto-js

Write-Host "🔍 检查本地 package-lock.json..." -ForegroundColor Cyan

# 检查本地文件
$localContent = Get-Content "package-lock.json" -Raw
if ($localContent -match '"node_modules/crypto-js"') {
    Write-Host "✅ 本地 package-lock.json 包含 crypto-js" -ForegroundColor Green
    
    # 提取 crypto-js 条目
    $match = [regex]::Match($localContent, '"node_modules/crypto-js"[^}]*?}')
    if ($match.Success) {
        Write-Host "`n📦 crypto-js 条目：" -ForegroundColor Yellow
        Write-Host $match.Value
    }
} else {
    Write-Host "❌ 本地 package-lock.json 不包含 crypto-js" -ForegroundColor Red
}

Write-Host "`n🔍 检查 Git 提交历史..." -ForegroundColor Cyan
git log --oneline -5 -- package-lock.json

Write-Host "`n🔍 检查远程分支状态..." -ForegroundColor Cyan
git fetch origin
git status

Write-Host "`n💡 如果 Cloudflare 仍然失败，尝试：" -ForegroundColor Yellow
Write-Host "1. 等待几分钟让 GitHub 完全同步" -ForegroundColor White
Write-Host "2. 在 Cloudflare Dashboard 中触发新的部署" -ForegroundColor White
Write-Host "3. 检查 Cloudflare 的构建日志查看详细错误" -ForegroundColor White







