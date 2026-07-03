# Siraj Agent Sandbox

Isolated Docker containers for multiple AI agents to work on the Siraj codebase simultaneously without file, process, or database conflicts.

## Quick Start

```powershell
# 1. Build the base image (first time only, ~2-5 min)
docker build -t siraj-agent-base -f .agent-sandbox/Dockerfile.agent .

# 2. Spin up agent sandboxes
.\.agent-sandbox\new-agent-sandbox.ps1 -AgentName "feature-auth" -AgentNumber 1
.\.agent-sandbox\new-agent-sandbox.ps1 -AgentName "fix-dashboard" -AgentNumber 2

# 3. Shell into an agent container
docker exec -it siraj-agent-1 bash

# 4. List all active agents
.\.agent-sandbox\list-agents.ps1

# 5. Tear down when done
.\.agent-sandbox\remove-agent-sandbox.ps1 -AgentName "feature-auth" -AgentNumber 1
```

## Architecture

Each agent gets:

| Resource | Isolation Mechanism |
|---|---|
| **Source code** | Git worktree (separate branch + filesystem) |
| **node_modules** | Named Docker volume (OS-specific native binaries) |
| **TypeScript cache** | Per-container `tsconfig.tsbuildinfo` |
| **ESLint cache** | Per-container `.eslintcache` |
| **Next.js build** | Per-container `.next/` directory |
| **Database** | Per-agent PostgreSQL database (`siraj_agent_N`) |
| **Ports** | Each agent maps to unique host ports |
| **Lint queue** | Each agent runs its own on container port 4777 |

## Files

```
.agent-sandbox/
├── README.md                    # This file
├── Dockerfile.agent             # Base image (Bun + system deps + entrypoint)
├── docker-compose.agents.yml    # Infrastructure + agent services
├── entrypoint.sh                # Container startup: bun install + git safe.directory
├── .dockerignore                # Excludes for image build
├── .env.template                # Environment variable template
├── new-agent-sandbox.ps1        # Spin up a new agent (6 steps)
├── remove-agent-sandbox.ps1    # Tear down an agent
├── list-agents.ps1             # Show active agents
└── AGENT_PROMPT.md             # Embeddable prompt for AI agents
```

## Port Mapping

| Agent Number | Dev Server | Lint Queue |
|---|---|---|
| 1 | localhost:3101 | localhost:4877 |
| 2 | localhost:3102 | localhost:4878 |
| 3 | localhost:3103 | localhost:4879 |
| N | localhost:(3100+N) | localhost:(4876+N) |

Infrastructure uses separate ports to avoid conflicts with native services:
- **PostgreSQL**: `localhost:5433` (maps to container 5432)
- **Redis**: `localhost:6380` (maps to container 6379)

## Git Worktree Path Fix

Git worktrees created on Windows contain `.git` files with Windows paths (e.g.
`gitdir: C:/Users/PC/Projects/siraj/.git/worktrees/agent-1`). Inside the Linux
container, this path doesn't exist. The `new-agent-sandbox.ps1` script
automatically patches the `.git` file to use the container-mount path
(`/workspaces/siraj-git/.git/worktrees/agent-1`), and the `remove-agent-sandbox.ps1`
script restores the Windows path before removing the worktree.

The main repo's `.git` directory is mounted read-only at `/workspaces/siraj-git`
inside each container.

## Working Inside a Container

```bash
# Inside the container at /workspaces/siraj

# Install dependencies (done automatically by entrypoint)
bun install

# Start dev server
bun run dev

# Type checking (isolated to this container's files)
bun tsgo

# Linting (isolated, via lint queue server — NEVER run `bun run lint` directly)
bun biome:check
# Start the lint queue server first (if not running):
~/.bun/bin/bun run scripts/lint-queue-server.ts &
# Then submit lint requests via the queue:
curl -s -X POST http://localhost:4777/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"sandbox","files":["<files>"]}'

# Run tests
bun test
bun run test:db
bun run test:graphql

# Quality gate (runs tsgo -> biome -> lint sequentially)
bun quality-gate

# Database operations
bun run db

# Start lint queue server (for sub-agents inside container)
~/.bun/bin/bun run scripts/lint-queue-server.ts
```

## Git Workflow

Each agent works on its own branch (`agent/<name>`). When done:

```bash
# Inside the container
git add -A
git commit -m "feat: implement feature X"
git push origin agent/feature-auth
```

Then create a PR from the host machine, and tear down the sandbox.

## How Isolation Works

### Without Containers (Current: Conflicts)

```
Windows Host
+-- Agent A edits foo.ts --+
|                           +-- Same filesystem -> OVERWRITES
+-- Agent B edits foo.ts --+
+-- Agent A runs tsgo -----+
|                           +-- Same tsconfig.tsbuildinfo -> CORRUPTION
+-- Agent B runs tsgo -----+
+-- Agent A runs lint ------ Same .eslintcache -> RACE CONDITIONS
```

### With Containers (Isolated)

```
Windows Host
+-- Agent A Container (siraj-agent-1)
|   +-- Own worktree: ../worktrees/feature-auth/
|   +-- Own node_modules volume
|   +-- Own .eslintcache, tsgo cache
|   +-- Own database: siraj_agent_1
|   +-- Own ports: 3101, 4877
|
+-- Agent B Container (siraj-agent-2)
|   +-- Own worktree: ../worktrees/fix-dashboard/
|   +-- Own node_modules volume
|   +-- Own .eslintcache, tsgo cache
|   +-- Own database: siraj_agent_2
|   +-- Own ports: 3102, 4878
|
+-- ZERO CONFLICTS - each is a completely isolated Linux environment
```

## Verified Isolation Tests

| Test | Result |
|---|---|
| Simultaneous `bun tsgo` in both containers | PASS - both complete independently |
| `bun biome:check` in one container, `bun tsgo` in the other | PASS - no interference |
| File created in agent-1 invisible to agent-2 | PASS - filesystem isolation |
| Separate `.eslintcache` files per container | PASS |
| Separate `tsconfig.tsbuildinfo` per container | PASS |
| Separate databases `siraj_agent_1` and `siraj_agent_2` | PASS |
| Git `branch --show-current` returns correct per-agent branch | PASS |

## Troubleshooting

### Container won't start
```powershell
# Check Docker is running
docker info

# Check if network exists
docker network ls | Select-String "siraj-agent"

# Create network manually if needed
docker network create siraj-agent-net

# Re-run with verbose output
.\.agent-sandbox\new-agent-sandbox.ps1 -AgentName "test" -AgentNumber 9
```

### bun install fails inside container
```powershell
# Check container logs
docker logs siraj-agent-1

# Manually run install
docker exec -it siraj-agent-1 bash -c "bun install"
```

### Port already in use
```powershell
# Find what's using the port
netstat -ano | findstr :3101

# Kill the process or use a different agent number
```

### Database connection issues
```powershell
# Verify Postgres is running
docker ps --filter "name=siraj_agent_postgres"

# Connect to Postgres directly
docker exec -it siraj_agent_postgres psql -U postgres -l
```

### node_modules issues (Windows/Linux mismatch)
```powershell
# The named volume handles this, but if needed:
docker exec -it siraj-agent-1 bash -c "rm -rf node_modules && bun install"
```

### Git "dubious ownership" error inside container
```powershell
# The entrypoint.sh already runs:
# git config --global --add safe.directory '*'
# If you still see this, run manually:
docker exec siraj-agent-1 bash -c "git config --global --add safe.directory '*'"
```

### Git worktree .git path broken on Windows
```powershell
# Remove script restores Windows path on teardown.
# If you need to fix manually:
$projectRoot = (Get-Location).Path
$windowsGitdir = "gitdir: $($projectRoot -replace '\\','/')/.git/worktrees/agent-1"
Set-Content -Path "C:\Users\PC\Projects\worktrees\agent-1\.git" -Value $windowsGitdir -NoNewline
```

## Cleaning Up Everything

```powershell
# Stop all agent containers
docker ps --filter "name=siraj-agent-" -q | ForEach-Object { docker stop $_ }

# Remove all agent containers
docker ps -a --filter "name=siraj-agent-" -q | ForEach-Object { docker rm $_ }

# Stop infrastructure
docker compose -f .agent-sandbox/docker-compose.agents.yml down

# Remove all named volumes
docker volume ls --filter name=siraj-agent- -q | ForEach-Object { docker volume rm $_ }

# Remove base image
docker rmi siraj-agent-base

# Remove all worktrees (CAUTION: loses uncommitted changes)
git worktree list
git worktree prune
```
