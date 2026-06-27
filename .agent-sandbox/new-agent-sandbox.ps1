#Requires -PSEdition Core
<#
.SYNOPSIS
    Spins up a new isolated AI agent sandbox container.

.DESCRIPTION
    Creates a git worktree, agent database, and Docker container
    for an AI agent to work on the Siraj codebase in complete isolation
    from other agents.

.PARAMETER AgentName
    Short name for the agent (e.g. "feature-auth", "fix-lint", "refactor-db").
    Used for branch name, container name, and worktree directory.

.PARAMETER AgentNumber
    Unique integer for this agent. Determines host ports:
    - Dev server: 3100 + AgentNumber
    - Lint queue: 4876 + AgentNumber

.PARAMETER BaseBranch
    Git branch to base the agent's worktree on. Defaults to current branch.

.EXAMPLE
    .\new-agent-sandbox.ps1 -AgentName "feature-auth" -AgentNumber 1
    .\new-agent-sandbox.ps1 -AgentName "fix-dashboard" -AgentNumber 2 -BaseBranch "develop"

.NOTES
    Prerequisites:
    - Docker Desktop running with WSL2 backend
    - Git (for worktree management)
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$AgentName,

    [Parameter(Mandatory = $true)]
    [int]$AgentNumber,

    [string]$BaseBranch = "",

    [switch]$Rebuild
)

$ErrorActionPreference = "Stop"

$ProjectRoot = (Get-Location).Path
$WorktreeBase = Join-Path (Split-Path $ProjectRoot -Parent) "worktrees"
$WorktreePath = Join-Path $WorktreeBase $AgentName
$HostDevPort = 3100 + $AgentNumber
$HostLintPort = 4876 + $AgentNumber
$ContainerName = "siraj-agent-$AgentNumber"
$BranchName = "agent/$AgentName"
$DbName = "siraj_agent_$AgentNumber"
$ComposeFile = Join-Path $ProjectRoot ".agent-sandbox\docker-compose.agents.yml"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Siraj Agent Sandbox Provisioning  " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Agent:     $AgentName" -ForegroundColor White
Write-Host "  Number:    $AgentNumber" -ForegroundColor White
Write-Host "  Branch:    $BranchName" -ForegroundColor White
Write-Host "  Dev Port:  $HostDevPort" -ForegroundColor White
Write-Host "  Lint Port: $HostLintPort" -ForegroundColor White
Write-Host "  Database:  $DbName" -ForegroundColor White
Write-Host ""

# --- Step 1: Ensure infrastructure is running ---
Write-Host "[1/6] Checking infrastructure (Postgres, Redis)..." -ForegroundColor Green

$infraRunning = docker ps --filter "name=siraj_agent_postgres" --filter "status=running" --format "{{.Names}}" 2>$null
if (-not $infraRunning) {
    Write-Host "  Starting Postgres and Redis..." -ForegroundColor Yellow
    docker compose -f $ComposeFile up -d postgres redis
    Write-Host "  Waiting for Postgres to be healthy..." -ForegroundColor Yellow
    $timeout = 30
    $elapsed = 0
    while ($elapsed -lt $timeout) {
        $healthy = docker ps --filter "name=siraj_agent_postgres" --filter "health=healthy" --format "{{.Names}}" 2>$null
        if ($healthy) { break }
        Start-Sleep -Seconds 2
        $elapsed += 2
    }
    if (-not $healthy) {
        Write-Host "  ERROR: Postgres did not become healthy within ${timeout}s" -ForegroundColor Red
        exit 1
    }
    Write-Host "  Infrastructure is up." -ForegroundColor Green
} else {
    Write-Host "  Infrastructure already running." -ForegroundColor Green
}

# --- Step 2: Create git worktree ---
Write-Host "[2/6] Setting up git worktree..." -ForegroundColor Green

if ($BaseBranch -eq "") {
    $BaseBranch = git branch --show-current 2>$null
    if (-not $BaseBranch) { $BaseBranch = "main" }
}

if (Test-Path $WorktreePath) {
    Write-Host "  Worktree already exists at: $WorktreePath" -ForegroundColor Yellow
    Write-Host "  Reusing existing worktree." -ForegroundColor Yellow
} else {
    if (-not (Test-Path $WorktreeBase)) {
        New-Item -ItemType Directory -Path $WorktreeBase -Force | Out-Null
    }

    $branchExists = git branch --list $BranchName 2>$null
    if ($branchExists) {
        Write-Host "  Branch $BranchName exists. Adding worktree..." -ForegroundColor Yellow
        git worktree add $WorktreePath $BranchName 2>$null
    } else {
        Write-Host "  Creating branch $BranchName from $BaseBranch..." -ForegroundColor Yellow
        git worktree add -b $BranchName $WorktreePath $BaseBranch 2>$null
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Failed to create git worktree" -ForegroundColor Red
        exit 1
    }
    Write-Host "  Worktree created at: $WorktreePath" -ForegroundColor Green
}

# --- Step 3: Fix .git worktree path for container compatibility ---
Write-Host "[3/6] Patching .git link for container path..." -ForegroundColor Green

$gitFile = Join-Path $WorktreePath ".git"
$gitContent = Get-Content $gitFile -Raw
$containerGitdir = "gitdir: /workspaces/siraj-git/.git/worktrees/$AgentName"
Set-Content -Path $gitFile -Value $containerGitdir -NoNewline
Write-Host "  .git file patched for container path." -ForegroundColor Green

# --- Step 4: Create agent database ---
Write-Host "[4/6] Creating agent database ($DbName)..." -ForegroundColor Green

$dbCreated = docker exec siraj_agent_postgres psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DbName'" 2>$null
if ($dbCreated -eq "1") {
    Write-Host "  Database $DbName already exists." -ForegroundColor Yellow
} else {
    docker exec siraj_agent_postgres psql -U postgres -c "CREATE DATABASE $DbName" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Failed to create database $DbName" -ForegroundColor Red
        exit 1
    }
    Write-Host "  Database $DbName created." -ForegroundColor Green
}

# --- Step 5: Build base image if needed ---
Write-Host "[5/6] Checking agent base image..." -ForegroundColor Green

$imageExists = docker image inspect siraj-agent-base 2>$null
if (-not $imageExists -or $Rebuild) {
    if ($Rebuild) {
        Write-Host "  Rebuilding siraj-agent-base image (--rebuild flag)..." -ForegroundColor Yellow
    } else {
        Write-Host "  Building siraj-agent-base image (first time, ~2-5 min)..." -ForegroundColor Yellow
    }
    docker build -t siraj-agent-base -f (Join-Path $ProjectRoot ".agent-sandbox\Dockerfile.agent") $ProjectRoot
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Failed to build Docker image" -ForegroundColor Red
        exit 1
    }
    Write-Host "  Image built successfully." -ForegroundColor Green
} else {
    Write-Host "  Image siraj-agent-base already exists. (Use -Rebuild to rebuild after package.json changes)" -ForegroundColor Green
}

# --- Step 6: Start agent container ---
Write-Host "[6/6] Starting agent container $ContainerName..." -ForegroundColor Green

$existingContainer = docker ps -a --filter "name=$ContainerName" --format "{{.Names}}" 2>$null
if ($existingContainer) {
    Write-Host "  Container $ContainerName already exists. Removing old one..." -ForegroundColor Yellow
    docker stop $ContainerName 2>$null | Out-Null
    docker rm $ContainerName 2>$null | Out-Null
}

$networkName = docker network ls --filter name=siraj-agent-net --format '{{.Name}}' | Select-Object -First 1
if (-not $networkName) {
    Write-Host "  Creating network siraj-agent-net..." -ForegroundColor Yellow
    docker network create siraj-agent-net 2>$null
    $networkName = "siraj-agent-net"
}

docker run -d `
    --name $ContainerName `
    --network $networkName `
    -p "${HostDevPort}:3000" `
    -p "${HostLintPort}:4777" `
    -v "${WorktreePath}:/workspaces/siraj" `
    -v "${ProjectRoot}:/workspaces/siraj-git:ro" `
    -v "siraj-agent-${AgentNumber}-modules:/workspaces/siraj/node_modules" `
    -e "NODE_ENV=development" `
    -e "PORT=3000" `
    -e "DATABASE_URL=postgresql://postgres:postgres@siraj_agent_postgres:5432/$DbName" `
    -e "REDIS_URL=redis://siraj_agent_redis:6379" `
    -e "REDIS_PROVIDER=local" `
    -e "DB_PROVIDER=postgres" `
    -e "JWT_SECRET=agent-${AgentNumber}-dev-jwt-secret-minimum-32-chars-change" `
    -e "DATABASE_ENCRYPTION_KEY=agent${AgentNumber}-dev-encryption-key-must-be-very-long" `
    -e "STORAGE_PROVIDER=local" `
    -e "LOCAL_STORAGE_PATH=./storage/" `
    -e "NEXT_PUBLIC_BASE_URL=http://localhost:${HostDevPort}" `
    -e "ALLOWED_ORIGIN=http://localhost:${HostDevPort}" `
    -e "NEXT_PUBLIC_ENABLE_BINARY_GRAPHQL=true" `
    -e "GRAPHQL_ENCRYPTION_KEY=agent${AgentNumber}-graphql-encryption-key-change" `
    -e "CACHE_PROVIDER=postgres" `
    siraj-agent-base

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Failed to start container" -ForegroundColor Red
    exit 1
}

Write-Host "  Container started (node_modules baked into image, no download needed)." -ForegroundColor Green
Start-Sleep -Seconds 2

Write-Host ""
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  Agent Sandbox Ready!               " -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Container:   $ContainerName" -ForegroundColor White
Write-Host "  Branch:      $BranchName" -ForegroundColor White
Write-Host "  Worktree:    $WorktreePath" -ForegroundColor White
Write-Host "  Dev URL:     http://localhost:$HostDevPort" -ForegroundColor White
Write-Host "  Lint Queue:  http://localhost:$HostLintPort" -ForegroundColor White
Write-Host "  Database:    $DbName" -ForegroundColor White
Write-Host ""
Write-Host "  Shell into container:" -ForegroundColor Cyan
Write-Host "    docker exec -it $ContainerName bash" -ForegroundColor White
Write-Host ""
Write-Host "  Start dev server:" -ForegroundColor Cyan
Write-Host "    docker exec -it $ContainerName bash -c 'bun run dev'" -ForegroundColor White
Write-Host ""
Write-Host "  Run migrations + seed:" -ForegroundColor Cyan
Write-Host "    docker exec -it $ContainerName bash -c 'bun run db'" -ForegroundColor White
Write-Host ""
Write-Host "  Tear down when done:" -ForegroundColor Cyan
Write-Host "    .\.agent-sandbox\remove-agent-sandbox.ps1 -AgentName '$AgentName' -AgentNumber $AgentNumber" -ForegroundColor White
Write-Host ""
