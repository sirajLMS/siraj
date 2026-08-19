# Phase 0: Pre-Implementation Baseline

## Baseline Captured

| Check | Result |
|-------|--------|
| **tsgo** | 2 errors (both in `backend/lib/newrelic-agent.ts` — pre-existing from Phase 1 creation, fixed in Phase 2) |
| **biome** | ✅ Clean (0 warnings; auto-fixed 3 files) |
| **lint** | 8 errors across 3 files (pre-existing: `newrelic.cjs:10` no-undef, `test/scripts/run-server-tests.ts:579` cognitive-complexity, `test/ui/e2e/student_portal.test.ts` 6× assertions-in-tests) |

## Pre-Existing Issues to Ignore During Post-Implementation Review

1. `newrelic.cjs:10:1` — `no-undef` (`'exports' is not defined`) — `.cjs` files use CommonJS `exports` which ESLint doesn't recognize. This is expected and not a real error.
2. `test/scripts/run-server-tests.ts:579:16` — `sonarjs/cognitive-complexity` (16 > 15) — pre-existing, not related to this plan.
3. `test/ui/e2e/student_portal.test.ts` — 6× `sonarjs/assertions-in-tests` — pre-existing, not related to this plan.

## Files Modified Before Implementation

- `package.json` — New Relic dependencies added (Phase 1)
- `newrelic.cjs` — Created (Phase 1)
- `backend/lib/newrelic-agent.ts` — Created (Phase 2, tsgo errors being fixed)

## Notes

- The 2 tsgo errors in `newrelic-agent.ts` were caused by accessing `newrelic.agent` which is not in `@types/newrelic`. Fixed by adding an intersection type `NewRelicModule` with the `agent` property.
- The lint errors are all pre-existing or from `.cjs` file (not linted by project config).
- Biome auto-fixed 3 files during baseline capture (formatting only).
