# Generate TLS certificates for ALC Stronghold Platform
# Requires: mkcert (https://github.com/FiloSottile/mkcert)

param(
    [string]$TraefikCertsPath = "$PSScriptRoot\..\..\..\..\pikachumetal\traefik-proxy\certs"
)

$ErrorActionPreference = "Stop"

# Check if mkcert is installed
if (-not (Get-Command mkcert -ErrorAction SilentlyContinue)) {
    Write-Error "mkcert is not installed. Install it with: choco install mkcert"
    exit 1
}

# Resolve path
$TraefikCertsPath = [System.IO.Path]::GetFullPath($TraefikCertsPath)

# Check if traefik-proxy certs folder exists
if (-not (Test-Path $TraefikCertsPath)) {
    Write-Error "Traefik certs folder not found: $TraefikCertsPath"
    Write-Host "Make sure traefik-proxy is cloned at: D:\code\github\pikachumetal\traefik-proxy"
    exit 1
}

Write-Host "Generating certificates for ALC Stronghold..." -ForegroundColor Cyan
Write-Host "Output folder: $TraefikCertsPath" -ForegroundColor Gray

# Generate wildcard certificate for *.alcstronghold.local
$certFile = Join-Path $TraefikCertsPath "alcstronghold.local.pem"
$keyFile = Join-Path $TraefikCertsPath "alcstronghold.local-key.pem"

mkcert -cert-file $certFile -key-file $keyFile "*.alcstronghold.local" "alcstronghold.local"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Certificates generated successfully!" -ForegroundColor Green
    Write-Host "  - $certFile"
    Write-Host "  - $keyFile"
    Write-Host ""
    Write-Host "Domains covered:" -ForegroundColor Yellow
    Write-Host "  - *.alcstronghold.local (backend.alcstronghold.local, etc.)"
    Write-Host "  - alcstronghold.local"
} else {
    Write-Error "Failed to generate certificates"
    exit 1
}
