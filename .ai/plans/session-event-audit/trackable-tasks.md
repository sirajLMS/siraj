# Plan 4 — Session Event Audit Enhancement: Tasks

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
>
> **Zero schema migrations.** This plan is a pure read-model projection
> over the existing `class_instances` table + Plan 3's payroll columns.

---

## Legend

- 🆕 = new file
- ✏️  = edit existing file
- 🧪 = test file
- 🔁  = run a command / quality loop
- 🔗  = cross-plan dependency (Plan 3 `teacher-payroll-engine`)

---

## Phase 0 — Foundation (permissions only — no schema changes)

> Goal: register the new permissions and the status-mapper utility so
> every later phase can consume them. No DB migration needed.

### 0.1 Add `ACCOUNTING_REPORTS_VIEW` + `ACCOUNTING_REPORTS_MANAGE` permissions
- ✏️ `backend/enum/permissions/permission.enum.ts` — add both new values.
- ✏️ `backend/db/seeds/auth/seed-user-permission-overrides.ts` (or wherever permission-groups are seeded) — grant both to the "Accounting" / "Finance Manager" default group.
- 🧪 `backend/enum/permissions/permission.enum.test.ts` — assert both new values parse via `isAppPermission`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/enum/permissions/permission.enum.ts --lifecycle codescene`

### 0.2 Add `mapToSessionAuditStatus` mapper (the heart of this plan)
- 🆕 `shared/constants/classes/session-audit-status.ts` — pure function: `mapToSessionAuditStatus(executionState, outcome, actualStartAt) → SessionAuditStatus`. Plus the `SessionAuditStatus` type and the `STATUS_TO_PREDICATE_KEY` inverse-mapper constant.
- 🧪 `shared/constants/classes/session-audit-status.test.ts` — full coverage matrix per specs AC-2.2 … AC-2.8 (every branch + null inputs + every `ON_DEMAND_*` variant).
- 🔁 `bun run scripts/health/sub-loop.ts shared/constants/classes/session-audit-status.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts shared/constants/classes/session-audit-status.test.ts --lifecycle codescene`

### 0.3 Confirm Plan 3 prerequisites are met 🔗
- ✏️ read `backend/db/schema/classes/scheduling.ts` — confirm the 8 Plan 3 payroll columns (`calculatedDuration`, `teacherPaidAmount`, `teacherPaidCurrency`, `calculationStatus`, `isPartialPercentage`, `payrollNote`, `payrollCalculatedAt`, `payrollCalculatedBy`) are present.
- ✏️ read `backend/graphql/pothos/teachers/payroll.pothos.ts` (Plan 3) — confirm `CalculationStatusPothosEnum` is exported.
- 🔗 If Plan 3 is not yet merged, document the graceful-degradation behavior (payroll fields return `null`; status still maps) in the service test and proceed.

### 0.4 Phase-0 regression smoke
- 🔁 `bun test backend/enum/permissions/permission.enum.test.ts`
- 🔁 `bun test shared/constants/classes/session-audit-status.test.ts`
- ✅ Existing scheduling / reports flows still pass (no schema touched).

---

## Phase 1 — Service layer (read model + repository)

> Goal: `SessionAuditService.getReport` + `SessionAuditRepository.findReportRows`
> with full filter expansion, sort, pagination, and aggregates.

### 1.1 Types
- 🆕 `backend/types/accounting/session-audit.types.ts` — add `SessionAuditStatus`, `SessionAuditReportFilters`, `SessionAuditReportSort`, `SessionAuditReportRow`, `SessionAuditReportPage`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/types/accounting/session-audit.types.ts --lifecycle codescene`

### 1.2 Status inverse-mapper (SQL predicate expansion)
- 🆕 `backend/services/accounting/session-audit-status-predicate.ts` — `expandStatusesToSql(statuses)` returns a Drizzle SQL fragment that ORs together the matching `(execution_state, outcome, actual_start_at IS [NOT] NULL)` triples for each requested status. The `"open"` branch is a `NOT IN` predicate (everything not in the terminal set).
- 🧪 `backend/services/accounting/session-audit-status-predicate.test.ts` — each status value produces the correct SQL fragment text; multiple statuses OR together correctly; empty list returns a `sql.true` fragment.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/accounting/session-audit-status-predicate.ts --lifecycle codescene`

### 1.3 Repository — single joined query
- 🆕 `backend/db/repo/scheduling/session-audit.repository.ts` — `findReportRows(filters, sort, pagination)` builds the WHERE + ORDER BY + LIMIT/OFFSET, INNER JOINs `teachers + users + students + users + class_subjects`, LEFT JOINs `teacher_dues` for the payment-date tooltip. Returns `{ rows, totalCount }`.
- 🧪 `backend/db/test/repo/scheduling/session-audit.repository.test.ts`:
  - Happy path — single page of 50 rows.
  - Filter by teacher / student / date range / status multi-select (each + combined).
  - Sort by every sortable field (asc + desc).
  - Sort by `teacherPaidAmount` puts nulls first (asc) / last (desc).
  - Pagination (limit/offset); clamp beyond last page.
  - Soft-delete RLS excludes deleted rows by default.
  - `includeDeleted=true` (admin) includes soft-deleted rows.
  - `search` matches teacher + student name (case-insensitive).
  - LEFT JOIN populates `teacherDuePaymentDate` only when `calculation_status = 'PAID'`.
  - No N+1 — single SELECT + single COUNT (assert via query count helper).
- 🔁 `bun run scripts/health/sub-loop.ts backend/db/repo/scheduling/session-audit.repository.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts backend/db/test/repo/scheduling/session-audit.repository.test.ts --lifecycle codescene`

### 1.4 Service — `getReport` + aggregates
- 🆕 `backend/services/accounting/session-audit.service.ts` — `getReport(actorUserId, filters, sort, pagination, tErrors)` enforces `ACCOUNTING_REPORTS_VIEW`, validates filters/sort/pagination, calls repository, computes page-level aggregates (`rowCountByStatus`, `rowCountByPaid`, `totalPaidAmount`, `totalPaidCurrency`).
- 🧪 `backend/services/accounting/session-audit.service.test.ts`:
  - Happy path returns page + aggregates.
  - Filter validation — `dateFrom > dateTo` → validation error.
  - Pagination clamp — `offset > totalCount` → clamps to last page.
  - Graceful degradation — payroll columns null when Plan 3 not deployed.
  - Permission denied → `InsufficientPermissions`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/accounting/session-audit.service.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/accounting/session-audit.service.test.ts --lifecycle codescene`
- 🔁 `bun test backend/services/accounting/session-audit.service.test.ts`

### 1.5 CSV serializer
- 🆕 `backend/services/accounting/session-audit-csv.serializer.ts` — pure function `serializeSessionAuditCsv(rows: readonly SessionAuditReportRow[]): string`. RFC 4180 compliant.
- 🧪 `backend/services/accounting/session-audit-csv.serializer.test.ts`:
  - Happy path — header + 3 rows.
  - Cell with comma → wrapped in quotes.
  - Cell with quote → doubled + wrapped.
  - Cell with newline → wrapped in quotes.
  - Empty rows array → header only.
  - Null payroll fields → empty cell.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/accounting/session-audit-csv.serializer.ts --lifecycle codescene`

### 1.6 Phase-1 acceptance
- ✅ All service + repository tests green.
- ✅ Existing `reports.service.test.ts` (the existing `/reports` page service) still green (no regression).
- ✅ `sub-loop` exit 0 on every touched file.

---

## Phase 2 — GraphQL layer

### 2.1 Pothos types
- 🆕 `backend/graphql/pothos/accounting/session-audit.pothos.ts` — `SessionAuditStatusPothosEnum`, `SessionAuditReportFilterPothosInput`, `SessionAuditReportSortPothosInput` (+ `SessionAuditReportSortFieldPothosEnum` + `SortDirectionPothosEnum`), `SessionAuditReportRowPothosObject`, `SessionAuditReportPagePothosObject`. Reuses Plan 3's `CalculationStatusPothosEnum` for the `calculationStatus` field.
- ✏️ `backend/graphql/pothos/shared/enum.pothos.ts` — register `SessionAuditStatusPothosEnum` (per `backend/enum/AGENTS.md` §Adding New Enums step 5) so GraphQL codegen picks it up.
- 🆕 `backend/graphql/pothos/accounting/index.ts` — re-export via `export * from "./session-audit.pothos";`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/pothos/accounting/session-audit.pothos.ts --lifecycle codescene`

### 2.2 Query
- 🆕 `backend/graphql/query/accounting/session-audit.query.ts` — `sessionAuditReport(filter, sort, limit, offset)` field with `authScopes: { permission: ACCOUNTING_REPORTS_VIEW }`.
- 🆕 `backend/graphql/query/accounting/index.ts` — re-export.
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/query/accounting/session-audit.query.ts --lifecycle codescene`

### 2.3 Query tests
- 🧪 `backend/graphql/query/accounting/session-audit.query.test.ts`:
  - Returns page shape with all fields populated (happy path).
  - Respects `limit`/`offset`/`sort`.
  - Returns null payroll fields gracefully when Plan 3 not deployed (mock `calculationStatus` as null).
  - Permission denied → GraphQL error.
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/query/accounting/session-audit.query.test.ts --lifecycle codescene`
- 🔁 `bun test backend/graphql/query/accounting/session-audit.query.test.ts`

### 2.4 CSV export route
- 🆕 `app/api/accounting/reports/export/route.ts` — Next.js Route Handler; calls `requireAuth` + `requirePermission(ACCOUNTING_REPORTS_VIEW)`; parses query params into filters/sort/pagination; calls `SessionAuditService.getReport` with `limit: 10_000`; serializes CSV; sets `Content-Type` + `Content-Disposition` + `X-Export-Truncated` headers.
- 🧪 `app/api/accounting/reports/export/route.test.ts`:
  - Happy path returns CSV with header + rows.
  - 401 when unauthenticated.
  - 403 when authenticated without `ACCOUNTING_REPORTS_VIEW`.
  - Truncation header set when `totalCount > 10_000`.
  - Date-range validation error returns 400.
  - CSV escaping for commas, quotes, newlines.
- 🔁 `bun run scripts/health/sub-loop.ts "app/api/accounting/reports/export/route.ts" --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts "app/api/accounting/reports/export/route.test.ts" --lifecycle codescene`

### 2.5 Phase-2 acceptance
- ✅ GraphQL schema builds (`bun run graphql:build`).
- ✅ Codegen (`bun run graphql:codegen`) produces typed `SessionAuditReportQuery` hooks.

---

## Phase 3 — Navigation, routes, i18n (shell)

> Goal: routes exist, nav item renders, permission gating works. No grid yet.

### 3.1 Page-permission entries
- ✏️ `frontend/common/types/page-permissions.types.ts` — add `accountingReportsView` + `accountingReportsManage` as **arrays** cast to `PagePermissions` (per existing convention):
  ```ts
  accountingReportsView: [AppPermission.ACCOUNTING_REPORTS_VIEW] as PagePermissions,
  accountingReportsManage: [AppPermission.ACCOUNTING_REPORTS_MANAGE] as PagePermissions,
  ```
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/types/page-permissions.types.ts --lifecycle codescene`

### 3.2 Sidebar nav item + nav label additions
- ✏️ `frontend/common/views/dashboard/config/navigationConfig.ts` — add `accounting-reports` item to `SIDEBAR_NAV_ITEMS` under `grp_reports`; add `AppPermission.ACCOUNTING_REPORTS_VIEW` to `grp_reports` group `permission` array.
- ✏️ `frontend/common/views/dashboard/config/navIconKeys.ts` — verify `assessment` is already in `NavIconKey` union (it is — no change needed).
- ✏️ `shared/locale/types/dashboard/core/nav.ts` — add `readonly accountingReports: string;` to `DashboardNavigationLabels` (label lives in the existing `dashboard.core.nav` namespace, NOT in the new `dashboard.reports.sessionAudit` namespace).
- ✏️ `shared/locale/en/dashboard/core/nav.ts` — add `accountingReports: "Full Reports"`.
- ✏️ `shared/locale/ar/dashboard/core/nav.ts` — add `accountingReports: "التقارير الشاملة"`.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/config/navigationConfig.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts shared/locale/types/dashboard/core/nav.ts --lifecycle codescene`

### 3.3 i18n namespace (four-artifact compile-time i18n)
- 🆕 `shared/locale/types/dashboard/reports/sessionAudit.ts` — define `SessionAuditLabels` interface per implementation.md §7.1 (use TypeScript function-typed fields where interpolation is needed — not ICU strings).
- ✏️ `shared/locale/types/dashboard/reports/index.ts` — add `export * from "./sessionAudit";` (create if missing).
- ✏️ `shared/locale/types/message.ts` — register `dashboard.reports.sessionAudit` in `MessageSchema`.
- 🆕 `shared/locale/namespaces/dashboard/reports/sessionAudit.namespace.ts` — define namespace via `defineNamespace<SessionAuditLabels>("dashboard.reports.sessionAudit", { load: { en, ar } })`.
- ✏️ `shared/locale/namespaces/dashboard/reports/index.ts` — add `export * from "./sessionAudit.namespace";` (create if missing).
- 🆕 `shared/locale/en/dashboard/reports/sessionAudit.ts` — EN translations (`dashboardReportsSessionAuditEn`).
- 🆕 `shared/locale/ar/dashboard/reports/sessionAudit.ts` — AR translations (`dashboardReportsSessionAuditAr`).
- 🔁 `bun run scripts/health/sub-loop.ts shared/locale/types/dashboard/reports/sessionAudit.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts shared/locale/namespaces/dashboard/reports/sessionAudit.namespace.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts shared/locale/en/dashboard/reports/sessionAudit.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts shared/locale/ar/dashboard/reports/sessionAudit.ts --lifecycle codescene`

### 3.4 Locale snapshot
- 🔁 `bun run locale:snapshots` (or project equivalent) — generate `public/static/locale-snapshots/{en,ar}/dashboard.reports.sessionAudit.json`.
- ✅ Verify snapshots committed.

### 3.5 Route shell
- 🆕 `app/(dashboard)/accounting/reports/page.tsx` — server component that renders `<SessionAuditReportsContainer />`.
- 🔁 `bun run scripts/health/sub-loop.ts "app/(dashboard)/accounting/reports/page.tsx" --lifecycle codescene`

### 3.6 Audit drawer reads `openOverride` query param 🔗
- ✏️ `frontend/common/views/dashboard/classes/audit/ClassAuditContainer.tsx` — on mount, read `searchParams.openOverride`; if truthy AND user holds `ACCOUNTING_PAYROLL_MANAGE` (Plan 3), auto-open the Override dialog on the Payroll card (Plan 3's `OverrideDialog`).
- 🧪 `frontend/common/views/dashboard/classes/audit/ClassAuditContainer.test.tsx` — `?openOverride=1` opens the dialog; without the param, the dialog stays closed; without `_MANAGE`, the dialog stays closed.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/classes/audit/ClassAuditContainer.tsx --lifecycle codescene`

### 3.7 Phase-3 acceptance
- ✅ `/accounting/reports` renders (with permission) / 403 (without).
- ✅ Sidebar "Full Reports" item visible only with `ACCOUNTING_REPORTS_VIEW` or `ACCOUNTING_REPORTS_MANAGE`.
- ✅ AR/EN snapshots exist.
- ✅ Audit drawer auto-opens Override dialog when `?openOverride=1` is present.

---

## Phase 4 — Session Audit Reports grid page

### 4.1 Apollo documents
- 🆕 `frontend/common/graphql/sharedDocuments/accounting/session-audit.documents.ts` — `sessionAuditReportQueryDocument` (TypedDocumentNode, camelCase + `Document` suffix per `sharedDocuments/AGENTS.md`; include `instanceId` field so Apollo cache can auto-update).
- 🆕 `frontend/common/graphql/sharedDocuments/accounting/index.ts` — barrel re-export via `export * from "./session-audit.documents";`.
- ✏️ `frontend/common/graphql/sharedDocuments/index.ts` — add `export * from "./accounting";` (new sub-directory).
- 🔁 After Phase 2 lands: `bun run generate:gqlSchema && bun codegen` so `Operations.SessionAuditReportQuery` + `Types.QuerySessionAuditReportArgs` exist.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/graphql/sharedDocuments/accounting/session-audit.documents.ts --lifecycle codescene`

### 4.2 View-model hook
- 🆕 `frontend/common/views/dashboard/accounting/reports/useSessionAuditReportsViewModel.ts` — manages Apollo query state, filter state (Zustand store), sort state, pagination, debounced search, "Export CSV" handler.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/reports/useSessionAuditReportsViewModel.ts --lifecycle codescene`

### 4.3 Zustand filter store + URL-state sync
- 🆕 `frontend/common/stores/sessionAuditFilterStore.ts` — `teacherId`, `studentId`, `dateFrom`, `dateTo`, `currentStatuses`, `search`, `sortField`, `sortDirection`, `page`, `pageSize`; `reset()`, `clearFilters()`. Includes a `useEffect` that syncs state → URL (debounced 100 ms) and a one-shot URL → state hydration on mount.
- 🧪 `frontend/common/stores/sessionAuditFilterStore.test.ts` — state → URL round-trip; URL → state hydration; debounce behavior.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/stores/sessionAuditFilterStore.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/stores/sessionAuditFilterStore.test.ts --lifecycle codescene`

### 4.4 Status chip component
- 🆕 `frontend/common/views/dashboard/accounting/reports/SessionAuditStatusChip.tsx` — MUI `Chip` with colored variant per `SessionAuditStatus`; pulse animation when row is within last 24 hours + `actualStartAt` set + `actualEndAt` null.
- 🧪 `frontend/common/views/dashboard/accounting/reports/SessionAuditStatusChip.test.tsx` — renders correct color + label per status; pulse animation only when running + within 24h.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/reports/SessionAuditStatusChip.tsx --lifecycle codescene`

### 4.5 Cell formatters
- 🆕 `frontend/common/views/dashboard/accounting/reports/formatters/sessionAuditCellFormatters.ts` — `formatOpenSessionTime`, `formatEndSessionTime`, `formatDurationMinutes`, `formatPaidAmount`, `formatNoteCell`.
- 🧪 `frontend/common/views/dashboard/accounting/reports/formatters/sessionAuditCellFormatters.test.ts` — every formatter handles null/empty + localized output.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/reports/formatters/sessionAuditCellFormatters.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/reports/formatters/sessionAuditCellFormatters.test.ts --lifecycle codescene`

### 4.6 Filter bar component
- 🆕 `frontend/common/views/dashboard/accounting/reports/SessionAuditFilterBar.tsx` — **reuse the existing `TeacherAutocomplete`** from `@/frontend/common/components/ui/input/userSelect/TeacherAutocomplete`, **reuse the existing `StudentAutocomplete`** from `@/frontend/common/components/ui/input/userSelect/StudentAutocomplete`, **reuse the existing `AppDateRangePicker`** from `@/frontend/common/components/ui/form/date/AppDateRangePicker`, status multi-select, search input (debounced 300 ms), "Clear filters" affordance.
- 🧪 `frontend/common/views/dashboard/accounting/reports/SessionAuditFilterBar.test.tsx` — every filter control works; "Clear filters" resets to defaults; URL-state sync via mock `useRouter`.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/reports/SessionAuditFilterBar.tsx --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/reports/SessionAuditFilterBar.test.tsx --lifecycle codescene`

### 4.7 DataGrid component
- 🆕 `frontend/common/views/dashboard/accounting/reports/SessionAuditDataGrid.tsx` — MUI `DataGrid` v9 with columns per §4.1; sortable headers; server-side pagination; row click → `/classes/[id]/audit`; "Open audit page" action (gated on `ACCOUNTING_REPORTS_MANAGE`) → `?openOverride=1`; aggregate footer card; CSV export button.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/reports/SessionAuditDataGrid.tsx --lifecycle codescene`

### 4.8 Container + responsive view variants
- 🆕 `frontend/common/views/dashboard/accounting/reports/SessionAuditReportsContainer.tsx` — composes filter bar + data grid; uses `useSessionAuditReportsViewModel`.
- 🆕 `frontend/desktop/views/dashboard/accounting/reports/session-audit-reports.desktop.tsx` + `frontend/mobile/views/dashboard/accounting/reports/session-audit-reports.mobile.tsx` — responsive view variants (per existing `ReportsContainer` pattern).
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/reports/SessionAuditReportsContainer.tsx --lifecycle codescene`

### 4.9 Page tests
- 🧪 `frontend/common/views/dashboard/accounting/reports/SessionAuditReportsContainer.test.tsx`:
  - Renders rows; filters debounce; empty state.
  - CSV button navigates to `/api/accounting/reports/export?...`.
  - Row click navigates to `/classes/[id]/audit`.
  - "Open audit page" action navigates with `?openOverride=1` (gated on `_MANAGE`).
  - "Open audit page" action hidden without `_MANAGE`.
  - URL-state sync (filters restored from query string).
  - Aggregate footer card renders correct totals.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/reports/SessionAuditReportsContainer.test.tsx --lifecycle codescene`
- 🔁 `bun test frontend/common/views/dashboard/accounting/reports/SessionAuditReportsContainer.test.tsx`

### 4.10 Phase-4 acceptance
- ✅ Full grid renders with all columns populated (including Plan 3 payroll columns when available).
- ✅ All filters work end-to-end (filter bar → query → grid update).
- ✅ CSV export downloads the correct file.
- ✅ Row click navigates to the audit drawer.

---

## Phase 5 — Aggregates + drill-down polish

### 5.1 Aggregate footer card
- 🆕 `frontend/common/views/dashboard/accounting/reports/SessionAuditAggregateCard.tsx` — renders `totalPaidAmount` + currency, `rowCountByStatus`, `rowCountByPaid` from the query's `aggregates` field.
- 🧪 `frontend/common/views/dashboard/accounting/reports/SessionAuditAggregateCard.test.tsx` — renders correct totals + counts.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/reports/SessionAuditAggregateCard.tsx --lifecycle codescene`

### 5.2 Note popover component
- 🆕 `frontend/common/views/dashboard/accounting/reports/PayrollNotePopover.tsx` — small note icon in the row's trailing cell; hover shows the first 200 chars + ellipsis; click opens a popover with the full note.
- 🧪 `frontend/common/views/dashboard/accounting/reports/PayrollNotePopover.test.tsx` — short note renders inline; long note truncates + popover shows full text.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/reports/PayrollNotePopover.tsx --lifecycle codescene`

### 5.3 Tooltip with raw UTC + booking timezone
- ✏️ `frontend/common/views/dashboard/accounting/reports/SessionAuditDataGrid.tsx` — add MUI `Tooltip` on `openSessionTime` / `endSessionTime` cells showing `Raw UTC: <value>` + `Booking timezone: <value>` (per AC-3.7).
- 🧪 extend `SessionAuditDataGrid.test.tsx` — tooltip content correct.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/reports/SessionAuditDataGrid.tsx --lifecycle codescene`

### 5.4 Phase-5 acceptance
- ✅ Aggregate card renders correct totals.
- ✅ Note popover works for short + long notes.
- ✅ Tooltip shows raw UTC + booking timezone.

---

## Phase 6 — Observability + audit-log integration

### 6.1 Structured logging
- ✏️ `backend/services/accounting/session-audit.service.ts` — confirm structured `logger.info` on every query + export with `actorUserId`, `filters`, `limit`, `offset`, `rowCount` (NFR-11).
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/accounting/session-audit.service.ts --lifecycle codescene`

### 6.2 Audit-log read integration (drill-down only)
- ✏️ The existing `/classes/[id]/audit` page already renders `class_status_events` for the audit drawer. No new code needed — Plan 4 just deep-links into it. Confirm the `PAYROLL_OVERRIDE` events (Plan 3) render in the drawer's chronological list.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard.tsx --lifecycle codescene`

### 6.3 Phase-6 acceptance
- ✅ Structured logs emit on every query + export.
- ✅ Drill-down audit drawer shows the `PAYROLL_OVERRIDE` events from Plan 3.

---

## Phase 7 — i18n polish, accessibility, RTL

### 7.1 Full key coverage
- ✏️ `shared/locale/namespaces/dashboard/accounting/reports.namespace.ts` — confirm every user-visible string has EN + AR (per implementation.md §7.1 table).
- 🔁 `bun run locale:validate` (or project equivalent) — fail if any key missing in either locale.

### 7.2 Accessibility pass
- ✏️ `SessionAuditDataGrid.tsx` — aria-labels on filter inputs, sortable columns announced, status chips have `aria-label` with full status text, row click is keyboard-accessible (Enter key on focused row).
- ✏️ `SessionAuditFilterBar.tsx` — every control has a `<label>` + `aria-label`.
- 🧪 `SessionAuditDataGrid.test.tsx` + `SessionAuditFilterBar.test.tsx` — add axe-core assertions (existing project pattern).
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/reports/SessionAuditDataGrid.tsx --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/reports/SessionAuditFilterBar.tsx --lifecycle codescene`

### 7.3 RTL pass
- ✏️ Confirm AR locale renders RTL; status chips + filter bar mirror LTR layout; date-range picker handles RTL correctly.
- 🧪 `SessionAuditReportsContainer.test.tsx` — RTL snapshot matches expected.

### 7.4 Phase-7 acceptance
- ✅ All i18n keys present in EN + AR.
- ✅ Axe-core passes on grid + filter bar.
- ✅ RTL layout correct.

---

## Phase 8 — End-to-end & regression

### 8.1 E2E test
- 🧪 `e2e/accounting/session-audit-reports.spec.ts` (Playwright, if project uses it):
  - Log in as accounting operator.
  - Open `/accounting/reports`, filter by teacher + status `Absent`.
  - Verify rows render with red status chips.
  - Click a row → verify navigation to `/classes/[id]/audit`.
  - Browser back → verify filter state restored.
  - Click "Export CSV" → verify the downloaded file has the expected rows.
  - Open `?openOverride=1` URL on a class instance → verify the audit drawer's Override dialog auto-opens (requires Plan 3).
- 🔁 `bun run scripts/health/sub-loop.ts e2e/accounting/session-audit-reports.spec.ts --lifecycle codescene`

### 8.2 Regression suite
- 🔁 `bun test backend/db/test/repo/scheduling/session-audit.repository.test.ts`
- 🔁 `bun test backend/services/accounting/session-audit.service.test.ts`
- 🔁 `bun test backend/services/accounting/session-audit-csv.serializer.test.ts`
- 🔁 `bun test backend/services/accounting/session-audit-status-predicate.test.ts`
- 🔁 `bun test shared/constants/classes/session-audit-status.test.ts`
- 🔁 `bun test backend/graphql/query/accounting/session-audit.query.test.ts`
- 🔁 `bun test "app/api/accounting/reports/export/route.test.ts"`
- 🔁 `bun test backend/db/test/repo/scheduling/scheduling.repository.test.ts` (no regression)
- 🔁 `bun test backend/db/test/repo/billing/credit.repository.test.ts` (no regression — Plan 2 still works)
- 🔁 `bun test backend/services/teachers/payroll-calculation.service.test.ts` 🔗 (Plan 3 still works)

### 8.3 Full quality gate
- 🔁 Run project-wide `lint`, `typecheck`, `test`, `build`.
- 🔁 `bun run scripts/health/sub-loop.ts <each-new-file> --lifecycle codescene` for every file created/edited in Phases 0–7.

### 8.4 Staging smoke
- 🔁 Deploy to staging; verify `/accounting/reports` renders with a populated dataset.
- ✅ Confirm drill-down to `/classes/[id]/audit` works.
- ✅ Confirm CSV export downloads and opens cleanly in Excel / Numbers.
- ✅ Confirm graceful degradation if Plan 3 is not yet deployed to staging (payroll columns render as `—`).

---

## Definition of Done

- [ ] All Phase 0–8 tasks complete.
- [ ] Every touched file passes `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0).
- [ ] `specs.md` acceptance criteria AC-1.1 … AC-9.3 each have a passing test.
- [ ] Edge cases E1–E20 each covered by a test or explicit "won't happen" note.
- [ ] **Zero schema migrations** introduced by this plan (graceful degradation when Plan 3 not yet deployed).
- [ ] EN + AR locale snapshots committed.
- [ ] Existing scheduling / reports / teacher-dues / payroll flows regression-green.
- [ ] 🔗 Plan 3 integration: when Plan 3 IS deployed, payroll columns render with values; when Plan 3 is NOT deployed, payroll cells render as `—` and `currentStatus` still maps correctly.
- [ ] Audit drawer auto-opens Override dialog when `?openOverride=1` is present (requires Plan 3).

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

## Cross-plan handoff checklist (for Plan 3 owner)

- [ ] Plan 3's `class_instances` extension (8 payroll columns) is merged.
- [ ] Plan 3's `CalculationStatusPothosEnum` is exported from `backend/graphql/pothos/teachers/payroll.pothos.ts`.
- [ ] Plan 3's `ClassInstanceDetailPothosObject` exposes the payroll fields.
- [ ] Plan 3's audit drawer reads `?openOverride=1` and auto-opens the Override dialog.
- [ ] Plan 3's `applyPayrollOverride` mutation is live.

If any of the above are not yet merged, Plan 4 still proceeds — the
graceful-degradation behavior means the grid renders `—` for payroll
cells and the `currentStatus` mapper still works on the existing
`execution_state + outcome` pair.

---

## Test Coverage Backfill: Cross-Actor Journeys & 4-Tier Enforcement

> Closes the gap between this plan and the enforced test kinds added later to the spec process
> (.agents/skills/spec-implementation/SKILL.md → "Plan Intake" items 5-7 + "Test-Layer Coverage
> Gate"; docs/testing/workflow-journey-tests.md). Existing tasks are unchanged; these tasks are
> additive and execute before this plan is treated as test-complete.

- [ ] TB.1 Journey: teacher joins/leaves session (meeting webhook writes `actual_start_at`/`actual_end_at`, `execution_state`, `outcome` on `class_instances`) → accounting operator sees the row evolve in `/accounting/reports` (status `open` → `end` / `Absent` / `absent_student` via `mapToSessionAuditStatus`); teacher-facing and student-facing views must NOT expose the accounting-only payroll columns
  - Create `test/workflows/accounting/session-audit-session-lifecycle.test.ts` (test-first; real services + real DB; NO `runInRollback`; committed fixtures in `beforeAll` + tracked hard delete in `afterAll`; cast helper in `test/workflows/helpers/`; no notification dispatch in this plan — assert dispatch is NOT triggered for session-audit reads via `spyOn(NotificationDispatchHelpers, "dispatchWithPreferences")`)
  - Assert: shared-state transitions on `class_instances` (join → `open`, leave → `end`, never-joined → `Absent`), cross-actor visibility (accounting operator with `ACCOUNTING_REPORTS_VIEW` sees it; teacher/student roles must not see payroll columns), side effects (payroll columns surface once Plan 3 calculation runs; no ledger/dues mutation from this plan — grid is read-only), denial paths (operator without `ACCOUNTING_REPORTS_VIEW` rejected with `INSUFFICIENT_PERMISSIONS`)
  - Verify: `bun run test/scripts/run-test.ts test/workflows/accounting/session-audit-session-lifecycle.test.ts` green, then `bun run test:workflows`
  - Reference: `docs/testing/workflow-journey-tests.md`, `test/workflows/AGENTS.md`
  - _Requirements: AC-1.x, AC-2.x, AC-3.x, AC-7.x_
- [ ] TB.2 Journey: Plan 3 payroll calculation + admin payroll override (system/Plan-3 actors write `calculation_status`, `teacher_paid_amount`, `payroll_note` on `class_instances`; admin applies override via `applyPayrollOverride`) → accounting operator observes updated payroll columns, aggregates, and payment-date tooltip in the grid and CSV export
  - Create `test/workflows/accounting/session-audit-payroll-visibility.test.ts` (test-first; real services + real DB; NO `runInRollback`; committed fixtures in `beforeAll` + tracked hard delete in `afterAll`; cast helper in `test/workflows/helpers/`; if Plan 3 emits any notification on override, spy via `spyOn(NotificationDispatchHelpers, "dispatchWithPreferences")`)
  - Assert: shared-state transitions (`NOT_CALCULATED` → `PAID`/`WAITING_PAID`/`PARTIALLY` visible in grid + CSV after override, `teacher_dues` payment-date tooltip populated only when `calculation_status = 'PAID'`), cross-actor visibility (accounting operator sees override result incl. `payrollNote`; operators without `ACCOUNTING_REPORTS_VIEW` denied; the `?openOverride=1` deep-link honors `ACCOUNTING_PAYROLL_MANAGE` separately from `ACCOUNTING_REPORTS_MANAGE`), side effects (aggregate footer totals update; CSV export reflects post-override values)
  - Verify: `bun run test/scripts/run-test.ts test/workflows/accounting/session-audit-payroll-visibility.test.ts` green, then `bun run test:workflows`
  - Reference: `docs/testing/workflow-journey-tests.md`, `test/workflows/AGENTS.md`
  - _Requirements: AC-6.x, AC-7.x, AC-8.x, AC-9.x_
- [ ] TB.3 Journey: accounting operator filters/exports session audit data (including filters scoped to a specific teacher/student) → unauthorized/non-accounting actors must be denied and must not observe another teacher's or student's audit slice
  - Create `test/workflows/accounting/session-audit-access-isolation.test.ts` (test-first; real services + real DB; NO `runInRollback`; committed fixtures in `beforeAll` + tracked hard delete in `afterAll`; cast helper in `test/workflows/helpers/`)
  - Assert: cross-actor visibility (operator with `ACCOUNTING_REPORTS_VIEW` gets the scoped rows; teacher role calling `sessionAuditReport` or the export route for their own or another teacher's data is denied; export route returns 401 unauthenticated / 403 without permission), side effects (structured log emits `actorUserId` + filters per NFR-11; `X-Export-Truncated` header set past 10 000 rows), denial paths for every non-authorized role
  - Verify: `bun run test/scripts/run-test.ts test/workflows/accounting/session-audit-access-isolation.test.ts` green, then `bun run test:workflows`
  - Reference: `docs/testing/workflow-journey-tests.md`, `test/workflows/AGENTS.md`
  - _Requirements: AC-1.2, AC-7.x, AC-8.5, AC-8.6, NFR-5, NFR-11_
- [ ] TB.4 4-Tier verification for session-audit service/repository/shared files
  - Confirm Tier 1 branch coverage + Tier 4 abuse/permission cases exist and green for: `backend/services/accounting/session-audit.service.ts`, `backend/services/accounting/session-audit-status-predicate.ts`, `backend/services/accounting/session-audit-csv.serializer.ts`, `backend/db/repo/scheduling/session-audit.repository.ts`, `shared/constants/classes/session-audit-status.ts`, `app/api/accounting/reports/export/route.ts`
  - Fill gaps via `.agents/skills/write-tests/SKILL.md` + `.agents/skills/test-expert/SKILL.md`; repo tests inside `runInRollback` with `tx` propagation; service tests mock all external channels
  - Verify with `bun run test/scripts/run-test.ts <each test file>`
  - _Requirements: cross-cutting_
- [ ] TB.5 Penetration verification (plan adds the `sessionAuditReport` GraphQL query and the `GET /api/accounting/reports/export` route — both are new endpoints)
  - BOLA/IDOR across the roles in this plan (teacher/student/parent/admin/accounting-operator access to another actor's audit slice via `filter.teacherId`/`filter.studentId`); permission denial on the query and export route without `ACCOUNTING_REPORTS_VIEW`; wildcard/ILIKE injection on the free-text `search` filter; formula-injection (`=`, `+`, `-`, `@` leading bytes) and header-injection hardening on the CSV export
  - Via `.agents/skills/pentester/SKILL.md`
  - _Requirements: AC-7.x, AC-8.x, NFR-5_
