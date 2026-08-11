# Phase 6 Baseline — Captured 2026-08-11

## jscpd Baseline (bun check:duplicates)

| Metric | Value |
|--------|-------|
| Total clones | 504 |
| tsx clones | 430 |
| ts clones | 74 |
| Total duplicated tokens | 68,194 |
| tsx duplicated tokens | 59,973 |
| ts duplicated tokens | 8,221 |
| Files analyzed | 3,131 |
| Total lines | 322,004 |
| Total tokens | 1,693,086 |

## P3 Scope (from prior jscpd parse)

| Category | Pairs | Tokens |
|----------|-------|--------|
| D↔M triplication residuals | 70 | 5,791 |
| C↔C intra-layer | 31 | 2,527 |
| C↔D cross-tier | 12 | 1,001 |
| C↔M cross-tier | 11 | 887 |
| D↔D same-tier | 7 | 567 |
| M↔M same-tier | 4 | 317 |
| **Total P3** | **135** | **11,090** |
| shared/locale structural | 16 | 1,604 |
| **Grand Total** | **151** | **12,694** |

## Notes

- 504 clones (not 505 as in plan) — jscpd count may fluctuate by ±1 between runs due to file hashing order
- Baseline tsgo/biome not captured in this run — will be recorded during implementation Task 0.1
- 3 pre-existing tsgo errors in `scripts/health/sub-loop-uncommitted.ts` are NOT Phase 6 files
