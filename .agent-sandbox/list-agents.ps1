#Requires -PSEdition Core
<#
.SYNOPSIS
    Lists all active agent sandboxes and their status.

.DESCRIPTION
    Shows running agent containers, their ports, branches, and databases.

.EXAMPLE
    .\list-agents.ps1
#>

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Siraj Agent Sandboxes              " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$agents = docker ps --filter "name=siraj-agent-" --format "{{.Names}}" 2>$null

if (-not $agents) {
    Write-Host "  No agent containers running." -ForegroundColor Yellow
} else {
    foreach ($name in $agents) {
        $ports = docker port $name 2>$null
        $status = docker inspect $name --format "{{.State.Status}}" 2>$null
        $uptime = docker inspect $name --format "{{.State.StartedAt}}" 2>$null

        Write-Host "  Container:  $name" -ForegroundColor White
        Write-Host "  Status:      $status" -ForegroundColor White
        Write-Host "  Ports:" -ForegroundColor White
        if ($ports) {
            $ports -split "`n" | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
        }
        Write-Host "  Started:    $uptime" -ForegroundColor Gray
        Write-Host ""
    }
}

$infra = @("siraj_agent_postgres", "siraj_agent_redis")
Write-Host "  Infrastructure:" -ForegroundColor Cyan
foreach ($svc in $infra) {
    $running = docker ps --filter "name=$svc" --filter "status=running" --format "{{.Names}}" 2>$null
    if ($running) {
        $health = docker inspect $svc --format "{{if .State.Health}}{{.State.Health.Status}}{{else}}n/a{{end}}" 2>$null
        Write-Host "    $svc  running (health: $health)" -ForegroundColor Green
    } else {
        Write-Host "    $svc  stopped" -ForegroundColor Red
    }
}

$databases = docker exec siraj_agent_postgres psql -U postgres -tAc "SELECT datname FROM pg_database WHERE datname LIKE 'siraj_agent_%'" 2>$null
if ($databases) {
    Write-Host ""
    Write-Host "  Agent Databases:" -ForegroundColor Cyan
    $databases -split "`n" | ForEach-Object {
        $db = $_.Trim()
        if ($db) { Write-Host "    $db" -ForegroundColor White }
    }
}

$worktreeBase = Join-Path (Split-Path (Get-Location).Path -Parent) "worktrees"
if (Test-Path $worktreeBase) {
    $worktrees = Get-ChildItem -Path $worktreeBase -Directory -ErrorAction SilentlyContinue
    if ($worktrees) {
        Write-Host ""
        Write-Host "  Git Worktrees:" -ForegroundColor Cyan
        foreach ($wt in $worktrees) {
            $branch = git -C $wt.FullName branch --show-current 2>$null
            Write-Host "    $($wt.Name)  (branch: $branch)" -ForegroundColor White
        }
    }
}

$volumes = docker volume ls --filter name=siraj-agent- --format "{{.Name}}" 2>$null
if ($volumes) {
    Write-Host ""
    Write-Host "  Named Volumes:" -ForegroundColor Cyan
    $volumes -split "`n" | ForEach-Object {
        $v = $_.Trim()
        if ($v) { Write-Host "    $v" -ForegroundColor White }
    }
}

Write-Host ""
