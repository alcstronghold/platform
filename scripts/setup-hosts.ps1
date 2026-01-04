# Setup hosts file for ALC Stronghold Platform
# Requires: gsudo (https://github.com/gerardog/gsudo)

param(
    [switch]$Remove
)

$ErrorActionPreference = "Stop"

$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$domains = @(
    "alcstronghold.local",
    "backend.alcstronghold.local"
)

# Check if gsudo is installed
if (-not (Get-Command gsudo -ErrorAction SilentlyContinue)) {
    Write-Error "gsudo is not installed. Install it with: winget install gerardog.gsudo"
    exit 1
}

function Update-HostsFile {
    param(
        [string]$HostsPath,
        [string[]]$Domains,
        [bool]$Remove
    )

    $hostsContent = Get-Content $HostsPath -Raw

    if ($Remove) {
        Write-Host "Removing ALC Stronghold domains from hosts file..." -ForegroundColor Yellow

        foreach ($domain in $Domains) {
            $pattern = "(?m)^127\.0\.0\.1\s+$([regex]::Escape($domain))\s*$\r?\n?"
            $hostsContent = $hostsContent -replace $pattern, ""
        }

        $hostsContent = $hostsContent -replace "# ALC Stronghold domains\r?\n", ""
        $hostsContent = $hostsContent -replace "(\r?\n){3,}", "`r`n`r`n"

        Set-Content -Path $HostsPath -Value $hostsContent.TrimEnd() -NoNewline
        Write-Host "Domains removed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Adding ALC Stronghold domains to hosts file..." -ForegroundColor Cyan

        $newEntries = @()

        foreach ($domain in $Domains) {
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
            Set-Content -Path $HostsPath -Value $newContent -NoNewline
            Write-Host ""
            Write-Host "Hosts file updated successfully!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "All domains already configured." -ForegroundColor Yellow
        }
    }
}

# Run with elevated privileges using gsudo
$scriptBlock = ${function:Update-HostsFile}.ToString()
$domainsStr = $domains -join ","

gsudo powershell -NoProfile -Command "
    `$domains = '$domainsStr' -split ','
    $scriptBlock
    Update-HostsFile -HostsPath '$hostsPath' -Domains `$domains -Remove `$$Remove
"

Write-Host ""
Write-Host "Current ALC Stronghold entries in hosts:" -ForegroundColor Cyan
Select-String -Path $hostsPath -Pattern "alcstronghold\.local" | ForEach-Object { Write-Host "  $_" }
