# TB.2 Outcome — Unpay-to-soft-delete journey test

- **Date**: 2026-09-07
- **Status**: ✅ Complete

## What was built

`test/workflows/expenses/carryover-unpay-expense-softdelete.test.ts` — the Plan-6
journey for US-3 (AC-3.5–AC-3.7), US-6 (AC-6.1–AC-6.6), E3, E4, E5. Real services +
real DB, no `runInRollback`, committed `beforeAll` fixtures + tracked `afterAll` hard
delete, new domain folder `test/workflows/expenses/` with its own `DIAGRAMS.md`.

Harness: shared payroll cast (`provisionPayrollJourneyCast`, operator = academy_admin →
holds both carryover-manage and expenses-manage), plus per-run extras in the test file:
a view-only auditor (custom group binding exactly `ACCOUNTING_EXPENSES_VIEW`, honest
membership rows) and a `staff_default` actor. All notifications intercepted via
`spyOn(NotificationDispatchHelpers, "dispatchWithPreferences")`.

## Journey steps (8/8 pass)

1. Operator aggregates two CALCULATED sessions → one unpaid carryover (120.00 §2 =
   240.00 SAR).
2. Operator creates a manual MARKETING bystander expense; view-only auditor reads it
   via default `getReport`; exactly one EXPENSE_CREATE audit row.
3. `bulkCarryoverToExpense` settles the carryover → provenance-linked Salaries expense
   (`sourceEntity = carryover_balances`), visible in the auditor's default ledger view.
4. Direct `ExpenseService.softDelete` on the paid-carryover-linked row rejects
   `EXPENSE_DELETE_VIA_UNPAY` (`deleteViaUnpay` message); row untouched, zero delete
   audit rows.
5. `bulkDelete([manual, protected])` rejects with the same code and rolls back
   atomically — bystander row still live, zero EXPENSE_DELETE audit rows for either.
6. `unpayCarryoverBalance` reverts the carryover and soft-deletes the expense
   atomically (`deletedAt`/`deletedByUserId`/note reason all set); the default ledger
   view hides the row while `includeDeleted: true` returns it with its deletion
   marker; exactly one EXPENSE_DELETE audit row with `metadata.reason` = unpay note.
7. Denial paths: re-unpay rejects `carryover.notPaid` (deletedAt byte-identical —
   idempotent); viewer denied unpay + `softDelete`; staff denied unpay + `bulkDelete`;
   teacher denied `getReport` — all ForbiddenError via real group memberships; manual
   bystander still alive.
8. Zero notification dispatches; settled-expense audit trail is exactly
   [EXPENSE_CREATE, EXPENSE_DELETE], manual expense exactly [EXPENSE_CREATE], and the
   carryover trail ends with CARRYOVER_UNPAID.

## Files touched

| File | Change |
|---|---|
| `test/workflows/expenses/carryover-unpay-expense-softdelete.test.ts` | 🆕 8-step journey |
| `test/workflows/expenses/DIAGRAMS.md` | 🆕 section + sequenceDiagram |

## Verification (all green)

- `bun run test/scripts/run-test.ts test/workflows/expenses/carryover-unpay-expense-softdelete.test.ts`
  — **8 pass, 0 fail**, 81 expect() calls, first run.
- `bun run validate:mermaid test/workflows/expenses/DIAGRAMS.md` — block 1 OK.
- `bun run scripts/health/sub-loop.ts <test file> --lifecycle codescene` — **exit 0**
  (tsgo → oxlint → biome → lint:type-aware → duplicates-skipped-out-of-scope → codescene).
  DIAGRAMS.md: sub-loop N/A for markdown (oxlint has no file types); its gate is
  validate:mermaid (passing).

## Notes / carry-forward

- Full-suite `bun run test:workflows` not run in-isolation here (shared tree; the
  single-file run via run-test is the task's required gate). Cleanup is fully tracked
  (audit rows with trigger lifted, both expense ids, carryover by teacher, the two
  audited instances + events, extras, cast), so suite-order interactions are safe.
- Cross-suite concurrency: assertions use membership-by-id within payment-date /
  title-filtered pages, never absolute totals, so parallel journeys cannot flake it.
