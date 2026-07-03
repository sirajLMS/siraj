---
name: quality-loop
description: Use ONLY when running the quality gate loop (tsgo, biome, lint) to fix issues iteratively. Triggers on quality-gate, lint, biome, tsgo failures.
---

# Quality Loop Skill

Run `tsgo` → `biome:check` → `lint` in a loop until all pass. Use the lint queue server at `http://localhost:4777` if available.

## Workflow

1. Run `bun tsgo`. If errors, fix type errors and re-run until clean.
2. Run `bun biome:check`. If errors, run `bun run format` to auto-fix, then re-run biome:check until clean.
3. For lint (NEVER run `bun run lint` directly — always use the lint queue client):
   - Check if the lint queue server is running: `Invoke-RestMethod -Uri http://localhost:4777/status`
   - If NOT running, start it: `~/.bun/bin/bun run scripts/lint-queue-server.ts &`
   - Submit lint request to the queue server:
     ```powershell
     $files = @("<file1>", "<file2>")
     $body = @{ id = "quality-loop"; files = $files } | ConvertTo-Json
     Invoke-RestMethod -Uri http://localhost:4777/lint -Method POST -ContentType 'application/json' -Body $body
     ```
     Or via curl:
     ```bash
     curl -s -X POST http://localhost:4777/lint \
       -H "Content-Type: application/json" \
       -d '{"id":"quality-loop","files":["<file1>","<file2>"]}'
     ```
4. If lint errors found, fix them and re-run lint.
5. Repeat the full loop (tsgo → biome → lint) until all three pass with zero errors.
6. Do NOT run `bun quality-gate` — that includes codescene and sonar which are out of scope for this skill.

## Key Rules

- tsgo and biome:check are safe to run concurrently.
- `bun run lint` is heavyweight and MUST NOT be run concurrently by multiple agents. NEVER run it directly — always use the lint queue server/client.
- After fixing lint errors, re-run only lint (not the full loop) until lint passes, then run the full loop once more to confirm everything is clean.
- Auto-fixable issues: `bun run format` for biome, lint via queue client (with --fix) for ESLint auto-fix.
- For ESLint, prefer fixing manually over relying on auto-fix when the rule requires contextual judgment.