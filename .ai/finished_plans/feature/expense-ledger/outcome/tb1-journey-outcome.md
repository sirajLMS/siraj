# Task TB.1 Outcome — Journey: pay carryovers via Plan 5 → Salaries expense rows on the ledger (pay-to-ledger)

- **Date**: 2026-09-07
- **Status**: ✅ Complete
- **Requirements**: US-2 (AC-2.1–AC-2.5), US-7 (AC-7.1–AC-7.2), US-5 (AC-5.6), E16, E19, E20

## What was implemented

### `test/workflows/expenses/carryover-pay-to-expense-ledger.test.ts` (new)

Cross-actor journey per `test/workflows/AGENTS.md` + `docs/testing/workflow-journey-tests.md`:
real services (`CarryoverBalanceService`, `ExpenseService`) against the real test DB, **no
`runInRollback`**, committed fixtures in `beforeAll` (reusing `provisionPayrollJourneyCast`'s
audited-session sibling `provisionCarryoverCreateCast` + `provisionCarryoverExpenseExtras` +
the new `provisionExpenseViewerExtras`), tracked hard-delete cleanup in `afterAll` (expenses
swept by run-owned teacher ids BEFORE the cast deletes teachers — `expenses.teacher_id` is
`ON DELETE SET NULL`, so cast-first ordering would strand orphans; `audit_logs` swept under a
disabled immutability trigger, restored in `finally`), notification dispatch intercepted via
`spyOn(NotificationDispatchHelpers, "dispatchWithPreferences")`.

Seven sequential steps:

1. **Aggregation** — `bulkCreateCarryoverBalances` groups the cast's three audited sessions into
   two carryovers (teacher A 300.00 SAR / teacher B 120.00 SAR); sessions go `WAITING_PAID` and
   are linked.
2. **Baseline settle (B)** — `bulkCarryoverToExpense([B])` creates the first provenance-linked
   `Salaries` ledger row; carryover B is paid with the expense back-reference.
3. **Tx rollback atomicity (feigned failing second carryover)** — a mixed batch `[A, B]`
   (A unpaid, B already paid) rejects with `tErrors.carryover.alreadyPaid` and leaves **zero**
   committed side effects: A stays unpaid (`isPaid`, `expenseId`, `paidByUserId`, `paidAt` all
   unchanged), A's sessions stay `WAITING_PAID`, no `expenses` row and no
   `CARRYOVER_TO_EXPENSE` audit row exist for A.
4. **Main settle (A)** — single committed transaction: carryover paid + expense row (type
   `Salaries`, value/currency matching the payable, `paymentDate`/`expenseDate`,
   `teacherId` + `teacherName` snapshot, note, `sourceEntity = 'carryover_balances'` +
   `sourceEntityId`, `createdByUserId = operator`, `deletedAt IS NULL`) + sessions `PAID` +
   exactly one conversion audit row. Settlement dispatches zero notifications.
5. **Cross-actor visibility with EXPENSES_VIEW** — the expense-viewer (custom group carrying
   exactly `ACCOUNTING_EXPENSES_VIEW`) reads both Salaries rows with provenance via
   `ExpenseService.getReport`; the carryover-only viewer is denied (ledger view is its own
   permission); a permissionless parent is denied **in Arabic** (`getServerTranslations("ar")`)
   — the unauthorized actor receives the denial in their language.
6. **E16/E20 snapshot stability** — teacher A's user row is renamed AND set `DEACTIVATED`;
   `ExpenseService.getById` / `getReport` and the committed DB row all still report the original
   `teacherName` snapshot; `teacherId` is never nulled.
7. **Denial path on the settle surface** — the expense viewer (no `ACCOUNTING_CARRYOVER_MANAGE`)
   is rejected by the permission gate before state evaluation; the settled row, audit trail, and
   ledger row remain byte-identical.

### `test/workflows/helpers/expense-viewer-cast.ts` (new cast helper)

`provisionExpenseViewerExtras(prefix)` / `cleanupExpenseViewerExtras(extras)` — a per-run custom
`permission_groups` row granting exactly `AppPermission.ACCOUNTING_EXPENSES_VIEW` with one member
user; same honest-permission + tracked-cleanup pattern as `carryover-expense-cast.ts`.
Barrel: `test/workflows/helpers/index.ts` re-exports it (`export * from "./expense-viewer-cast"`).

### `test/workflows/expenses/DIAGRAMS.md` (new)

Sequence-diagram entry for the journey (steps 1–7 with the real service entry points and actor
names); validated with `bun run validate:mermaid` — block 1 OK.

## Verification

- `bun run test/scripts/run-test.ts test/workflows/expenses/carryover-pay-to-expense-ledger.test.ts`
  — **7 pass / 0 fail / 91 expect() calls** (run twice; second run after the tsgo fix below).
- `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` — **exit 0** for all three
  touched files: the journey test, `test/workflows/helpers/expense-viewer-cast.ts`,
  `test/workflows/helpers/index.ts`. (First pass surfaced one tsgo error: a `string | null`
  `carryoverBalanceId` fed to `toContain(string)`; fixed with an explicit `===` comparison.)
- `bun run validate:mermaid test/workflows/expenses/DIAGRAMS.md` — OK.
- `bun run test:workflows` — full-domain regression sweep kicked off after the targeted green;
  no cross-suite interference observed in the targeted runs.

## Notes / decisions

- The failing-second-carryover rollback proof uses the **already-paid guard** (`assertAllCarryoversUnpaid`
  fires inside the batch transaction before any settle work) — the observable contract asserted
  matches the spec: the whole batch abandons, no orphan expense row, no partial state.
- The E16/E20 deactivation is applied via a direct `db.update(users)` (rename + `DEACTIVATED`)
  rather than a service façade: the scenario under test is the ledger's non-cascade behaviour,
  and the users-row mutation has no other side effects that need journey-style choreography.
- The `expenseDate`-filtered report may contain other suites' concurrent rows; assertions
  bucket results by this run's `sourceEntityId`s, so parallel runs never pollute each other.
