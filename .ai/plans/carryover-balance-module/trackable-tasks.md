# Plan 5 — Carryover Balance Module: Tasks

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

> Goal: additive data-model changes that unblock every later phase. Zero
> behavior change for existing flows.

### 0.1 Add `ACCOUNTING_CARRYOVER_VIEW` + `ACCOUNTING_CARRYOVER_MANAGE` permissions
- ✏️ `backend/enum/permissions/permission.enum.ts` — add both new values.
- ✏️ `backend/db/seeds/auth/seed-user-permission-overrides.ts` (or wherever permission-groups are seeded) — grant both to the "Accounting" / "Finance Manager" default group.
- 🧪 `backend/enum/permissions/permission.enum.test.ts` — assert both new values parse via `isAppPermission`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/enum/permissions/permission.enum.ts --lifecycle codescene`

### 0.2 New `carryover_balances` table schema
- 🆕 `backend/db/schema/teachers/carryover-balances.ts` — define `carryoverBalances` (16 columns per §2.3) + `carryoverBalanceItems` (8 columns per §2.4) with 7+2 indexes.
- ✏️ `backend/db/schema/teachers/index.ts` — re-export.
- 🔁 `bun run scripts/health/sub-loop.ts backend/db/schema/teachers/carryover-balances.ts --lifecycle codescene`

### 0.3 Extend `class_instances` with `carryover_balance_id` FK
- ✏️ `backend/db/schema/classes/scheduling.ts` — add `carryoverBalanceId` (uuid, nullable, FK to `carryover_balances.id` with `onDelete: "set null"`) + `class_instances_carryover_balance_id_idx` index.
- ✏️ `backend/db/drizzleRelations.ts` — add `carryoverBalancesRelations`, `carryoverBalanceItemsRelations`, and `classInstances.carryoverBalance` relation.
- 🔁 `bun run scripts/health/sub-loop.ts backend/db/schema/classes/scheduling.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts backend/db/drizzleRelations.ts --lifecycle codescene`

### 0.4 Generate + apply migration
- 🔁 `bun run db:generate` — produce additive migration: (a) `CREATE TABLE carryover_balances` + `CREATE TABLE carryover_balance_items` (transactional), (b) `ALTER TABLE class_instances ADD COLUMN carryover_balance_id` (transactional), (c) `CREATE INDEX` statements.
- 🔁 `bun run db:migrate` against local dev DB.
- 🧪 `backend/db/test/migrations/carryover-tables.test.ts` — assert migration is idempotent and additive; existing `class_instances_state_machine_chk` constraint still passes.
- 🔁 `bun run scripts/health/sub-loop.ts <migration-file> --lifecycle codescene`

### 0.5 Phase-0 regression smoke
- 🔁 `bun test backend/db/test/repo/scheduling/scheduling.repository.test.ts`
- 🔁 `bun test backend/db/test/logic/scheduling/class_instances_security.test.ts`
- 🔁 `bun test backend/services/teachers/payroll-calculation.service.test.ts` 🔗 (Plan 3)
- ✅ Confirm existing scheduling / payroll flows still pass.

---

## Phase 1 — Service layer

> Goal: `CarryoverBalanceService` with bulkCreate, bulkToExpense, CRUD,
> unpay, and getReport — full idempotency, validation, and audit logging.

### 1.1 Types
- 🆕 `backend/types/teachers/carryover-balance.types.ts` — `BulkCreateCarryoverInput`, `BulkCreateCarryoverResult`, `BulkCreateCarryoverGroupResult`, `BulkToExpenseInput`, `BulkToExpenseResult`, `BulkToExpenseItemResult`, `CreateCarryoverInput`, `UpdateCarryoverInput`, `CarryoverFilters`, `CarryoverRow`, `CarryoverPage`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/types/teachers/carryover-balance.types.ts --lifecycle codescene`

### 1.2 Repository layer
- 🆕 `backend/db/repo/teachers/carryover-balance.repository.ts` — `findFiltered(filters, pagination)`, `getByIdsForUpdate(ids, tx)`, `getById(id, tx)`, `findByTeacherId(teacherId, tx)`, `findLinkedSessions(carryoverId, tx)`, `create(input, tx)`, `update(id, patch, tx)`, `delete(id, tx)`, `bulkDelete(ids, tx)`, `insertItems(items, tx)`.
- ✏️ `backend/db/repo/teachers/index.ts` — re-export.
- 🧪 `backend/db/test/repo/teachers/carryover.repository.test.ts` — filter combinations, pagination, `getByIdsForUpdate` lock correctness, aggregate totals.
- 🔁 `bun run scripts/health/sub-loop.ts backend/db/repo/teachers/carryover-balance.repository.ts --lifecycle codescene`

### 1.3 Class-instance repo extensions
- ✏️ `backend/db/repo/scheduling/class-instances.ts` — add `getByIdsForUpdate(ids, tx)`, `findByCarryoverId(carryoverId, tx)`, `linkToCarryover(instanceIds, carryoverId, tx)`, `unlinkFromCarryover(instanceIds, tx)`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/db/repo/scheduling/class-instances.ts --lifecycle codescene`

### 1.4 Idempotency helpers
- 🆕 `backend/services/teachers/carryover-idempotency.ts` — `deriveBulkCreateIdempotencyKey(input)`, `deriveBulkToExpenseIdempotencyKey(input)`, `deriveCrudIdempotencyKey(input)`.
- 🧪 `backend/services/teachers/carryover-idempotency.test.ts` — same input → same key; instance-id reordering produces same key; payment-date change produces different key.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/teachers/carryover-idempotency.ts --lifecycle codescene`

### 1.5 Aggregation helpers
- 🆕 `backend/services/teachers/carryover-aggregate.ts` — `groupInstancesByTeacher(instances)`, `resolveDominantCurrency(instances, fallback)`, `computeTotalDurationHours(instances)`, `truncateWithEllipsis(text, maxLen)`, `minDate(dates)`, `maxDate(dates)`, `pickDominantCurrency(rows)`.
- 🧪 `backend/services/teachers/carryover-aggregate.test.ts` — grouping, dominant-currency tie-break, hours rounding (banker's), truncation at 500 chars.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/teachers/carryover-aggregate.ts --lifecycle codescene`

### 1.6 Teacher-disabled snapshot helper
- ✏️ `backend/db/repo/teachers/teacher.repository.ts` — add `isDisabled(teacherId, tx)` returning boolean (`users.status = DEACTIVATED`).
- 🧪 extend `backend/db/test/repo/teachers/teacher.repository.test.ts` — returns true for deactivated; false otherwise.
- 🔁 `bun run scripts/health/sub-loop.ts backend/db/repo/teachers/teacher.repository.ts --lifecycle codescene`

### 1.7 `bulkCreateCarryoverBalances` service
- 🆕 `backend/services/teachers/carryover-balance.service.ts` — implement `bulkCreateCarryoverBalances(input, tErrors)` per §3.2: permission check, idempotency short-circuit, lock+fetch, validate audited + unlinked, group by teacher, resolve dominant currency + FX convert via existing `FxService`, insert carryover + items, update sessions to `WAITING_PAID`, emit `PAYROLL_STATUS_TRANSITION` events + `CARRYOVER_CREATE` audit log.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/teachers/carryover-balance.service.ts --lifecycle codescene`

### 1.8 `bulkCarryoverToExpense` service
- ✏️ `backend/services/teachers/carryover-balance.service.ts` — add `bulkCarryoverToExpense(input, tErrors)` per §3.3: validate `paymentDate` + `expenseDate`, idempotency short-circuit, lock+fetch all unpaid carryovers, call `ExpenseService.createInternal` (🔗 Plan 6 — stub interface in the meantime if Plan 6 hasn't landed), mark carryovers paid, transition sessions to `PAID`, emit `PAYROLL_STATUS_TRANSITION` + `CARRYOVER_TO_EXPENSE` audit logs.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/teachers/carryover-balance.service.ts --lifecycle codescene`

### 1.9 `unpayCarryoverBalance` service
- ✏️ `backend/services/teachers/carryover-balance.service.ts` — add `unpayCarryoverBalance(input, tErrors)` per §3.4: validate paid, soft-delete linked expense (idempotent if already soft-deleted), revert carryover to unpaid, revert sessions to `WAITING_PAID`, emit `CARRYOVER_UNPAID` audit log.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/teachers/carryover-balance.service.ts --lifecycle codescene`

### 1.10 CRUD + bulkDelete services
- ✏️ `backend/services/teachers/carryover-balance.service.ts` — add `createCarryoverBalance(input, tErrors)`, `updateCarryoverBalance(input, tErrors)` (reject `teacherId` patch with `CARRYOVER_TEACHER_IMMUTABLE`), `deleteCarryoverBalance(input, tErrors)` (reject on `isPaid` with `CARRYOVER_PAID_CANNOT_DELETE`; unlink sessions, revert statuses, hard-delete carryover + items), `bulkDeleteCarryoverBalances(input, tErrors)` (atomic — any `isPaid` rolls back whole batch).
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/teachers/carryover-balance.service.ts --lifecycle codescene`

### 1.11 `getReport` read model
- ✏️ `backend/services/teachers/carryover-balance.service.ts` — add `getReport(actorUserId, filters, pagination, tErrors)` returning `CarryoverPage` with `totalPayable`, `totalPaid`, `dominantCurrency`, `rowCountByPaid` aggregates.
- ✏️ `backend/services/teachers/carryover-balance.service.ts` — add `getById(actorUserId, id, tErrors)` for the drill-down query.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/teachers/carryover-balance.service.ts --lifecycle codescene`

### 1.12 Service tests — bulkCreate
- 🧪 `backend/services/teachers/carryover-balance.service.test.ts`:
  - Happy path — 3 teachers, mixed sessions → 3 carryover rows + items + sessions transitioned to `WAITING_PAID`.
  - All-not-audited rejection (`CARRYOVER_SESSION_NOT_AUDITED`).
  - Already-linked rejection (`CARRYOVER_SESSION_ALREADY_LINKED`).
  - Cross-currency aggregation with FX conversion; per-item `originalAmount` preserved.
  - FX rate missing rejection (`CARRYOVER_FX_RATE_MISSING`).
  - Idempotent re-submit (same `clientRequestId` within 60s).
  - `studentsText` truncation at 500 chars.
  - Permission denied → `InsufficientPermissions`.
  - Empty `instanceIds` rejection.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/teachers/carryover-balance.service.test.ts --lifecycle codescene`
- 🔁 `bun test backend/services/teachers/carryover-balance.service.test.ts`

### 1.13 Service tests — bulkToExpense
- 🧪 `backend/services/teachers/carryover-to-expense.service.test.ts`:
  - Happy path — 2 carryovers → 2 expenses (type `Salaries`) + carryovers marked paid + sessions transitioned to `PAID`.
  - Already-paid rejection (`CARRYOVER_ALREADY_PAID`).
  - Missing `paymentDate` (`PAYMENT_DATE_REQUIRED`).
  - Invalid `expenseDate` format (`EXPENSE_DATE_INVALID`).
  - Default `expenseDate` from `paymentDate` slice.
  - Idempotent re-submit.
  - 🔗 Plan 6 `ExpenseService.create` failure rolls back everything.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/teachers/carryover-to-expense.service.test.ts --lifecycle codescene`
- 🔁 `bun test backend/services/teachers/carryover-to-expense.service.test.ts`

### 1.14 Service tests — CRUD + unpay
- 🧪 `backend/services/teachers/carryover-crud.service.test.ts`:
  - Create happy path (snapshot `isDisabledTeacher`).
  - Update happy path; rejects `teacherId` patch.
  - Delete happy path (unlinks sessions, reverts statuses, hard-deletes).
  - Delete on `isPaid` rejection (`CARRYOVER_PAID_CANNOT_DELETE`).
  - BulkDelete atomic — 1 paid in batch rolls back whole batch.
  - Unpay happy path (soft-deletes expense, reverts carryover, reverts sessions to `WAITING_PAID`).
  - Unpay idempotent when expense already soft-deleted.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/teachers/carryover-crud.service.test.ts --lifecycle codescene`
- 🔁 `bun test backend/services/teachers/carryover-crud.service.test.ts`

### 1.15 Phase-1 acceptance
- ✅ All service tests green.
- ✅ Existing `payroll-calculation.service.test.ts` + `class-instances.ts` repo tests still green (no regression). 🔗 Plan 3
- ✅ `sub-loop` exit 0 on every touched file.

---

## Phase 2 — GraphQL layer

### 2.1 Pothos types
- 🆕 `backend/graphql/pothos/teachers/carryover.pothos.ts` — `CarryoverBalancePothosObject`, `CarryoverPagePothosObject`, `CarryoverFilterPothosInput`, `BulkCreateCarryoverInputPothos`, `BulkCreateCarryoverGroupResultPothosObject`, `BulkCreateCarryoverResultPothosObject`, `BulkToExpenseInputPothos`, `BulkToExpenseItemResultPothosObject`, `BulkToExpenseResultPothosObject`, `CreateCarryoverInputPothos`, `UpdateCarryoverInputPothos`, `DeleteResultPothosObject`, `BulkDeleteResultPothosObject`.
- ✏️ `backend/graphql/pothos/teachers/index.ts` — re-export.
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/pothos/teachers/carryover.pothos.ts --lifecycle codescene`

### 2.2 Queries
- 🆕 `backend/graphql/query/teachers/carryover.query.ts` — `carryoverBalances(filter, limit, offset)` + `carryoverBalance(id)`.
- ✏️ `backend/graphql/query/teachers/index.ts` — re-export.
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/query/teachers/carryover.query.ts --lifecycle codescene`

### 2.3 Mutations
- 🆕 `backend/graphql/mutation/teachers/carryover.mutation.ts` — 7 mutations: `bulkCreateCarryoverBalances`, `bulkCarryoverToExpense`, `createCarryoverBalance`, `updateCarryoverBalance`, `deleteCarryoverBalance`, `bulkDeleteCarryoverBalances`, `unpayCarryoverBalance`.
- ✏️ `backend/graphql/mutation/teachers/index.ts` — re-export.
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/mutation/teachers/carryover.mutation.ts --lifecycle codescene`

### 2.4 Query + mutation tests
- 🧪 `backend/graphql/query/teachers/carryover.query.test.ts` — returns page shape; respects `limit`/`offset`; permission denied → GraphQL error.
- 🧪 `backend/graphql/mutation/teachers/carryover.mutation.test.ts` — every mutation returns the expected result shape; permission denied → GraphQL error; mutation-argument coverage per `docs/testing/mutation-argument-coverage.md`; empty-array rejection; oversized-array cap.
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/query/teachers/carryover.query.test.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/mutation/teachers/carryover.mutation.test.ts --lifecycle codescene`
- 🔁 `bun test backend/graphql/query/teachers/carryover.query.test.ts`
- 🔁 `bun test backend/graphql/mutation/teachers/carryover.mutation.test.ts`

### 2.5 CSV export route
- 🆕 `app/api/carryover/export/route.ts` — Next.js Route Handler; calls `requireAuth` + `requirePermission(ACCOUNTING_CARRYOVER_VIEW)`; calls `CarryoverBalanceService.getReport` with `limit: 10_000`; serializes CSV; sets `Content-Type` + `Content-Disposition` + `X-Export-Truncated` headers.
- 🧪 `app/api/carryover/export/route.test.ts` — happy path returns CSV; permission denied returns 403; truncation header set when `totalCount > 10_000`.
- 🔁 `bun run scripts/health/sub-loop.ts "app/api/carryover/export/route.ts" --lifecycle codescene`

### 2.6 Phase-2 acceptance
- ✅ GraphQL schema builds (`bun run graphql:build`).
- ✅ Codegen (`bun run graphql:codegen`) produces typed hooks for all queries/mutations.

---

## Phase 3 — Navigation, routes, i18n (shell)

> Goal: routes exist, nav item renders, permission gating works. No reports page yet.

### 3.1 Page-permission entries
- ✏️ `frontend/common/types/page-permissions.types.ts` — add `accountingCarryoverView`, `accountingCarryoverManage`.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/types/page-permissions.types.ts --lifecycle codescene`

### 3.2 Sidebar nav item
- ✏️ `frontend/common/views/dashboard/config/navigationConfig.ts` — add `accounting-carryover` item to `SIDEBAR_NAV_ITEMS` under `grp_finance`; add `AppPermission.ACCOUNTING_CARRYOVER_VIEW` to `grp_finance` group `permission` array.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/config/navigationConfig.ts --lifecycle codescene`

### 3.3 i18n namespace
- 🆕 `shared/locale/namespaces/dashboard/accounting/carryover.namespace.ts` — define all keys (EN + AR) per implementation.md §7.1.
- 🆕 `shared/locale/en/dashboard/accounting/carryover.ts` — EN translations.
- 🆕 `shared/locale/ar/dashboard/accounting/carryover.ts` — AR translations.
- 🔁 `bun run scripts/health/sub-loop.ts shared/locale/namespaces/dashboard/accounting/carryover.namespace.ts --lifecycle codescene`

### 3.4 Locale snapshot
- 🔁 `bun run locale:snapshots` — generate `public/static/locale-snapshots/{en,ar}/dashboard.accounting.carryover.json`.
- ✅ Verify snapshots committed.

### 3.5 Route shell
- 🆕 `app/(dashboard)/accounting/carryover/page.tsx` — server component that renders `<CarryoverContainer />`.
- 🆕 `app/(dashboard)/accounting/carryover/[id]/page.tsx` — drill-down page rendering `<CarryoverDetailDrawer />`.
- 🔁 `bun run scripts/health/sub-loop.ts "app/(dashboard)/accounting/carryover/page.tsx" --lifecycle codescene`

### 3.6 Phase-3 acceptance
- ✅ `/accounting/carryover` renders (with permission) / 403 (without).
- ✅ Sidebar "Carryover" item visible only with `ACCOUNTING_CARRYOVER_VIEW` or `ACCOUNTING_CARRYOVER_MANAGE`.
- ✅ AR/EN snapshots exist.

---

## Phase 4 — Carryover list page

### 4.1 Apollo documents
- 🆕 `frontend/common/graphql/sharedDocuments/teachers/carryover.documents.ts` — `CARRYOVER_BALANCES_QUERY`, `CARRYOVER_BALANCE_QUERY`, `BULK_CREATE_CARRYOVER_MUTATION`, `BULK_TO_EXPENSE_MUTATION`, `CREATE_CARRYOVER_MUTATION`, `UPDATE_CARRYOVER_MUTATION`, `DELETE_CARRYOVER_MUTATION`, `BULK_DELETE_CARRYOVER_MUTATION`, `UNPAY_CARRYOVER_MUTATION`.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/graphql/sharedDocuments/teachers/carryover.documents.ts --lifecycle codescene`

### 4.2 View-model hook
- 🆕 `frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel.ts` — manages Apollo query state, filter state (Zustand), pagination, debounced search, "Export CSV" handler, bulk-action selection state.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel.ts --lifecycle codescene`

### 4.3 Zustand filter store
- 🆕 `frontend/common/stores/carryoverFilterStore.ts` — `teacherId`, `paidStatus`, `dateFrom`, `dateTo`, `includeDisabledTeachers`, `search`, `page`, `pageSize`, `selectedIds`; `reset()`, `clearFilters()`, `toggleSelected(id)`, `clearSelection()`.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/stores/carryoverFilterStore.ts --lifecycle codescene`

### 4.4 Filter bar component
- 🆕 `frontend/common/views/dashboard/accounting/carryover/CarryoverFilterBar.tsx` — teacher autocomplete, paid-status radio (`Paid`/`Unpaid`/`Both`), date-range picker, disabled-teachers toggle (default off), search input (debounced 300 ms), Clear button.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/carryover/CarryoverFilterBar.tsx --lifecycle codescene`

### 4.5 Chips + actions
- 🆕 `frontend/common/views/dashboard/accounting/carryover/PaidStatusChip.tsx` — green=Paid, default=Unpaid.
- 🆕 `frontend/common/views/dashboard/accounting/carryover/DisabledTeacherChip.tsx` — grey chip with `block` icon.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/carryover/PaidStatusChip.tsx --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/carryover/DisabledTeacherChip.tsx --lifecycle codescene`

### 4.6 DataGrid component
- 🆕 `frontend/common/views/dashboard/accounting/carryover/CarryoverDataGrid.tsx` — MUI `DataGrid` v9 with columns per §5.3; per-row actions (Edit / Delete / Unpay / View Sessions); toolbar (Add New / Bulk To Expense / Bulk Delete / Export CSV) gated on `_MANAGE`; aggregate footer.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/carryover/CarryoverDataGrid.tsx --lifecycle codescene`

### 4.7 Container + responsive variants
- 🆕 `frontend/common/views/dashboard/accounting/carryover/CarryoverContainer.tsx` — composes filter bar + data grid + dialogs; uses `useCarryoverViewModel`.
- 🆕 `frontend/desktop/views/dashboard/accounting/carryover/carryover.desktop.tsx` + `frontend/mobile/views/dashboard/accounting/carryover/carryover.mobile.tsx` — responsive view variants.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/carryover/CarryoverContainer.tsx --lifecycle codescene`

### 4.8 Page tests
- 🧪 `frontend/common/views/dashboard/accounting/carryover/CarryoverContainer.test.tsx` — renders rows; filters debounce; empty state; CSV button navigates to `/api/carryover/export?...`; toolbar gated on `_MANAGE`.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/carryover/CarryoverContainer.test.tsx --lifecycle codescene`
- 🔁 `bun test frontend/common/views/dashboard/accounting/carryover/CarryoverContainer.test.tsx`

---

## Phase 5 — Modals (Add New / Edit / Bulk To Expense)

### 5.1 Add New / Edit dialog
- 🆕 `frontend/common/views/dashboard/accounting/carryover/CarryoverFormDialog.tsx` — fields per AC-4.1; teacher autocomplete (disabled in Edit); fromDate / toDate / payable / teacherCurrency / studentsCount / studentsText / note.
- 🆕 `frontend/common/views/dashboard/accounting/carryover/useCarryoverFormViewModel.ts` — local form state + validation (`fromDate <= toDate`, `payable >= 0`, currency required) + `useMutation(CREATE_CARRYOVER_MUTATION | UPDATE_CARRYOVER_MUTATION)` + cache evict + error mapping.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/carryover/CarryoverFormDialog.tsx --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/carryover/useCarryoverFormViewModel.ts --lifecycle codescene`

### 5.2 Bulk To Expense modal
- 🆕 `frontend/common/views/dashboard/accounting/carryover/BulkToExpenseModal.tsx` — Payment Date (DatePicker), Expense Date (month picker, `YYYY-MM`), optional note, summary of selected carryovers (count + total + currency), Submit button calling `bulkCarryoverToExpense`.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/carryover/BulkToExpenseModal.tsx --lifecycle codescene`

### 5.3 Delete confirmation + Unpay confirmation dialogs
- 🆕 `frontend/common/views/dashboard/accounting/carryover/DeleteCarryoverDialog.tsx` — confirmation showing teacher + payable; warning when row has linked sessions.
- 🆕 `frontend/common/views/dashboard/accounting/carryover/UnpayCarryoverDialog.tsx` — warning that linked expense will be soft-deleted + sessions revert to `WAITING_PAID`; optional reason note.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/carryover/DeleteCarryoverDialog.tsx --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/carryover/UnpayCarryoverDialog.tsx --lifecycle codescene`

### 5.4 Modal tests
- 🧪 `frontend/common/views/dashboard/accounting/carryover/CarryoverFormDialog.test.tsx`:
  - Add New vs Edit (teacher field disabled in Edit).
  - Validation blocks invalid submits.
  - Double-click submit → only one mutation call (`clientRequestId`).
  - `CARRYOVER_TEACHER_IMMUTABLE` error surfaced inline.
- 🧪 `frontend/common/views/dashboard/accounting/carryover/BulkToExpenseModal.test.tsx`:
  - Date pickers required; submit disabled until both valid.
  - Summary shows count + total + currency.
  - `CARRYOVER_ALREADY_PAID` error surfaces a non-dismissable banner.
  - Idempotent re-submit returns first result silently.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/carryover/CarryoverFormDialog.test.tsx --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/carryover/BulkToExpenseModal.test.tsx --lifecycle codescene`
- 🔁 `bun test frontend/common/views/dashboard/accounting/carryover/CarryoverFormDialog.test.tsx`
- 🔁 `bun test frontend/common/views/dashboard/accounting/carryover/BulkToExpenseModal.test.tsx`

### 5.5 Detail drawer
- 🆕 `frontend/common/views/dashboard/accounting/carryover/CarryoverDetailDrawer.tsx` — shows the carryover's fields + the linked-sessions list (read from a `classInstancesByCarryoverId` query added in Phase 2).
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/carryover/CarryoverDetailDrawer.tsx --lifecycle codescene`

### 5.6 Phase-5 acceptance
- ✅ Add New → row appears in grid.
- ✅ Edit → row updates in-place.
- ✅ Bulk To Expense → rows flip to `Paid` + sessions transition to `PAID`.
- ✅ Unpay → row reverts to `Unpaid` + sessions revert to `WAITING_PAID` + linked expense soft-deleted.
- ✅ Delete → row disappears; linked sessions revert.

---

## Phase 6 — Plan 4 integration (Bulk Carryover action on audit grid)

### 6.1 Bulk-action button on Plan 4 grid
- ✏️ `frontend/common/views/dashboard/accounting/reports/SessionAuditDataGrid.tsx` 🔗 Plan 4 — add a "Carryover Balance" bulk-action button in the toolbar (gated on `ACCOUNTING_CARRYOVER_MANAGE`). When clicked, opens a confirmation dialog showing the per-teacher grouped summary, then calls `bulkCreateCarryoverBalances`.
- 🧪 extend `frontend/common/views/dashboard/accounting/reports/SessionAuditDataGrid.test.tsx` 🔗 Plan 4 — bulk-action button visible only with `_MANAGE`; calls mutation with selected ids; on success, evicts Plan 4 cache + shows success toast.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/reports/SessionAuditDataGrid.tsx --lifecycle codescene`

### 6.2 Plan 4 grid shows `carryoverBalanceId` chip
- ✏️ Plan 4's row renderer — when a session is linked to a carryover (`carryoverBalanceId` is non-null), show a small "Linked" chip in the row; clicking it opens the CarryoverDetailDrawer.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/reports/SessionAuditDataGrid.tsx --lifecycle codescene`

### 6.3 Phase-6 acceptance
- ✅ Bulk Carryover button on `/accounting/reports` produces carryover rows visible on `/accounting/carryover`.
- ✅ Linked sessions show a "Linked" chip on the audit grid.

---

## Phase 7 — i18n polish, accessibility, observability

### 7.1 Full key coverage
- ✏️ `shared/locale/namespaces/dashboard/accounting/carryover.namespace.ts` — confirm every user-visible string has EN + AR (per implementation.md §7.1 table).
- 🔁 `bun run locale:validate` — fail if any key missing in either locale.

### 7.2 Accessibility pass
- ✏️ `CarryoverDataGrid.tsx` — aria-labels on filter inputs, sortable columns announced, paid + disabled chips have `aria-label` with full text.
- ✏️ `CarryoverFormDialog.tsx` + `BulkToExpenseModal.tsx` + `DeleteCarryoverDialog.tsx` + `UnpayCarryoverDialog.tsx` — aria-labels, focus trap, keyboard nav, Escape closes.
- 🧪 Modal tests — add axe-core assertions (existing project pattern).
- 🔁 `bun run scripts/health/sub-loop.ts <each-modal.tsx> --lifecycle codescene`

### 7.3 RTL pass
- ✏️ Confirm AR locale renders RTL; paid + disabled chips align right; Bulk To Expense modal mirrors LTR layout.
- 🧪 `BulkToExpenseModal.test.tsx` — RTL snapshot matches expected.

### 7.4 Structured logging
- ✏️ `backend/services/teachers/carryover-balance.service.ts` — confirm structured `logger.info` on every bulk create / to-expense / unpay / delete (NFR-11).
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/teachers/carryover-balance.service.ts --lifecycle codescene`

---

## Phase 8 — End-to-end & regression

### 8.1 E2E test
- 🧪 `e2e/accounting/carryover.spec.ts` (Playwright, if project uses it):
  - Log in as accounting operator.
  - Navigate to `/accounting/reports`, select 5 audited sessions across 2 teachers, click "Carryover Balance".
  - Confirm dialog → success toast → navigate to `/accounting/carryover` → see 2 carryover rows.
  - Select both rows → "Bulk To Expense" → pick payment date + expense month → confirm.
  - Rows flip to "Paid"; expense rows visible on `/accounting/expenses` (🔗 Plan 6).
  - Click "Unpay" on one row → confirm → row reverts to "Unpaid"; expense soft-deleted.
  - Click "Export CSV"; verify the downloaded file has the expected rows.
- 🔁 `bun run scripts/health/sub-loop.ts e2e/accounting/carryover.spec.ts --lifecycle codescene`

### 8.2 Regression suite
- 🔁 `bun test backend/db/test/repo/scheduling/scheduling.repository.test.ts`
- 🔁 `bun test backend/db/test/logic/scheduling/class_instances_security.test.ts`
- 🔁 `bun test backend/services/teachers/payroll-calculation.service.test.ts` 🔗 Plan 3
- 🔁 `bun test backend/services/teachers/carryover-balance.service.test.ts`
- 🔁 `bun test backend/services/teachers/carryover-to-expense.service.test.ts`
- 🔁 `bun test backend/services/teachers/carryover-crud.service.test.ts`
- 🔁 `bun test backend/graphql/query/teachers/carryover.query.test.ts`
- 🔁 `bun test backend/graphql/mutation/teachers/carryover.mutation.test.ts`
- 🔁 `bun test backend/services/expenses/expense.service.test.ts` 🔗 Plan 6 (if landed)

### 8.3 Full quality gate
- 🔁 Run project-wide `lint`, `typecheck`, `test`, `build`.
- 🔁 `bun run scripts/health/sub-loop.ts <each-new-file> --lifecycle codescene` for every file created/edited in Phases 0–7.

### 8.4 Migration rehearsal on staging
- 🔁 Apply migration to a staging snapshot of prod data.
- ✅ Confirm `class_instances` row count unchanged, new column nullable, no locks held > 100 ms.
- 🔁 Smoke-test the bulk Carryover action on staging with a small batch (5 sessions) before opening to operators.

---

## Definition of Done

- [ ] All Phase 0–8 tasks complete.
- [ ] Every touched file passes `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0).
- [ ] `specs.md` acceptance criteria AC-1.1 … AC-8.4 each have a passing test.
- [ ] Edge cases E1–E20 each covered by a test or explicit "won't happen" note.
- [ ] Migration is additive, zero-downtime, idempotent.
- [ ] EN + AR locale snapshots committed.
- [ ] Existing scheduling / payroll / teacher-dues / teacher-payments flows regression-green.
- [ ] 🔗 Plan 4 (`session-event-audit`) "Carryover Balance" bulk-action button works end-to-end.
- [ ] 🔗 Plan 6 (`expense-ledger`) `ExpenseService.createInternal` is callable from this plan's `bulkCarryoverToExpense` (or a stub interface is wired if Plan 6 hasn't landed yet).

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

## Cross-plan handoff checklist (for Plan 4 + Plan 6 owners)

- [ ] `carryover_balances` + `carryover_balance_items` tables created.
- [ ] `class_instances.carryover_balance_id` FK column added.
- [ ] `CarryoverBalancePothosObject` GraphQL type live.
- [ ] `carryoverBalances` + `carryoverBalance` queries live.
- [ ] 7 mutations live: `bulkCreateCarryoverBalances`, `bulkCarryoverToExpense`, `createCarryoverBalance`, `updateCarryoverBalance`, `deleteCarryoverBalance`, `bulkDeleteCarryoverBalances`, `unpayCarryoverBalance`.
- [ ] `/api/carryover/export` route returns CSV.
- [ ] EN + AR locale snapshots for `dashboard.accounting.carryover`.
- [ ] 🔗 Plan 4 can call `bulkCreateCarryoverBalances` from its audit grid bulk-action toolbar.
- [ ] 🔗 Plan 6 exposes `ExpenseService.createInternal({ teacherId, teacherName, title, type: Salaries, expenseValue, expenseCurrency, paymentDate, expenseDate, note, sourceEntity, sourceEntityId, createdByUserId }, tx, tErrors)` callable from within this plan's transaction.
- [ ] 🔗 Plan 6 exposes `ExpenseService.softDelete({ id, actorUserId, tx }, tErrors)` callable from `unpayCarryoverBalance`.
- [ ] 🔗 Plan 7 (`profit-loss-dashboard`) can read `expenses.sourceEntity = 'carryover_balances'` to attribute Salaries expenses to carryover settlements.

---

## Test Coverage Backfill: Cross-Actor Journeys & 4-Tier Enforcement

> Closes the gap between this plan and the enforced test kinds added later to the spec process
> (.agents/skills/spec-implementation/SKILL.md → "Plan Intake" items 5-7 + "Test-Layer Coverage
> Gate"; docs/testing/workflow-journey-tests.md). Existing tasks are unchanged; these tasks are
> additive and execute before this plan is treated as test-complete.

- [x] TB.1 Journey: accounting operator bulk-creates carryover from audited sessions → sessions transition to `WAITING_PAID` and become visible/"Linked" to other operators on the Plan 4 audit grid (bulk-create settlement journey)
  - Create `test/workflows/accounting/carryover-bulk-create.journey.test.ts` (test-first; real services + real DB; NO `runInRollback`; committed fixtures in `beforeAll` + tracked hard delete in `afterAll`; cast helper in `test/workflows/helpers/`; spy notification dispatch via `spyOn(NotificationDispatchHelpers, "dispatchWithPreferences")`)
  - Assert: shared-state transitions (sessions move to `WAITING_PAID`, `carryover_balance_id` set); cross-actor visibility (second operator with `ACCOUNTING_CARRYOVER_VIEW` sees the new rows and linked sessions; unauthorised role sees nothing); side effects (one `CARRYOVER_CREATE` audit_logs row per carryover; `PAYROLL_STATUS_TRANSITION` events); denial paths (operator without `ACCOUNTING_CARRYOVER_MANAGE` rejected; second operator selecting the same already-linked sessions gets `CARRYOVER_SESSION_ALREADY_LINKED`)
  - Verify: `bun run test/scripts/run-test.ts <path>` green, then `bun run test:workflows`
  - Reference: `docs/testing/workflow-journey-tests.md`, `test/workflows/AGENTS.md`
  - _Requirements: US-2 / AC-2.1–AC-2.10, E2, E15_
- [x] TB.2 Journey: accounting operator runs Bulk To Expense on unpaid carryovers → expenses created, carryovers marked paid, sessions transition to `PAID` and the expense becomes visible to the expense-ledger audience (to-expense settlement journey)
  - Create `test/workflows/accounting/carryover-to-expense.journey.test.ts` (test-first; real services + real DB; NO `runInRollback`; committed fixtures in `beforeAll` + tracked hard delete in `afterAll`; cast helper in `test/workflows/helpers/`; spy notification dispatch via `spyOn(NotificationDispatchHelpers, "dispatchWithPreferences")`)
  - Assert: shared-state transitions (`isPaid = true`, sessions `PAID`, expense row with `sourceEntity = carryover_balances`); cross-actor visibility (VIEW-only operator reads paid rows + drill-down sessions; Plan 6 expense readers see the new Salaries expense); side effects (`CARRYOVER_TO_EXPENSE` audit rows; ledger doubled on idempotent re-submit is a no-op); denial paths (`CARRYOVER_ALREADY_PAID` for a concurrent second operator; missing `_MANAGE` rejected)
  - Verify: `bun run test/scripts/run-test.ts <path>` green, then `bun run test:workflows`
  - Reference: `docs/testing/workflow-journey-tests.md`, `test/workflows/AGENTS.md`
  - _Requirements: US-3 / AC-3.1–AC-3.8, E5, E6, E7, E15_
- [x] TB.3 Journey: accounting operator unpays a paid carryover → linked expense soft-deleted, carryover reverted, sessions back to `WAITING_PAID` for the audit-grid audience (unpay correction journey)
  - Create `test/workflows/accounting/carryover-unpay.journey.test.ts` (test-first; real services + real DB; NO `runInRollback`; committed fixtures in `beforeAll` + tracked hard delete in `afterAll`; cast helper in `test/workflows/helpers/`; spy notification dispatch via `spyOn(NotificationDispatchHelpers, "dispatchWithPreferences")`)
  - Assert: shared-state transitions (carryover `isPaid = false` with cleared payment fields; sessions `PAID → WAITING_PAID`; expense soft-deleted); cross-actor visibility (expense disappears from the ledger audience; audit-grid viewers see sessions linked again); side effects (`CARRYOVER_UNPAID` audit row preserved; idempotent when expense already soft-deleted per E17); denial paths (unpay on an already-unpaid carryover rejected; `_MANAGE` enforced)
  - Verify: `bun run test/scripts/run-test.ts <path>` green, then `bun run test:workflows`
  - Reference: `docs/testing/workflow-journey-tests.md`, `test/workflows/AGENTS.md`
  - _Requirements: US-7 / AC-7.1–AC-7.4, E17_
- [x] TB.4 Journey: accounting operator deletes a carryover → linked sessions unlinked and reverted to their prior status on the Plan 4 audit grid while the audit trail survives (delete correction journey)
  - Create `test/workflows/accounting/carryover-delete.journey.test.ts` (test-first; real services + real DB; NO `runInRollback`; committed fixtures in `beforeAll` + tracked hard delete in `afterAll`; cast helper in `test/workflows/helpers/`; spy notification dispatch via `spyOn(NotificationDispatchHelpers, "dispatchWithPreferences")`)
  - Assert: shared-state transitions (`carryover_balance_id = NULL`, session `calculationStatus` reverted from `carryover_balance_items.originalStatus`); cross-actor visibility (sessions selectable again by another operator on the audit grid; deleted carryover gone from the list); side effects (`CARRYOVER_DELETE` audit rows preserved per AC-8.4; bulk delete atomic — one paid row rolls back the whole batch); denial paths (`CARRYOVER_PAID_CANNOT_DELETE`; `_MANAGE` enforced)
  - Verify: `bun run test/scripts/run-test.ts <path>` green, then `bun run test:workflows`
  - Reference: `docs/testing/workflow-journey-tests.md`, `test/workflows/AGENTS.md`
  - _Requirements: US-4 / AC-4.5–AC-4.10, US-8 / AC-8.3–AC-8.4, E8, E9_
- [x] TB.5 4-Tier verification for carryover service/repository files
  - Confirm Tier 1 branch coverage + Tier 4 abuse/permission cases exist and green for: `backend/services/teachers/carryover-balance.service.ts`, `backend/services/teachers/carryover-idempotency.ts`, `backend/services/teachers/carryover-aggregate.ts`, `backend/db/repo/teachers/carryover-balance.repository.ts`, `backend/db/repo/scheduling/class-instances.ts` (new `carryover_balance_id` methods), `backend/db/repo/teachers/teacher.repository.ts` (`isDisabled`), `backend/graphql/query/teachers/carryover.query.ts`, `backend/graphql/mutation/teachers/carryover.mutation.ts`, `app/api/carryover/export/route.ts`
  - Fill gaps via `.agents/skills/write-tests/SKILL.md` + `.agents/skills/test-expert/SKILL.md`; repo tests inside `runInRollback` with `tx` propagation; service tests mock all external channels
  - Verify with `bun run test/scripts/run-test.ts <each test file>`
  - _Requirements: cross-cutting_
- [x] TB.6 Penetration verification (skip only if plan has no new endpoints/mutations)
  - BOLA/IDOR across the roles in this plan (operator acting on another operator's carryovers; teacher-scoped ids in `bulkCreateCarryoverBalances` / `carryoverBalance(id)`); permission denial on all 7 mutations + CSV export route; wildcard/`ILIKE` injection on the teacher-name/`studentsText` search filter (AC-5.5)
  - Via `.agents/skills/pentester/SKILL.md`
  - _Requirements: US-6 / AC-6.1–AC-6.5, NFR-5_
