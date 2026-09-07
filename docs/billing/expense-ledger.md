# Expense Ledger

This document is the canonical reference for the Expense Ledger module — the
single table that holds **all outgoing money**: auto-generated `Salaries`
payouts written by the carryover settlement flow
([carryover-balances](./carryover-balances.md)) plus manually entered
operational expenses (`Marketing`, `Logistics`, `Technology`). The module
shipped with a permission-gated CRUD UI at `/accounting/expenses`, a
server-derived idempotent create, atomic bulk soft-delete, an RFC-4180 CSV
export route, and a cross-transaction settlement seam (`createInternal` /
`softDelete`) consumed by the carryover module inside its own transaction.

Plan: `.ai/plans/expense-ledger/` (Plan 6; sibling billing refs:
`docs/billing/carryover-balances.md`, `docs/billing/credit-adjustments.md`,
`docs/billing/credit-hours-system.md`).

## Architecture Overview

```
ExpensesDataGrid / ExpenseFilterBar / dialogs / drawer (expenseFilterStore + useExpensesViewModel)
  → useQuery(expensesQueryDocument) / useMutation(create|update|delete|bulkDeleteExpenseMutationDocument)
    → Pothos query/billing + mutation/billing fields (authScopes permission + requireAuth)
      → ExpenseService (permission re-check → advisory lock → replay pre-check
         → FOR UPDATE row locks → guards → writes → audit rows)
        → ExpenseRepository / CarryoverBalanceRepository / TeacherRepository / AuditRepository
          → expenses + carryover_balances (+ users join for createdByName)

CSV: browser fetch("/api/expenses/export?...") → route → getServerUserContext
  → requirePermission(ACCOUNTING_EXPENSES_VIEW) → ExpenseService.getReport (limit 10 000)
  → RFC-4180 CSV (+formula-injection neutralization) with X-Export-Truncated header
```

| Layer | File(s) |
|---|---|
| Permissions | `ACCOUNTING_EXPENSES_VIEW` / `ACCOUNTING_EXPENSES_MANAGE` in `backend/enum/permissions/permission.enum.ts`; grants via custom SQL migration `backend/db/migration/44-accounting-expenses-permissions.sql` (`super_admin` + `academy_admin`) |
| Schema | `backend/db/schema/expenses/expenses.ts`; pg enum `expenseTypeEnum` in `backend/db/schema/enums.ts`; relations in `backend/db/drizzleRelations.ts` (`teacher`, `createdByUser`, `deletedByUser`) |
| Migrations | `backend/db/migration/45-expenses-table.sql` — custom SQL (NOT `drizzle-kit generate`, to keep a sibling in-flight schema out of the migration): guarded `CREATE TYPE expense_type`, `CREATE TABLE IF NOT EXISTS`, DO-guarded CHECK + FK constraints, 9 `CREATE INDEX IF NOT EXISTS`; fully idempotent, applied to both dev and test DBs |
| Enums / constants | `ExpenseType` canonical in `shared/constants/expenses/expense-type.enum.ts` (`Salaries`/`Marketing`/`Logistics`/`Technology`); `backend/enum/expenses/expense-type.enum.ts` is a re-export shim (CurrencyCode convention). `EXPENSE_SOURCE_CARRYOVER_BALANCES = "carryover_balances"` lives in `shared/constants/expenses/` and is imported (never re-declared) by both services |
| Types | `backend/types/billing/expense.types.ts` — Select/Insert/patch (`ExpenseUpdatePatch` omits id/createdAt/createdByUserId/provenance), inputs (`CreateExpenseInput`, `UpdateExpenseInput`, `DeleteExpenseInput`, `BulkDeleteExpensesInput`, `SoftDeleteExpenseInput` with optional caller `tx`, `ExpenseFilters`), results (`DeleteExpenseResult`, `BulkDeleteExpensesResult`), `ExpenseRow`, `ExpensePage` |
| Repository | `backend/db/repo/expenses/expense.repository.ts` — `findFiltered` (ILIKE title with wildcard escaping, `type IN (...)`, `expenseDate =`, payment-date range, `deletedAt IS NULL` default, `users` join for `createdByName` — row query AND count query join identically), `getById`, `getByIdForUpdate` (FOR UPDATE), `create`, `update`, `softDelete`; all writes accept the caller's `tx` |
| Service | `backend/services/expenses/expense.service.ts` + `expense-idempotency.ts` + `expense-helpers.ts` |
| GraphQL | `backend/graphql/pothos/expenses/expense.pothos.ts` (enum registered in `pothos/shared/enum.pothos.ts`); `backend/graphql/query/billing/expense.query.ts`; `backend/graphql/mutation/billing/expense.mutation.ts` |
| CSV route | `app/api/expenses/export/route.ts` |
| Frontend documents | `frontend/common/graphql/sharedDocuments/billing/expense.documents.ts` (6 operations + `ExpenseFields` fragment, all 19 `Expense` fields with `id` first) |
| Store | `frontend/common/stores/expenseFilterStore.ts` (flat non-persisted; fields mirror `ExpenseFilter` 1:1; `EXPENSE_PAGE_SIZE_OPTIONS`) |
| Views | `frontend/common/views/dashboard/accounting/expenses/` (ExpensesContainer, `useExpensesViewModel`, ExpensesDataGrid, ExpenseFilterBar, ExpenseTypeChip/ExpenseSourceChip, ExpenseFormDialog + form ViewModel, DeleteExpenseDialog/BulkDeleteExpensesDialog + `useExpenseConfirmAction`, ExpenseDetailDrawer); tier views `frontend/desktop|mobile/views/dashboard/accounting/expenses/` |
| Routes (App Router) | `app/(dashboard)/accounting/expenses/page.tsx` + `[id]/page.tsx`, both behind `withPageAuth([ACCOUNTING_EXPENSES_VIEW])`; the drawer deep-link mirrors the carryover `[id]` convention |
| Nav | `frontend/common/views/dashboard/config/navigationConfig.ts` — `accounting-expenses` under `grp_finance` (`receiptLong` icon), gated on `ACCOUNTING_EXPENSES_VIEW`; label key `accountingExpenses` in `dashboard.core.nav` |
| i18n | `dashboard.accounting.expenses` namespace (EN/AR, CLDR plurals; 70 keys per locale) + server-side `errors.expenses` leaf (14 keys, EN/AR) |
| Audit | `AuditEntityType.EXPENSE` + `EXPENSE_CREATE` / `EXPENSE_UPDATE` / `EXPENSE_DELETE` in `backend/types/audit/audit.types.ts` |
| Tests | Repo: `backend/db/test/repo/expenses/expense.repository.test.ts`, migration: `backend/db/test/migrations/expenses-table.test.ts`. Service: co-located suites in `backend/services/expenses/` (service 55, internal cross-tx 5, idempotency 10, helpers 33). GraphQL: `expense.query.test.ts` (16) / `expense.mutation.test.ts` (29, in-process real-schema harness). Route: `app/api/expenses/export/route.test.ts` (24). Journeys: `test/workflows/expenses/carryover-pay-to-expense-ledger.test.ts` (7), `carryover-unpay-expense-softdelete.test.ts` (8), `expense-crud-audit-attribution.test.ts` (9). UI suites co-located in the expenses views dir + E2E `test/ui/e2e/accounting/expenses.test.ts` (both **authored but never executed** — deferred item D5) |

## Schema — `expenses`

18 columns, 9 indexes, 3 FKs:

- `id` (uuid PK), `teacherId` (nullable, FK → teachers `ON DELETE SET NULL`),
  `teacherName` (varchar 200 — creation-time snapshot; survives teacher
  rename/deactivation, never cascades, never auto-refreshes).
- `title` (varchar 200, NOT NULL), `type` (`expense_type` enum, NOT NULL).
- `expenseValue` / `expenseCurrency` — money is stored as **text** (exact
  decimal, no float drift — same call as carryover's `payable`); write paths
  canonicalize to two decimals (`canonicalizeExpenseValue`).
- `paymentDate` (text, ISO `YYYY-MM-DD` — the real-world payout date),
  `expenseDate` (varchar(7), the accounting month `YYYY-MM`; PG-only CHECK
  `expenses_expense_date_format_chk`, shape only — SQLite has no regex engine).
- `note` (text, sanitized plain text), `sourceEntity` (varchar 64) +
  `sourceEntityId` (uuid) — provenance: `null` for manual rows,
  `'carryover_balances'` for settlement rows. Written once at insert; never
  patched (the patch type omits them).
- `createdByUserId` (NOT NULL, FK → users), soft-delete triple
  `deletedAt` / `deletedByUserId` / `deletedReason` (varchar 500),
  `createdAt` / `updatedAt`.
- Indexes: per-column indexes on `teacher_id`, `type`, `payment_date`,
  `expense_date`, `source_entity`, `source_entity_id`, `created_by_user_id`,
  `deleted_at`, plus composite `expenses_type_expense_date_idx` for the most
  common filter (type + accounting month).

### Known issue — D6: NOT NULL + `ON DELETE SET NULL` contradiction

All three FKs (`teacher_id`, `created_by_user_id`, `deleted_by_user_id`) are
declared `onDelete: "set null"`, but `created_by_user_id` is NOT NULL: deleting
a user who authored expenses fails with PG 23502 (`teacher_id` and
`deleted_by_user_id` are nullable, so only the creator FK is affected). The
schema contradiction is **open and unresolved** (deferred-items D6 ❌,
re-flagged by backend review R1 finding 10): decide — relax the NOT NULL or
drop the set-null action. Until then, never hard-delete users/teachers that own
expense rows (journey-test cleanup must delete expense rows FIRST — see the
workflow outcomes). Historical note: drizzle snapshots do NOT contain the table
(migration 45 shipped as custom SQL); the next `drizzle-kit generate` will
re-emit it — `ensureIdempotentMigrations` rewrites it to idempotent form.

## Service surface (`ExpenseService`)

Signature surface (all return `ExpenseRow` unless noted):

```ts
create(input: CreateExpenseInput, actorUserId: string, tErrors: ErrorsLabels)
createInternal(input: CreateExpenseInput, tx: DBTransaction, tErrors: ErrorsLabels)
update(input: UpdateExpenseInput, tErrors: ErrorsLabels)
softDelete(input: SoftDeleteExpenseInput, tErrors: ErrorsLabels) // { id, actorUserId, reason?, tx? }
bulkDelete(input: BulkDeleteExpensesInput, tErrors): Promise<BulkDeleteExpensesResult>
getById(actorUserId: string, id: string, tErrors: ErrorsLabels)
getReport(actorUserId: string, filters: ExpenseFilters, pagination: { limit; offset }, tErrors): Promise<ExpensePage>
```

- **Permissions**: `create`/`update`/`bulkDelete` require
  `ACCOUNTING_EXPENSES_MANAGE`; `getById`/`getReport` require
  `ACCOUNTING_EXPENSES_VIEW`. Reads/writes are **double-gated**: Pothos
  `authScopes` AND the service `requirePermission`. `actorUserId` is always
  server-derived (`requireAuth(ctx)`), never accepted as input; the persisted
  `createdByUserId` is forced to the actor on create.
- **`Salaries` is settlement-only**: public `create` rejects
  `type = Salaries` with `EXPENSE_SALARIES_VIA_CARRYOVER_ONLY`;
  `update` rejects both directions (re-typing INTO `Salaries` and changing
  type/value OUT of a Salaries row — `EXPENSE_SALARIES_VIA_CARRYOVER_ONLY` /
  `EXPENSE_TYPE_IMMUTABLE_FOR_SALARIES` / `EXPENSE_VALUE_IMMUTABLE_FOR_SALARIES`
  after canonicalized comparison).
- **Soft-delete, never hard delete** (rows remain for audit + P&L
  reporting): sets `deletedAt` / `deletedByUserId` / sanitized `deletedReason`.
  Re-deleting an already-deleted row is a **successful no-op** returning the
  current row (no second write, no second audit row). `update` on a deleted row
  rejects with `EXPENSE_ALREADY_DELETED`.
- **`bulkDelete` atomicity**: one tx, `softDeleteInTx` per id (deduped),
  any guard rejection rolls the whole batch back — no partial deletes.
- **Reads**: `getReport` aggregates are **page-derived**
  (`totalValue` minor-unit bigint math, `dominantCurrency` page mode, fallback
  `SAR`, `rowCountByType` zero-initialized for all four types); `totalCount`
  covers the whole filtered set. Whole-ledger totals need a dedicated
  `ExpenseRepository.findFiltered` call — do not read page aggregates as
  global totals. `getById` deliberately serves soft-deleted rows (audit
  trail). Malformed ids are shape-checked to `EXPENSE_NOT_FOUND` (never a raw
  driver error); dangling `teacherId` fails on shape + existence
  (`TEACHER_NOT_FOUND`, on both create and update).
- **Audit**: one `audit_logs` row per mutation in the same tx —
  `EXPENSE_CREATE` (idempotency key + snapshot), `EXPENSE_UPDATE`
  (`previousValues` via `pickChanged` + applied patch), `EXPENSE_DELETE`
  (sanitized reason). Structured `logger.info` on every mutation and
  `logger.error` before `EXPENSE_CREATE_FAILED`.

### `createInternal` contract (settlement seam — Plan 5 / `bulkCarryoverToExpense`)

```ts
// inside the caller's transaction:
const row = await ExpenseService.createInternal(
  { teacherId, teacherName, title, type: ExpenseType.SALARIES,
    expenseValue: carryover.payable, expenseCurrency: carryover.teacherCurrency,
    paymentDate, expenseDate, note,
    sourceEntity: EXPENSE_SOURCE_CARRYOVER_BALANCES, sourceEntityId: carryover.id,
    createdByUserId: actorUserId, clientRequestId /* per-carryover */ },
  tx, tErrors,
);
carryover.expenseId = row.id; // back-reference on the carryover row
```

- Uses the caller's `tx` — never opens a nested transaction, so the expense
  insert and the carryover payment commit or roll back **atomically**.
- **No permission check** — the caller already verified
  `ACCOUNTING_CARRYOVER_MANAGE`; `createInternal` is never exposed via GraphQL.
- **No advisory lock inside the caller tx** (callee-with-caller-tx rule):
  the settlement batch is already serialized by its own
  `carryover-to-expense:<key>` lock, and the per-carryover `clientRequestId`
  gives it replay protection.
- Emits its own `EXPENSE_CREATE` audit row into the caller tx (in addition to
  the carryover `CARRYOVER_TO_EXPENSE` row). A failure throws a typed
  `DomainError`; the caller wraps it as `CARRYOVER_TO_EXPENSE_FAILED` and the
  outer tx rolls back.

### `softDelete` contract (Plan 5 unpay / UI delete)

```ts
// unpayCarryoverBalance, inside its tx (after the carryover is unpaid):
await ExpenseService.softDelete(
  { id: carryover.expenseId, actorUserId, reason, tx }, tErrors,
);
```

- With a caller `tx` the permission check is skipped (caller owns it); without
  one it requires `ACCOUNTING_EXPENSES_MANAGE` and opens its own transaction.
- Idempotent: a second soft-delete of the same row returns the current row
  with no second write/audit — safe to re-apply from retrying settlements.
- A missing row throws `EXPENSE_NOT_FOUND` — the unpay flow deliberately
  **tolerates and swallows** this (references minted before the ledger
  existed).

## Idempotency design

- **Key** (`deriveCreateIdempotencyKey` in `expense-idempotency.ts`): sha256 of
  scope + actor + `clientRequestId` + the identifying payload (title, type,
  value, currency, paymentDate, expenseDate, teacherId, provenance). The
  **note is excluded** (non-identifying); `null`/`undefined` collapse to an
  empty segment.
- **Lock-then-replay** (credit-adjustments precedent): the tx-owning `create`
  acquires `expense-create:<key>` via `acquireAdvisoryLock` BEFORE the replay
  scan — concurrent duplicate bursts serialize onto one row + one audit entry.
  `createInternal` takes no lock (caller-tx rule; settlement supplies its own
  batch lock + per-carryover key).
- **Replay window**: `AuditRepository.queryAuditLogs` (`action =
  EXPENSE_CREATE`, actor-scoped, 60-second window, recursive pages of 500
  capped at 10 pages) matches `metadata.idempotencyKey`; the newest match wins
  and the reply **re-reads the live expense row** (never a stale snapshot).
  Missing audit row or vanished row falls through to a fresh insert. No
  `clientRequestId` → no replay lookup (deliberate repeats persist as separate
  rows). Spec note: the plan's E1 says 30 s; the code uses 60 s — the constant
  is the behavior that shipped.

## Cross-plan carryover settlement interplay (lock ordering)

- **Settle** (`bulkCarryoverToExpense`, Plan 5): locks the carryovers, rejects
  already-paid, calls `createInternal` per carryover in the same tx with
  provenance, stores `carryover_balances.expenseId`, sessions → `PAID`, one
  `CARRYOVER_TO_EXPENSE` audit row; ledger failures roll the whole batch back.
- **Unpay** (`unpayCarryoverBalance`, Plan 5): locks the carryover first,
  flips `isPaid` to false and nulls the payment fields, THEN calls
  `ExpenseService.softDelete(..., { tx })` in the same tx; sessions go back to
  `WAITING_PAID`. Unpaid-first ordering makes the ledger's own settlement
  guard admit the settlement's delete.
- **Settlement-protection guard** (`softDeleteInTx`): an expense whose
  `sourceEntity = 'carryover_balances'` and whose linked carryover (locked in
  the same tx) is still paid rejects a soft-delete with
  `EXPENSE_DELETE_VIA_UNPAY` — the operator is directed to the carryover Unpay
  flow instead. Unpaid carryovers delete normally.
- **Canonical row-lock order: carryover BEFORE expense** (R1 finding 5 fix).
  `softDeleteInTx` pre-reads the expense row non-locking (provenance is
  write-once, so this is safe), locks the linked carryover via
  `CarryoverBalanceRepository.getByIdsForUpdate`, and only then takes the
  expense `FOR UPDATE` lock before re-verifying existence/`deletedAt`. The
  unpay path uses the same order. Without it, a concurrent UI delete + unpay
  of the same pair deadlocks (PG 40P01).

## CSV export contract (`GET /api/expenses/export`)

- **Auth before any read**: 401 unauthenticated → 403 without
  `ACCOUNTING_EXPENSES_VIEW`.
- **Query params** (exact names — the UI must use these): `title` (≤200
  chars), `types` (comma-separated enum **display values**
  `Salaries,Marketing,Logistics,Technology` — not the codegen enum keys),
  `expenseDate` (strict `YYYY-MM`, month 01–12 enforced), `paymentDateFrom` /
  `paymentDateTo` (real calendar dates), `includeDeleted`. Malformed values →
  400. **`includeDeleted: true` is honored only for
  `ACCOUNTING_EXPENSES_MANAGE` holders / super-admins** — silently stripped to
  `false` otherwise (same rule as the GraphQL query; both entry points
  re-gate the privileged flag).
- **Report**: `ExpenseService.getReport` with `EXPORT_ROW_LIMIT = 10 000`;
  `X-Export-Truncated: true` when `totalCount > 10 000` (the UI surfaces a
  warning toast from this header).
- **Body**: UTF-8 CSV, CRLF, one row per expense, **19 columns in
  `ExpenseRow` declaration order (`id` first … `updatedAt` last)** — the
  header contract is pinned by tests; adding a column means updating the E2E
  `CSV_HEADER_COLUMNS`. RFC-4180 quoting + formula-injection neutralization
  (`=`, `+`, `-`, `@`, tab, CR get a `'` prefix); Arabic/RTL bytes pass
  through unchanged.
- **Headers**: `Content-Type: text/csv; charset=utf-8`,
  `Content-Disposition: attachment; filename="expenses-<YYYY-MM-DD>.csv"`.
- The serializer is inlined in the route (4th per-domain copy of the
  parse/serialize scaffolding after carryover/payroll/session-audit);
  extracting a shared CSV helper remains a follow-up — do it **before** a
  fifth route adds another copy.

## Error codes

| Code | Thrown when |
|---|---|
| `EXPENSE_SALARIES_VIA_CARRYOVER_ONLY` | `create` with `type: Salaries`; `update` re-typing a non-Salaries row INTO `Salaries` |
| `EXPENSE_TYPE_IMMUTABLE_FOR_SALARIES` / `EXPENSE_VALUE_IMMUTABLE_FOR_SALARIES` | patching type/value on an existing `Salaries` row |
| `EXPENSE_NOT_FOUND` | unknown id, **malformed/non-uuid id** (shape-check folding — never a raw driver error), repo returning null mid-write |
| `EXPENSE_ALREADY_DELETED` | `update` on a soft-deleted row (delete itself is an idempotent no-op) |
| `EXPENSE_DELETE_VIA_UNPAY` | soft-delete of an expense whose linked carryover is still paid — use the carryover Unpay flow |
| `EXPENSE_DATE_INVALID` | `expenseDate` not `YYYY-MM` or month outside 01–12 |
| `PAYMENT_DATE_INVALID` | `paymentDate` not a valid ISO `YYYY-MM-DD` calendar date |
| `EXPENSE_CREATE_FAILED` | insert driver failure (`logger.error` fires first) |
| `TEACHER_NOT_FOUND` | dangling/malformed `teacherId` on create or update |
| `ValidationError` (`errors.expenses.*`) | title/value/currency field validation |
| GraphQL guards | `INSUFFICIENT_PERMISSIONS` from authScopes + `requirePermission`; empty `ids` rejected in the resolver (`invalidInput`); `>500` ids rejected by the `@constraint` plugin (`maxItems: 500`) |

All user-facing messages come from the compile-time `errors.expenses` leaf
(14 keys, EN + AR); domain codes propagate via `extensions.code`.

## Frontend essentials

- **Grid**: `ExpensesDataGrid` — type chip (semantic status color pairs),
  source chip (`Manual` static / `From Carryover` → router push to
  `/accounting/carryover/<sourceEntityId>`, which opens the carryover detail
  drawer), teacher `PersonProfileLinkCell`, struck-through soft-deleted rows
  (only surfaced with `includeDeleted`), row menu (Edit / Delete /
  View Source — manage-gated except View Source), toolbar (Add New / Bulk
  Delete manage-gated, Export CSV for every viewer).
- **Filters**: `ExpenseFilterBar` — 300 ms debounced title search **at the bar
  only** (the ViewModel reads the settled store value — a doubled debounce was
  removed), type multi-select, `YYYY-MM` month picker, payment-date range,
  include-deleted toggle visible to all (server re-gates).
- **Form dialog** (`ExpenseFormDialog`): one `clientRequestId` per dialog open
  + submit-token guard; the `Salaries` option renders disabled with a hint
  (never submittable from the UI); editing a `Salaries` row locks type + value
  and **omits them from the patch**; update sends `teacherId` AND
  `teacherName` together so the snapshot follows the id; `expenses` root-field
  cache evict + `gc()` after save/bulk success (aggregates depend on all
  rows).
- **Delete dialogs**: single delete shows a restated `summary(title, value,
  currency)` + optional reason (≤500 chars, `deletedReason` column ceiling); an
  `EXPENSE_DELETE_VIA_UNPAY` rejection keeps the dialog open with a
  non-dismissible `role="alert"` banner and disables confirm. Bulk delete is
  one mutation per open; an atomic batch rejection toasts the server-localized
  reason with nothing deleted.
- **Aggregates**: footer totals come from the page aggregates
  (`totalValue` + `dominantCurrency`, `EXPENSE_TYPE_EXPORT_VALUE` maps codegen
  enum keys → display values only for the export query string).

## Known follow-ups (deferred-items ledger)

- **D4 ❌** staging migration rehearsal for 44/45 — external dependency.
- **D5 🔄** UI component suites + the E2E spec are authored but never executed
  (wave policy); first real runs may need fixture adjustments (the E2E
  outcome carries a carry-forward list: 19-column header pinned, masked-date
  locale formats, FX-rate precondition on the carryover leg).
- **D6 ❌** schema contradiction — see Schema section.
- **D7 ❌** expense detail drawer ships without an audit-log timeline: no
  entity-scoped audit GraphQL query exists yet.
- Optional hardening not done: tighten the `expense_date` PG CHECK to month
  01–12 (validation is server-side only today); idempotency window wording
  (spec 30 s vs code 60 s) — the 60 s constant is the shipped behavior.
