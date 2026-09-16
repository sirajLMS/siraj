# Plan 7 — Profit & Loss Dashboard: Tasks

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

## Phase 0 — Foundation (permission, indexes, no schema changes)

> Goal: add the `_VIEW` permission + verify the indexes that the
> P&L queries depend on. Zero schema changes — this plan is read-only.

### 0.1 Add `ACCOUNTING_PROFITS_VIEW` permission — [x]
- [x] ✏️ `backend/enum/permissions/permission.enum.ts` — add the new value. **No `_MANAGE` permission is defined** (AC-8.3 — dashboard is read-only).
- [x] ✏️ Permission grant — applied as `backend/db/migration/50-accounting-profits-permissions.sql` + auto-bundled drizzle migration (permission rows/grants are owned by migration SQL, not seeders — seeds/AGENTS.md). Granted to `super_admin` + `academy_admin`.
- [x] 🧪 `backend/enum/permissions/permission.enum.test.ts` — assert the new value parses via `isAppPermission`.
- [x] 🔁 `bun run scripts/health/sub-loop.ts backend/enum/permissions/permission.enum.ts --lifecycle codescene` — exit 0 (also passed for the test file)

### 0.2 Verify required indexes exist — [x]
- [x] 🔁 Read schema files to confirm the indexes listed in implementation.md §2.3 exist:
  - `class_instances_scheduled_start_at_idx` (existing)
  - `class_instances_calculation_status_idx` 🔗 Plan 3
  - `class_instances_teacher_status_scheduled_idx` 🔗 Plan 3
  - `expenses_expense_date_idx` 🔗 Plan 6
  - `expenses_type_expense_date_idx` 🔗 Plan 6
  - `expenses_deleted_at_idx` 🔗 Plan 6
  - `payments_created_at_idx` (existing / Plan 1)
  - `credit_transactions_class_instance_id_idx` 🔗 Plan 2
- ✅ If all exist, no migration is needed for this plan.
- 🆕 (only if any are missing) `backend/db/migrations/<timestamp>_add_profit_loss_indexes.sql` — additive `CREATE INDEX IF NOT EXISTS` statements.
- 🔁 `bun run db:migrate` (if migration was needed)

### 0.3 Phase-0 regression smoke — [x]
- [x] 🔁 `backend/db/test/repo/scheduling/scheduling.repository.test.ts` — 26 pass / 0 fail
- [x] 🔁 `backend/services/teacher/payroll-calculation.service.test.ts` 🔗 Plan 3 — 52 pass / 0 fail
- [x] 🔁 `backend/services/teachers/carryover-balance.service.test.ts` 🔗 Plan 5 (if landed) — 21 pass / 0 fail
- [x] 🔁 `backend/services/expenses/expense.service.test.ts` 🔗 Plan 6 (if landed) — 55 pass / 0 fail
- [x] ✅ Confirm existing flows still pass.

---

## Phase 1 — Service layer

> Goal: `ProfitLossService.getReport` returns the 4-tab payload with
> aggregates, FX conversion, and FX warnings.

### 1.1 Types
- [x] 🆕 `backend/types/billing/profit-loss.types.ts` — `ProfitLossInput`, `ProfitLossPagination`, `ProfitLossPaymentRow`, `ProfitLossPaymentsPage`, `ProfitLossExpenseRow`, `ProfitLossExpensesPage`, `ProfitLossIncomeRow`, `ProfitLossIncomePage`, `ProfitLossSummary`, `FxWarning`, `ProfitLossReport`.
- [x] 🔁 `bun run scripts/health/sub-loop.ts backend/types/billing/profit-loss.types.ts --lifecycle codescene` — exit 0

### 1.2 Repository extensions — class_instances
- [x] ✏️ `backend/db/repo/scheduling/class-instances.ts` — add `findProfitLossPayments({ month, limit, offset })` that runs the joined SQL query (sessions + teachers + students + class_subjects, filtered by `execution_state = COMPLETED` + `calculation_status IN (...)` + `to_char(scheduled_start_at, 'YYYY-MM') = month` + `deleted_at IS NULL`).
- [x] 🧪 `backend/db/test/repo/scheduling/profit-loss-payments.repository.test.ts` — month filter correctness; status filter excludes `NOT_CALCULATED`; pagination.
- [x] 🔁 `bun run scripts/health/sub-loop.ts backend/db/repo/scheduling/class-instances.ts --lifecycle codescene`

### 1.3 Repository extensions — expenses — [x]
- [x] ✏️ `backend/db/repo/expenses/expense.repository.ts` 🔗 Plan 6 — add `findProfitLossExpenses({ month, limit, offset })` (filtered by `expense_date = month` + `deleted_at IS NULL`).
- [x] 🧪 `backend/db/test/repo/expenses/profit-loss-expenses.repository.test.ts` — month filter; soft-delete exclusion; pagination. (+ per-type rowCountByType aggregate derivation; see `outcome/1.3-outcome.md`)
- [x] 🔁 `bun run scripts/health/sub-loop.ts backend/db/repo/expenses/expense.repository.ts --lifecycle codescene`

### 1.4 Repository extensions — payments — [x]
- [x] ✏️ `backend/db/repo/billing/accounting-payment.repository.ts` (path corrected — the plan's `payments.repository.ts` does not exist; helpers in `accounting-payment-helpers.ts`) — added `findProfitLossIncome(filters: { month }, pagination: { limit, offset }, tx?)` (filtered by `to_char(created_at, 'YYYY-MM') = month` + `invoices.deleted_at IS NULL` — payments has no `deleted_at`; joined with students + parents/users + packagePlans, columns per AC-5.2; returns `Omit<ProfitLossIncomePage, "aggregate">` — the FX aggregate is service-side).
- [x] 🧪 `backend/db/test/repo/billing/profit-loss-income.repository.test.ts` — month filter; pagination; joined columns; soft-delete exclusion; null parent name — 5 pass / 0 fail.
- [x] 🔁 `bun run scripts/health/sub-loop.ts backend/db/repo/billing/accounting-payment.repository.ts --lifecycle codescene` — exit 0 (also passed for the test file)

### 1.5 Repository extensions — credit_transactions
- [x] ✏️ `backend/db/repo/billing/credit.repository.ts` 🔗 Plan 2 — added `findSubtractCreditsByInstanceIds(instanceIds, tx?)` returning a `Map<instanceId, { amount, currency }>` for `adjustmentType = Subtract` rows linked to those instances (actual credit repo file — `credit-transactions.repository.ts` does not exist).
- [x] 🧪 `backend/db/test/repo/billing/profit-loss-credit-subtract.repository.test.ts` — returns the right amount per instance; missing instance → not in the map; empty input → empty map; multiple rows sum; non-SUBTRACT rows excluded.
- [x] 🔁 `bun run scripts/health/sub-loop.ts backend/db/repo/billing/credit.repository.ts --lifecycle codescene` — exit 0

### 1.6 FX conversion + aggregation helpers — [x]
- [x] 🆕 `backend/services/accounting/profit-loss-helpers.ts` — `convertCurrency(amount, from, to)` (uses `FxService.getLatestRate`; returns `null` when rate missing), `aggregateWithFx(rows, getAmount, getCurrency, targetCurrency)` → `{ sum, dominantCurrency, excludedRowCount }`, `collectFxWarnings(allRows, targetCurrency)` → `FxWarning[]`, `composeProfitsSummary(currency, payments, expenses, income)` → `ProfitLossSummary`, `validateMonth(month, tErrors)`.
  > Edit complete; the FX read path is `BillingRepository.getLatestExchangeRateForDisplay` (no `FxService.getLatestRate` exists) and `tErrors` is the `ProfitLossLabels` bundle — see `outcome/1.6-outcome.md`.
- [x] 🧪 `backend/services/accounting/profit-loss-helpers.test.ts` — happy path; FX-missing row excluded; Net Profit Margin computed correctly; Net Profit Margin null when Total Payments = 0; month validation rejects bad formats.
- [x] 🔁 `bun run scripts/health/sub-loop.ts backend/services/accounting/profit-loss-helpers.ts --lifecycle codescene` — exit 0 (also passed for the test file and the accounting barrel)

### 1.7 `getReport` orchestrator + per-tab fetchers
- 🆕 `backend/services/accounting/profit-loss.service.ts` — implement `getReport(actorUserId, input, pagination, tErrors)` per §3.2: permission check, month validation, `Promise.all` of the 3 tab fetchers, compose profits summary, collect FX warnings, structured logging. Implement `getPaymentsPage`, `getExpensesPage`, `getIncomePaymentsPage` per §3.3–§3.5.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/accounting/profit-loss.service.ts --lifecycle codescene`

### 1.8 Service tests
- 🧪 `backend/services/accounting/profit-loss.service.test.ts`:
  - Happy path — month with 5 sessions + 3 expenses + 4 income payments → 4-tab payload.
  - Month with no data → all tabs empty; aggregates 0; Net Profit = 0.
  - Mixed currencies (USD + EUR rows) → FX conversion; per-row `convertedAmount` set; excluded rows counted.
  - FX rate missing → row excluded; `fxWarnings` populated; warning chip rendered.
  - Soft-deleted expenses excluded.
  - `NOT_CALCULATED` sessions excluded from Payments tab.
  - Manual subtract credits summed per session.
  - Net Profit Margin positive / negative / null.
  - Permission denied → `InsufficientPermissions`.
  - `MONTH_INVALID` validation rejection.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/accounting/profit-loss.service.test.ts --lifecycle codescene`
- 🔁 `bun test backend/services/accounting/profit-loss.service.test.ts`

### 1.9 Phase-1 acceptance
- ✅ All service tests green.
- ✅ Existing tests still green (no regression). 🔗 Plans 1, 2, 3, 5, 6
- ✅ `sub-loop` exit 0 on every touched file.

---

## Phase 2 — GraphQL layer (single multi-tab query)

### 2.1 Pothos types
- 🆕 `backend/graphql/pothos/accounting/profit-loss.pothos.ts` — `ProfitLossPaymentRowPothosObject`, `ProfitLossPaymentsPagePothosObject`, `ProfitLossExpenseRowPothosObject`, `ProfitLossExpensesPagePothosObject`, `ProfitLossIncomeRowPothosObject`, `ProfitLossIncomePagePothosObject`, `ProfitLossSummaryPothosObject`, `FxWarningPothosObject`, `ProfitLossReportPothosObject`.
- ✏️ `backend/graphql/pothos/accounting/index.ts` — re-export.
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/pothos/accounting/profit-loss.pothos.ts --lifecycle codescene`

### 2.2 Single multi-tab query
- 🆕 `backend/graphql/query/accounting/profit-loss.query.ts` — `profitLossReport(month, currency, paymentsLimit, paymentsOffset, expensesLimit, expensesOffset, incomePaymentsLimit, incomePaymentsOffset)` field; `authScopes: { permission: ACCOUNTING_PROFITS_VIEW }`; resolves via `ProfitLossService.getReport`.
- ✏️ `backend/graphql/query/accounting/index.ts` — re-export.
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/query/accounting/profit-loss.query.ts --lifecycle codescene`

### 2.3 Query tests
- 🧪 `backend/graphql/query/accounting/profit-loss.query.test.ts`:
  - Returns the 4-tab payload shape; respects pagination args.
  - Permission denied → GraphQL error.
  - Missing required `month` / `currency` args → GraphQL validation error.
  - Invalid `month` format → `MONTH_INVALID` GraphQL error.
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/query/accounting/profit-loss.query.test.ts --lifecycle codescene`
- 🔁 `bun test backend/graphql/query/accounting/profit-loss.query.test.ts`

### 2.4 CSV export routes (one per tab)
- 🆕 `app/api/profit-loss/payments/export/route.ts` — calls `ProfitLossService.getReport` with `paymentsLimit: 10_000`; serializes Payments tab to CSV; sets `Content-Type` + `Content-Disposition` + `X-Export-Truncated` headers.
- 🆕 `app/api/profit-loss/expenses/export/route.ts` — same shape for Expenses tab.
- 🆕 `app/api/profit-loss/income/export/route.ts` — same shape for Income Payments tab.
- 🆕 `app/api/profit-loss/summary/export/route.ts` — serializes the 4-row Profits summary to CSV.
- 🧪 `app/api/profit-loss/<tab>/export/route.test.ts` (×4) — happy path returns CSV; permission denied returns 403; truncation header set when `totalCount > 10_000`.
- 🔁 `bun run scripts/health/sub-loop.ts "app/api/profit-loss/payments/export/route.ts" --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts "app/api/profit-loss/expenses/export/route.ts" --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts "app/api/profit-loss/income/export/route.ts" --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts "app/api/profit-loss/summary/export/route.ts" --lifecycle codescene`

### 2.5 Phase-2 acceptance
- ✅ GraphQL schema builds (`bun run graphql:build`).
- ✅ Codegen (`bun run graphql:codegen`) produces typed `ProfitLossReportQuery` hook.

---

## Phase 3 — Navigation, routes, i18n (shell)

> Goal: route exists, nav item renders, permission gating works. No tabs yet.

### 3.1 Page-permission entries
- [x] ✏️ `frontend/common/types/page-permissions.types.ts` — add `accountingProfitsView`. **No `_MANAGE` entry** (AC-8.3).
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/types/page-permissions.types.ts --lifecycle codescene`

### 3.2 Sidebar nav item
- [x] ✏️ `frontend/common/views/dashboard/config/navigationConfig.ts` — add `accounting-profits` item to `SIDEBAR_NAV_ITEMS` under `grp_finance`; add `AppPermission.ACCOUNTING_PROFITS_VIEW` to `grp_finance` group `permission` array.
  > Edit complete; sub-loop passes exit 0 — the `accountingProfits` label key
  > was registered in `DashboardNavigationLabels` (`dashboard.core.nav`) with
  > EN "Profit & Loss" / AR "الأرباح والخسائر" and snapshots regenerated (see
  > `outcome/3.2-nav-key-fix-outcome.md`).
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/config/navigationConfig.ts --lifecycle codescene`

### 3.3 i18n namespace
- [x] 🆕 `shared/locale/namespaces/dashboard/accounting/profit-loss.namespace.ts` — define all keys (EN + AR) per implementation.md §7.1.
- [x] 🆕 `shared/locale/en/dashboard/accounting/profitLoss.ts` — EN translations.
- [x] 🆕 `shared/locale/ar/dashboard/accounting/profitLoss.ts` — AR translations.
- [x] 🔁 `bun run scripts/health/sub-loop.ts shared/locale/namespaces/dashboard/accounting/profit-loss.namespace.ts --lifecycle codescene` (also run on the type schema and both leaf files — all exit 0; see `outcome/3.3-3.4-outcome.md`)

### 3.4 Locale snapshot
- [x] 🔁 `bun run locale:snapshots` — generate `public/static/locale-snapshots/{en,ar}/dashboard.accounting.profitLoss.json`.
- [x] ✅ Verify snapshots committed.

### 3.5 Route shell
- 🆕 `app/(dashboard)/accounting/profits/page.tsx` — server component that renders `<ProfitLossDashboard />`.
- 🔁 `bun run scripts/health/sub-loop.ts "app/(dashboard)/accounting/profits/page.tsx" --lifecycle codescene`

### 3.6 Phase-3 acceptance
- ✅ `/accounting/profits` renders (with permission) / 403 (without).
- ✅ Sidebar "P&L" item visible only with `ACCOUNTING_PROFITS_VIEW`.
- ✅ AR/EN snapshots exist.

---

## Phase 4 — Dashboard shell + global filter bar

### 4.1 Apollo document
- 🆕 `frontend/common/graphql/sharedDocuments/accounting/profit-loss.documents.ts` — `PROFIT_LOSS_REPORT_QUERY`.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/graphql/sharedDocuments/accounting/profit-loss.documents.ts --lifecycle codescene`

### 4.2 View-model hook
- 🆕 `frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel.ts` — manages Apollo query state, filter state (Zustand with `persist`), pagination per tab, tab state, FX-warning aggregation.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel.ts --lifecycle codescene`

### 4.3 Zustand store (persisted)
- 🆕 `frontend/common/stores/profitLossFilterStore.ts` — `month`, `currency`, `activeTab`, `paymentsPage`, `expensesPage`, `incomePage`, `pageSize`; `setMonth`, `setCurrency`, `setActiveTab`, `setPaymentsPage`, `setExpensesPage`, `setIncomePage`, `reset`. With `persist` middleware (localStorage key: `profit-loss-filter`).
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/stores/profitLossFilterStore.ts --lifecycle codescene`

### 4.4 Global filter bar
- 🆕 `frontend/common/views/dashboard/accounting/profit-loss/GlobalFilterBar.tsx` — MUI `DatePicker` (month mode, `YYYY-MM`), MUI `Autocomplete` for currency, FX-warning chip (with tooltip listing the currency pairs), URL search params sync (`?month=...&currency=...`).
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/profit-loss/GlobalFilterBar.tsx --lifecycle codescene`

### 4.5 Dashboard shell + tabs
- 🆕 `frontend/common/views/dashboard/accounting/profit-loss/ProfitLossDashboard.tsx` — composes GlobalFilterBar + MUI `Tabs` + active tab content; uses `useProfitLossViewModel`; Apollo `useQuery(PROFIT_LOSS_REPORT, { variables, fetchPolicy: 'cache-and-network', notifyOnNetworkStatusChange: true })`.
- 🆕 `frontend/desktop/views/dashboard/accounting/profit-loss/profitLoss.desktop.tsx` + `frontend/mobile/views/dashboard/accounting/profit-loss/profitLoss.mobile.tsx` — responsive view variants.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/profit-loss/ProfitLossDashboard.tsx --lifecycle codescene`

### 4.6 Dashboard tests
- 🧪 `frontend/common/views/dashboard/accounting/profit-loss/ProfitLossDashboard.test.tsx` — renders 4 tabs; default tab = Payments; month filter defaults to current month; changing the month refetches the single query; tab switching is instant (no extra network call); FX warning chip rendered when `fxWarnings.length > 0`; URL search params updated.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/profit-loss/ProfitLossDashboard.test.tsx --lifecycle codescene`
- 🔁 `bun test frontend/common/views/dashboard/accounting/profit-loss/ProfitLossDashboard.test.tsx`

---

## Phase 5 — Per-tab tables + summary

### 5.1 Payments tab
- 🆕 `frontend/common/views/dashboard/accounting/profit-loss/PaymentsTab.tsx` — MUI `DataGrid` v9 with columns per AC-3.2; footer (Total Payments + dominant currency + excluded row count + Export CSV button); row click → `router.push('/classes/[id]/audit')` 🔗 Plan 4.
- 🆕 `frontend/common/views/dashboard/accounting/profit-loss/CalculationStatusChip.tsx` — small chip for the session's `calculationStatus` (reuses Plan 3's chip if available; otherwise a local variant).
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/profit-loss/PaymentsTab.tsx --lifecycle codescene`

### 5.2 Expenses tab
- 🆕 `frontend/common/views/dashboard/accounting/profit-loss/ExpensesTab.tsx` — MUI `DataGrid` v9 with columns per AC-4.2; reuses Plan 6's `ExpenseTypeChip` + `ExpenseSourceChip` (🔗 Plan 6); footer (Total Expenses + dominant currency + count-by-type + Export CSV button); row click → `router.push('/accounting/expenses/[id]')` 🔗 Plan 6; "From Carryover" chip click → opens Plan 5's CarryoverDetailDrawer.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/profit-loss/ExpensesTab.tsx --lifecycle codescene`

### 5.3 Income Payments tab
- 🆕 `frontend/common/views/dashboard/accounting/profit-loss/IncomePaymentsTab.tsx` — MUI `DataGrid` v9 with columns per AC-5.2; footer (Total Income Payments + dominant currency + excluded row count + Export CSV button); row click → `router.push('/billing/invoices?invoiceId=...')` or `/students/[id]`.
- 🆕 `frontend/common/views/dashboard/accounting/profit-loss/PaymentMethodChip.tsx` — small chip for the payment method (reuses existing chip if available).
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/profit-loss/IncomePaymentsTab.tsx --lifecycle codescene`

### 5.4 Profits tab
- 🆕 `frontend/common/views/dashboard/accounting/profit-loss/ProfitsTab.tsx` — single summary table with 4 rows (Income Payments, Total Payments, Total Expenses, Net Profit); Net Profit row colored green/red/grey per AC-6.3; Net Profit Margin percentage displayed next to Net Profit when `Total Payments > 0`; "Export CSV" button → `/api/profit-loss/summary/export?...`.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/profit-loss/ProfitsTab.tsx --lifecycle codescene`

### 5.5 Empty state component
- 🆕 `frontend/common/views/dashboard/accounting/profit-loss/EmptyMonthState.tsx` — rendered when all tabs are empty for the selected month (E16).
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/profit-loss/EmptyMonthState.tsx --lifecycle codescene`

### 5.6 Tab tests
- 🧪 `frontend/common/views/dashboard/accounting/profit-loss/PaymentsTab.test.tsx` — renders rows; footer shows Total Payments; row click navigates correctly; Export CSV button hits the right URL.
- 🧪 `frontend/common/views/dashboard/accounting/profit-loss/ExpensesTab.test.tsx` — renders rows; "From Carryover" chip opens CarryoverDetailDrawer; row click navigates correctly.
- 🧪 `frontend/common/views/dashboard/accounting/profit-loss/IncomePaymentsTab.test.tsx` — renders rows; row click navigates correctly.
- 🧪 `frontend/common/views/dashboard/accounting/profit-loss/ProfitsTab.test.tsx` — summary table renders 4 rows; Net Profit colored green/red/grey; Net Profit Margin displayed correctly.
- 🔁 `bun run scripts/health/sub-loop.ts <each-tab.test.tsx> --lifecycle codescene`
- 🔁 `bun test <each-tab.test.tsx>`

### 5.7 Phase-5 acceptance
- ✅ All 4 tabs render with real data (smoke test against dev DB).
- ✅ Tab switching is instant (no extra network call observed in the Network panel).
- ✅ CSV exports work for each tab.
- ✅ Drill-down navigation works (Payments → /classes/[id]/audit; Expenses → /accounting/expenses/[id]; Income Payments → /billing/invoices).
- ✅ "From Carryover" chip opens CarryoverDetailDrawer when Plan 5 is landed.

---

## Phase 6 — Cross-plan drill-downs + integration

### 6.1 Plan 4 audit page integration
- ✏️ `frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard.tsx` 🔗 Plan 4 — when navigated to from the P&L Payments tab, scroll to / highlight the Payroll Calculation card (reuse Plan 3's card on the existing audit page).
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard.tsx --lifecycle codescene`

### 6.2 Plan 5 CarryoverDetailDrawer integration
- ✏️ `frontend/common/views/dashboard/accounting/profit-loss/ExpensesTab.tsx` — wire the "From Carryover" chip click to open Plan 5's `CarryoverDetailDrawer` (rendered via a portal/overlay at the dashboard root).
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/profit-loss/ExpensesTab.tsx --lifecycle codescene`

### 6.3 Plan 6 ExpenseDetailDrawer integration
- ✏️ `frontend/common/views/dashboard/accounting/profit-loss/ExpensesTab.tsx` — wire the row click to navigate to `/accounting/expenses/[id]` (Plan 6's existing detail page) rather than rendering a separate drawer.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/profit-loss/ExpensesTab.tsx --lifecycle codescene`

### 6.4 Phase-6 acceptance
- ✅ Drill-downs work end-to-end across plans 4, 5, 6.
- ✅ No regression in those plans' tests.

---

## Phase 7 — i18n polish, accessibility, observability

### 7.1 Full key coverage
- ✏️ `shared/locale/namespaces/dashboard/accounting/profit-loss.namespace.ts` — confirm every user-visible string has EN + AR (per implementation.md §7.1 table).
- 🔁 `bun run locale:validate` — fail if any key missing in either locale.

### 7.2 Accessibility pass
- ✏️ `ProfitLossDashboard.tsx` — MUI `Tabs` keyboard-navigable; tab change announced via `aria-label`.
- ✏️ `GlobalFilterBar.tsx` — month picker + currency picker keyboard-navigable with `aria-label`.
- ✏️ Per-tab DataGrids — sortable columns announced; status chips have `aria-label` with full text.
- ✏️ `ProfitsTab.tsx` — summary table uses `<th scope="row">` for screen-reader row identification.
- 🧪 Tab tests — add axe-core assertions (existing project pattern).
- 🔁 `bun run scripts/health/sub-loop.ts <each-tab.tsx> --lifecycle codescene`

### 7.3 RTL pass
- ✏️ Confirm AR locale renders RTL; month picker + currency picker align right; tabs render right-to-left; summary table values align right.
- 🧪 `ProfitLossDashboard.test.tsx` — RTL snapshot matches expected.

### 7.4 Structured logging
- ✏️ `backend/services/accounting/profit-loss.service.ts` — confirm structured `logger.info` on every `getReport` invocation (NFR-11).
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/accounting/profit-loss.service.ts --lifecycle codescene`

---

## Phase 8 — End-to-end & regression

### 8.1 E2E test
- 🧪 `e2e/accounting/profit-loss.spec.ts` (Playwright, if project uses it):
  - Log in as accounting operator.
  - Navigate to `/accounting/profits`; verify the 4 tabs render.
  - Verify the month filter defaults to the current month.
  - Pick a previous month → verify all tabs refetch.
  - Click the Payments tab → verify rows + Total Payments footer.
  - Click a row → verify navigation to `/classes/[id]/audit`.
  - Click the Expenses tab → verify rows + Total Expenses footer.
  - Click the Income Payments tab → verify rows + Total Income Payments footer.
  - Click the Profits tab → verify the 4-row summary; Net Profit colored correctly.
  - Change the currency picker → verify all tabs refetch with FX-converted amounts.
  - Pick a currency with no FX rate for some rows → verify the warning chip renders.
  - Click "Export CSV" on the Payments tab → verify the downloaded file has the expected rows.
- 🔁 `bun run scripts/health/sub-loop.ts e2e/accounting/profit-loss.spec.ts --lifecycle codescene`

### 8.2 Regression suite
- 🔁 `bun test backend/db/test/repo/scheduling/scheduling.repository.test.ts`
- 🔁 `bun test backend/db/test/repo/expenses/expense.repository.test.ts` 🔗 Plan 6
- 🔁 `bun test backend/services/teachers/payroll-calculation.service.test.ts` 🔗 Plan 3
- 🔁 `bun test backend/services/teachers/carryover-balance.service.test.ts` 🔗 Plan 5
- 🔁 `bun test backend/services/expenses/expense.service.test.ts` 🔗 Plan 6
- 🔁 `bun test backend/services/accounting/profit-loss.service.test.ts`
- 🔁 `bun test backend/graphql/query/accounting/profit-loss.query.test.ts`
- 🔁 `bun test frontend/common/views/dashboard/accounting/profit-loss/ProfitLossDashboard.test.tsx`

### 8.3 Full quality gate
- 🔁 Run project-wide `lint`, `typecheck`, `test`, `build`.
- 🔁 `bun run scripts/health/sub-loop.ts <each-new-file> --lifecycle codescene` for every file created/edited in Phases 0–7.

### 8.4 Performance rehearsal on staging
- 🔁 Seed a staging DB with a "large month" fixture (5 000 sessions + 100 expenses + 200 income payments).
- 🔁 Measure the `profitLossReport` query p95 latency (target: < 800 ms per NFR-2).
- 🔁 If p95 > 800 ms, profile the SQL queries; consider adding the missing indexes identified in §2.3.

---

## Definition of Done

- [ ] All Phase 0–8 tasks complete.
- [ ] Every touched file passes `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0).
- [ ] `specs.md` acceptance criteria AC-1.1 … AC-8.4 each have a passing test.
- [ ] Edge cases E1–E20 each covered by a test or explicit "won't happen" note.
- [ ] No schema migrations produced (read-only plan) — or only additive index migrations if any were missing.
- [ ] EN + AR locale snapshots committed.
- [ ] Existing scheduling / payroll / carryover / expense flows regression-green. 🔗 Plans 3, 5, 6
- [ ] The `profitLossReport` query returns a single payload with all 4 tabs (US-7).
- [ ] No mutation UI anywhere on the dashboard (AC-8.3 + AC-8.4).
- [ ] p95 latency of `profitLossReport` is < 800 ms on a typical month (NFR-2).

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

## Cross-plan handoff checklist (for Plans 1, 2, 3, 5, 6 owners)

- [ ] `ACCOUNTING_PROFITS_VIEW` permission registered.
- [ ] `profitLossReport` GraphQL query live.
- [ ] 4 CSV export routes live: `/api/profit-loss/{payments,expenses,income,summary}/export`.
- [ ] EN + AR locale snapshots for `dashboard.accounting.profitLoss`.
- [ ] 🔗 Plan 1 (`payments`) — `payments.created_at` indexed; `payments.deleted_at` filtered out.
- [ ] 🔗 Plan 2 (`credit-adjustment-system`) — `credit_transactions.class_instance_id` indexed; `adjustmentType = Subtract` rows fetchable by instance ids.
- [ ] 🔗 Plan 3 (`teacher-payroll-engine`) — `class_instances.calculation_status` indexed; `teacher_paid_amount` + `teacher_paid_currency` + `calculated_duration` readable.
- [ ] 🔗 Plan 5 (`carryover-balance-module`) — `carryover_balances.id` queryable for the "From Carryover" drill-down; `CarryoverDetailDrawer` component importable.
- [ ] 🔗 Plan 6 (`expense-ledger`) — `expenses.expense_date` + `expenses.deleted_at` indexed; `ExpenseTypeChip` + `ExpenseSourceChip` + `ExpenseDetailDrawer` components importable.
- [ ] Existing FX module — `FxService.getLatestRate(from, to)` callable.

---

## Test Coverage Backfill: Cross-Actor Journeys & 4-Tier Enforcement

> Closes the gap between this plan and the enforced test kinds added later to the spec process
> (.agents/skills/spec-implementation/SKILL.md → "Plan Intake" items 5-7 + "Test-Layer Coverage
> Gate"; docs/testing/workflow-journey-tests.md). Existing tasks are unchanged; these tasks are
> additive and execute before this plan is treated as test-complete.

- [ ] TB.1 Journey: student/parent cash-in payment recorded → executive sees it in Income Payments + Profits summary (cash-in visibility)
  - Create `test/workflows/accounting/profit-loss-cash-in-visibility.test.ts` (test-first; real services + real DB; NO `runInRollback`; committed fixtures in `beforeAll` — student, parent, package, `payments` row via the real billing/payment service — + tracked hard delete in `afterAll`; cast helper in `test/workflows/helpers/`; spy notification dispatch via `spyOn(NotificationDispatchHelpers, "dispatchWithPreferences")` and assert none are dispatched — this plan explicitly defers notifications)
  - Assert: shared-state transitions (a payment recorded by the billing actor appears in `ProfitLossService.getReport`'s `incomePaymentsPage` and `profitsSummary.incomePayments` for that month and no other month), cross-actor visibility (executive with `ACCOUNTING_PROFITS_VIEW` sees it; payment actor's own view unchanged), side effects (Total Income Payments + Net Profit aggregates move correctly), denial paths (same query as a user without the permission is rejected before any data is read)
  - Verify: `bun run test/scripts/run-test.ts test/workflows/accounting/profit-loss-cash-in-visibility.test.ts` green, then `bun run test:workflows`
  - Reference: `docs/testing/workflow-journey-tests.md`, `test/workflows/AGENTS.md`
  - _Requirements: US-5 (AC-5.1–AC-5.3), US-6 (AC-6.1), US-8 (AC-8.1, AC-8.2)_
- [ ] TB.2 Journey: teacher session completed + payroll/deduction calculated → executive sees earned revenue in Payments tab (earned-revenue visibility)
  - Create `test/workflows/accounting/profit-loss-earned-revenue.test.ts` (test-first; real services + real DB; NO `runInRollback`; committed fixtures in `beforeAll` — teacher, student, class instance driven to `executionState = COMPLETED` + an allowed `calculationStatus` via the real payroll-calculation path 🔗 Plan 3, plus a manual subtract credit via Plan 2's credit-adjustment path — + tracked hard delete in `afterAll`; cast helper in `test/workflows/helpers/`; spy `dispatchWithPreferences` and assert none dispatched from the read path)
  - Assert: shared-state transitions (completed+calculated session surfaces in `paymentsPage` with the subtract credit summed into Total Payments; `NOT_CALCULATED` sessions do NOT surface), cross-actor visibility (executive sees it; teacher/student roles cannot call `profitLossReport`), side effects (Total Payments and Net Profit move correctly), denial paths for unauthorized actors
  - Verify: `bun run test/scripts/run-test.ts test/workflows/accounting/profit-loss-earned-revenue.test.ts` green, then `bun run test:workflows`
  - Reference: `docs/testing/workflow-journey-tests.md`, `test/workflows/AGENTS.md`
  - _Requirements: US-3 (AC-3.1–AC-3.3), US-6 (AC-6.1), US-8 (AC-8.1, AC-8.2)_
- [ ] TB.3 Journey: manager records expense / carryover settlement auto-generates Salaries expense → executive sees it in Expenses tab and Net Profit drops (expense visibility)
  - Create `test/workflows/accounting/profit-loss-expense-visibility.test.ts` (test-first; real services + real DB; NO `runInRollback`; committed fixtures in `beforeAll` — one manual expense via the real expense service 🔗 Plan 6, one carryover-sourced `Salaries` expense via the real carryover settlement path 🔗 Plan 5 — + tracked hard delete in `afterAll`; cast helper in `test/workflows/helpers/`; spy `dispatchWithPreferences` and assert none dispatched from the read path)
  - Assert: shared-state transitions (both expense kinds appear in `expensesPage` for `expenseDate` month; the carryover one carries its source linkage; soft-deleted expenses disappear), cross-actor visibility (executive sees them; the manager without `ACCOUNTING_PROFITS_VIEW` does not gain report access), side effects (Total Expenses + Net Profit recompute correctly), denial paths for unauthorized actors
  - Verify: `bun run test/scripts/run-test.ts test/workflows/accounting/profit-loss-expense-visibility.test.ts` green, then `bun run test:workflows`
  - Reference: `docs/testing/workflow-journey-tests.md`, `test/workflows/AGENTS.md`
  - _Requirements: US-4 (AC-4.1–AC-4.5), US-6 (AC-6.1–AC-6.3), US-8 (AC-8.1, AC-8.2), NFR-9_
- [ ] TB.4 4-Tier verification for P&L service, repository extensions, GraphQL query, and CSV export routes
  - Confirm Tier 1 branch coverage + Tier 4 abuse/permission cases exist and green for: `backend/services/accounting/profit-loss.service.ts`, `backend/services/accounting/profit-loss-helpers.ts`, `backend/db/repo/scheduling/class-instances.ts` (`findProfitLossPayments`), `backend/db/repo/expenses/expense.repository.ts` (`findProfitLossExpenses`), `backend/db/repo/billing/payments.repository.ts` (`findProfitLossIncome`), `backend/db/repo/billing/credit-transactions.repository.ts` (`findSubtractCreditsByInstanceIds`), `backend/graphql/query/accounting/profit-loss.query.ts`, `app/api/profit-loss/{payments,expenses,income,summary}/export/route.ts`
  - Fill gaps via `.agents/skills/write-tests/SKILL.md` + `.agents/skills/test-expert/SKILL.md`; repo tests inside `runInRollback` with `tx` propagation; service tests mock all external channels (FX service)
  - Verify with `bun run test/scripts/run-test.ts <each test file>`
  - _Requirements: US-2 (AC-2.3, AC-2.4), US-3, US-4, US-5, US-6, US-7 (AC-7.1–AC-7.6), US-8, NFR-9, NFR-12, E2, E13, E14, E17, E19 — cross-cutting across the read model_
- [ ] TB.5 Penetration verification (plan adds a new GraphQL query + 4 new CSV export endpoints)
  - BOLA/IDOR across the roles in this plan (`profitLossReport` + CSV exports must not leak financial rows to teacher/student/parent/manager roles lacking `ACCOUNTING_PROFITS_VIEW`); permission denial on every export route (403 without the permission); wildcard/regex injection on the `month` argument (`YYYY-MM` validation must reject patterns like `%`, `.*`, `2024-1`, `2024-13`); CSV formula-injection check on exported cells
  - Via `.agents/skills/pentester/SKILL.md`
  - _Requirements: US-8 (AC-8.1–AC-8.4), NFR-5, AC-2.x (E11), E13_
