# Phase 0 Baseline — Outcome

**Date:** 2026-08-11
**Captured by:** autopilot session 3a59ddac

## Baseline Metrics (before any Phase 4 implementation)

| Metric | Value | Status |
|--------|-------|--------|
| `bun tsgo` | exit 0, zero type errors | ✅ Clean |
| `bun check:duplicates` | **528 clones**, 12,315 dup lines (3.82%), 72,387 dup tokens (4.27%) | Baseline |
| Total files scanned | 3,118 | — |
| Total lines | 322,276 | — |
| Total tokens | 1,695,384 | — |

## Scope (36 in-scope pairs out of 528)

| Category | Pairs | Action |
|----------|-------|--------|
| backend↔backend | 25 | Service extraction, repo factory extension, GraphQL helpers |
| shared↔backend enums | 3 | Delete `backend/enum/shared/*`, repoint to `@/shared/constants/*` |
| app↔app | 3 | Page route helpers in `__shared__/` |
| scripts↔scripts | 4 | Shared log/duplicate-tracker helpers in `scripts/health/__shared__/` |
| codegen.ts self-clone | 1 | Restructure repeated schema-array blocks |

## Out-of-Scope (492 pairs)

- 470 frontend↔frontend — deferred to future phase
- 6 frontend↔shared (locale-related) — structural, deferred
- 16 shared↔shared (locale intra-namespace) — structural, deferred

## Goal

Reduce 528 → ≤450 clones (≥15% reduction) without touching frontend or running any server tests.
Stretch goal: ≤400 clones.

## Artifacts

- `/tmp/phase4-baseline-tsgo.txt` — full tsgo output
- `/tmp/phase4-baseline-jscpd.txt` — full jscpd output
