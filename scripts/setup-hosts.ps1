# Setup hosts file for ALC Stronghold Platform
# Requires: gsudo (https://github.com/gerardog/gsudo)

param(
    [switch]$Remove,
    [switch]$Elevated
)

$ErrorActionPreference = "Stop"

$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$domains = @(
    "alcstronghold.local",
    "backend.alcstronghold.local"
)

# If not elevated, re-run with gsudo
if (-not $Elevated) {
    if (-not (Get-Command gsudo -ErrorAction SilentlyContinue)) {
        Write-Error "gsudo is not installed. Install it with: winget install gerardog.gsudo"
        exit 1
    }

    $scriptPath = $MyInvocation.MyCommand.Path
    if ($Remove) {
        gsudo pwsh -NoProfile -File $scriptPath -Elevated -Remove
    } else {
        gsudo pwsh -NoProfile -File $scriptPath -Elevated
    }
    exit $LASTEXITCODE
}

# Elevated execution starts here
$hostsContent = Get-Content $hostsPath -Raw -ErrorAction SilentlyContinue
if (-not $hostsContent) { $hostsContent = "" }

if ($Remove) {
    Write-Host "Removing ALC Stronghold domains from hosts file..." -ForegroundColor Yellow

    foreach ($domain in $domains) {
        $pattern = "(?m)^127\.0\.0\.1\s+$([regex]::Escape($domain))\s*$\r?\n?"
        $hostsContent = $hostsContent -replace $pattern, ""
    }

    $hostsContent = $hostsContent -replace "# ALC Stronghold domains\r?\n", ""
    $hostsContent = $hostsContent -replace "(\r?\n){3,}", "`r`n`r`n"

    Set-Content -Path $hostsPath -Value $hostsContent.TrimEnd() -NoNewline -Encoding UTF8
    Write-Host "Domains removed successfully!" -ForegroundColor Green
} else {
    Write-Host "Adding ALC Stronghold domains to hosts file..." -ForegroundColor Cyan

    $newEntries = @()

    foreach ($domain in $domains) {
        if ($hostsContent -notmatch "127\.0\.0\.1\s+$([regex]::Escape($domain))") {
            $newEntries += "127.0.0.1`t$domain"
            Write-Host "  + $domain" -ForegroundColor Green
        } else {
            Write-Host "  = $domain (already exists)" -ForegroundColor Gray
        }
    }

    if ($newEntries.Count -gt 0) {
        $separator = "`r`n`r`n# ALC Stronghold domains`r`n"
        $newContent = $hostsContent.TrimEnd() + $separator + ($newEntries -join "`r`n") + "`r`n"
        Set-Content -Path $hostsPath -Value $newContent -NoNewline -Encoding UTF8
        Write-Host ""
        Write-Host "Hosts file updated successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "All domains already configured." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Current ALC Stronghold entries in hosts:" -ForegroundColor Cyan
Get-Content $hostsPath | Select-String "alcstronghold\.local" | ForEach-Object { Write-Host "  $_" }
