$token = "tpK9s0f0M2N1g1ShdyWhZxNvPpxUdjIt"
$baseUrl = "https://backend-stronghold.up.railway.app"
$outputDir = "D:\code\github\alcstronghold\platform\infrastructure\data_export"

# Create output directory
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# Collections to export (user data only)
$collections = @(
    "languages",
    "ai_prompts",
    "genres",
    "genres_translations",
    "publishers",
    "rpg_families",
    "rpg_families_translations",
    "rpg_systems",
    "rpg_systems_translations",
    "rpg_editions",
    "rpg_editions_translations",
    "settings",
    "settings_translations",
    "settings_genres",
    "rpg_families_settings"
)

foreach ($collection in $collections) {
    Write-Host "Exporting $collection..."
    $url = "$baseUrl/items/$collection`?limit=-1"
    $outputFile = "$outputDir\$collection.json"

    try {
        $response = Invoke-RestMethod -Uri $url -Headers @{Authorization = "Bearer $token"} -Method Get
        $response.data | ConvertTo-Json -Depth 100 | Set-Content $outputFile -Encoding UTF8
        $count = ($response.data | Measure-Object).Count
        Write-Host "  -> Exported $count items"
    } catch {
        Write-Host "  -> Error: $_"
    }
}

Write-Host "`nExport completed!"
