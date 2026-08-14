# Phase 5 Baseline Capture

**Date:** 2026-08-11
**Captured by:** Task 0.1

## Metrics

| Metric | Value |
|--------|-------|
| Total clones | **505** (430 tsx + 75 typescript) |
| Total duplicated tokens | **68,279** (59,973 tsx + 8,306 ts) |
| Total duplicated lines | **11,504** (10,029 tsx + 1,475 ts) |
| Files analyzed | 3,131 (1,401 tsx + 1,730 ts) |
| tsgo | ❌ **3 errors** — all in `scripts/health/sub-loop-uncommitted.ts` (pre-existing, NOT Phase 5 files) |
| biome:check | ⚠️ **1 warning** (54 files auto-fixed) |

## Baseline Files

| File | Contents |
|------|----------|
| `/tmp/phase5-baseline-tsgo.txt` | tsgo output (3 errors in sub-loop-uncommitted.ts — pre-existing) |
| `/tmp/phase5-baseline-jscpd.txt` | jscpd output (505 clones) |
| `/tmp/phase5-baseline-biome.txt` | biome output (1 warning, 54 auto-fixed) |

## Notes

- Clone count dropped from 522 (initial analysis) to **505** — Phase 4 implementation (other session) has been making progress on backend/shared/app/scripts pairs.
- The 3 tsgo errors are in `scripts/health/sub-loop-uncommitted.ts` — a script file, NOT a frontend file. These are pre-existing and not caused by Phase 5 work. They should be tracked as a pre-existing condition.
- The biome auto-fix of 54 files is safe — biome only applies safe formatting fixes.

## Target

| Metric | Baseline | Target | Required Reduction |
|--------|----------|--------|--------------------|
| Total clones | 505 | ≤300 | ≥205 (40.6%) |
| Frontend clone pairs (estimated) | ~450 of 505 | ≤170 | ≥280 (62.2%) |
