# PowerShell 部署脚本
# 用于 Windows 系统快速部署到 Cloudflare Pages

Write-Host "🚀 开始部署流程..." -ForegroundColor Cyan
Write-Host ""

# 步骤 1: 检查 Node.js
Write-Host "📦 步骤 1: 检查环境..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✓ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ 未检测到 Node.js，请先安装 Node.js" -ForegroundColor Red
    exit 1
}

# 步骤 2: 检查依赖
Write-Host ""
Write-Host "📦 步骤 2: 检查依赖..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "   ⚠️  依赖未安装，正在安装..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ 依赖安装失败" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✓ 依赖安装完成" -ForegroundColor Green
} else {
    Write-Host "   ✓ 依赖已安装" -ForegroundColor Green
}

# 步骤 3: 清理旧的构建
Write-Host ""
Write-Host "🧹 步骤 3: 清理旧的构建..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "   ✓ 已清理 dist 目录" -ForegroundColor Green
} else {
    Write-Host "   ✓ dist 目录不存在，跳过清理" -ForegroundColor Green
}

# 步骤 4: 构建项目
Write-Host ""
Write-Host "🔨 步骤 4: 构建项目..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ 构建失败" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ 构建完成" -ForegroundColor Green

# 步骤 5: 验证构建产物
Write-Host ""
Write-Host "✅ 步骤 5: 验证构建产物..." -ForegroundColor Yellow
$requiredFiles = @(
    "dist\index.html",
    "dist\functions\_middleware.js",
    "dist\functions\api\[[path]].js"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file 不存在" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "❌ 构建产物验证失败，请检查构建过程" -ForegroundColor Red
    exit 1
}

# 步骤 6: 检查 Wrangler
Write-Host ""
Write-Host "🔍 步骤 6: 检查 Wrangler CLI..." -ForegroundColor Yellow
try {
    $wranglerVersion = wrangler --version 2>&1
    Write-Host "   ✓ Wrangler 已安装" -ForegroundColor Green
    $wranglerInstalled = $true
} catch {
    Write-Host "   ⚠️  Wrangler 未安装" -ForegroundColor Yellow
    $wranglerInstalled = $false
}

# 步骤 7: 部署提示
Write-Host ""
Write-Host "📋 步骤 7: 部署选项" -ForegroundColor Yellow
Write-Host ""
Write-Host "请选择部署方式:" -ForegroundColor Cyan
Write-Host "1. 使用 Wrangler CLI 部署（需要项目名称）" -ForegroundColor White
Write-Host "2. 通过 Cloudflare Dashboard 手动部署" -ForegroundColor White

if ($wranglerInstalled) {
    Write-Host ""
    Write-Host "如果选择方式 1，请运行:" -ForegroundColor Cyan
    Write-Host "   wrangler pages deploy dist --project-name=YOUR_PROJECT_NAME" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "要安装 Wrangler，请运行:" -ForegroundColor Cyan
    Write-Host "   npm install -g wrangler" -ForegroundColor White
}

Write-Host ""
Write-Host "如果选择方式 2，请:" -ForegroundColor Cyan
Write-Host "   1. 访问 https://dash.cloudflare.com/" -ForegroundColor White
Write-Host "   2. 进入 Pages 项目" -ForegroundColor White
Write-Host "   3. 上传 dist 目录或连接 Git 仓库" -ForegroundColor White

Write-Host ""
Write-Host "✨ 构建完成！dist 目录已准备好部署。" -ForegroundColor Green

