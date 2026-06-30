---
name: quality-loop
description: Use ONLY when running the quality gate loop (tsgo, biome, lint) to fix issues iteratively. Triggers on quality-gate, lint, biome, tsgo failures.
---

# Quality Loop Skill

Run `tsgo` → `biome:check` → `lint` in a loop until all pass. Use the lint queue server at `http://localhost:4777` if available.

## Workflow

1. Run `bun tsgo`. If errors, fix type errors and re-run until clean.
2. Run `bun biome:check`. If errors, run `bun run format` to auto-fix, then re-run biome:check until clean.
3. For lint:
   - Check if the lint queue server is running: `Invoke-RestMethod -Uri http://localhost:4777/status`
   - If running, submit lint request to the queue server instead of running `bun run lint` directly:
     ```powershell
     $files = @("<file1>", "<file2>")
     $body = @{ id = "quality-loop"; files = $files } | ConvertTo-Json
     Invoke-RestMethod -Uri http://localhost:4777/lint -Method POST -ContentType 'application/json' -Body $body
     ```
   - If not running, run `bun run lint` directly (but never concurrently with other lint runs).
4. If lint errors found, fix them and re-run lint.
5. Repeat the full loop (tsgo → biome → lint) until all three pass with zero errors.
6. Do NOT run `bun quality-gate` — that includes codescene and sonar which are out of scope for this skill.

## Key Rules

- tsgo and biome:check are safe to run concurrently.
- `bun run lint` is heavyweight and MUST NOT be run concurrently by multiple agents. Always prefer the lint queue server.
- After fixing lint errors, re-run only lint (not the full loop) until lint passes, then run the full loop once more to confirm everything is clean.
- Auto-fixable issues: `bun run format` for biome, `bun run lint` (with --fix) for ESLint auto-fix.
- For ESLint, prefer fixing manually over relying on auto-fix when the rule requires contextual judgment.