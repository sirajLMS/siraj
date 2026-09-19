# TB.3 Outcome — P&L Expense-Visibility Journey (manager → executive)

**Date:** 2026-09-17
**Plan:** `.ai/plans/profit-loss-dashboard/`
**Status:** Complete — journey green (8 pass / 0 fail), Mermaid diagram validated, sub-loop `--lifecycle codescene` exit 0.

## Summary

Created `test/workflows/accounting/profit-loss-expense-visibility.test.ts`: a cross-actor
journey where the academy operator (manager) records a **manual Marketing expense** through the
real `ExpenseService.create`, and a **carryover settlement** (`CarryoverBalanceService.bulkCreateCarryoverBalances` →
`bulkCarryoverToExpense` over a teacher-driven CALCULATED session) auto-generates a provenance-linked
**Salaries expense**. The executive — holding `ACCOUNTING_PROFITS_VIEW` through a real
`academy_admin` membership — sees **both** rows in `ProfitLossService.getReport`'s `expensesPage`
for the `expenseDate` month (and neither in the previous month); the carryover row carries its
source linkage (`sourceEntity = 'carryover_balances'`, `sourceEntityId = carryoverId`). Soft-deleting
the manual expense via `ExpenseService.softDelete` removes it from the tab while the settled salary
stays and Total Expenses / Net Profit recompute. A ledger VIEW-only actor (run-owned custom group
with exactly `ACCOUNTING_EXPENSES_VIEW`, no profits permission) is denied at the permission gate
with `ForbiddenError` before any data is read.

## Steps mapped to the task assertions

| Step | Coverage |
|---|---|
| 1 | Teacher drives `activate`/`updateStatusStart`, operator `stop` → session COMPLETED + payroll CALCULATED at SAR 120.00; `CLASS_COMPLETED` dispatch drained through the spy, then `mockClear` |
| 2 | Tier-1 write: manual expense via the real `ExpenseService.create` (MARKETING 75.00 SAR, `expenseDate =` journey month, unique `clientRequestId`); baseline `totalExpenses` captured first; ledger write dispatches nothing |
| 3 | Carryover aggregate + settle → one Salaries expense with carryover provenance, session PAID+linked; settle dispatches nothing |
| 4 | Executive's `expensesPage` contains both rows (identity FX conversion asserted: `75.00`/`120.00`), salary row carries source linkage + teacher name; `rowCountByType` ≥ 1 for both types; `Total Expenses ≥ baseline + 195.00` (concurrency-safe); `Net Profit === Total Payments − Total Expenses` |
| 5 | Neither expense surfaces in the previous month |
| 6 | Tier-4 denial: `ACCOUNTING_EXPENSES_VIEW`-only actor → `ForbiddenError` + `tErrors.insufficientPermissions` before any read |
| 7 | `softDelete` stamps `deletedAt`/`deletedByUserId`; row drops from the tab, settled salary remains; `Total Expenses` drops by the deleted amount; Net Profit identity holds |
| 8 | Report read path dispatches zero notifications (`dispatchWithPreferences` spy at 0 after a fresh read) |

## Conventions honored

- **No `runInRollback`** — committed fixtures in `beforeAll` (payroll cast + expense-viewer extras +
  executive user), tracked hard delete in `afterAll` (expenses → carryover → audit-log sweep under the
  immutability trigger, then viewer extras / executive / payroll cast), per `test/workflows/AGENTS.md`.
- UUID-prefixed run (`jrn_plex_<8ch>`) in every free-text field.
- Real permission resolution only (`assignSystemGroup` / run-owned custom group) — no permission
  monkey-patching.
- `dispatchWithPreferences` spied via namespace import; `waitForEventDispatchToUser` drains the
  asynchronous completion fan-out; `expectJourneyError` (no `.rejects.toThrow()`).
- Fixtures via `provisionPayrollJourneyCast` / `provisionExpenseViewerExtras` / `createTestUser` —
  no demo/seed rows touched.

## Files changed

- `test/workflows/accounting/profit-loss-expense-visibility.test.ts` — created (8 steps)
- `test/workflows/accounting/DIAGRAMS.md` — added the `profit-loss-expense-visibility.test.ts`
  sequence-diagram section
- `.ai/plans/profit-loss-dashboard/trackable-tasks.md` — TB.3 checkbox marked `[x]`

## Verification

- `bun run test/scripts/run-test.ts test/workflows/accounting/profit-loss-expense-visibility.test.ts`
  → **8 pass / 0 fail / 60 expect() calls**
- `bun run scripts/health/sub-loop.ts test/workflows/accounting/profit-loss-expense-visibility.test.ts --lifecycle codescene`
  → exit 0 (tsgo → oxlint → biome → lint:type-aware → duplicates [out of jscpd scope] → codescene)
- `bun run validate:mermaid test/workflows/accounting/DIAGRAMS.md` → all 12 blocks `OK`
- `bun run test:workflows` (locked full suite) → **185 pass / 2 fail / 26 files; this journey is among
  the passes.** The 2 failures are pre-existing/in-flight in the unrelated
  `test/workflows/whatsapp/conversations.test.ts` (Meta 24h-window + `listConversations`
  assertions) — another agent's in-flight work in this shared tree, outside TB.3 scope.

## Deferred items / cross-file dependencies

None. No production code was changed; TB.3 is test-only.
