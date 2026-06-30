---
name: quality-loop
description: >
  Run the project quality gate loop (tsgo, biome:check, lint) repeatedly until all pass clean.
  Use when asked to run quality checks, fix lint issues, clean up the code, or validate changes.
allowed-tools: shell
---

## Quality Loop Workflow

Run these three checks in sequence. If any fails, fix the issues and re-run from the failed step. Continue until a complete round has zero issues.

### Step 1: TypeScript

```bash
bun tsgo
```

Fix all type errors before proceeding. `tsgo` is safe to run concurrently with other processes.

### Step 2: Biome

```bash
bun biome:check
```

Fix formatting and lint issues. `biome:check` is safe to run concurrently.

### Step 3: Lint

**Do NOT run `bun run lint` directly if other lint processes may be running.**

Check if the lint queue server is available:

```powershell
Invoke-RestMethod -Uri http://localhost:4777/status
```

If the server is running, submit via the queue:

```powershell
$files = @("file1.ts","file2.ts")
$body = @{ id = "quality-loop"; files = $files } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:4777/lint -Method POST -ContentType 'application/json' -Body $body
```

If the server is NOT running and no other agents are active, run directly:

```bash
bun run lint
```

### Loop

If any step reports issues, fix them and restart the loop from the failing step. A clean round is when all three pass without errors.

### Final Report

When a full round passes clean, report:
- Which steps passed
- How many iterations were needed
- Any issues that required manual fixes
