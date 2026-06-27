#Requires -PSEdition Core
<#
.SYNOPSIS
    Tears down an AI agent sandbox container, worktree, and database.

.DESCRIPTION
    Stops and removes the Docker container, optionally removes the git
    worktree and agent database. Prompts before destructive operations.

.PARAMETER AgentName
    The agent name used when the sandbox was created.

.PARAMETER AgentNumber
    The agent number used when the sandbox was created.

.PARAMETER Force
    Skip confirmation prompts (useful for automation).

.EXAMPLE
    .\remove-agent-sandbox.ps1 -AgentName "feature-auth" -AgentNumber 1
    .\remove-agent-sandbox.ps1 -AgentName "fix-lint" -AgentNumber 2 -Force
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$AgentName,

    [Parameter(Mandatory = $true)]
    [int]$AgentNumber,

    [switch]$Force
)

$ErrorActionPreference = "Stop"

$WorktreeBase = Join-Path (Split-Path (Get-Location).Path -Parent) "worktrees"
$WorktreePath = Join-Path $WorktreeBase $AgentName
$ContainerName = "siraj-agent-$AgentNumber"
$BranchName = "agent/$AgentName"
$DbName = "siraj_agent_$AgentNumber"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "  Siraj Agent Sandbox Teardown       " -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "  Agent:    $AgentName" -ForegroundColor White
Write-Host "  Number:   $AgentNumber" -ForegroundColor White
Write-Host "  Container: $ContainerName" -ForegroundColor White
Write-Host "  Worktree:  $WorktreePath" -ForegroundColor White
Write-Host "  Database:  $DbName" -ForegroundColor White
Write-Host ""

# --- Step 1: Stop and remove container ---
$containerExists = docker ps -a --filter "name=$ContainerName" --format "{{.Names}}" 2>$null
if ($containerExists) {
    Write-Host "[1/3] Stopping container $ContainerName..." -ForegroundColor Red
    docker stop $ContainerName 2>$null | Out-Null
    docker rm $ContainerName 2>$null | Out-Null
    Write-Host "  Container removed." -ForegroundColor Green
} else {
    Write-Host "[1/3] Container $ContainerName not found. Skipping." -ForegroundColor Yellow
}

# --- Step 2: Remove git worktree ---
if (Test-Path $WorktreePath) {
    if ($Force) {
        $removeWorktree = "y"
    } else {
        Write-Host "[2/3] Remove git worktree at $WorktreePath ?" -ForegroundColor Red
        Write-Host "  Ensure the agent has committed and pushed all changes!" -ForegroundColor Red
        $removeWorktree = Read-Host "  Confirm? (y/N)"
    }

    if ($removeWorktree -eq "y") {
        $gitFile = Join-Path $WorktreePath ".git"
        $projectRoot = (Get-Location).Path
        $windowsGitdir = "gitdir: $($projectRoot -replace '\\','/')/.git/worktrees/$AgentName"
        Set-Content -Path $gitFile -Value $windowsGitdir -NoNewline
        
        git worktree remove $WorktreePath --force 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Worktree removed." -ForegroundColor Green
        } else {
            Write-Host "  WARNING: Could not remove worktree. Remove manually:" -ForegroundColor Yellow
            Write-Host "    git worktree remove $WorktreePath --force" -ForegroundColor White
        }

        $branchGone = git branch --list $BranchName 2>$null
        if ($branchGone) {
            if ($Force) {
                $removeBranch = "y"
            } else {
                $removeBranch = Read-Host "  Also delete branch $BranchName ? (y/N)"
            }
            if ($removeBranch -eq "y") {
                git branch -D $BranchName 2>$null
                Write-Host "  Branch $BranchName deleted." -ForegroundColor Green
            }
        }
    } else {
        Write-Host "  Worktree kept." -ForegroundColor Yellow
    }
} else {
    Write-Host "[2/3] Worktree not found at $WorktreePath. Skipping." -ForegroundColor Yellow
}

# --- Step 3: Drop agent database ---
if ($Force) {
    $dropDb = "y"
} else {
    Write-Host "[3/3] Drop database $DbName ?" -ForegroundColor Red
    $dropDb = Read-Host "  Confirm? (y/N)"
}

if ($dropDb -eq "y") {
    $pgRunning = docker ps --filter "name=siraj_agent_postgres" --format "{{.Names}}" 2>$null
    if ($pgRunning) {
        docker exec siraj_agent_postgres psql -U postgres -c "DROP DATABASE IF EXISTS $DbName" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Database $DbName dropped." -ForegroundColor Green
        } else {
            Write-Host "  WARNING: Could not drop database. Drop manually:" -ForegroundColor Yellow
            Write-Host "    docker exec siraj_agent_postgres psql -U postgres -c 'DROP DATABASE IF EXISTS $DbName'" -ForegroundColor White
        }
    } else {
        Write-Host "  Postgres container not running. Database not dropped." -ForegroundColor Yellow
    }
} else {
    Write-Host "  Database kept." -ForegroundColor Yellow
}

# --- Cleanup: Remove named volume for node_modules ---
$volumeName = "siraj-agent-${AgentNumber}-modules"
$volumeExists = docker volume ls --filter name=$volumeName --format "{{.Name}}" 2>$null
if ($volumeExists -and $Force) {
    docker volume rm $volumeName 2>$null | Out-Null
    Write-Host "  Volume $volumeName removed." -ForegroundColor Green
} elseif ($volumeExists) {
    $rmVol = Read-Host "  Remove node_modules volume $volumeName ? (y/N)"
    if ($rmVol -eq "y") {
        docker volume rm $volumeName 2>$null | Out-Null
        Write-Host "  Volume removed." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== Teardown Complete ===" -ForegroundColor Green
Write-Host ""

$remainingAgents = docker ps --filter "name=siraj-agent-" --format "{{.Names}}" 2>$null
if (-not $remainingAgents) {
    Write-Host "No agent containers running. You can stop infrastructure:" -ForegroundColor Cyan
    Write-Host "  docker compose -f .agent-sandbox/docker-compose.agents.yml down" -ForegroundColor White
    Write-Host ""
}
