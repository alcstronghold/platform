$json = Get-Content 'D:\code\github\alcstronghold\platform\infrastructure\railway_collections.json' -Raw | ConvertFrom-Json
$collections = $json.data | Where-Object { $_.schema -ne $null } | ForEach-Object { $_.collection }
$collections | ForEach-Object { Write-Host $_ }
