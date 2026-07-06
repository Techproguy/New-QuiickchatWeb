# Fix Next.js build error: Case sensitivity and React context issues
# Run this from: C:\runorx\mobile\QC\quickchat-web

Write-Host "Fixing Next.js build errors..." -ForegroundColor Cyan

$projectRoot = $PSScriptRoot
if (-not $projectRoot) {
    $projectRoot = Get-Location
}

Write-Host "`n1. Cleaning .next build cache..." -ForegroundColor Yellow
$nextFolder = Join-Path $projectRoot ".next"
if (Test-Path $nextFolder) {
    Remove-Item -Path $nextFolder -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✓ Removed .next folder" -ForegroundColor Green
} else {
    Write-Host "   ✓ .next folder doesn't exist" -ForegroundColor Green
}

Write-Host "`n2. Cleaning node_modules/.cache..." -ForegroundColor Yellow
$cacheFolder = Join-Path $projectRoot "node_modules\.cache"
if (Test-Path $cacheFolder) {
    Remove-Item -Path $cacheFolder -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✓ Removed node_modules/.cache" -ForegroundColor Green
}

Write-Host "`n3. Verifying project path casing..." -ForegroundColor Yellow
$currentPath = $projectRoot
$expectedName = "quickchat-web"
$actualName = Split-Path $currentPath -Leaf

if ($actualName -ne $expectedName) {
    Write-Host "   ⚠ Warning: Project folder is '$actualName', expected '$expectedName'" -ForegroundColor Yellow
    Write-Host "   Make sure you're running from the lowercase 'quickchat-web' folder" -ForegroundColor Yellow
} else {
    Write-Host "   ✓ Project path is correct: $actualName" -ForegroundColor Green
}

Write-Host "`n4. Checking for duplicate folders..." -ForegroundColor Yellow
$parentDir = Split-Path $projectRoot -Parent
$quickchatWebUpper = Join-Path $parentDir "QuickChat-web"
if (Test-Path $quickchatWebUpper) {
    Write-Host "   ⚠ Found duplicate folder: QuickChat-web" -ForegroundColor Yellow
    Write-Host "   This can cause case sensitivity issues. Consider removing it." -ForegroundColor Yellow
} else {
    Write-Host "   ✓ No duplicate folders found" -ForegroundColor Green
}

Write-Host "`n5. Next steps:" -ForegroundColor Cyan
Write-Host "   Run: npm run build" -ForegroundColor White
Write-Host "   If errors persist, try:" -ForegroundColor White
Write-Host "   - Delete node_modules and reinstall: Remove-Item -Recurse -Force node_modules ; npm install" -ForegroundColor Gray
Write-Host "   - Check that all imports use consistent casing" -ForegroundColor Gray

Write-Host "`n✓ Cleanup complete!" -ForegroundColor Green
