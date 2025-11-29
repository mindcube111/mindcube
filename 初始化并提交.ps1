# Initialize Git and Commit Changes

Write-Host "=== Initialize Git Repository and Commit ===" -ForegroundColor Cyan
Write-Host ""

$currentDir = Get-Location
Write-Host "Current directory: $currentDir" -ForegroundColor Yellow
Write-Host ""

# Check if already a Git repository
$isGitRepo = Test-Path ".git"

if (-not $isGitRepo) {
    Write-Host "Not a Git repository. Initializing..." -ForegroundColor Yellow
    git init
    git branch -M main
    
    Write-Host ""
    Write-Host "Adding remote repository..." -ForegroundColor Yellow
    git remote add origin https://github.com/yo385042-blip/mindcube.git
    
    Write-Host "Git repository initialized!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "Git repository already exists." -ForegroundColor Green
    Write-Host ""
}

# Add all files
Write-Host "Adding all changes..." -ForegroundColor Yellow
git add -A

# Show status
Write-Host ""
Write-Host "Current status:" -ForegroundColor Yellow
git status --short

# Commit
Write-Host ""
Write-Host "Committing changes..." -ForegroundColor Yellow
$commitMsg = "Optimize Cloudflare Pages Middleware - Fix ERR_CONNECTION_CLOSED"
git commit -m $commitMsg

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Commit successful!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Push successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Cloudflare Pages will automatically deploy the changes." -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "Push failed. You may need to authenticate or check remote URL." -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "Commit failed or no changes to commit." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan

