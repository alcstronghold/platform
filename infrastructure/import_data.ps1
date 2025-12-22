# Get fresh admin token
$loginUrl = "https://backend.alcstronghold.local/auth/login"
$creds = @{
    email = "alcstronghold@alcstronghold.com"
    password = "Admin123!"
} | ConvertTo-Json

# Skip SSL verification for local development
add-type @"
using System.Net;
using System.Security.Cryptography.X509Certificates;
public class TrustAllCertsPolicy : ICertificatePolicy {
    public bool CheckValidationResult(
        ServicePoint srvPoint, X509Certificate certificate,
        WebRequest request, int certificateProblem) {
        return true;
    }
}
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host "Getting admin token..."
$loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $creds -ContentType "application/json"
$token = $loginResponse.data.access_token
Write-Host "Token acquired!`n"

$baseUrl = "https://backend.alcstronghold.local"
$inputDir = "D:\code\github\alcstronghold\platform\infrastructure\data_export"

# Collections to import (order matters for foreign keys)
$collections = @(
    "languages",
    "genres",
    "publishers",
    "rpg_families",
    "rpg_systems",
    "rpg_editions",
    "settings",
    "genres_translations",
    "rpg_families_translations",
    "rpg_systems_translations",
    "settings_translations",
    "settings_genres",
    "rpg_families_settings"
)

foreach ($collection in $collections) {
    $inputFile = "$inputDir\$collection.json"

    if (!(Test-Path $inputFile)) {
        Write-Host "Skipping $collection (file not found)"
        continue
    }

    $content = Get-Content $inputFile -Raw -Encoding UTF8
    if ($content -eq "null" -or $content -eq "" -or $content -eq "[]") {
        Write-Host "Skipping $collection (no data)"
        continue
    }

    $data = $content | ConvertFrom-Json
    $count = ($data | Measure-Object).Count

    if ($count -eq 0) {
        Write-Host "Skipping $collection (empty)"
        continue
    }

    Write-Host "Importing $collection ($count items)..."

    $url = "$baseUrl/items/$collection"

    # Ensure data is always an array
    if ($data -isnot [System.Array]) {
        $data = @($data)
    }

    $body = ConvertTo-Json -InputObject $data -Depth 100 -Compress

    try {
        $response = Invoke-RestMethod -Uri $url -Headers @{
            Authorization = "Bearer $token"
            "Content-Type" = "application/json"
        } -Method Post -Body $body
        Write-Host "  -> Imported successfully"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "  -> Error ($statusCode): $errorBody"
    }
}

Write-Host "`nImport completed!"
