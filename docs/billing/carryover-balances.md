# Carryover Balance Module

This document is the canonical reference for the Carryover Balance module — the
accounting surface that settles teacher pay for sessions that were audited but
never disbursed through payroll ("carryover balances"). An operator aggregates
audited class instances into one carryover per teacher, converts unpaid
carryovers into expense records, and can unpay or delete (with full session-state
restore). The module shipped with server-derived idempotency, DataLoader-batched
list counts, a permission-gated CSV export, and a four-tier test battery plus
journey tests.

Plan: `.ai/plans/carryover-balance-module/` (produced by the
`.ai/plans/teacher-payroll-engine` lineage; sibling billing refs:
`docs/services/teacher-payroll.md`, `docs/billing/credit-adjustments.md`).

## Architecture Overview

```
CarryoverDataGrid / FilterBar / dialogs / drawer (Zustand filter store + ViewModel)
  → useQuery(carryoverBalancesQueryDocument) / useMutation(*MutationDocument)
    → Pothos query/mutation fields (authScopes permission + requireAuth)
      → CarryoverBalanceService (permission re-check → advisory lock → replay pre-check
         → FOR UPDATE row locks → guards → writes → events + audit rows)
        → CarryoverBalanceRepository / SchedulingRepository / TeacherRepository
          → carryover_balances + carryover_balance_items + class_instances.carryover_balance_id

CSV: browser fetch("/api/carryover/export?...") → route → getServerUserContext
  → requirePermission(ACCOUNTING_CARRYOVER_VIEW) → CarryoverBalanceService.getReport
  → RFC-4180 CSV (+formula-injection neutralization) with X-Export-Truncated header
```

| Layer | File(s) |
|---|---|
| Permissions | `ACCOUNTING_CARRYOVER_VIEW` / `ACCOUNTING_CARRYOVER_MANAGE` in `backend/enum/permissions/permission.enum.ts`; grants via custom SQL migration `backend/db/migration/40-accounting-carryover-permissions.sql` (bundled by `applyCustomMigrations`) |
| Schema | `backend/db/schema/teachers/carryover-balances.ts` (`carryover_balances` 20 cols, `carryover_balance_items` 10 cols); nullable FK `backend/db/schema/classes/scheduling.ts` → `class_instances.carryover_balance_id`; relations in `backend/db/drizzleRelations.ts` |
| Shared constants | `shared/constants/billing/carryover.enum.ts` — `CARRYOVER_PAID_STATUS_VALUES` tuple + derived `CarryoverPaidStatus` type (single source for the `"Paid" \| "Unpaid" \| "Both"` closed set) |
| Types | `backend/types/billing/carryover-balance.types.ts` — Select/Insert types, inputs (`BulkCreateCarryoverInput`, `BulkToExpenseInput`, `CreateCarryoverInput`, `UpdateCarryoverInput`, `UnpayCarryoverInput`, `DeleteCarryoverInput`, `BulkDeleteCarryoverInput`), results, `CarryoverFilters`, `CarryoverRow`, `CarryoverPage`, `CarryoverPaidRowCounts`, repo projection types (`CarryoverBalanceListRow`, `CarryoverBalanceUpdatePatch`, `FindLinkedSessionsOptions`, `CarryoverLinkedSessionRow`) |
| Repositories | `backend/db/repo/teachers/carryover-balance.repository.ts` (`CarryoverBalanceRepository`); `backend/db/repo/scheduling/class-instances.ts` "Carryover linking" section (`getByIdsForUpdate`, `findByCarryoverId`, `linkToCarryover`, `unlinkFromCarryover` via `SchedulingRepository`); `TeacherRepository.isDisabled` |
| Service | `backend/services/teachers/carryover-balance.service.ts` (`CarryoverBalanceService`, 10 public methods); helpers `carryover-idempotency.ts` (sha256 key derivers), `carryover-aggregate.ts` (grouping, dominant currency, duration, date bounds, truncation) |
| GraphQL | `backend/graphql/pothos/teachers/carryover.pothos.ts` (+ `__shared__/carryoverFieldHelpers.ts`); `backend/graphql/query/teachers/carryover.query.ts`; `backend/graphql/mutation/teachers/carryover.mutation.ts` |
| CSV route | `app/api/carryover/export/route.ts` |
| Frontend documents | `frontend/common/graphql/sharedDocuments/teachers/carryover.documents.ts` (9 operations + `carryoverBalanceLinkedSessionsQueryDocument`, shared `CarryoverBalanceFields` fragment) |
| Store | `frontend/common/stores/carryoverFilterStore.ts` (filters + page-local selection + selected `teacherOption`) |
| Views | `frontend/common/views/dashboard/accounting/carryover/` (Container, `useCarryoverViewModel`, `useCarryoverExport`, DataGrid, FilterBar, chips, form dialog, bulk-to-expense modal, delete/unpay/bulk-delete dialogs, confirm scaffold, detail drawer + `LinkedSessionsSection`); tier views `frontend/desktop/views/dashboard/accounting/carryover/carryover.desktop.tsx` and `frontend/mobile/.../carryover.mobile.tsx` |
| Routes (App Router) | `app/(dashboard)/accounting/carryover/page.tsx` (+ `[id]/page.tsx` deep-link drawer), both behind `withPageAuth([ACCOUNTING_CARRYOVER_VIEW])` |
| i18n | `dashboard.accounting.carryover` namespace (`shared/locale/{types,en,ar}/dashboard/accounting/carryover.ts` + `carryover.namespace.ts`); service errors in `errors.carryover.*`; nav label `accountingCarryover` in `dashboard.core.nav` |
| Audit | `AuditAction` `CARRYOVER_CREATE` / `CARRYOVER_TO_EXPENSE` / `CARRYOVER_UNPAID` / `CARRYOVER_DELETE` (+ generic `"UPDATE"`), entity type `CARRYOVER_BALANCE` in `backend/types/audit/audit.types.ts` |
| Tests | Repo/migration: `backend/db/test/repo/teachers/carryover.repository.test.ts`, `backend/db/test/repo/scheduling/class-instances-carryover.repository.test.ts`, `backend/db/test/migrations/carryover-tables.test.ts`. Service: three co-located mock-module suites in `backend/services/teachers/` + two pure-helper suites. GraphQL: `carryover.query.test.ts` / `carryover.mutation.test.ts` (in-process real-schema harness). Route: `app/api/carryover/export/route.test.ts`. UI component suites co-located in the carryover views dir; E2E `test/ui/e2e/accounting/carryover.test.ts`. Journeys: `test/workflows/accounting/carryover-{bulk-create,to-expense,unpay,delete}.journey.test.ts` |

## Schema Tables

### `carryover_balances`

- 20 columns: `id` (uuid PK via `uuidColumn`), `teacherId` (NOT NULL, FK teachers
  RESTRICT), `studentsCount` (nullable int), `studentsText` (varchar 500),
  `totalDuration` (text, decimal hours string), `payable` / `paid` (text, NOT NULL;
  `paid` defaults `"0"`), `teacherCurrency` (`currencyCodeEnum`), `fromDate` /
  `toDate` / `paymentDate` (TEXT ISO `YYYY-MM-DD`), `isPaid` / `isDisabledTeacher`
  (bool, default false), `expenseId` (uuid, **deliberately no FK** — expense ledger
  is Plan 6), `note`, `createdByUserId` (NOT NULL, FK users SET NULL),
  `paidByUserId` / `paidAt` (nullable), timestamps.
- Indexes incl. `carryover_balances_expense_id_unique_idx` as a real
  `uniqueIndex` (a carryover links to at most one expense; NULLs don't collide in
  either dialect).
- Invariant: a **paid** row is settled (`paid = payable`, `paymentDate`,
  `expenseId`, `paidByUserId` set) and is fully **read-only** — update rejects
  with `CARRYOVER_PAID_CANNOT_EDIT`, delete with `CARRYOVER_PAID_CANNOT_DELETE`;
  correction path is unpay-then-recreate.

### `carryover_balance_items` (link-time snapshots)

Per linked class instance: `carryoverId` (FK cascade), `classInstanceId` (FK
cascade), `originalAmount` / `originalCurrency`, `originalStatus` (varchar —
survives enum evolution), `convertedAmount` / `convertedCurrency` (nullable),
`originalPartialPercentage` (nullable int — see the PARTIALLY gotcha below),
`createdAt`. The snapshot rows (not the `class_instances.carryover_balance_id`
back-reference) are the source of truth for listing and restoring linked
sessions.

### `class_instances.carryover_balance_id`

Nullable FK `SET NULL` + index. Cleared on unlink/delete; the item snapshots
outlive it.

## Service Operations & Idempotency

One namespace, `CarryoverBalanceService`, with ten public methods:

| Method | Permission | Shape |
|---|---|---|
| `bulkCreateCarryoverBalances` | MANAGE | Locks audited sessions `FOR UPDATE`, guards (audited status, not already linked, not soft-deleted), groups per teacher with dominant currency + FX conversion, snapshots items (amount, currency, status, partial %), links sessions → `WAITING_PAID`, one carryover + audit row per teacher |
| `bulkCarryoverToExpense` | MANAGE | Locks carryovers, rejects already-paid, real expense row per carryover via `ExpenseService.createInternal` in the same tx, rows settle (`isPaid`, `paid`, `paymentDate`, `expenseId`, …), sessions → `PAID` |
| `unpayCarryoverBalance` | MANAGE | Locks + reverts: carryover back to unpaid FIRST (payment fields nulled, `paid "0"`) so the ledger's settlement-protection guard admits the delete, then the expense is soft-deleted in the same tx (missing row tolerated), sessions `PAID → WAITING_PAID` (locked first) |
| `createCarryoverBalance` / `updateCarryoverBalance` | MANAGE | Manual CRUD; teacher is immutable (`CARRYOVER_TEACHER_IMMUTABLE` via `Object.hasOwn(input, "teacherId")`); update blocked on paid rows; update writes a full-state `"UPDATE"` audit row |
| `deleteCarryoverBalance` / `bulkDeleteCarryoverBalances` | MANAGE | Rejects paid rows before any write (bulk is atomic); restores each session's `originalStatus` + partial % from item snapshots, unlinks, hard-deletes (items cascade); audit rows for the orphaned id survive |
| `getReport` | VIEW | Filtered page + aggregates (totals in integer minor units, paid/unpaid split, dominant currency; fast path covers page, slow path re-scans when page < total) |
| `getById` | VIEW | Drill-down row |
| `getLinkedSessions` | VIEW | Enriched snapshot rows for the drawer (student/subject joins, original + `currentStatus`) |
| `countLinkedSessionsByCarryoverIds` | (field-internal) | Batch `Map<id, count>` with zero-fill for the `t.loadable` field — reachable only behind a VIEW-gated parent |

Every entry point re-checks `requirePermission(..., VIEW/MANAGE)` — GraphQL
`authScopes` is the first gate, the service is the second.

### Idempotency design (60 s replay window)

Ordering per `docs/IDEMPOTENCY.md` lock-then-replay: **advisory lock → replay
lookup → row locks/guards → writes**, all in one transaction.

- Keys are sha256 over scope-prefixed content, derived in
  `carryover-idempotency.ts`: `carryover-bulk-create` (actor + **sorted**
  instanceIds), `carryover-to-expense` (actor, paymentDate, expenseDate, note,
  **sorted** carryoverIds), `carryover-crud-create` (actor + **full raw
  payload** incl. `clientRequestId`, note, studentsText — a tampered payload on
  a reused token creates a fresh row, it never silently replays). Scope prefixes
  guarantee cross-operation key isolation; list fields are sorted so id
  reordering doesn't change the key.
- Replay lookup: audit rows for (actor, action) in the last 60 s, matched on
  `metadata.idempotencyKey` in memory; the replayed result is **reconstructed
  from audit metadata** (`teacherId`, `instanceIds`, `payable`, …). Corrupt or
  malformed metadata falls through to normal processing instead of emitting a
  fabricated replay.
- Advisory lock keys: `carryover-bulk-create:<hash>`, `carryover-to-expense:<hash>`,
  `carryover-create:<hash>` (note: the CRUD *lock* prefix is `carryover-create`
  while its *idempotency scope* is `carryover-crud-create`).

## GraphQL Surface

- Queries: `carryoverBalances(filter, limit, offset)` (limit 1–200, default 50),
  `carryoverBalance(id)`, `carryoverBalanceLinkedSessions(carryoverId)` — all
  VIEW-scoped. Mutations: `bulkCreateCarryoverBalances`,
  `bulkCarryoverToExpense`, `createCarryoverBalance`, `updateCarryoverBalance`,
  `deleteCarryoverBalance`, `bulkDeleteCarryoverBalances`,
  `unpayCarryoverBalance` — all MANAGE-scoped, and the service re-enforces.
- `actorUserId` is injected from `requireAuth(ctx)` and is never a GraphQL input;
  `DomainError` subclasses propagate `extensions.code` to the client.
- Every carryover object type exposes `id` for Apollo normalization (list rows,
  page, aggregates, result wrappers).
- Bulk-selection list inputs carry `@constraint(maxItems: 500)` (empty arrays are
  rejected by the service). **Caveat**: under the current
  `graphql-constraint-directive@6` + `graphql@17` stack the plugin only
  enforces constraints on **literal** arguments — variable-bound values skip
  validation repo-wide; `minItems` even misfires on every request. The service
  layer remains the real defense.
- `linkedSessionCount: Int` on `CarryoverBalance` is a `t.loadable` DataLoader
  field (one batched load per page). `t.loadable` **cannot return lists**, so
  the drawer's session list is a separate root query
  (`carryoverBalanceLinkedSessions`).

## CSV Export (`GET /api/carryover/export`)

- Auth: `getServerUserContext()` → 401; `requirePermission(_VIEW)` → 403 before
  any read. All query params are strictly validated (calendar-check dates, the
  paid-status closed set shared with the GraphQL guard, `search` ≤ 200 chars,
  non-uuid `teacherId` → 400) with localized errors.
- Serialization: one column per `CarryoverRow` field (19 columns, `id` first),
  RFC 4180 quoting, formula-injection neutralization (`= + - @ \t \r` prefixed
  with `'`), CRLF separators; Arabic/RTL cell round-trips are covered by tests.
- **`X-Export-Truncated` header contract**: `EXPORT_ROW_LIMIT = 10_000`; the
  response carries `X-Export-Truncated: true` when `totalCount > 10_000`. The
  frontend (`useCarryoverExport`) reads the header on a fetch + blob download
  (which keeps `Content-Disposition` and the header visible) and toasts
  `labels.exportTruncated` / `labels.exportFailed`.

## Frontend

- Container composes `useCarryoverViewModel()` + `ResponsiveViewSwitch`; overlay
  state is a single discriminated-union (`form` / `bulk-to-expense` / `delete` /
  `unpay` / `drawer`) living **above** the tier switch so open dialogs survive
  desktop↔mobile swaps.
- The filter store is page-local for selection: page turns and `clearFilters()`
  clear `selectedIds`; bulk success must `clearSelection()` and
  `cache.evict({ fieldName: "carryoverBalances" })` (aggregates live on the list
  query). The selected teacher `PersonOption` is also kept in the store so the
  autocomplete chip survives tier switches.
- Permission split: toolbar/row menus always render, but Edit/Unpay/Delete are
  MANAGE-only; "View Sessions" and Export CSV are VIEW-level reads and stay
  visible to viewers on both tiers.
- Idempotent writes: dialogs mint a fresh `clientRequestIdRef` per open plus a
  re-armable single-write guard (double-click ⇒ one mutation).
- Drawer: detail query + independent `carryoverBalanceLinkedSessions` query,
  both `skip: !open`; linked-session amounts come from item snapshots
  (`originalAmount`), status column shows live `currentStatus`.

## Error Codes (`DomainError.extensions.code`)

`CARRYOVER_SESSION_NOT_AUDITED`, `CARRYOVER_SESSION_ALREADY_LINKED`,
`CARRYOVER_FX_RATE_MISSING`, `CARRYOVER_AMOUNT_INVALID`,
`PAYMENT_DATE_REQUIRED`, `EXPENSE_DATE_INVALID`, `CARRYOVER_ALREADY_PAID`,
`CARRYOVER_NOT_PAID`, `CARRYOVER_PAID_CANNOT_EDIT`,
`CARRYOVER_PAID_CANNOT_DELETE`, `CARRYOVER_TEACHER_IMMUTABLE`,
`CARRYOVER_TO_EXPENSE_FAILED`, `CARRYOVER_SNAPSHOT_INVALID`; not-found rows use
`CARRYOVER_NOT_FOUND` / `TEACHER_NOT_FOUND` / `CLASS_INSTANCE_NOT_FOUND`
(NotFoundError).

## Battle-Tested Patterns & Gotchas

These were found the hard way (reviews, journey tests, sub-loop runs):

1. **PARTIALLY-status transitions must clear/restore `isPartialPercentage`.**
   `class_instances_partial_percentage_chk` binds `is_partial_percentage` to the
   `PARTIALLY` status (`PARTIALLY ⇒ NOT NULL`; otherwise NULL). Any status
   transition off/into PARTIALLY must write `isPartialPercentage: null` or the
   restored value in the same patch — otherwise the CHECK rejects the update.
   Because the live column *must* be cleared on link, the pre-link value is
   snapshotted on `carryover_balance_items.original_partial_percentage` and
   restored on delete. A PARTIALLY snapshot without the stored percentage
   rejects with `CARRYOVER_SNAPSHOT_INVALID`. (Also: REFUND fixtures need
   `teacher_paid_amount = '0'` — exact text compare, `"0.00"` fails.)
2. **Replay-audit-window paging beyond 100 rows.** `findReplayAuditLogs` pages
   the actor+action+60s window through `AuditRepository.queryAuditLogs`
   (dedupe by row id, deterministic `createdAt DESC, id DESC`, stop at `total`,
   defensive page cap). A bulk create emits up to 500 audit rows — the original
   100-row un-paged fetch truncated replays and returned wrong results.
3. **`FOR UPDATE` batch reads must be id-sorted.** Both `getByIdsForUpdate`
   implementations sort the id array (`toSorted(localeCompare)`) before
   `inArray` and `ORDER BY id` in the statement — concurrent bulk operations
   then acquire locks in the same order (deadlock avoidance).
4. **Lock reads must exclude soft-deleted rows.** `getByIdsForUpdate` and
   `findLinkedSessions` filter `isNull(deletedAt)`; without it, a soft-deleted
   session (which keeps its audited statuses) can be aggregated and settled for
   money. The repo's locking helpers require `tx` — a lock outside a
   transaction is meaningless, and `findLinkedSessions` throws if called with
   `{ forUpdate: true }` without one.
5. **Validate uuids before uuid-typed queries.** `t.arg.id()` accepts any
   string; a malformed id against a uuid column makes PG abort with `22P02`
   (→ 500). The service guards every id-accepting entry point with
   `assertUuidId` (→ `*_NOT_FOUND`), and the GraphQL/CSV filter boundaries
   reject malformed `teacherId` with `VALIDATION`/400.
6. **Money as decimal text.** Money/duration columns are `text` columns holding
   decimal strings (SQLite shares the type); all arithmetic is integer
   minor-unit bigint (`toAmountMinorUnits` / `formatAmountMinorUnits`, FX
   half-up on a fixed scale), never float. ISO dates in text columns compare
   lexicographically (inclusive date-range filters work via plain `>=`/`<=`).
7. **Guard ordering: audited-status fires before already-linked.** Once linked,
   a session sits in `WAITING_PAID` (outside the audited set), so re-selecting
   the same ids surfaces `CARRYOVER_SESSION_NOT_AUDITED`, not
   `ALREADY_LINKED`. The already-linked guard is only reachable for rows linked
   while still audited (legacy/migrated data).
8. **Lock the linked sessions before settle/unpay/delete transitions.**
   `markCarryoverPaidAndSettleSessions`, unpay, and the delete revert read them
   via `findLinkedSessions(..., { forUpdate: true })` inside the transaction so
   a concurrent payroll recalculation waits on the row locks instead of being
   clobbered.
9. **Pothos `t.loadable` returns scalars only.** Count fields expose
   `Int` via a batched `Map<id, number>` (zero-filled per requested id); list
   values need their own root query.
10. **Permission grants are custom SQL migrations, not seeds.** New
    `app_permission` enum values + `permissions`/`group_permissions` rows ship as
    an idempotent SQL file under `backend/db/migration/` (`ADD VALUE IF NOT
    EXISTS`, upsert with `is_system` trigger toggle, `ON CONFLICT DO NOTHING`
    grants to `super_admin` + `academy_admin`), bundled into a drizzle folder by
    `applyCustomMigrations()` (also runs inside `bun db migrate`). Seeders must
    never write these tables (`backend/db/seeds/AGENTS.md`).
11. **Real expense ledger integration.** Settlement calls
    `ExpenseService.createInternal(input, tx, tErrors)` (from the
    `@/backend/services` barrel) inside the carryover transaction — one
    `Salaries` row per carryover with `sourceEntity = "carryover_balances"` +
    `sourceEntityId = carryover.id` and a per-carryover `clientRequestId`
    composed from the bulk idempotency key, so the ledger's 60 s replay
    returns the originally persisted expense on a same-window retry. Ledger
    failures are wrapped into `CARRYOVER_TO_EXPENSE_FAILED` so the batch rolls
    back. Unpay marks the carryover unpaid FIRST under its row lock — the
    ledger's `assertNotSettlementProtected` guard rejects soft-deleting an
    expense whose carryover is still paid (`EXPENSE_DELETE_VIA_UNPAY`) — then
    calls `ExpenseService.softDelete({ id, actorUserId, reason, tx })` in the
    same transaction; a missing row (`EXPENSE_NOT_FOUND`, e.g. references
    minted before the ledger existed) is tolerated and the revert completes.
    The ledger layers its own `EXPENSE_CREATE`/`EXPENSE_DELETE` audit rows
    (entity type `EXPENSE`) alongside the carryover trail. Cleanup note: journey
    teardown must delete the settle-write expense rows before the users/
    teachers they reference — `expenses.created_by_user_id` is NOT NULL even
    though its FK is `onDelete: set null`.
12. **Adding a nullable column to a hot table breaks full-row fixtures.**
    `class_instances.carryoverBalanceId` immediately added a required key to the
    Drizzle select type — five sibling test files needed
    `carryoverBalanceId: null` in their `ClassInstanceSelectType` literals.
    Budget the fixture pass when adding columns to widely-fixtured tables.
13. **DB pair discipline.** Migrations must be applied to both `.env` (dev) and
    `.env.test` — `run-test.ts` strips `DATABASE_URL` so tests always hit
    `.env.test`; "column does not exist" test failures are the tell. Also:
    drizzle hashes long FK constraint names in a snapshot-order-dependent way —
    match such FKs in migration tests by constraint *definition*, not name.
14. **Test-harness notes.** Co-located service tests mock the
    `@/backend/db/repo` barrel + an in-memory audit store that mimics
    `queryAuditLogs`'s newest-first order; GraphQL tests use the in-process
    real schema with the shared `Symbol.for("siraj.payrollTest.scalarsRegistered")`
    scalar guard; rollback tx pins one connection, so parallel `Promise.all` repo
    calls share a single pg connection (avoid it inside `runInRollback` — keep
    reads sequential).

## Test Layers

- **Repo** (real DB, `runInRollback`): filter-branch matrix, pagination edges,
  LIKE-wildcard/SQL-injection battery, real `FOR UPDATE` lock contention
  (blocker tx + `statement_timeout` contender; skipped on SQLite), cascade,
  aggregate-support data shape.
- **Service** (mocked barrels, no DB): all ten methods — happy paths, every
  guard rejection, replay determinism and burst concurrency, expired-window
  fallthrough, tampered/forged `clientRequestId`, corrupt-alert-metadata
  tolerance, truncation logging.
- **GraphQL** (in-process real schema + scope-auth plugin, and the real Apollo
  constraint plugin for `@constraint`): result shapes, permission matrices
  (no-permission / logged-out / unrelated-permission / super-admin),
  `actorUserId` injection, `clientRequestId` forwarding, oversized-selection
  rejection via literal args.
- **Route**: 401/403/400/500 branches, header contract, formula-injection and
  RTL cell round-trips.
- **Journeys** (`test/workflows/accounting/`): bulk-create, to-expense, unpay,
  delete — committed fixtures, honest permission groups, zero-notification
  spies, audit-trail preservation on delete, cross-actor visibility. Every
  journey has a sequence diagram in `test/workflows/accounting/DIAGRAMS.md`.

## Known Follow-ups

- Plan 4 (session-event-audit) audit-grid integration — "Carryover Balance" bulk
  action and "Linked" chip — was blocked on the sibling plan landing.
- Plan 6 (expense ledger) landed and the stub is swapped for the real
  `ExpenseService` (see Architecture decision #11); the E2E spec can still gain
  real `/accounting/expenses` page assertions once the ledger UI ships.
- UI component test suites and the E2E spec were authored under a
  written-but-unexecuted policy; first real runs may need fixture/real-dialog
  adjustments (MUI date-picker typing, autocomplete option names, demo dataset).
- Cross-plan clone pairs (CSV export route, list ViewModel, dialog scaffolds) are
  recorded as jscpd follow-ups for a shared export/ViewModel scaffold.
- Frontend layer can adopt `CARRYOVER_PAID_STATUS_VALUES` from
  `@/shared/constants/billing/carryover.enum` in place of its local literal sets.
