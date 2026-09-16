# Deferred Item D4 — Expense-Adapter Stub → Real `ExpenseService` Swap

- **Date**: 2026-09-06
- **Status**: ✅ Complete (deferred-items.md D4 marked ✅ Done)

## What was done

The module-private expense-adapter stub (`ExpenseCreateCommand` /
`createExpenseRecord` / `softDeleteExpenseRecord`, which minted `randomUUID`
references and only `logger.warn`ed) in
`backend/services/teachers/carryover-balance.service.ts` is replaced by calls
to the real `ExpenseService`, imported from the `@/backend/services` barrel
(plus `EXPENSE_SOURCE_CARRYOVER_BALANCES` and `ExpenseType.SALARIES`, replacing
the local `EXPENSE_TYPE_SALARIES` constant). The `randomUUID` import is gone.

### Settle (`bulkCarryoverToExpense` → `requestExpenseRecord`)

- Calls `ExpenseService.createInternal({ teacherId, teacherName, title, type:
  ExpenseType.SALARIES, expenseValue: carryover.payable, expenseCurrency:
  carryover.teacherCurrency, paymentDate, expenseDate, note, sourceEntity:
  EXPENSE_SOURCE_CARRYOVER_BALANCES, sourceEntityId: carryover.id,
  createdByUserId: actorUserId, clientRequestId }, tx, tErrors)` inside the
  settlement transaction.
- `clientRequestId = "carryover-to-expense:<bulkIdempotencyKey>:<carryoverId>"`
  — reuses the bulk settle key as the seed, composed per carryover, so a
  same-window retry of one conversion replays the originally persisted expense
  row instead of minting a duplicate.
- Any ledger failure is wrapped in `DomainError("CARRYOVER_TO_EXPENSE_FAILED", …,
  { cause })` exactly like the stub path, so the whole batch rolls back.
- `requestExpenseRecord` now takes the caller's `tx` (signature change within
  the module; the public service surface is unchanged).

### Unpay (`unpayCarryoverBalance` → `softDeleteSettledExpense`)

- **Order flip (required by the ledger's settlement-protection guard):** the
  carryover is marked unpaid FIRST (captured `expenseId` kept for the delete,
  audit metadata, and return), then `ExpenseService.softDelete({ id,
  actorUserId, reason: note, tx }, tErrors)` runs in the same tx. With the old
  order the ledger's `assertNotSettlementProtected` would reject the delete
  with `EXPENSE_DELETE_VIA_UNPAY` because the linked carryover was still paid.
- **E17 tolerance:** `DomainError` code `EXPENSE_NOT_FOUND` from the ledger
  (reference whose row never materialized, e.g. stub-era references, or a row
  pruned independently) is caught and the revert continues. Any other ledger
  failure propagates and rolls the revert back. Already-soft-deleted rows are
  no-op'd by the ledger itself (idempotent soft-delete) with no carryover-side
  handling.
- Audit metadata shape is unchanged: `CARRYOVER_TO_EXPENSE` /
  `CARRYOVER_UNPAID` rows still carry `expenseId` (and `reason: note` on
  unpay). The ledger layers its own `EXPENSE_CREATE` / `EXPENSE_DELETE` rows
  under entity type `EXPENSE` in the same transaction.

### Tests

- `carryover-to-expense.service.test.ts` — mocks `@/backend/services` barrel
  with a capturing `createInternal` fake; asserts the full payload per
  carryover (`type: Salaries`, payable/currency, dates, provenance,
  `createdByUserId`, tx-sentinel wiring, per-carryover `clientRequestId`),
  that `item.expenseId` equals the ledger id, replay never re-creates, and the
  failure injection now throws from `createInternal` (still wraps into
  `CARRYOVER_TO_EXPENSE_FAILED` with the error as `cause`).
- `carryover-crud.service.test.ts` — mocks `ExpenseService.softDelete`;
  asserts the unpay issues exactly one soft-delete with
  `{ id, actorUserId, reason, tx }`, tolerates `EXPENSE_NOT_FOUND`
  (revert completes; audit keeps the removed reference), propagates any other
  ledger failure, and skips the call when the paid row carries no reference.
- `carryover-balance.service.test.ts` (bulk-create) — barrel stubbed
  defensively so the real services barrel never loads in the mocked suite.
- Journey `carryover-to-expense` — docstring updated (ledger is live); step 4
  asserts the committed `expenses` row (id, `Salaries`, value/currency,
  `paymentDate`, `expenseDate`, teacher, provenance, actor, `deletedAt null`);
  step 6 asserts the idempotent replay grew no ledger row; afterAll hard-
  deletes the expense rows.
- Journey `carryover-unpay` — step 2 asserts the real expense row after
  settle (incl. `expenseDate` derived from the payment date); step 3 asserts
  the row is soft-deleted (`deletedAt` set, `deletedByUserId` = operator,
  `deletedReason` = the unpay note) with exactly one `EXPENSE_DELETE` audit
  row; step 4 asserts the denied re-unpay leaves `deletedAt` byte-identical
  and the delete-audit count at one (idempotent-twice); afterAll deletes the
  expense rows. `DIAGRAMS.md` untouched — the flow did not change.
- `test/workflows/helpers/carryover-delete-cast.ts` — the delete journey
  settles teacher B's carryover, so its cleanup now deletes run-scoped
  `expenses` rows (by cast teacher ids) INSIDE the purge transaction, before
  the carryover rows and before the users/teachers. Required because
  `expenses.created_by_user_id` is `NOT NULL` while its FK declares
  `onDelete: set null` — deleting a user with a surviving expense row raises
  23502 (surfaced on the first post-swap run; orphan rows from that run were
  swept from the test DB).

## Schema tension worth a fix in the expense-ledger plan

`expenses.created_by_user_id`, `deleted_by_user_id`, and `teacher_id` declare
`onDelete: "set null"` but the columns are non-nullable; any user/teacher
deletion that reaches surviving expense rows fails with 23502. Carryover
journeys now pre-delete their expense rows before the cast teardown, but the
column/FK mismatch itself lives in `backend/db/schema/expenses.ts` (Plan 6
surface) and should either drop `set null` or make the columns nullable.

## Files touched

| File | Change |
|---|---|
| `backend/services/teachers/carryover-balance.service.ts` | Stub removed; real `ExpenseService` wired in (settle + unpay, unpay order flipped, E17 catch) |
| `backend/services/teachers/carryover-to-expense.service.test.ts` | Barrel mock + payload/replay/failure assertions |
| `backend/services/teachers/carryover-crud.service.test.ts` | Barrel mock + unpay soft-delete/E17/propagation assertions |
| `backend/services/teachers/carryover-balance.service.test.ts` | Defensive barrel stub |
| `test/workflows/accounting/carryover-to-expense.journey.test.ts` | Real expense-row assertions + replay no-growth + cleanup |
| `test/workflows/accounting/carryover-unpay.journey.test.ts` | Settle/unpay expense assertions + idempotent-twice + cleanup |
| `test/workflows/helpers/carryover-delete-cast.ts` | Expense sweep added to the delete-cast cleanup |
| `docs/billing/carryover-balances.md` | Stub note replaced with the real-integration description |
| `.ai/plans/carryover-balance-module/deferred-items.md` | D4 → ✅ Done |

## Test results (`bun run test/scripts/run-test.ts`, all green)

- Service tests: `carryover-to-expense` 14, `carryover-crud` 55,
  `carryover-balance` (bulk-create) 21, `carryover-aggregate` 30,
  `carryover-idempotency` 34.
- Journeys: `carryover-to-expense` 7, `carryover-unpay` 5,
  `carryover-bulk-create` 7, `carryover-delete` 12.
- Expense module: `expense.service` 31, `expense-internal` 5,
  `expense-idempotency` 8, `expense-helpers` 24.
- Payroll regression: `payroll-calculation` 52, `payroll-override` 40,
  `payroll-override.idempotency` 23, `teacher-due-payroll-integration` 15,
  `payroll-grace-settings` 13, `scheduling-payroll-trigger` 20, plus GraphQL
  surface `payroll.mutation` 15 / `payroll.query` 9 / `carryover.mutation` 40 /
  `carryover.query` 24.

## Verification (sub-loop `--lifecycle codescene`, exit 0)

`carryover-balance.service.ts`, `carryover-to-expense.service.test.ts`,
`carryover-crud.service.test.ts`, `carryover-balance.service.test.ts`,
both journey files, `carryover-delete-cast.ts` — all tsgo → oxlint → biome →
lint → duplicates → codescene green. No error keys changed, so
`bun run locale:snapshots` was not needed. No UI/E2E runs, no git mutations.
