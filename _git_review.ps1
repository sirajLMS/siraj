$mergeBase = "953e5c18c0ab2af994a1da11abefec9eb9325a4b"
$outDir = "$PSScriptRoot\_git_review_output"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# Command 1: git diff
$p1 = Start-Process -FilePath "git" -ArgumentList "-c","core.quotepath=false","diff",$mergeBase -RedirectStandardFile "$outDir\1_diff.txt" -NoNewWindow -Wait -PassThru

# Command 2: git ls-files
$p2 = Start-Process -FilePath "git" -ArgumentList "ls-files","--others","--exclude-standard" -RedirectStandardFile "$outDir\2_lsfiles.txt" -NoNewWindow -Wait -PassThru

# Command 3: git status
$p3 = Start-Process -FilePath "git" -ArgumentList "status","--short" -RedirectStandardFile "$outDir\3_status.txt" -NoNewWindow -Wait -PassThru

# Command 4: git log
$p4 = Start-Process -FilePath "git" -ArgumentList "log","origin/master..HEAD","--oneline" -RedirectStandardFile "$outDir\4_log.txt" -NoNewWindow -Wait -PassThru

# Command 5: git diff --stat
$p5 = Start-Process -FilePath "git" -ArgumentList "diff","--stat",$mergeBase -RedirectStandardFile "$outDir\5_stat.txt" -NoNewWindow -Wait -PassThru

Write-Output "Done. Exit codes: $($p1.ExitCode) $($p2.ExitCode) $($p3.ExitCode) $($p4.ExitCode) $($p5.ExitCode)"
