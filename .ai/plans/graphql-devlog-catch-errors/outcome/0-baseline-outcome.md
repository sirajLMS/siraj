# Task 0 Outcome — Pre-Implementation Baseline

**Date**: 2026-08-19
**Task**: 0. Establish error baseline and create deferred-items ledger

---

## Baseline Metrics

### 1. tsgo (TypeScript type-checking)

| Metric | Value |
|--------|-------|
| Error count (`grep -c "error TS"`) | **0** |
| Exit behavior | Completed successfully (exit 0) |
| Tail output | Process-lock enqueued → acquired → released; no type errors emitted |

**Interpretation**: The codebase compiles cleanly with `bun tsgo`. Any new `error TS` lines appearing after implementation are regressions introduced by the plan.

---

### 2. biome:check (Formatting & linting)

| Metric | Value |
|--------|-------|
| Warning count (`grep -c "warn"`) | **0** |
| Exit behavior | Completed successfully (exit 0) |
| Tail output | "Checked 5591 files in 3s. No fixes applied." |

**Interpretation**: Biome reports no warnings across 5591 files. Any post-implementation biome warnings are new and must be resolved.

---

### 3. lint-service (ESLint via custom runner)

| Metric | Value |
|--------|-------|
| Success | `true` |
| Exit code | 0 |
| File count | 0 (no specific files targeted — full-repo scope) |
| Duration | 10750 ms |
| Output | Only a benign `ESLintPoorConcurrencyWarning` (Node.js runtime warning, not a lint error) |

**Interpretation**: The project-level ESLint service passes with exit 0. The `ESLintPoorConcurrencyWarning` is a pre-existing Node.js runtime warning (not a lint finding) and should be **ignored** in post-implementation review.

---

### 4. Git diff baseline (files modified before implementation)

| Metric | Value |
|--------|-------|
| Files in `git diff --name-only` | **0** (empty — no uncommitted changes in tracked files) |
| Stash list | **empty** (no stashes) |

**Interpretation**: The working tree is clean. All source files are at their committed state. Any files appearing in `git diff --name-only` after implementation are changes made during the plan execution.

---

## Pre-Existing Issues to Ignore During Post-Implementation Review

| Issue | Location | Reason to Ignore |
|-------|----------|------------------|
| `ESLintPoorConcurrencyWarning` | lint-service output | Node.js runtime warning about ESLint concurrency, not an actual lint finding. Present in baseline. |
| `[process-lock]` log lines | tsgo / biome / lint output | Informational messages from the project's process-locking wrapper (`scripts/lib/run-locked-cmd.ts`). Not errors. Present in all baseline captures. |

---

## Summary

All three quality gates (tsgo, biome, lint) are at **zero errors/warnings** at baseline. The working tree is clean with no uncommitted changes and no stashes. This provides a clean reference point against which post-implementation regressions can be measured.

| Gate | Baseline |
|------|----------|
| tsgo errors | 0 |
| biome warnings | 0 |
| lint (exit code) | 0 (success) |
| uncommitted files | 0 |
| stashes | 0 |
