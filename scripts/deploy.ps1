# PowerShell 一键部署脚本
# 用于 Windows 系统快速部署到 Cloudflare Pages

$ErrorActionPreference = "Stop"
$projectName = "psychological-assessment-platform"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     MIND CUBE 心理测评管理平台 - 一键部署脚本          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 步骤 1: 检查 Node.js
Write-Host "📦 步骤 1/7: 检查环境..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✓ Node.js 版本: $nodeVersion" -ForegroundColor Green
    
    # 检查 Node.js 版本是否 >= 16
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNumber -lt 16) {
        Write-Host "   ⚠️  警告: 推荐使用 Node.js 16 或更高版本" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ 未检测到 Node.js，请先安装 Node.js" -ForegroundColor Red
    Write-Host "   下载地址: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# 步骤 2: 检查依赖
Write-Host ""
Write-Host "📦 步骤 2/7: 检查依赖..." -ForegroundColor Yellow
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
Write-Host "🧹 步骤 3/7: 清理旧的构建..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "   ✓ 已清理 dist 目录" -ForegroundColor Green
} else {
    Write-Host "   ✓ dist 目录不存在，跳过清理" -ForegroundColor Green
}

# 步骤 4: 构建项目
Write-Host ""
Write-Host "🔨 步骤 4/7: 构建项目..." -ForegroundColor Yellow
Write-Host "   正在运行: npm run build" -ForegroundColor Gray
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ 构建失败，请检查错误信息" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ 构建完成" -ForegroundColor Green

# 步骤 5: 验证构建产物
Write-Host ""
Write-Host "✅ 步骤 5/7: 验证构建产物..." -ForegroundColor Yellow
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

# 检查 assets 目录
if (Test-Path "dist\assets") {
    $assetCount = (Get-ChildItem "dist\assets" -File).Count
    Write-Host "   ✓ dist\assets\ ($assetCount files)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  dist\assets\ directory not found" -ForegroundColor Yellow
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "❌ 构建产物验证失败，请检查构建过程" -ForegroundColor Red
    exit 1
}

# 步骤 6: 检查 Wrangler
Write-Host ""
Write-Host "🔍 步骤 6/7: 检查 Wrangler CLI..." -ForegroundColor Yellow
$wranglerInstalled = $false
try {
    $wranglerVersion = wrangler --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Wrangler 已安装: $wranglerVersion" -ForegroundColor Green
        $wranglerInstalled = $true
    }
} catch {
    $wranglerInstalled = $false
}

if (-not $wranglerInstalled) {
    Write-Host "   ⚠️  Wrangler 未安装" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   是否现在安装 Wrangler? (Y/N): " -ForegroundColor Cyan -NoNewline
    $response = Read-Host
    if ($response -eq 'Y' -or $response -eq 'y') {
        Write-Host "   正在安装 Wrangler..." -ForegroundColor Yellow
        npm install -g wrangler
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✓ Wrangler 安装完成" -ForegroundColor Green
            $wranglerInstalled = $true
        } else {
            Write-Host "   ❌ Wrangler 安装失败" -ForegroundColor Red
        }
    }
}

# 步骤 7: 部署选项
Write-Host ""
Write-Host "🚀 步骤 7/7: 部署选项" -ForegroundColor Yellow
Write-Host ""

if ($wranglerInstalled) {
    Write-Host "请选择部署方式:" -ForegroundColor Cyan
    Write-Host "1. 使用 Wrangler CLI 自动部署（推荐）" -ForegroundColor White
    Write-Host "2. 通过 Cloudflare Dashboard 手动部署" -ForegroundColor White
    Write-Host "3. 仅构建，稍后手动部署" -ForegroundColor White
    Write-Host ""
    Write-Host "请输入选项 (1/2/3): " -ForegroundColor Cyan -NoNewline
    $choice = Read-Host
    
    switch ($choice) {
        "1" {
            Write-Host ""
            Write-Host "🚀 开始部署到 Cloudflare Pages..." -ForegroundColor Cyan
            Write-Host "   项目名称: $projectName" -ForegroundColor Gray
            
            # 检查是否已登录
            try {
                wrangler whoami 2>&1 | Out-Null
                if ($LASTEXITCODE -ne 0) {
                    Write-Host ""
                    Write-Host "   ⚠️  需要先登录 Cloudflare" -ForegroundColor Yellow
                    Write-Host "   正在打开登录页面..." -ForegroundColor Yellow
                    wrangler login
                }
            } catch {
                Write-Host "   ⚠️  需要先登录 Cloudflare" -ForegroundColor Yellow
                wrangler login
            }
            
            Write-Host ""
            Write-Host "   正在部署..." -ForegroundColor Yellow
            wrangler pages deploy dist --project-name=$projectName
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
                Write-Host "║            ✅ 部署成功！                                 ║" -ForegroundColor Green
                Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
                Write-Host ""
                Write-Host "   网站地址: https://$projectName.pages.dev" -ForegroundColor Cyan
                Write-Host "   API 测试: https://$projectName.pages.dev/api/questionnaires/available" -ForegroundColor Cyan
            } else {
                Write-Host ""
                Write-Host "   ❌ 部署失败，请检查错误信息" -ForegroundColor Red
            }
        }
        "2" {
            Write-Host ""
            Write-Host "📋 手动部署步骤:" -ForegroundColor Cyan
            Write-Host "   1. 访问 https://dash.cloudflare.com/" -ForegroundColor White
            Write-Host "   2. 进入 Pages > Create a project" -ForegroundColor White
            Write-Host "   3. 选择 'Upload assets'" -ForegroundColor White
            Write-Host "   4. 上传 dist 目录" -ForegroundColor White
            Write-Host ""
            Write-Host "   ✓ dist 目录已准备好，位于: $PWD\dist" -ForegroundColor Green
        }
        "3" {
            Write-Host ""
            Write-Host "✓ 构建完成，dist 目录已准备好部署" -ForegroundColor Green
            Write-Host "   dist 目录位置: $PWD\dist" -ForegroundColor Gray
        }
        default {
            Write-Host ""
            Write-Host "⚠️  无效选项，构建完成但未部署" -ForegroundColor Yellow
            Write-Host "   dist 目录位置: $PWD\dist" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "⚠️  Wrangler 未安装，无法使用 CLI 部署" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "请选择部署方式:" -ForegroundColor Cyan
    Write-Host "1. 通过 Cloudflare Dashboard 手动部署（推荐）" -ForegroundColor White
    Write-Host "2. 安装 Wrangler 后使用 CLI 部署" -ForegroundColor White
    Write-Host ""
    Write-Host "如果选择方式 1，请:" -ForegroundColor Cyan
    Write-Host "   1. 访问 https://dash.cloudflare.com/" -ForegroundColor White
    Write-Host "   2. 进入 Pages > Create a project" -ForegroundColor White
    Write-Host "   3. 选择 'Upload assets'" -ForegroundColor White
    Write-Host "   4. 上传 dist 目录" -ForegroundColor White
    Write-Host ""
    Write-Host "如果选择方式 2，请运行:" -ForegroundColor Cyan
    Write-Host "   npm install -g wrangler" -ForegroundColor White
    Write-Host "   wrangler login" -ForegroundColor White
    Write-Host "   wrangler pages deploy dist --project-name=$projectName" -ForegroundColor White
    Write-Host ""
    Write-Host "✓ dist 目录已准备好，位于: $PWD\dist" -ForegroundColor Green
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
