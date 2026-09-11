$folders = @('client', 'front', 'partner', 'server')
$results = @()

foreach ($folder in $folders) {
    if (Test-Path $folder) {
        $files = Get-ChildItem -Path $folder -Recurse -File | Where-Object {
            $_.FullName -notmatch '\\(node_modules|\.next|dist|\.git)\\'
        }
        foreach ($file in $files) {
            $matches = Select-String -Path $file.FullName -Pattern 'rhoseatte|bluebell' -AllMatches
            foreach ($m in $matches) {
                $results += [PSCustomObject]@{
                    File = $file.FullName.Replace('d:\Ritesh\mwp\', '')
                    Line = $m.LineNumber
                    Match = $m.Line.Trim()
                }
            }
        }
    }
}

$results | Format-Table -AutoSize | Out-File -FilePath 'search_results.txt' -Encoding utf8
Write-Output "Found $($results.Count) matches. Saved to search_results.txt."
