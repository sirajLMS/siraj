# FIX-TSGO-REGRESSION Outcome — carryoverBalanceId fixture repair

- **Date**: 2026-09-05
- **Status**: ✅ Complete — all 7 Group-A errors from `2.6-codegen-outcome.md` eliminated; every edited file passes sub-loop `--lifecycle codescene` and its full test suite.

## Change

Added `carryoverBalanceId: null,` to the full-row `ClassInstanceSelectType` fixture literal in each file, inserted between `payrollCalculatedBy` and `remarks` to match the schema column order in `backend/db/schema/classes/scheduling.ts:237`:

- `backend/services/notification/test/class-reminder.service.test.ts:84` (literal `mockInstance1`; `mockInstance2` spreads it)
- `backend/services/teacher/payroll-calculation.service.test.ts:93` (`buildInstanceRow` return literal, before `...overrides`)
- `backend/services/teacher/payroll-override.service.test.ts:86` (`buildInstanceRow` return literal; `buildSettledRow` routes through it)
- `backend/services/teacher/teacher-due-payroll-integration.test.ts:69` (`BASE_INSTANCE` satisfies literal — one edit fixes both error lines 75 and 78, since `buildClassInstance` spreads `BASE_INSTANCE`)
- `backend/services/teacher/teacher-due.service.test.ts:69` (same pattern as above)

No other edits were made to the five files; pre-existing content was preserved verbatim.

## Verification

Per-file: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` → exit 0 for all 5 files (tsgo → oxlint → biome → lint → duplicates → codescene all green).

Tests (`bun run test/scripts/run-test.ts <file>`):

- class-reminder.service.test.ts — 6 pass, 0 fail
- payroll-calculation.service.test.ts — 52 pass, 0 fail
- payroll-override.service.test.ts — 40 pass, 0 fail
- teacher-due-payroll-integration.test.ts — 15 pass, 0 fail
- teacher-due.service.test.ts — 12 pass, 0 fail

Project-wide `bun tsgo`: the 7 Group-A fixture errors are gone.

## Remaining tsgo errors (not owned by this task)

8 errors remain, none from this plan:

1. **2 sibling baseline errors** (left untouched per assignment): `test/ui/components/classes/classDetailsAdminView.test.tsx:55`, `test/ui/components/fixtures/classDetailsFixtures.tsx:20` — session-event-audit plan's documents work.
2. **6 errors in WhatsApp communication code under active edit by another concurrent agent**: `MetaCloudApiAdapter.ts:222` (`senderKey`), `WhatsappChannelFactory.ts:45`, `pair-rate-limit.test.ts:188/220/279`, `pair-rate-limit.integration.test.ts:70`. The error set for these files shifted between consecutive tsgo runs during this task (4 → 6 errors), confirming mid-flight refactor. NOT touched by this agent.

## Carry-forward notes

- The strict "baseline of 2 errors" acceptance is unattainable while the WhatsApp `senderKey` refactor is in flight in the shared tree; once that sibling work settles, the carryover-attributable error count is 0.
- `backend/services/teachers/carryover-crud.service.test.ts` (sibling carryover test file) already includes the field and was not touched.
