# Submit Cloudflare Middleware fix code

Write-Host "=== Submitting Middleware Fix Code ===" -ForegroundColor Cyan
Write-Host ""

# Switch to project root if in functions directory
if ((Get-Location).Path -match "functions$") {
    Write-Host "Switching to project root directory..." -ForegroundColor Yellow
    Set-Location ..
}

$currentDir = Get-Location
Write-Host "Current directory: $currentDir" -ForegroundColor Yellow
Write-Host ""

# Check if this is a Git repository
if (-not (Test-Path ".git")) {
    Write-Host "ERROR: Current directory is not a Git repository!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please switch to the project root directory that contains .git folder" -ForegroundColor Yellow
    exit 1
}

Write-Host "Git repository found" -ForegroundColor Green
Write-Host ""

# Show current status
Write-Host "Current Git status:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Add all changes
Write-Host "Adding all changes..." -ForegroundColor Yellow
git add -A
Write-Host ""

# Commit
Write-Host "Committing changes..." -ForegroundColor Yellow
$commitMsg = "Optimize Cloudflare Pages Middleware - Fix ERR_CONNECTION_CLOSED issue"
git commit -m $commitMsg

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Commit successful!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Pushing to remote repository..." -ForegroundColor Yellow
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Push successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Cloudflare Pages will automatically detect the new commit and start deploying." -ForegroundColor Cyan
        Write-Host "Please wait 1-3 minutes and check if ERR_CONNECTION_CLOSED is fixed." -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "Push failed. Please check network connection or Git configuration." -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "Commit failed or no changes to commit." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Detailed status:" -ForegroundColor Yellow
    git status
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan

