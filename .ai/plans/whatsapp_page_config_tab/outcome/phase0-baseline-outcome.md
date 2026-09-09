# Phase 0 — Pre-Implementation Baseline Outcome

- **Task ID:** phase0
- **Date:** 2025-09-07
- **Branch:** `feat/whatsapp-page-config-tab` @ `719cf1029` (fresh from origin/master)
- **Captured before any implementation work.** No source files were modified during capture (verified via `git status` before and after).

## Baseline Numbers

| Check | Result | Status |
|---|---|---|
| tsgo errors (`grep -c "error TS"`) | **0 lines captured — but command OOM-killed (exit 137)** | ⚠️ N/A (see Type-check constraint) |
| biome warnings (`grep -c warn`) | **1** — and it is an infra warning, **0 code-level warnings, 0 errors** (6234 files checked) | ✅ CLEAN |
| lint-service (`scripts/lint-service.ts --json --id baseline`) | `success:false, exitCode:1, fileCount:0, durationMs:5` — child `tsgolint` OOM-killed | ⚠️ N/A (see Type-check constraint) |
| oxlint (`bun oxlint`) | exits 1 — `Error running tsgolint` (child SIGKILL / OOM). Same with `--disable-typescript-plugin`. | ⚠️ N/A (see Type-check constraint) |
| git stash list | empty (no stashes) | ✅ |
| git diff --name-only | `bun.lock` only | ✅ |
| DB schema (app_data, public schema) | **0 tables** → **schema NOT pushed** | 📌 expected (fresh clone) |

## Type-check constraint (CRITICAL for all later phases)

This sandbox has a **4GB memory cgroup limit** (`/sys/fs/cgroup/memory.max` = 4294967296, no swap, no sudo). The full-repo type/lint stack exceeds it and is **kernel OOM-killed**:

- `bun tsgo` (full `tsconfig.json` scope): OOM kill at ~3.68 GB RSS — dmesg evidence `Out of memory: Killed process ... (tsgo)`. Tried 3× (via `bun tsgo`, direct binary, and again after monitoring).
- `tsgo -p tsconfig.build.json --noEmit` (production-graph scope only, excluding tests/scripts): also OOM kill (exit 137).
- `tsc -p tsconfig.json --noEmit` with `NODE_OPTIONS=--max-old-space-size=3400`: OOM kill (exit 137).
- `tsc -p tsconfig.build.json --noEmit` with heap 3200 MB: node heap exhaustion abort (exit 134, "Ineffective mark-compacts near heap limit") at ~3.2 GB.
- `oxlint` / `lint-service.ts`: both spawn `tsgolint headless` (oxlint-tsgolint type-aware backend) unconditionally; the child is OOM-killed at ~3.19 GB RSS (dmesg evidence).

**Consequence:** a numeric tsgo/tsc error-count baseline could not be established in this environment. This is an **environment limitation, not a code issue** — there is no evidence of type errors either way. Later phases must NOT treat "tsgo OOM" as a regression, and must NOT attempt to "fix" it. Verification gates that require `bun tsgo` or type-aware lint cannot run here; use **biome** (completed cleanly) + non-type-aware checks as the in-sandbox automated gates, and defer full type-check verification to the orchestrator (e.g. CI or a larger machine) — record in deferred-items.md if the plan requires it.

Raw evidence files: `/tmp/baseline-tsgo.txt`, `/tmp/baseline-tsgo-full.txt`, `/tmp/baseline-tsc-buildscope.txt`, `/tmp/baseline-biome.txt`, `/tmp/baseline-biome-full.txt`, `/tmp/baseline-lint.json`, `/tmp/baseline-oxlint.txt`, `/tmp/baseline-stash.txt`, `/tmp/baseline-files.txt`.

## Pre-existing issues to ignore during post-implementation review

1. **biome (1 warning, non-code):** `! Dereferenced symlink` — broken symlink at `.claude/skills` (filesystem infra warning; `Biome encountered a file system entry that is a broken symbolic link`). Ignore in every review round; it is not in the diff scope and must not be "fixed".
2. **biome code-level:** none — 0 errors, 0 warnings across 6234 files. Any biome code warning appearing post-implementation is **new** and attributable to the feature work.
3. **tsgo/tsc/tsgolint OOM (exit 137/134):** environmental; pre-existing and reproducible on untouched master. Ignore as a code signal; do not spend debugging time on it.
4. **bun.lock modified:** modified during environment setup (bun install), **before** implementation began — not part of feature work; leave as-is.

## Git baseline (files already modified before implementation)

- Modified (tracked): `bun.lock` (from env-setup `bun install`)
- Untracked (expected, not source): `.ai/plans/whatsapp_page_config_tab/deferred-items.md`, `.ai/plans/whatsapp_page_config_tab/tasks.md`, `Caddyfile` (preserved env file)
- `.env` is gitignored (not shown in status)
- **No source files (app/, backend/, frontend/, shared/, scripts/) are modified** — any change there appearing in later `git diff --name-only` runs is attributable to feature phases.

## DB schema state

- Provider: `DB_PROVIDER=postgres`, `DATABASE_URL` → `postgresql://postgres@127.0.0.1:5432/app_data` (user-space PostgreSQL 17.11 at `/tmp/pg`, trust auth).
- `\dt` → "Did not find any relations"; `information_schema.tables` (public) count = **0**.
- **Schema NOT pushed, DB empty.** Task 1 (schema/migration/seeding) starts from an empty database. (Not pushed in Phase 0, per instructions.)

## Note for all later review rounds

**These baselines are the filter for pre-existing issues.** In every later quality-loop / review round: anything listed under "Pre-existing issues to ignore" above must be excluded from findings; biome is the only completed full-repo checker (baseline: 0 errors / 0 code warnings / 1 symlink infra warning); type-check and type-aware-lint baselines are **N/A due to sandbox OOM** and must not be compared or "improved" against. Report deviations from this baseline as new, attributable to the phase that introduced them.
