# Task TB.2 Outcome — Journey: carryover to-expense settlement

- **Date**: 2026-09-05
- **Status**: ✅ Complete

## What was implemented

`test/workflows/accounting/carryover-to-expense.journey.test.ts` — a 7-step
cross-actor journey (real services, real committed rows, no `runInRollback`)
asserting the to-expense settlement contract of the carryover module:

| Step | Actor → Call → Assertion |
|---|---|
| 1 | teacher `activate`/`updateStatusStart` → operator `stop` → on-time session CALCULATED 120.00 SAR; CLASS_COMPLETED dispatch intercepted (`waitForEventDispatchToUser`), spy cleared |
| 2 | operator `activateOverride`/`updateStatusAbsent` → second session CALCULATED 120.00 SAR |
| 3 | operator `bulkCreateCarryoverBalances` → one group (same teacher), payable "240.00", both sessions WAITING_PAID + `carryoverBalanceId` set, one `CARRYOVER_CREATE` audit row |
| 4 | operator `bulkCarryoverToExpense` → committed row `isPaid = true`, `paid = "240.00"`, `paymentDate`, `expenseId`, `paidByUserId`; both sessions PAID with the carryover link intact; exactly one `CARRYOVER_TO_EXPENSE` audit row whose metadata carries `expenseId`/`paymentDate`/`expenseDate`/`amount`/`currency`; per-session `PAYROLL_STATUS_TRANSITION` settlement events attributed to the operator; zero notification dispatches |
| 5 | view-only auditor (custom group with exactly `ACCOUNTING_CARRYOVER_VIEW`) reads the paid row via `getReport` and the drill-down via `getLinkedSessions` (`currentStatus PAID`, `originalStatus CALCULATED`, `originalAmount 120.00`); permissionless parent denied `ForbiddenError` |
| 6 | identical re-submit replays the first result byte-for-byte (`toEqual`: same `expenseId`, same `auditLogIds`); audit trail still one create + one conversion row; no new settlement events |
| 7 | second `academy_admin` operator's settle attempt (distinct idempotency key — actor is part of the key) rejected with `CARRYOVER_ALREADY_PAID`; view-only auditor rejected `ForbiddenError` at the permission gate; both denials leave the settled state untouched |

## Expense-stub observability (per 1.7–1.11 outcome)

The Plan 6 expense ledger has not landed; the adapter stub only logs and
returns a reference id. The journey therefore asserts what is actually
observable: the settled carryover columns, the audit rows (the metadata IS
the settlement payload — including `sourceEntity`-equivalent expense
context), and the session statuses. No expense-table assertions exist
anywhere in the file.

## Supporting files

- `test/workflows/helpers/carryover-expense-cast.ts` 🆕 — provisions/cleans up
  the per-run extras layered on the shared payroll cast: a second operator
  (`academy_admin`, honest contention) and a read-only auditor (run-owned
  custom `permissionGroups` row bound to the catalog's
  `accounting.carryover_view` permission; same pattern as the payroll
  permission-denials journey's viewer group).
- `test/workflows/helpers/index.ts` — barrel re-export of the new cast helper.
- `test/workflows/accounting/DIAGRAMS.md` — new
  `carryover-to-expense.journey.test.ts` section with a sequence diagram
  (actor/step names match the real service calls).
- `afterAll` cleanup: deletes this run's `carryover_balances` for the cast
  teacher (items cascade; session links set NULL), then sweeps all actors'
  `audit_logs` rows with the immutability trigger toggled (payroll-journey
  precedent), then the extras, then the shared payroll cast.

## Verification

- `bun run test/scripts/run-test.ts test/workflows/accounting/carryover-to-expense.journey.test.ts`
  → **7 pass, 0 fail, 85 expects** (final run, ~1.9 s). First run had 1
  failure: step 4's zero-dispatch assertion caught step 2's async
  absent-resolution fan-out; fixed by `dispatchSpy.mockClear()` at step 4's
  start.
- `bun run validate:mermaid test/workflows/accounting/DIAGRAMS.md` → all 8
  blocks OK.
- `bun run scripts/health/sub-loop.ts --lifecycle codescene`:
  - `test/workflows/accounting/carryover-to-expense.journey.test.ts` ✅
    (fixed en route: 5 × oxlint `no-await-in-loop` → read loops replaced with
    a `forEachSettlementSession` helper wrapping `Promise.all`)
  - `test/workflows/helpers/carryover-expense-cast.ts` ✅
  - `test/workflows/helpers/index.ts` ✅

## Carry-forward

- TB.3 (unpay journey) can reuse `carryover-expense-cast.ts` verbatim: the
  same second operator + VIEW-only auditor actors cover the unpay denial and
  visibility steps; the settle-path fixture state (steps 1–4) is a ready-made
  precondition for an unpay journey.
- The jscpd cross-file checker does not scan `test/workflows/` (sub-loop
  reported "outside jscpd scan scope") — deliberation about shared assertion
  helpers across journey files is moot at this layer.
- No cross-file dependencies; no git mutations; no edits to
  `trackable-tasks.md`.
