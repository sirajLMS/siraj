# Plan 6 — Expense Ledger: Tasks

> Phased task list companion to `specs.md` and `implementation.md`.
> Every code-producing task ends with a quality loop:
>
> ```
> bun run scripts/health/sub-loop.ts <file> --lifecycle codescene
> ```
>
> This runs `tsgo → oxlint → biome:check → lint:type-aware → check:duplicates → codescene --file`,
> short-circuiting at the first failure. Fix and re-run until exit 0 before
> marking a task complete.

---

## Legend

- 🆕 = new file
- ✏️  = edit existing file
- 🧪 = test file
- 🔁  = run a command / quality loop
- 🔗  = cross-plan dependency

---

## Phase 0 — Foundation (enum, permissions, schema, migration)

> Goal: additive data-model changes that unblock every later phase.

### 0.1 Add `ExpenseType` enum
- 🆕 `backend/enum/expenses/expense-type.enum.ts` — define `ExpenseType` enum (`Salaries | Marketing | Logistics | Technology`).
- 🆕 `backend/enum/expenses/index.ts` — re-export.
- ✏️ `backend/enum/index.ts` — re-export `expenses`.
- ✏️ `shared/constants/expenses/expense-type.enum.ts` — mirror enum for client.
- 🔁 `bun run scripts/health/sub-loop.ts backend/enum/expenses/expense-type.enum.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts shared/constants/expenses/expense-type.enum.ts --lifecycle codescene`

### 0.2 Add `ACCOUNTING_EXPENSES_VIEW` + `ACCOUNTING_EXPENSES_MANAGE` permissions
- ✏️ `backend/enum/permissions/permission.enum.ts` — add both new values.
- ✏️ `backend/db/seeds/auth/seed-user-permission-overrides.ts` (or wherever permission-groups are seeded) — grant both to the "Accounting" / "Finance Manager" default group.
- 🧪 `backend/enum/permissions/permission.enum.test.ts` — assert both new values parse via `isAppPermission`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/enum/permissions/permission.enum.ts --lifecycle codescene`

### 0.3 New `expenses` table schema
- 🆕 `backend/db/schema/expenses/expenses.ts` — define `expenses` table per §2.3 (16 columns + 9 indexes including the composite `expenses_type_expense_date_idx`).
- 🆕 `backend/db/schema/expenses/index.ts` — re-export.
- ✏️ `backend/db/schema/index.ts` — re-export `expenses` directory.
- ✏️ `backend/db/schema/enums.ts` — register `expenseTypeEnum = createPgEnumFromEnum("expense_type", ExpenseType)`.
- ✏️ `backend/db/drizzleRelations.ts` — add `expensesRelations` (teacher, createdByUser, deletedByUser).
- 🔁 `bun run scripts/health/sub-loop.ts backend/db/schema/expenses/expenses.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts backend/db/schema/enums.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts backend/db/drizzleRelations.ts --lifecycle codescene`

### 0.4 Generate + apply migration
- 🔁 `bun run db:generate` — produce additive migration: (a) `CREATE TYPE expense_type` (transactional), (b) `CREATE TABLE expenses` (transactional), (c) `CREATE INDEX` statements.
- ✏️ migration file — add CHECK constraint: `expense_date ~ '^\d{4}-\d{2}$'` (regex check) so the YYYY-MM format is enforced at the DB layer.
- 🔁 `bun run db:migrate` against local dev DB.
- 🧪 `backend/db/test/migrations/expenses-table.test.ts` — assert migration is idempotent and additive; existing scheduling / payroll constraints still pass.
- 🔁 `bun run scripts/health/sub-loop.ts <migration-file> --lifecycle codescene`

### 0.5 Phase-0 regression smoke
- 🔁 `bun test backend/db/test/repo/scheduling/scheduling.repository.test.ts`
- 🔁 `bun test backend/services/teachers/payroll-calculation.service.test.ts` 🔗 Plan 3
- 🔁 `bun test backend/services/teachers/carryover-balance.service.test.ts` 🔗 Plan 5 (if landed)
- ✅ Confirm existing flows still pass.

---

## Phase 1 — Service layer

> Goal: `ExpenseService` with `create`, `createInternal`, `update`,
> `softDelete`, `bulkDelete`, `getReport`, `getById` — full
> idempotency, validation, and audit logging.

### 1.1 Types
- 🆕 `backend/types/expenses/expense.types.ts` — `CreateExpenseInput`, `CreateExpenseInternalInput`, `UpdateExpenseInput`, `DeleteExpenseInput`, `BulkDeleteExpensesInput`, `SoftDeleteInput`, `ExpenseFilters`, `ExpenseRow`, `ExpensePage`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/types/expenses/expense.types.ts --lifecycle codescene`

### 1.2 Repository layer
- 🆕 `backend/db/repo/expenses/expense.repository.ts` — `findFiltered(filters, pagination)`, `getById(id, tx)`, `getByIdForUpdate(id, tx)`, `create(input, tx)`, `update(id, patch, tx)`, `softDelete(id, actorUserId, reason, tx)`, `bulkSoftDelete(ids, actorUserId, reason, tx)`.
- 🆕 `backend/db/repo/expenses/index.ts` — re-export.
- ✏️ `backend/db/repo/index.ts` — re-export `expenses` directory.
- 🧪 `backend/db/test/repo/expenses/expense.repository.test.ts` — filter combinations, pagination, aggregate totals, index usage on composite.
- 🔁 `bun run scripts/health/sub-loop.ts backend/db/repo/expenses/expense.repository.ts --lifecycle codescene`

### 1.3 Idempotency helper
- 🆕 `backend/services/expenses/expense-idempotency.ts` — `deriveCreateIdempotencyKey(input)`.
- 🧪 `backend/services/expenses/expense-idempotency.test.ts` — same input → same key; type change → different key.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/expenses/expense-idempotency.ts --lifecycle codescene`

### 1.4 Helpers
- 🆕 `backend/services/expenses/expense-helpers.ts` — `pickChanged(existing, patch)`, `pickDominantCurrency(rows)`, `countBy(rows, keyFn)`, `validateCreateInput(input, tErrors)`, `validateUpdateInput(input, tErrors)`.
- 🧪 `backend/services/expenses/expense-helpers.test.ts` — `pickChanged` only returns actually-changed fields; validation rejects all edge cases.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/expenses/expense-helpers.ts --lifecycle codescene`

### 1.5 Plain-text sanitizer reuse
- ✏️ `backend/lib/sanitize/richTextSanitizer.ts` — confirm `sanitizePlainText(text, maxLength)` already exists from Plan 3; if not, add it (referenced by `create` / `update` / `softDelete`).
- 🔁 `bun run scripts/health/sub-loop.ts backend/lib/sanitize/richTextSanitizer.ts --lifecycle codescene`

### 1.6 `create` + `createInternal`
- 🆕 `backend/services/expenses/expense.service.ts` — implement `create(input, actorUserId, tErrors)` (UI entry point; opens its own tx) + `createInternal(input, tx, tErrors)` (Plan 5 cross-call; uses caller's tx; bypasses permission check; no idempotency short-circuit when `clientRequestId` is null) per §3.2.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/expenses/expense.service.ts --lifecycle codescene`

### 1.7 `update`
- ✏️ `backend/services/expenses/expense.service.ts` — add `update(input, tErrors)` per §3.3: permission check, `forUpdate` lock, `EXPENSE_TYPE_IMMUTABLE_FOR_SALARIES` + `EXPENSE_VALUE_IMMUTABLE_FOR_SALARIES` guards, validation, audit log with `previousValues`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/expenses/expense.service.ts --lifecycle codescene`

### 1.8 `softDelete` (shared by UI + Plan 5 unpay)
- ✏️ `backend/services/expenses/expense.service.ts` — add `softDelete({ id, actorUserId, reason, tx }, tErrors)` per §3.4: idempotent if already soft-deleted; rejects `Salaries` expenses whose carryover `isPaid = true` with `EXPENSE_DELETE_VIA_UNPAY`; reuses caller's tx when provided (Plan 5 path).
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/expenses/expense.service.ts --lifecycle codescene`

### 1.9 `bulkDelete` (atomic)
- ✏️ `backend/services/expenses/expense.service.ts` — add `bulkDelete(input, tErrors)` per §3.5: opens its own tx, iterates ids, calls `softDelete` per id with the shared tx; any rejection rolls back the whole batch.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/expenses/expense.service.ts --lifecycle codescene`

### 1.10 `getReport` + `getById`
- ✏️ `backend/services/expenses/expense.service.ts` — add `getReport(actorUserId, filters, pagination, tErrors)` returning `ExpensePage` with `totalValue` + `dominantCurrency` + `rowCountByType` aggregates; add `getById(actorUserId, id, tErrors)` for drill-down.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/expenses/expense.service.ts --lifecycle codescene`

### 1.11 Service tests — CRUD
- 🧪 `backend/services/expenses/expense.service.test.ts`:
  - `create` happy path (manual `Marketing`) → audit log emitted.
  - `createInternal` happy path (Plan 5 simulation `Salaries` + `sourceEntity`) → no permission check.
  - `create` with `Salaries` type → rejected with `EXPENSE_SALARIES_VIA_CARRYVER_ONLY`.
  - Validation rejections: title empty, value negative, paymentDate invalid, expenseDate invalid.
  - `update` happy path; rejects type change on `Salaries`.
  - `update` rejects value change on `Salaries`.
  - `softDelete` happy path.
  - `softDelete` idempotent when already soft-deleted.
  - `softDelete` rejects `Salaries` expense with `isPaid = true` carryover (`EXPENSE_DELETE_VIA_UNPAY`).
  - `softDelete` accepts `Salaries` expense with `isPaid = false` carryover.
  - `bulkDelete` atomic — 1 protected row rolls back whole batch.
  - Idempotent re-submit with `clientRequestId`.
  - Permission denied → `InsufficientPermissions` on `create` / `update` / `softDelete` / `bulkDelete` (NOT on `createInternal`).
  - `getReport` aggregates + filter combinations.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/expenses/expense.service.test.ts --lifecycle codescene`
- 🔁 `bun test backend/services/expenses/expense.service.test.ts`

### 1.12 Service tests — Plan 5 cross-call simulation
- 🧪 `backend/services/expenses/expense-internal.service.test.ts`:
  - Plan 5 calls `createInternal` inside its own tx → expense row visible after commit.
  - Plan 5 rolls back its tx → expense row NOT visible (atomic).
  - Plan 5 calls `softDelete` (in `unpayCarryoverBalance`) inside its own tx → expense soft-deleted after commit.
  - Plan 5 rolls back its tx → expense NOT soft-deleted (atomic).
  - 🔗 Stub `ExpenseService.createInternal` + `ExpenseService.softDelete` interfaces in case Plan 5 lands before Plan 6.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/expenses/expense-internal.service.test.ts --lifecycle codescene`
- 🔁 `bun test backend/services/expenses/expense-internal.service.test.ts`

### 1.13 Phase-1 acceptance
- ✅ All service tests green.
- ✅ Existing `payroll-calculation.service.test.ts` + (if landed) `carryover-balance.service.test.ts` still green (no regression). 🔗 Plan 3 / Plan 5
- ✅ `sub-loop` exit 0 on every touched file.

---

## Phase 2 — GraphQL layer

### 2.1 Pothos types
- 🆕 `backend/graphql/pothos/expenses/expense.pothos.ts` — `ExpenseTypePothosEnum`, `ExpensePothosObject`, `ExpensePagePothosObject`, `ExpenseFilterPothosInput`, `CreateExpenseInputPothos`, `UpdateExpenseInputPothos`, `DeleteExpenseInputPothos`, `BulkDeleteExpensesInputPothos`, `DeleteResultPothosObject`, `BulkDeleteResultPothosObject`.
- ✏️ `backend/graphql/pothos/expenses/index.ts` — re-export.
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/pothos/expenses/expense.pothos.ts --lifecycle codescene`

### 2.2 Queries
- 🆕 `backend/graphql/query/expenses/expense.query.ts` — `expenses(filter, limit, offset)` + `expense(id)`.
- ✏️ `backend/graphql/query/expenses/index.ts` — re-export.
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/query/expenses/expense.query.ts --lifecycle codescene`

### 2.3 Mutations
- 🆕 `backend/graphql/mutation/expenses/expense.mutation.ts` — 4 mutations: `createExpense` (rejects `Salaries` type with `EXPENSE_SALARIES_VIA_CARRYVER_ONLY`), `updateExpense`, `deleteExpense`, `bulkDeleteExpenses`. **No public mutation for `createInternal`** (AC-5.6).
- ✏️ `backend/graphql/mutation/expenses/index.ts` — re-export.
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/mutation/expenses/expense.mutation.ts --lifecycle codescene`

### 2.4 Query + mutation tests
- 🧪 `backend/graphql/query/expenses/expense.query.test.ts` — returns page shape; respects `limit`/`offset`; permission denied → GraphQL error.
- 🧪 `backend/graphql/mutation/expenses/expense.mutation.test.ts` — every mutation returns expected shape; permission denied → GraphQL error; mutation-argument coverage per `docs/testing/mutation-argument-coverage.md`; `createExpense` rejects `Salaries`; `deleteExpense` on protected `Salaries` → `EXPENSE_DELETE_VIA_UNPAY`; `bulkDeleteExpenses` atomic.
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/query/expenses/expense.query.test.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/mutation/expenses/expense.mutation.test.ts --lifecycle codescene`
- 🔁 `bun test backend/graphql/query/expenses/expense.query.test.ts`
- 🔁 `bun test backend/graphql/mutation/expenses/expense.mutation.test.ts`

### 2.5 CSV export route
- 🆕 `app/api/expenses/export/route.ts` — Next.js Route Handler; calls `requireAuth` + `requirePermission(ACCOUNTING_EXPENSES_VIEW)`; calls `ExpenseService.getReport` with `limit: 10_000`; serializes CSV; sets `Content-Type` + `Content-Disposition` + `X-Export-Truncated` headers.
- 🧪 `app/api/expenses/export/route.test.ts` — happy path returns CSV; permission denied returns 403; truncation header set when `totalCount > 10_000`.
- 🔁 `bun run scripts/health/sub-loop.ts "app/api/expenses/export/route.ts" --lifecycle codescene`

### 2.6 Phase-2 acceptance
- ✅ GraphQL schema builds (`bun run graphql:build`).
- ✅ Codegen (`bun run graphql:codegen`) produces typed hooks for all queries/mutations.

---

## Phase 3 — Navigation, routes, i18n (shell)

> Goal: routes exist, nav item renders, permission gating works. No ledger page yet.

### 3.1 Page-permission entries
- ✏️ `frontend/common/types/page-permissions.types.ts` — add `accountingExpensesView`, `accountingExpensesManage`.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/types/page-permissions.types.ts --lifecycle codescene`

### 3.2 Sidebar nav item
- ✏️ `frontend/common/views/dashboard/config/navigationConfig.ts` — add `accounting-expenses` item to `SIDEBAR_NAV_ITEMS` under `grp_finance`; add `AppPermission.ACCOUNTING_EXPENSES_VIEW` to `grp_finance` group `permission` array.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/config/navigationConfig.ts --lifecycle codescene`

### 3.3 i18n namespace
- 🆕 `shared/locale/namespaces/dashboard/accounting/expenses.namespace.ts` — define all keys (EN + AR) per implementation.md §7.1.
- 🆕 `shared/locale/en/dashboard/accounting/expenses.ts` — EN translations.
- 🆕 `shared/locale/ar/dashboard/accounting/expenses.ts` — AR translations.
- 🔁 `bun run scripts/health/sub-loop.ts shared/locale/namespaces/dashboard/accounting/expenses.namespace.ts --lifecycle codescene`

### 3.4 Locale snapshot
- 🔁 `bun run locale:snapshots` — generate `public/static/locale-snapshots/{en,ar}/dashboard.accounting.expenses.json`.
- ✅ Verify snapshots committed.

### 3.5 Route shell
- 🆕 `app/(dashboard)/accounting/expenses/page.tsx` — server component that renders `<ExpenseLedgerContainer />`.
- 🆕 `app/(dashboard)/accounting/expenses/[id]/page.tsx` — drill-down page rendering `<ExpenseDetailDrawer />`.
- 🔁 `bun run scripts/health/sub-loop.ts "app/(dashboard)/accounting/expenses/page.tsx" --lifecycle codescene`

### 3.6 Phase-3 acceptance
- ✅ `/accounting/expenses` renders (with permission) / 403 (without).
- ✅ Sidebar "Expenses" item visible only with `ACCOUNTING_EXPENSES_VIEW` or `ACCOUNTING_EXPENSES_MANAGE`.
- ✅ AR/EN snapshots exist.

---

## Phase 4 — Expense Ledger list page

### 4.1 Apollo documents
- 🆕 `frontend/common/graphql/sharedDocuments/expenses/expense.documents.ts` — `EXPENSES_QUERY`, `EXPENSE_QUERY`, `CREATE_EXPENSE_MUTATION`, `UPDATE_EXPENSE_MUTATION`, `DELETE_EXPENSE_MUTATION`, `BULK_DELETE_EXPENSES_MUTATION`.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/graphql/sharedDocuments/expenses/expense.documents.ts --lifecycle codescene`

### 4.2 View-model hook
- 🆕 `frontend/common/views/dashboard/accounting/expenses/useExpenseLedgerViewModel.ts` — manages Apollo query state, filter state (Zustand), pagination, debounced title search, "Export CSV" handler, bulk-action selection state.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/expenses/useExpenseLedgerViewModel.ts --lifecycle codescene`

### 4.3 Zustand filter store
- 🆕 `frontend/common/stores/expenseFilterStore.ts` — `title`, `types`, `expenseDate`, `paymentDateFrom`, `paymentDateTo`, `includeDeleted`, `page`, `pageSize`, `selectedIds`; `reset()`, `clearFilters()`, `toggleSelected(id)`, `clearSelection()`.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/stores/expenseFilterStore.ts --lifecycle codescene`

### 4.4 Filter bar component
- 🆕 `frontend/common/views/dashboard/accounting/expenses/ExpenseFilterBar.tsx` — title search (debounced 300 ms), type multi-select, expense month picker, payment date range picker, include-deleted toggle, Clear button.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/expenses/ExpenseFilterBar.tsx --lifecycle codescene`

### 4.5 Type + source chips
- 🆕 `frontend/common/views/dashboard/accounting/expenses/ExpenseTypeChip.tsx` — color per type: Salaries=indigo, Marketing=amber, Logistics=blue, Technology=green.
- 🆕 `frontend/common/views/dashboard/accounting/expenses/ExpenseSourceChip.tsx` — "Manual" (grey) when `sourceEntity IS NULL`; "From Carryover" (blue, clickable) when `sourceEntity = 'carryover_balances'`. Click opens `CarryoverDetailDrawer` (🔗 Plan 5).
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/expenses/ExpenseTypeChip.tsx --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/expenses/ExpenseSourceChip.tsx --lifecycle codescene`

### 4.6 DataGrid component
- 🆕 `frontend/common/views/dashboard/accounting/expenses/ExpenseDataGrid.tsx` — MUI `DataGrid` v9 with columns per §5.3; per-row actions (Edit / Delete / View Source); toolbar (Add New / Bulk Delete / Export CSV) gated on `_MANAGE`; aggregate footer.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/expenses/ExpenseDataGrid.tsx --lifecycle codescene`

### 4.7 Container + responsive variants
- 🆕 `frontend/common/views/dashboard/accounting/expenses/ExpenseLedgerContainer.tsx` — composes filter bar + data grid + dialogs; uses `useExpenseLedgerViewModel`.
- 🆕 `frontend/desktop/views/dashboard/accounting/expenses/expenseLedger.desktop.tsx` + `frontend/mobile/views/dashboard/accounting/expenses/expenseLedger.mobile.tsx` — responsive view variants.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/expenses/ExpenseLedgerContainer.tsx --lifecycle codescene`

### 4.8 Page tests
- 🧪 `frontend/common/views/dashboard/accounting/expenses/ExpenseLedgerContainer.test.tsx` — renders rows; filters debounce; empty state; CSV button navigates to `/api/expenses/export?...`; toolbar gated on `_MANAGE`; soft-deleted rows render with strike-through chip when `includeDeleted = true`.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/expenses/ExpenseLedgerContainer.test.tsx --lifecycle codescene`
- 🔁 `bun test frontend/common/views/dashboard/accounting/expenses/ExpenseLedgerContainer.test.tsx`

---

## Phase 5 — Modals (Add New / Edit / Bulk Delete confirmation)

### 5.1 Add New / Edit dialog
- 🆕 `frontend/common/views/dashboard/accounting/expenses/ExpenseFormDialog.tsx` — fields per AC-3.1; type dropdown hides `Salaries` (AC-2.5); when editing a `Salaries` expense, the `type` + `expenseValue` fields are disabled (AC-3.3 + Q5).
- 🆕 `frontend/common/views/dashboard/accounting/expenses/useExpenseFormViewModel.ts` — local form state + validation (`title` non-empty + max 200, `expenseValue >= 0`, currency required, `paymentDate` valid ISO, `expenseDate` valid YYYY-MM) + `useMutation(CREATE_EXPENSE_MUTATION | UPDATE_EXPENSE_MUTATION)` + cache evict + error mapping.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/expenses/ExpenseFormDialog.tsx --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/expenses/useExpenseFormViewModel.ts --lifecycle codescene`

### 5.2 Delete confirmation dialog
- 🆕 `frontend/common/views/dashboard/accounting/expenses/DeleteExpenseDialog.tsx` — confirmation showing title + value + currency; optional reason field.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/expenses/DeleteExpenseDialog.tsx --lifecycle codescene`

### 5.3 Modal tests
- 🧪 `frontend/common/views/dashboard/accounting/expenses/ExpenseFormDialog.test.tsx`:
  - Add New hides `Salaries` from the type dropdown.
  - Edit on `Salaries` disables `type` + `expenseValue`.
  - Validation blocks invalid submits.
  - Double-click submit → only one mutation call (`clientRequestId`).
  - `EXPENSE_TYPE_IMMUTABLE_FOR_SALARIES` + `EXPENSE_VALUE_IMMUTABLE_FOR_SALARIES` errors surface inline.
  - `EXPENSE_SALARIES_VIA_CARRYVER_ONLY` error when manually submitting `Salaries`.
- 🧪 `frontend/common/views/dashboard/accounting/expenses/DeleteExpenseDialog.test.tsx`:
  - `EXPENSE_DELETE_VIA_UNPAY` error → non-dismissable banner pointing to Plan 5 Unpay flow.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/expenses/ExpenseFormDialog.test.tsx --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/expenses/DeleteExpenseDialog.test.tsx --lifecycle codescene`
- 🔁 `bun test frontend/common/views/dashboard/accounting/expenses/ExpenseFormDialog.test.tsx`
- 🔁 `bun test frontend/common/views/dashboard/accounting/expenses/DeleteExpenseDialog.test.tsx`

### 5.4 Detail drawer
- 🆕 `frontend/common/views/dashboard/accounting/expenses/ExpenseDetailDrawer.tsx` — shows the expense's full fields + source chip + audit-log timeline (from `audit_logs.entityId = <id>`).
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/expenses/ExpenseDetailDrawer.tsx --lifecycle codescene`

### 5.5 Phase-5 acceptance
- ✅ Add New → row appears in grid.
- ✅ Edit → row updates in-place (except for `Salaries` rows where type + value are read-only).
- ✅ Delete → row soft-deleted (disappears from default view; reappears with strike-through when `includeDeleted` toggled on).
- ✅ Bulk Delete → atomic; one protected row rolls back the whole batch.
- ✅ View Source → for `Salaries` rows, opens Plan 5's CarryoverDetailDrawer.

---

## Phase 6 — Cross-plan integration with Plan 5

> Goal: wire `ExpenseService.createInternal` + `ExpenseService.softDelete`
> so Plan 5's `bulkCarryoverToExpense` + `unpayCarryoverBalance` calls work.

### 6.1 Expose `createInternal` + `softDelete` to Plan 5
- ✏️ `backend/services/expenses/index.ts` (or wherever the service barrel lives) — ensure `createInternal` + `softDelete` are exported (not just `create` / `update` / `delete` / `bulkDelete`).
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/expenses/index.ts --lifecycle codescene`

### 6.2 Plan 5 calls `createInternal` inside its tx
- ✏️ `backend/services/teachers/carryover-balance.service.ts` 🔗 Plan 5 — in `bulkCarryoverToExpense`, call `ExpenseService.createInternal({ teacherId, teacherName, title, type: ExpenseType.SALARIES, expenseValue: carryover.payable, expenseCurrency: carryover.teacherCurrency, paymentDate, expenseDate, note, sourceEntity: 'carryover_balances', sourceEntityId: carryover.id, createdByUserId: actorUserId }, tx, tErrors)` and store the returned `id` on `carryover_balances.expenseId`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/teachers/carryover-balance.service.ts --lifecycle codescene`

### 6.3 Plan 5 calls `softDelete` inside its `unpayCarryoverBalance` tx
- ✏️ `backend/services/teachers/carryover-balance.service.ts` 🔗 Plan 5 — in `unpayCarryoverBalance`, call `ExpenseService.softDelete({ id: carryover.expenseId, actorUserId, reason: input.note, tx }, tErrors)` (idempotent if already soft-deleted per AC-6.2).
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/teachers/carryover-balance.service.ts --lifecycle codescene`

### 6.4 Phase-6 acceptance
- ✅ Plan 5's `bulkCarryoverToExpense` produces expense rows visible on `/accounting/expenses`.
- ✅ Plan 5's `unpayCarryoverBalance` soft-deletes the linked expense; the expense reappears on `/accounting/expenses` when `includeDeleted` is toggled on.
- ✅ Cross-tx atomicity — Plan 5 tx rollback leaves no orphan expense rows.

---

## Phase 7 — i18n polish, accessibility, observability

### 7.1 Full key coverage
- ✏️ `shared/locale/namespaces/dashboard/accounting/expenses.namespace.ts` — confirm every user-visible string has EN + AR (per implementation.md §7.1 table).
- 🔁 `bun run locale:validate` — fail if any key missing in either locale.

### 7.2 Accessibility pass
- ✏️ `ExpenseDataGrid.tsx` — aria-labels on filter inputs, sortable columns announced, type + source chips have `aria-label` with full text.
- ✏️ `ExpenseFormDialog.tsx` + `DeleteExpenseDialog.tsx` + `ExpenseDetailDrawer.tsx` — aria-labels, focus trap, keyboard nav, Escape closes.
- 🧪 Modal tests — add axe-core assertions (existing project pattern).
- 🔁 `bun run scripts/health/sub-loop.ts <each-modal-or-drawer.tsx> --lifecycle codescene`

### 7.3 RTL pass
- ✏️ Confirm AR locale renders RTL; type chips + source chips align right; Add New modal mirrors LTR layout.
- 🧪 `ExpenseFormDialog.test.tsx` — RTL snapshot matches expected.

### 7.4 Structured logging
- ✏️ `backend/services/expenses/expense.service.ts` — confirm structured `logger.info` on every create / update / softDelete / bulkDelete (NFR-11).
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/expenses/expense.service.ts --lifecycle codescene`

---

## Phase 8 — End-to-end & regression

### 8.1 E2E test
- 🧪 `e2e/accounting/expenses.spec.ts` (Playwright, if project uses it):
  - Log in as accounting operator.
  - Navigate to `/accounting/expenses`.
  - Click "Add New" → fill Marketing expense, pick payment date + expense month → submit.
  - Verify the row appears in the grid.
  - Click "Edit" on the row → change value → submit → verify row updates.
  - Click "Delete" on the row → confirm → verify row disappears from the default view.
  - Toggle "Include deleted" on → verify row reappears with a strike-through chip.
  - 🔗 If Plan 5 landed: open `/accounting/carryover`, select 2 unpaid carryovers, click "Bulk To Expense" → verify 2 `Salaries` expenses appear on `/accounting/expenses` with the "From Carryover" chip.
  - Click "From Carryover" chip → verify it opens the CarryoverDetailDrawer.
  - 🔗 If Plan 5 landed: click "Unpay" on Plan 5's carryover → verify the linked `Salaries` expense is soft-deleted (reappears with `includeDeleted = true`).
  - Click "Export CSV"; verify the downloaded file has the expected rows.
- 🔁 `bun run scripts/health/sub-loop.ts e2e/accounting/expenses.spec.ts --lifecycle codescene`

### 8.2 Regression suite
- 🔁 `bun test backend/db/test/repo/scheduling/scheduling.repository.test.ts`
- 🔁 `bun test backend/services/teachers/payroll-calculation.service.test.ts` 🔗 Plan 3
- 🔁 `bun test backend/services/teachers/carryover-balance.service.test.ts` 🔗 Plan 5 (if landed)
- 🔁 `bun test backend/services/teachers/carryover-to-expense.service.test.ts` 🔗 Plan 5 (if landed)
- 🔁 `bun test backend/services/expenses/expense.service.test.ts`
- 🔁 `bun test backend/services/expenses/expense-internal.service.test.ts`
- 🔁 `bun test backend/graphql/query/expenses/expense.query.test.ts`
- 🔁 `bun test backend/graphql/mutation/expenses/expense.mutation.test.ts`

### 8.3 Full quality gate
- 🔁 Run project-wide `lint`, `typecheck`, `test`, `build`.
- 🔁 `bun run scripts/health/sub-loop.ts <each-new-file> --lifecycle codescene` for every file created/edited in Phases 0–7.

### 8.4 Migration rehearsal on staging
- 🔁 Apply migration to a staging snapshot of prod data.
- ✅ Confirm `expenses` table is empty (new table); no locks held > 100 ms.
- 🔁 Smoke-test manual expense creation + deletion on staging before opening to operators.

---

## Definition of Done

- [ ] All Phase 0–8 tasks complete.
- [ ] Every touched file passes `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0).
- [ ] `specs.md` acceptance criteria AC-1.1 … AC-8.4 each have a passing test.
- [ ] Edge cases E1–E20 each covered by a test or explicit "won't happen" note.
- [ ] Migration is additive, zero-downtime, idempotent.
- [ ] EN + AR locale snapshots committed.
- [ ] Existing scheduling / payroll / teacher-dues / teacher-payments flows regression-green.
- [ ] 🔗 Plan 5 (`carryover-balance-module`) `ExpenseService.createInternal` + `ExpenseService.softDelete` are callable from within Plan 5's transactions (atomic).
- [ ] 🔗 Plan 7 (`profit-loss-dashboard`) can read the `expenses` table (filtered to `deletedAt IS NULL`) to compute Total Expenses.

---

## Quick-reference: quality loop commands

```bash
# Single file, full lifecycle (tsgo → oxlint → biome → lint:type-aware → duplicates → codescene)
bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene

# Lighter stages (short-circuit earlier)
bun run scripts/health/sub-loop.ts <file-path> --lifecycle tsgo
bun run scripts/health/sub-loop.ts <file-path> --lifecycle biome
bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint
bun run scripts/health/sub-loop.ts <file-path> --lifecycle duplicates
```

> See `scripts/health/sub-loop.ts` header for the canonical lifecycle ordering.
> Never run `bun sonar-scan` from a sub-loop — only the orchestrator owns sonar.

---

## Cross-plan handoff checklist (for Plan 5 + Plan 7 owners)

- [ ] `expenses` table created with 16 columns + 9 indexes including `expenses_type_expense_date_idx` composite.
- [ ] `ExpenseType` enum registered (`Salaries | Marketing | Logistics | Technology`).
- [ ] `ExpensePothosObject` GraphQL type live.
- [ ] `expenses` + `expense` queries live.
- [ ] 4 public mutations live: `createExpense`, `updateExpense`, `deleteExpense`, `bulkDeleteExpenses`.
- [ ] `ExpenseService.createInternal` + `ExpenseService.softDelete` exported for Plan 5's cross-tx calls.
- [ ] `/api/expenses/export` route returns CSV.
- [ ] EN + AR locale snapshots for `dashboard.accounting.expenses`.
- [ ] 🔗 Plan 5 can call `ExpenseService.createInternal({ teacherId, teacherName, title, type: Salaries, expenseValue, expenseCurrency, paymentDate, expenseDate, note, sourceEntity: 'carryover_balances', sourceEntityId, createdByUserId }, tx, tErrors)` from within `bulkCarryoverToExpense`'s transaction.
- [ ] 🔗 Plan 5 can call `ExpenseService.softDelete({ id, actorUserId, reason, tx }, tErrors)` from within `unpayCarryoverBalance`'s transaction; idempotent if already soft-deleted.
- [ ] 🔗 Plan 7 can read `expenses` (filtered to `deletedAt IS NULL`) for the P&L's "Expenses tab"; can read `sourceEntity = 'carryover_balances'` to break down Salaries vs Operational if needed.

---

## Test Coverage Backfill: Cross-Actor Journeys & 4-Tier Enforcement

> Closes the gap between this plan and the enforced test kinds added later to the spec process
> (.agents/skills/spec-implementation/SKILL.md → "Plan Intake" items 5-7 + "Test-Layer Coverage
> Gate"; docs/testing/workflow-journey-tests.md). Existing tasks are unchanged; these tasks are
> additive and execute before this plan is treated as test-complete.

- [ ] TB.1 Journey: accounting operator pays carryovers via Plan 5 (`bulkCarryoverToExpense`) → Salaries expense rows appear on the ledger with provenance (pay-to-ledger journey)
  - Create `test/workflows/expenses/carryover-pay-to-expense-ledger.test.ts` (test-first; real services + real DB; NO `runInRollback`; committed fixtures in `beforeAll` + tracked hard delete in `afterAll`; cast helper in `test/workflows/helpers/`; spy notification dispatch via `spyOn(NotificationDispatchHelpers, "dispatchWithPreferences")`)
  - Assert: shared-state transitions (carryover `isPaid = true` + `expenseId` set inside the same tx; tx rollback leaves no orphan expense row), cross-actor visibility (operator with `ACCOUNTING_EXPENSES_VIEW` sees the `Salaries` row with `sourceEntity = 'carryover_balances'` + `sourceEntityId`; `teacherName` snapshot preserved even if teacher later deactivated — E16/E20; users without the view permission must not see it), side effects (ledger row value/currency match the carryover payable), denial paths for unauthorized actors
  - Verify: `bun run test/scripts/run-test.ts test/workflows/expenses/carryover-pay-to-expense-ledger.test.ts` green, then `bun run test:workflows`
  - Reference: `docs/testing/workflow-journey-tests.md`, `test/workflows/AGENTS.md`
  - _Requirements: US-2 (AC-2.1–AC-2.5), US-7 (AC-7.1–AC-7.2), US-5 (AC-5.6), E16, E19, E20_
- [ ] TB.2 Journey: accounting operator unpays a carryover via Plan 5 (`unpayCarryoverBalance`) → linked Salaries expense soft-deleted and hidden from the default ledger view (unpay-to-soft-delete journey)
  - Create `test/workflows/expenses/carryover-unpay-expense-softdelete.test.ts` (test-first; real services + real DB; NO `runInRollback`; committed fixtures in `beforeAll` + tracked hard delete in `afterAll`; cast helper in `test/workflows/helpers/`)
  - Assert: shared-state transitions (expense `deletedAt`/`deletedByUserId` set atomically with the carryover revert in one tx; soft-delete idempotent on repeated unpay), cross-actor visibility (default filter hides the row; `includeDeleted` shows strike-through; direct `deleteExpense`/`bulkDeleteExpenses` on the protected row rejected with `EXPENSE_DELETE_VIA_UNPAY` and the operator is directed to the Unpay flow; bulk delete with one protected row rolls back atomically — E5), side effects (`audit_logs` `EXPENSE_DELETE` row with reason), denial paths
  - Verify: `bun run test/scripts/run-test.ts test/workflows/expenses/carryover-unpay-expense-softdelete.test.ts` green, then `bun run test:workflows`
  - Reference: `docs/testing/workflow-journey-tests.md`, `test/workflows/AGENTS.md`
  - _Requirements: US-3 (AC-3.5–AC-3.7), US-6 (AC-6.1–AC-6.6), E3, E4, E5_
- [ ] TB.3 Journey: operator with MANAGE creates/edits/deletes a manual expense → VIEW-only operator and auditor observe the result + audit trail with correct actor attribution (operator-to-auditor journey)
  - Create `test/workflows/expenses/expense-crud-audit-attribution.test.ts` (test-first; real services + real DB; NO `runInRollback`; committed fixtures in `beforeAll` + tracked hard delete in `afterAll`; cast helper in `test/workflows/helpers/`)
  - Assert: shared-state transitions (soft-delete never hard-deletes; `audit_logs` rows for EXPENSE_CREATE / EXPENSE_UPDATE with `previousValues` / EXPENSE_DELETE carry the acting user's `actorUserId`, never a client-supplied one), cross-actor visibility (VIEW-only operator reads the ledger but every mutation + the CSV export route rejects `INSUFFICIENT_PERMISSIONS` for a MANAGE-less actor — E17; user with neither permission cannot query at all), side effects (aggregate `getReport` excludes soft-deleted rows — AC-6.6), denial paths for unauthorized actors
  - Verify: `bun run test/scripts/run-test.ts test/workflows/expenses/expense-crud-audit-attribution.test.ts` green, then `bun run test:workflows`
  - Reference: `docs/testing/workflow-journey-tests.md`, `test/workflows/AGENTS.md`
  - _Requirements: US-3 (AC-3.2, AC-3.8–AC-3.9), US-5 (AC-5.1–AC-5.5), US-8 (AC-8.3–AC-8.4), NFR-5, NFR-6, NFR-9, E14, E17_
- [ ] TB.4 4-Tier verification for expense service/repository/GraphQL layer
  - Confirm Tier 1 branch coverage + Tier 4 abuse/permission cases exist and are green for: `backend/db/repo/expenses/expense.repository.ts`, `backend/services/expenses/expense.service.ts`, `backend/services/expenses/expense-helpers.ts`, `backend/services/expenses/expense-idempotency.ts`, `backend/services/teachers/carryover-balance.service.ts` (cross-tx `createInternal`/`softDelete` integration), `backend/graphql/query/expenses/expense.query.ts`, `backend/graphql/mutation/expenses/expense.mutation.ts`, `app/api/expenses/export/route.ts`
  - Fill gaps via `.agents/skills/write-tests/SKILL.md` + `.agents/skills/test-expert/SKILL.md`; repo tests inside `runInRollback` with `tx` propagation; service tests mock all external channels
  - Verify with `bun run test/scripts/run-test.ts <each test file>`
  - _Requirements: cross-cutting_
- [ ] TB.5 Penetration verification (plan introduces new GraphQL queries/mutations + a CSV export route)
  - BOLA/IDOR across the roles in this plan (expense rows leakable between tenants/permission scopes; drill-down `expense(id)` must not bypass `ACCOUNTING_EXPENSES_VIEW`); permission denial on all admin mutations (`createExpense`/`updateExpense`/`deleteExpense`/`bulkDeleteExpenses`) and on `POST/GET /api/expenses/export`; wildcard injection (`%`/`_`) on the `ILIKE '%term%'` title search (AC-4.1); CSV formula injection (`=`, `+`, `-`, `@` leading cells) in the export route; confirm `ExpenseService.createInternal` is unreachable via GraphQL (AC-5.6)
  - Via `.agents/skills/pentester/SKILL.md`
  - _Requirements: US-5 (AC-5.1–AC-5.6), AC-4.1, AC-1.6, E13_
