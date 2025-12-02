# 推送到 GitHub 脚本

$ErrorActionPreference = "Stop"

Write-Host "🚀 准备推送到 GitHub..." -ForegroundColor Cyan

# 切换到项目目录（相对于用户主目录）
$projectPath = "Desktop\心理网站编写\02 管理器"

# 添加项目文件（使用相对路径）
Write-Host "📦 添加项目文件..." -ForegroundColor Yellow

# 切换到项目目录
Set-Location $projectPath -ErrorAction Stop

# 只添加项目文件
git add package.json package-lock.json
git add *.md *.js *.ts *.json *.tsx *.css 2>$null
git add .gitignore wrangler.toml index.html
git add public/ src/ functions/ scripts/ e2e/ 2>$null

# 检查是否有文件需要提交
$status = git status --porcelain
if ($status) {
    Write-Host "✅ 文件已添加到暂存区" -ForegroundColor Green
    
    # 提交
    Write-Host "💾 提交更改..." -ForegroundColor Yellow
    git commit -m "fix: 同步 package-lock.json 以包含 crypto-js 依赖"
    
    # 推送
    Write-Host "📤 推送到 GitHub..." -ForegroundColor Yellow
    git push origin master
    
    Write-Host "✅ 推送完成！" -ForegroundColor Green
} else {
    Write-Host "⚠️  没有需要提交的文件" -ForegroundColor Yellow
}

