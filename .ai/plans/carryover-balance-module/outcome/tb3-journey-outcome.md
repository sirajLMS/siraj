# Task TB.3 Outcome — Carryover Unpay Journey Test

- **Date**: 2026-09-05
- **Status**: ✅ Complete

## What was implemented

`test/workflows/accounting/carryover-unpay.journey.test.ts` — a 5-step cross-actor
journey (bun:test, real services + real DB, NO `runInRollback`, committed
fixtures in `beforeAll` with tracked hard delete in `afterAll`):

| Step | Actor → action | Assertions |
|---|---|---|
| 1 | operator (`academy_admin`) → `bulkCreateCarryoverBalances` over two committed CALCULATED sessions | One group (payable `"240.00"` SAR = 2 × 120.00), sessions `WAITING_PAID` + `carryoverBalanceId` set, carryover row unpaid with `paid "0"`, view-only viewer sees the row + linked sessions (`originalStatus` snapshot `CALCULATED`), one `CARRYOVER_CREATE` audit row attributed to the operator |
| 2 | operator → `bulkCarryoverToExpense` (payment date fixed, cross-session currency intact — same currency, no FX fetch) | `isPaid`, `paid`, `paymentDate`, `expenseId`, `paidByUserId`, `paidAt` on the committed row; sessions `PAID`; viewer follows on the paid surface; `CARRYOVER_TO_EXPENSE` audit row appended |
| 3 | operator → `unpayCarryoverBalance` with note | Return value AND committed row reverted: `isPaid false`, `paid "0"`, `paymentDate/expenseId/paidAt/paidByUserId` all null; sessions `PAID → WAITING_PAID`, still linked; **expense soft-delete tolerance** (E17-stub: the persisted expense reference never materialized a ledger row — the service-no-ops adapter completes the revert); viewer sees the row back on the unpaid surface; `CARRYOVER_UNPAID` audit row metadata carries `{ expenseId, reason: note }`; full append-only trail CREATE/TO_EXPENSE/UNPAID survives (AC-8.4-style preservation) |
| 4 | denials | Re-unpay on the already-unpaid carryover → `tErrors.carryover.notPaid`; view-only operator + staff actor (`staff_default`, no grants) → `ForbiddenError` + `insufficientPermissions` through real group memberships; teacher denied even the scoped `getReport` read; post-denial state untouched |
| 5 | side-effect integrity | `dispatchWithPreferences` spy (namespace `spyOn`, installed before provisioning) saw **zero** calls across the whole journey; exactly 3 audit rows for the entity — no denial mirrored anything |

### Harness choices

- **Fixtures**: reuses the shared payroll cast (`provisionPayrollJourneyCast`)
  and layers two committed `createMockClassInstance` sessions pre-set to
  `executionState COMPLETED` / `outcome TAKEN` / `calculationStatus CALCULATED`
  with `teacherPaidAmount "120.00"` SAR + `calculatedDuration 60` (satisfies the
  state-machine + partial-percentage CHECK constraints; the carryover service
  never re-computes payroll). The journey's own sessions/events are deleted in
  `afterAll` before the cast cleanup removes the teacher (carryover RESTRICT FK).
- **View-only viewer**: custom per-run permission group carrying exactly
  `ACCOUNTING_CARRYOVER_VIEW` (no system group holds VIEW without MANAGE) —
  same pattern as `payroll-permission-denials.test.ts`.
- **Audit sweep**: `prevent_audit_log_mod_trigger` disabled/enabled around the
  `afterAll` delete of this run's actor-attributed `audit_logs` rows (payroll
  settlement journey precedent).
- Errors asserted via `expectJourneyError` + translated substrings; spied
  dispatch restored in `afterAll`.

## Diagram

`test/workflows/accounting/DIAGRAMS.md` — new `carryover-unpay.journey.test.ts`
sequenceDiagram section appended. `bun run validate:mermaid` → all 10 blocks OK.

## Test results

- `bun run test/scripts/run-test.ts test/workflows/accounting/carryover-unpay.journey.test.ts`
  → **5 pass, 0 fail, 85 expects** (final run after all edits).

## Sub-loop results (`scripts/health/sub-loop.ts <file> --lifecycle codescene`)

| File | Runs | Result |
|---|---|---|
| `test/workflows/accounting/carryover-unpay.journey.test.ts` | 4 | ✅ exit 0. Run 1: tsgo TS6133 ×2 (unused `createCastSubjectPair` import, unused entity-type constant — both removed). Run 2: oxlint 12 warnings — `no-await-in-loop` ×4 (parallelized via `Promise.all` + read loops) and mutating `Array#sort` ×8 (moved to `toSorted`, then…). Run 3: lint:type-aware `sonarjs/no-alphabetical-sort` ×8 (extracted module-scope `sortStrings` helper with `localeCompare` comparator). Run 4: all six stages green (duplicates skipped — test files outside jscpd scope). |

`DIAGRAMS.md` is a markdown doc — outside sub-loop scope; validated with `validate:mermaid`.

## Files touched

- `test/workflows/accounting/carryover-unpay.journey.test.ts` — new (only test file).
- `test/workflows/accounting/DIAGRAMS.md` — appended one journey section.

No production code, no barrels, no shared fixtures changed. `trackable-tasks.md`
untouched (orchestrator-owned). No git mutations.

## Carry-forward knowledge

- **Sibling journeys TB.1 (bulk-create) / TB.2 (to-expense)**: this file's
  `provisionCarryoverUnpayFixture` pattern (payroll cast + two committed
  CALCULATED `createMockClassInstance` sessions + per-run VIEW-only custom
  group) is directly reusable — consider extracting a
  `test/workflows/helpers/carryover-cast.ts` scaffold if a third journey needs
  it (two copies so far, one per journey; TB.4 delete journey likely wants it too).
- `CarryoverBalanceService` dispatches **no** notifications on any path —
  the journey pins that with a zero-call spy assertion.
- Unpay update patch writes `paid: "0"` (single zero, not `"0.00"`) — assertion
  pins the actual persisted value.
- `CarryoverRow` report rows serialize `paidAt` as ISO string; the raw
  `carryoverBalances` select keeps `Date | null` — assert on the committed row
  when checking `paidByUserId` (not on the service-returned `CarryoverRow`,
  which drops `paidByUserId`).

## Cross-file dependencies

None. All changes are inside the two assigned files; the shared helpers
(`provisionPayrollJourneyCast`, `expectJourneyError`, dispatch spy) already
exported everything needed from `@/test/workflows/helpers`.
