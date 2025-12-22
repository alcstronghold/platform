$json = Get-Content 'D:\code\github\alcstronghold\platform\infrastructure\directus_diff.json' -Raw | ConvertFrom-Json
$json.data | ConvertTo-Json -Depth 100 -Compress | Set-Content 'D:\code\github\alcstronghold\platform\infrastructure\directus_diff_data.json' -Encoding UTF8
Write-Host "Diff data extracted successfully"
