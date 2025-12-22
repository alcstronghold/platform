$json = Get-Content 'D:\code\github\alcstronghold\platform\infrastructure\directus_schema.json' -Raw | ConvertFrom-Json
$json.data | ConvertTo-Json -Depth 100 -Compress | Set-Content 'D:\code\github\alcstronghold\platform\infrastructure\directus_schema_data.json' -Encoding UTF8
Write-Host "Schema data extracted successfully"
