---
name: fix
description: Use when you have lint errors, formatting issues, or before committing code to ensure it passes CI. Runs the project's quality checks (tsgo, oxlint, biome, lint) and follows the progressive verification loop.
allowed-tools: shell
---

# Fix Lint and Formatting

## Quick Fixes

For a fast targeted fix on specific files:

```bash
# 1. Format and fix biome issues
bun run biome:check

# 2. Fix oxlint violations
bun run oxlint

# 3. Fix ESLint issues (in-process lint service, no HTTP server)
bun run lint
# Or file-scoped:
bun run scripts/lint-service.ts -f <file> --id fix
```

## Per-File Progressive Verification

For thorough per-file verification (tsgo → oxlint → biome → lint → duplicates → codescene):

```bash
# Full verification (all checks):
bun run scripts/health/sub-loop.ts <file> --lifecycle codescene

# Just lint checks (tsgo + oxlint + biome + lint):
bun run scripts/health/sub-loop.ts <file> --lifecycle lint

# Just type checking:
bun run scripts/health/sub-loop.ts <file> --lifecycle tsgo
```

The sub-loop script **short-circuits at the first failing check** — stops and prints errors for you to fix.
Fix the errors and re-run until it passes (exit 0). It also prints which instruction files and
AGENTS.md files apply to the target file — read ALL listed files before fixing.

## Batch Verification (All Uncommitted Files)

To verify all uncommitted files at once:

```bash
bun run scripts/health/sub-loop-uncommitted.ts --lifecycle lint
```

## Critical Rules

- **NEVER** add `oxlint-disable` comments — fix the root cause instead. See AGENTS.md "Oxlint Rules" section.
- **NEVER** add `eslint-disable` or `biome-ignore` comments — fix the root cause.
- **NEVER** use `console.*` directly — use `@/frontend/utils/logger` (frontend) or `@/backend/lib/logger` (backend).
- **NEVER** use hardcoded colors — use theme palette via `sx` prop.
- All imports use `@/*` path alias (never relative paths).

## Common Issues

- **Biome formatting**: Run `bun run biome:check` — it auto-fixes formatting and safe lint issues.
- **Oxlint violations**: See AGENTS.md "Oxlint Rules" section for per-rule fix patterns (type guards for `no-unsafe-type-assertion`, `Promise.all` for `no-await-in-loop`, etc.).
- **ESLint type-aware errors**: Use the in-process lint service: `bun run scripts/lint-service.ts -f <file> --id fix`
- **Type errors**: Run `bun tsgo` — project-wide type checker.
