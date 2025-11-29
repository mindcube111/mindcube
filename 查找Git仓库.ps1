# Find Git Repository

Write-Host "=== Finding Git Repository ===" -ForegroundColor Cyan
Write-Host ""

$searchPath = "$env:USERPROFILE\Desktop\心理网站编写"
Write-Host "Searching in: $searchPath" -ForegroundColor Yellow
Write-Host ""

if (Test-Path $searchPath) {
    $gitDirs = Get-ChildItem -Path $searchPath -Recurse -Depth 3 -Filter ".git" -Directory -ErrorAction SilentlyContinue
    
    if ($gitDirs) {
        foreach ($gitDir in $gitDirs) {
            $repoPath = $gitDir.Parent.FullName
            Write-Host "Found Git repository:" -ForegroundColor Green
            Write-Host "  Path: $repoPath" -ForegroundColor White
            Write-Host ""
            
            # Test if it works
            Push-Location $repoPath
            try {
                git status --short | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  Status: Working" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "  Current changes:" -ForegroundColor Yellow
                    git status --short
                }
            } catch {
                Write-Host "  Status: Error" -ForegroundColor Red
            }
            Pop-Location
            Write-Host ""
        }
    } else {
        Write-Host "No Git repositories found!" -ForegroundColor Red
    }
} else {
    Write-Host "Path not found: $searchPath" -ForegroundColor Red
}

Write-Host "=== Done ===" -ForegroundColor Cyan

