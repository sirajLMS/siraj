# Quota UI Production-Readiness Plan — Tasks

**Version**: 1.0
**Date**: 2025-01-20
**Author**: AI Agent (spec-driven-development skill)

---

## Implementation Guide

### Quality Loop (Per File)

After creating/modifying ANY file, run the sub-loop script with `--lifecycle codescene`. It runs tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene progressively and short-circuits at the first failing check. It also auto-discovers and prints the applicable AGENTS.md and instruction files for the target file.
```bash
bun run scripts/health/sub-loop.ts <the-file> --lifecycle codescene
```
Fix all errors before proceeding.

### Instruction Verification (Per Task)

After quality loop passes, validate against ALL applicable AGENTS.md + instruction files:
- `/home/ahmed/Projects/siraj/AGENTS.md` (root — always)
- `/home/ahmed/Projects/siraj/frontend/AGENTS.md`
- `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`
- `/home/ahmed/Projects/siraj/shared/AGENTS.md`
- `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
- `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md`

### Drizzle Schema Convention

- No database schema changes in this plan — UI-only
- If any schema gaps are found (e.g., PERIODIC kind (already exists), PENDING status (needs backend addition)), document as backend team backlog

---

## Tasks

> **Parallel Execution**: Tasks are organized into waves (Wave 0–5). Within each wave, all task groups run as **parallel subagents**. See `implementation.md` → "Parallel Execution Strategy" for the full wave table, dependency graph, and dispatch rules. Each subagent must run `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per file before completing.

### Task Group 1: i18n Key Additions (Foundation) — Wave 0

- [ ] 1.1 Add PENDING status and formatters to billing quota i18n
  - Add `status.PENDING` string and `statuses.PENDING` function to all 3 locale files (types, en, ar)
  - Files: `shared/locale/types/dashboard/billing/quota.ts`, `shared/locale/en/dashboard/billing/quota.ts`, `shared/locale/ar/dashboard/billing/quota.ts`
  - _Requirements: R9 (i18n Completeness)_
  - - [ ] 1.1.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on all 3 files
  - - [ ] 1.1.IV Instruction Verification: Read `shared/AGENTS.md` + `frontend.instructions.md`

- [ ] 1.2 Add delete confirmation and error keys to billing quota i18n
  - Add: `deleteConfirmTitle`, `deleteConfirmBody(studentName)`, `deleteConfirmCancel`, `deleteConfirmConfirm`, `deleteFailed`, `deleteSuccess`
  - Files: `shared/locale/types/dashboard/billing/quota.ts`, `shared/locale/en/dashboard/billing/quota.ts`, `shared/locale/ar/dashboard/billing/quota.ts`
  - _Requirements: R3 (Detail — Delete), R9 (i18n)_
  - - [ ] 1.2.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on all 3 files
  - - [ ] 1.2.IV Instruction Verification: `shared/AGENTS.md` + `frontend.instructions.md`

- [ ] 1.3 Add pluralized count keys to both quota i18n namespaces
  - Add `quotaCount(count)` and `ledgerCount(count)` as `(count: number) => string` to billing and student namespaces (all 6 files)
  - Arabic must use CLDR plural rules (zero/one/two/few/many/other)
  - Files: `shared/locale/{types,en,ar}/dashboard/billing/quota.ts`, `shared/locale/{types,en,ar}/dashboard/students/quota.ts`
  - _Requirements: R9 (i18n — Pluralization)_
  - - [ ] 1.3.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on all 6 files
  - - [ ] 1.3.IV Instruction Verification: `shared/AGENTS.md`

- [ ] 1.4 Add periodDays, student picker, and not-found i18n keys to billing quota
  - Add: `periodDays`, `periodDaysHelperText`, `periodDaysRequired`, `validUntilAfterValidFrom`, `studentPickerPlaceholder`, `studentPickerNoOptions`, `studentPickerLoading`, `notFoundTitle`, `notFoundMessage`, `notFoundBackButton`, `emptyListMessage`, `emptyListCta`
  - Files: `shared/locale/{types,en,ar}/dashboard/billing/quota.ts`
  - _Requirements: R2 (Form), R3 (Detail — Not Found), R9 (i18n)_
  - - [ ] 1.4.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on all 3 files
  - - [ ] 1.4.IV Instruction Verification: `shared/AGENTS.md`

- [ ] 1.5 Add insights filter and export i18n keys to billing quota
  - Add: `insightsDateRangeLabel`, `insightsKindLabel`, `insightsStatusLabel`, `insightsStudentLabel`, `exportSuccess`, `emptyInsightsMessage`
  - Add: `expiryWarning(days)`, `quotaExhausted`, `eligibleForNextClass`, `notEligibleForNextClass` to student namespace
  - Files: `shared/locale/{types,en,ar}/dashboard/billing/quota.ts`, `shared/locale/{types,en,ar}/dashboard/students/quota.ts`
  - _Requirements: R4 (Insights), R6 (Audience Views), R9 (i18n)_
  - - [ ] 1.5.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on all 6 files
  - - [ ] 1.5.IV Instruction Verification: `shared/AGENTS.md`

---

### Task Group 2: Form Schema Wiring — Wave 0

- [ ] 2.1 Rewrite billing quota Zod schema as factory pattern
  - Create `createQuotaSchema(labels: DashboardBillingQuota)` factory returning `z.object({...})` with fields: `studentId`, `name`, `kind` (enum `["PACKAGE", "PERIODIC"]` — NOT `ON_DEMAND`), `periodType`, `periodDays`, `validFrom`, `validUntil`, `totalClasses` (NOT `maxClasses`), `priority` (enum `["LOW", "MEDIUM", "HIGH"]`). Conditional validation for periodDays (required when CUSTOM) and validUntil > validFrom.
  - Export `QuotaFormData` and `QuotaFormInput` types
  - File: `frontend/common/views/dashboard/billing/quota/schemas/quotaSchema.ts`
  - _Requirements: R2 (Form — Validation)_
  - - [ ] 2.1.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on schema file
  - - [ ] 2.1.IV Instruction Verification: `frontend/AGENTS.md` + `frontend.instructions.md`

- [ ] 2.2 Create billing quota form types
  - Define `DashboardBillingQuota` interface matching i18n keys
  - Define `BillingQuotaFormState` and `BillingQuotaFormProps` types
  - File: `frontend/common/views/dashboard/billing/quota/types/quotaForm.types.ts`
  - _Requirements: R2_
  - - [ ] 2.2.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on types file
  - - [ ] 2.2.IV Instruction Verification: `frontend/AGENTS.md` + `.agents/instructions/backend.instructions.md` (type patterns)

---

### Task Group 3: Billing Quota List — Tier Isolation — Wave 1 (parallel with Groups 4, 5, 6)

- [ ] 3.1 Create desktop quota list tier view
  - `DesktopPageContainer` + `DesktopPageHeader` (breadcrumbs, title, actions) + `DesktopMetricCardGrid` (3 metrics) + `SectionPanel` (FilterButton + ExportButton + PrimaryPageAction) + `DesktopAppDataGrid` with server pagination
  - Replace inline Chips with `StatusBadge` (new `quota` category)
  - Use `ErrorState` + `AppDataGridLoadingOverlay`
  - File: `frontend/desktop/views/dashboard/billing/quota/quotaList.desktop.tsx`
  - Additional: `frontend/desktop/views/dashboard/billing/quota/components/QuotaListDesktopActions.tsx`
  - _Requirements: R1 (List), R10 (Design System)_
  - - [ ] 3.1.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on both files
  - - [ ] 3.1.IV Instruction Verification: `frontend/AGENTS.md` + `frontend/views/AGENTS.md` + `mobile-desktop.instructions.md`

- [ ] 3.2 Create mobile quota list tier view
  - `MobilePageContainer` (edge-to-edge) + `MobilePageHeader` (breadcrumbs) + `MobileMetricCardGrid` + `MobileSectionPanel` + `MobileCardList` + `MobileCardListItem` with pagination
  - Add search/filter UI (parity with desktop) — mobile currently has NO search/filter/pagination
  - Use `StatusBadge` in card items
  - Mirror FAB position for RTL
  - File: `frontend/mobile/views/dashboard/billing/quota/quotaList.mobile.tsx`
  - Additional: `frontend/mobile/views/dashboard/billing/quota/components/QuotaListItemMobile.tsx`
  - _Requirements: R1 (List — Mobile), R9 (RTL FAB)_
  - - [ ] 3.2.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on both files
  - - [ ] 3.2.IV Instruction Verification: `frontend/AGENTS.md` + `frontend/views/AGENTS.md` + `mobile-desktop.instructions.md`

- [ ] 3.3 Update QuotaContainer switcher to use lazy tier imports
  - Replace co-located component imports with `createLazyView` + `ResponsiveViewSwitch` from tier directories
  - File: `frontend/common/views/dashboard/billing/quota/QuotaContainer.tsx`
  - _Requirements: R11 (Tier Isolation)_
  - - [ ] 3.3.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on container file
  - - [ ] 3.3.IV Instruction Verification: `frontend/views/AGENTS.md`

- [ ] 3.4 Update useQuotaViewModel with Zustand pagination state
  - Move `page`/`pageSize` from local `useState` to `quotaStore.ts`
  - Return typed `QuotaListViewModel` readonly interface
  - File: `frontend/common/views/dashboard/billing/quota/useQuotaViewModel.ts`, `frontend/common/stores/quotaStore.ts`
  - _Requirements: R11 (Tier Isolation — State)_
  - - [ ] 3.4.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on both files
  - - [ ] 3.4.IV Instruction Verification: `frontend/AGENTS.md` + `frontend/views/AGENTS.md`

- [ ] 3.5 Extend StatusBadgeCategory with `quota` mapping
  - Add `quota` to `StatusBadgeCategory` union; map ACTIVE/EXPIRED/ARCHIVED/PENDING to palette keys
  - File: `frontend/common/components/ui/badge/StatusBadge.tsx` (or types file)
  - _Requirements: R1 (StatusBadge), R10 (Design System)_
  - - [ ] 3.5.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on badge file
  - - [ ] 3.5.IV Instruction Verification: `frontend/AGENTS.md`

---

### Task Group 4: Billing Quota Form — Tier Isolation + Validation — Wave 1 (parallel with Groups 3, 5, 6)

- [ ] 4.1 Create desktop quota form tier view
  - `DesktopPageContainer` + `DesktopPageHeader` (breadcrumbs: Quotas > New/Edit) + `FormProvider` + form sections using RHF + zodResolver
  - Replace free-text studentId with permission-based `userSelect` Autocomplete
  - Replace `TextField type="date"` with `AppDatePicker` for validFrom/validUntil
  - Add `periodDays` number input (conditionally shown when periodType === CUSTOM)
  - Add `helperText`, `required`, `error` on all fields
  - Use `DesktopPrimaryPageAction` for Save (with SyncOutlined spinner)
  - Use `FormSuccessSnackbar` + `FormErrorSnackbar`
  - File: `frontend/desktop/views/dashboard/billing/quota/quotaForm.desktop.tsx`
  - Additional: `frontend/desktop/views/dashboard/billing/quota/components/QuotaFormSectionDesktop.tsx`
  - _Requirements: R2 (Form — all criteria)_
  - - [ ] 4.1.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on both files
  - - [ ] 4.1.IV Instruction Verification: `frontend/AGENTS.md` + `frontend/views/AGENTS.md` + `mobile-desktop.instructions.md`

- [ ] 4.2 Create mobile quota form tier view
  - `MobilePageContainer` + `MobilePageHeader` + `FormProvider` + stacked form sections (single column)
  - Same fields as desktop, mobile-styled inputs
  - Use `MobilePrimaryPageAction` for Save
  - File: `frontend/mobile/views/dashboard/billing/quota/quotaForm.mobile.tsx`
  - Additional: `frontend/mobile/views/dashboard/billing/quota/components/QuotaFormSectionMobile.tsx`
  - _Requirements: R2 (Form — Mobile)_
  - - [ ] 4.2.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on both files
  - - [ ] 4.2.IV Instruction Verification: `frontend/AGENTS.md` + `mobile-desktop.instructions.md`

- [ ] 4.3 Update QuotaFormContainer to switcher pattern
  - Replace inline form logic with `createLazyView` + `ResponsiveViewSwitch`
  - File: `frontend/common/views/dashboard/billing/quota/QuotaFormContainer.tsx`
  - _Requirements: R11 (Tier Isolation)_
  - - [ ] 4.3.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on container file
  - - [ ] 4.3.IV Instruction Verification: `frontend/views/AGENTS.md`

- [ ] 4.4 Update useQuotaFormViewModel with RHF + zodResolver
  - Replace plain controlled state with `useForm<QuotaFormData, undefined, QuotaFormInput>({ resolver: zodResolver(createQuotaSchema(labels)) })` where `labels` comes from `useAppTranslation(Translation.Dashboard.BillingQuota)`
  - Add cache `update` function for create/update mutations
  - Add `FormSuccessSnackbar` on success + redirect to detail
  - Add `FormErrorSnackbar` on error
  - File: `frontend/common/views/dashboard/billing/quota/useQuotaFormViewModel.ts`
  - _Requirements: R2 (Form — Validation, Feedback), R15 (GraphQL Cache)_
  - - [ ] 4.4.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on VM file
  - - [ ] 4.4.IV Instruction Verification: `frontend/AGENTS.md` + `frontend/views/AGENTS.md`

---

### Task Group 5: Billing Quota Detail — Tier Isolation + Delete Confirmation — Wave 1 (parallel with Groups 3, 4, 6)

- [ ] 5.1 Create desktop quota detail tier view
  - `DesktopPageContainer` + `DesktopPageHeader` (breadcrumbs, back button, Edit/Delete actions)
  - Summary `SectionPanel` with Grid showing ALL metadata (student, kind, periodType, periodDays, validFrom, validUntil, createdAt, updatedAt, status)
  - `StatusBadge` for status (not inline Chip)
  - `DesktopAppDataGrid` for ledger with server pagination
  - `BaseDeleteDialog` for delete confirmation
  - Not-found state with localized message + back button
  - Skeleton loading with `aria-busy="true"`
  - File: `frontend/desktop/views/dashboard/billing/quota/quotaDetail.desktop.tsx`
  - Additional: `frontend/desktop/views/dashboard/billing/quota/components/QuotaDetailSummaryDesktop.tsx`
  - _Requirements: R3 (Detail — all criteria), R8 (Accessibility)_
  - - [ ] 5.1.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on both files
  - - [ ] 5.1.IV Instruction Verification: `frontend/AGENTS.md` + `frontend/views/AGENTS.md` + `mobile-desktop.instructions.md`

- [ ] 5.2 Create mobile quota detail tier view
  - `MobilePageContainer` + `MobilePageHeader` (breadcrumbs)
  - Stacked summary cards (MobileCardListItem per field)
  - `MobileCardList` for ledger entries with pagination
  - `BaseDeleteDialog` for delete confirmation
  - FAB position mirrored for RTL
  - File: `frontend/mobile/views/dashboard/billing/quota/quotaDetail.mobile.tsx`
  - Additional: `frontend/mobile/views/dashboard/billing/quota/components/QuotaDetailSummaryMobile.tsx`
  - _Requirements: R3 (Detail — Mobile), R9 (RTL)_
  - - [ ] 5.2.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on both files
  - - [ ] 5.2.IV Instruction Verification: `frontend/AGENTS.md` + `mobile-desktop.instructions.md`

- [ ] 5.3 Update QuotaDetailContainer to switcher pattern
  - File: `frontend/common/views/dashboard/billing/quota/QuotaDetailContainer.tsx`
  - _Requirements: R11 (Tier Isolation)_
  - - [ ] 5.3.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on container file
  - - [ ] 5.3.IV Instruction Verification: `frontend/views/AGENTS.md`

- [ ] 5.4 Update useQuotaDetailViewModel with delete dialog state + cache update
  - Add `deleteDialogOpen`, `onDeleteDialogClose`, `onDeleteConfirm` with `BaseDeleteDialog` flow
  - Delete mutation uses `update` function to remove from list cache
  - Add `notFound` boolean state
  - Add `FormErrorSnackbar` with `deleteFailed` key on error
  - File: `frontend/common/views/dashboard/billing/quota/useQuotaDetailViewModel.ts`
  - _Requirements: R3 (Detail — Delete), R15 (GraphQL Cache)_
  - - [ ] 5.4.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on VM file
  - - [ ] 5.4.IV Instruction Verification: `frontend/AGENTS.md` + `frontend/views/AGENTS.md`

---

### Task Group 6: Quota Insights — Aggregation + Filtering — Wave 1 (parallel with Groups 3, 4, 5)

- [ ] 6.1 Create desktop insights tier view
  - `DesktopPageContainer` + `DesktopPageHeader` (breadcrumbs: Quotas > Insights)
  - `DesktopMetricCardGrid` with 4 KPI cards (totalActiveClasses, totalRemaining, totalReserved, pendingBacklog)
  - Filter bar: `AppDateRangePicker` + `FilterButton` popovers (kind, status, student)
  - `ExportButton` for CSV export
  - recharts components with theme palette via `sx` callback
  - `ErrorState` on error, skeletons with `aria-busy` on loading
  - File: `frontend/desktop/views/dashboard/billing/quota/quotaInsights.desktop.tsx`
  - Additional: `frontend/desktop/views/dashboard/billing/quota/components/QuotaInsightsChartsDesktop.tsx`
  - _Requirements: R4 (Insights — all criteria)_
  - - [ ] 6.1.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on both files
  - - [ ] 6.1.IV Instruction Verification: `frontend/AGENTS.md` + `frontend/views/AGENTS.md` + `mobile-desktop.instructions.md`

- [ ] 6.2 Create mobile insights tier view
  - `MobilePageContainer` + `MobilePageHeader` + `MobileMetricCardGrid` + stacked charts + collapsible filters
  - File: `frontend/mobile/views/dashboard/billing/quota/quotaInsights.mobile.tsx`
  - Additional: `frontend/mobile/views/dashboard/billing/quota/components/QuotaInsightsChartsMobile.tsx`
  - _Requirements: R4 (Insights — Mobile)_
  - - [ ] 6.2.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on both files
  - - [ ] 6.2.IV Instruction Verification: `frontend/AGENTS.md` + `mobile-desktop.instructions.md`

- [ ] 6.3 Update QuotaInsightsContainer to switcher pattern
  - File: `frontend/common/views/dashboard/billing/quota/QuotaInsightsContainer.tsx`
  - _Requirements: R11 (Tier Isolation)_
  - - [ ] 6.3.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on container file
  - - [ ] 6.3.IV Instruction Verification: `frontend/views/AGENTS.md`

- [ ] 6.4 Create useQuotaInsightsViewModel with quotaBalance query
  - Use `useQuery(quotaBalanceQueryDocument)` for aggregated data (not client-side paginated computation)
  - Fix `pendingBacklogCount` to use real data (not aliased to `activeQuotasCount`)
  - Add filter state (dateRange, kind, status, studentId) in Zustand store
  - Add CSV export function
  - File: `frontend/common/views/dashboard/billing/quota/useQuotaInsightsViewModel.ts`
  - _Requirements: R4 (Insights — Aggregation), R15 (GraphQL)_
  - - [ ] 6.4.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on VM file
  - - [ ] 6.4.IV Instruction Verification: `frontend/AGENTS.md` + `frontend/views/AGENTS.md`

---

### Task Group 7: Navigation, Breadcrumbs, Cross-Linking — Wave 2 (parallel with Groups 8, 9)

- [ ] 7.1 Add breadcrumbs to all quota pages
  - Desktop: `DesktopPageHeader` `breadcrumbs` prop on list, new, detail, edit, insights
  - Mobile: `MobilePageHeader` `breadcrumbs` prop
  - Student tab: breadcrumbs in `MobilePageHeader`/`DesktopPageHeader`
  - Files: all tier view files (quotaList, quotaForm, quotaDetail, quotaInsights .desktop.tsx/.mobile.tsx), student quota tier files
  - _Requirements: R5 (Navigation — Breadcrumbs)_
  - - [ ] 7.1.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on modified files
  - - [ ] 7.1.IV Instruction Verification: `frontend/AGENTS.md` + `frontend/views/AGENTS.md`

- [ ] 7.2 Fix orphaned navigationConfig entries
  - Wire or remove `quotas-view`/`quotas-edit` placeholder href entries
  - Add mobile bottom nav entries for "Insights" and "Create"
  - File: `frontend/common/views/dashboard/config/navigationConfig.ts`
  - _Requirements: R5 (Navigation — Orphaned entries, Mobile bottom nav)_
  - - [ ] 7.2.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on navigationConfig file
  - - [ ] 7.2.IV Instruction Verification: `frontend/AGENTS.md`

- [ ] 7.3 Add cross-links from billing/teacher/parent dashboards to quota pages
  - Billing dashboard: link to `/quotas` from billing overview
  - Teacher student view: link to `/quotas/[id]` for student quota
  - Parent portal: link to `/students/[childId]/quotas`
  - Notifications: route quota override notifications to `/quotas/[id]`
  - Files: Relevant dashboard components (TBD during implementation)
  - _Requirements: R5 (Cross-linking)_
  - - [ ] 7.3.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on modified files
  - - [ ] 7.3.IV Instruction Verification: `frontend/AGENTS.md` + `frontend/views/AGENTS.md`

- [ ] 7.4 Add generateMetadata to students/[id]/quotas page
  - File: `app/(dashboard)/students/[id]/quotas/page.tsx`
  - _Requirements: R5 (generateMetadata)_
  - - [ ] 7.4.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on page file
  - - [ ] 7.4.IV Instruction Verification: `app/AGENTS.md` + `frontend.instructions.md`

- [ ] 7.5 Add route-level loading and error boundaries under /quotas
  - Create `app/(dashboard)/quotas/loading.tsx` and `app/(dashboard)/quotas/error.tsx`
  - Create `app/(dashboard)/quotas/[id]/not-found.tsx` for not-found state
  - Files: `app/(dashboard)/quotas/loading.tsx`, `app/(dashboard)/quotas/error.tsx`, `app/(dashboard)/quotas/[id]/not-found.tsx`
  - _Requirements: R5 (Route boundaries, Not found state)_
  - - [ ] 7.5.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on all 3 files
  - - [ ] 7.5.IV Instruction Verification: `app/AGENTS.md` + `frontend.instructions.md`

---

### Task Group 8: Audience Views — Live Data Wiring — Wave 2 (parallel with Groups 7, 9)

- [ ] 8.1 Wire StudentQuotaView to studentQuotas query
  - Fetch quota data using `studentQuotas` or `quotaBalance` query
  - Render: balance card (remaining/total), StatusBadge, valid period, recent 5 ledger entries
  - Add expiry warning (amber banner if <7 days) and exhausted banner (red if 0 remaining)
  - Empty state: "No quota assigned — contact academy admin"
  - Loading: skeleton with `aria-busy`
  - File: `frontend/common/views/dashboard/students/quota/audience/StudentQuotaView.tsx`
  - _Requirements: R6 (Audience — Student)_
  - - [ ] 8.1.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on view file
  - - [ ] 8.1.IV Instruction Verification: `frontend/AGENTS.md` + `frontend/views/AGENTS.md`

- [ ] 8.2 Wire ParentQuotaView
  - Same as StudentQuotaView + child name header + avatar
  - Handle multiple children (tabbed/segmented view)
  - File: `frontend/common/views/dashboard/students/quota/audience/ParentQuotaView.tsx`
  - _Requirements: R6 (Audience — Parent)_
  - - [ ] 8.2.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on view file
  - - [ ] 8.2.IV Instruction Verification: `frontend/AGENTS.md`

- [ ] 8.3 Wire TeacherQuotaView
  - Balance + kind + "Eligible for next class" / "Not eligible" indicator
  - File: `frontend/common/views/dashboard/students/quota/audience/TeacherQuotaView.tsx`
  - _Requirements: R6 (Audience — Teacher)_
  - - [ ] 8.3.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on view file
  - - [ ] 8.3.IV Instruction Verification: `frontend/AGENTS.md`

- [ ] 8.4 Wire SupervisorQuotaView
  - Full audit: all quotas table + override history + status breakdown
  - File: `frontend/common/views/dashboard/students/quota/audience/SupervisorQuotaView.tsx`
  - _Requirements: R6 (Audience — Supervisor)_
  - - [ ] 8.4.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on view file
  - - [ ] 8.4.IV Instruction Verification: `frontend/AGENTS.md`

---

### Task Group 9: Recurring Class Dialog — Quota Autocomplete — Wave 2 (parallel with Groups 7, 8)

- [ ] 9.1 Replace free-text quotaId field with Autocomplete
  - Use `studentOpenQuotas` query to populate options
  - Option label: student name + kind + remaining balance + validUntil
  - Change schedulingMode from Select to Tabs or Radio buttons
  - Hide on-demand-only fields when not in on-demand mode
  - Empty state: "No open quotas — create a quota first" with link to `/quotas/new`
  - File: Recurring class dialog component (TBD during implementation — search for `schedulingMode` or `quotaId` in codebase)
  - _Requirements: R7 (Recurring Class Dialog)_
  - - [ ] 9.1.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on modified file
  - - [ ] 9.1.IV Instruction Verification: `frontend/AGENTS.md` + `frontend/views/AGENTS.md`

---

### Task Group 10: Accessibility — ARIA, Keyboard, Screen Reader — Wave 3 (parallel with Groups 11, 12)

- [ ] 10.1 Add aria-labels to all icon-only buttons in quota components
  - Back button: `aria-label={t("back")}`, Edit: `aria-label={t("edit")}`, Delete: `aria-label={t("delete")}`, Add FAB: `aria-label={t("addQuota")}`
  - Files: All quota tier view files (desktop + mobile)
  - _Requirements: R8 (Accessibility — ARIA)_
  - - [ ] 10.1.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on modified files
  - - [ ] 10.1.IV Instruction Verification: `frontend/AGENTS.md`

- [ ] 10.2 Add aria-busy on loading regions and role="status" on status badges
  - Loading: `aria-busy="true"` on Skeleton/CircularProgress containers
  - StatusBadge: `role="status"` on badge element
  - DataGrid: `ariaLabel` prop + localized `emptyMessage`
  - Files: All quota tier view files
  - _Requirements: R8 (Accessibility)_
  - - [ ] 10.2.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on modified files
  - - [ ] 10.2.IV Instruction Verification: `frontend/AGENTS.md`

- [ ] 10.3 Add aria-label summaries to charts and role="alert" on error snacks
  - Charts: `aria-label` with data summary or `aria-hidden` with text alternative
  - Error snackbar: `role="alert"`, success snackbar: `role="status"`
  - Files: Insights tier views, form containers
  - _Requirements: R8 (Accessibility — Charts, Toasts)_
  - - [ ] 10.3.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on modified files
  - - [ ] 10.3.IV Instruction Verification: `frontend/AGENTS.md`

- [ ] 10.4 Implement full keyboard navigation and focus trap
  - Delete dialog: focus trap on open, focus returns to trigger on close
  - Page navigation: focus moves to page header on mount
  - Filter popovers: Tab through filter controls, Escape to close
  - Insights charts: keyboard-accessible filter toggles
  - Files: All quota containers and tier views
  - _Requirements: R8 (Accessibility — Keyboard, Focus)_
  - - [ ] 10.4.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on modified files
  - - [ ] 10.4.IV Instruction Verification: `frontend/AGENTS.md`

- [ ] 10.5 Verify WCAG AA color contrast in all quota views
  - Ensure `text.primary`/`text.secondary` on background meet 4.5:1 contrast
  - Verify StatusBadge colors for ACTIVE/EXPIRED/PENDING meet contrast on white and dark surfaces
  - Audit form error states (`error.main` on `background.default`) for contrast
  - Files: All quota frontend files
  - _Requirements: R8 (Accessibility — Contrast)_
  - - [ ] 10.5.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on modified files
  - - [ ] 10.5.IV Instruction Verification: `frontend/AGENTS.md` + `frontend/THEME_PALETTE.md`

---

### Task Group 11: Design System Compliance — Wave 3 (parallel with Groups 10, 12)

- [ ] 11.1 Fix string-quoted palette access violations
  - Replace `"text.secondary"`, `"warning.main"`, `"error.main"` with `sx={(theme) => ({ color: theme.palette.text.secondary })}` in all quota files
  - Files: All quota frontend files (search for string palette access patterns)
  - _Requirements: R10 (Design System — Theme)_
  - - [ ] 11.1.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on modified files
  - - [ ] 11.1.IV Instruction Verification: `frontend/AGENTS.md` + `frontend/THEME_PALETTE.md`

- [ ] 11.2 Replace inline Chips with StatusBadge in all quota views
  - Files: All quota frontend files using inline `<Chip>` for status
  - _Requirements: R10 (Design System — StatusBadge)_
  - - [ ] 11.2.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on modified files
  - - [ ] 11.2.IV Instruction Verification: `frontend/AGENTS.md` + `frontend/COMPONENT_PATTERNS.md`

- [ ] 11.3 Replace hand-rolled Card/MetricCard with MetricCardGrid
  - Insights: Replace `<Card><CardContent>` with `DesktopMetricCardGrid`/`MobileMetricCardGrid`
  - Files: Insights tier views, insights container
  - _Requirements: R10 (Design System — MetricCard)_
  - - [ ] 11.3.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on modified files
  - - [ ] 11.3.IV Instruction Verification: `frontend/AGENTS.md` + `frontend/COMPONENT_PATTERNS.md`

- [ ] 11.4 Fix MUI icon naming to use *Outlined variants
  - Replace any `*Outline` icon imports with `*Outlined` (MUI v9 convention)
  - Verify all icons in quota views use the `*Outlined` suffix
  - Files: All quota frontend files importing MUI icons
  - _Requirements: R10 (Design System — Icons)_
  - - [ ] 11.4.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on modified files
  - - [ ] 11.4.IV Instruction Verification: `frontend/AGENTS.md`

- [ ] 11.5 Use MUI typography variants and on<Color> palette siblings
  - Replace hardcoded `fontSize`/`fontWeight` with `variant="h6"`, `variant="body2"`, etc.
  - Use `onPrimary`, `onSurface`, `onError` siblings for contrast (Material 3 pattern)
  - Ensure no hardcoded color hex values anywhere in quota views
  - Files: All quota frontend files
  - _Requirements: R10 (Design System — Theme, Typography)_
  - - [ ] 11.5.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on modified files
  - - [ ] 11.5.IV Instruction Verification: `frontend/AGENTS.md` + `frontend/THEME_PALETTE.md`

---

### Task Group 12: Animation and Transitions — Wave 3 (parallel with Groups 10, 11)

- [ ] 12.1 Add list item enter/exit animations
  - Desktop: MUI `Grow` with `timeout={300}` on DataGrid rows (or Fade on container)
  - Mobile: MUI `Grow` staggered on card list items
  - Files: Quota list tier views, detail ledger tier views
  - _Requirements: R12 (Animation — List)_
  - - [ ] 12.1.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on modified files
  - - [ ] 12.1.IV Instruction Verification: `frontend/AGENTS.md`

- [ ] 12.2 Add page transition, dialog transition, and reduced-motion support
  - Page mount: MUI `Fade` wrapper
  - Dialog: MUI `Dialog` default transition (or custom Slide)
  - Save spinner: `SyncOutlined` with CSS `animation: spin 1s linear infinite`
  - Reduced motion: Use CSS `@media (prefers-reduced-motion: reduce)` in `sx` props to disable non-essential animations. Do NOT use `useMediaQuery("(prefers-reduced-motion: reduce)")` — it violates ESLint mobile/desktop isolation rules in tier files.
  - Charts: `isAnimationActive`, `animationDuration={500}`
  - MetricCard: Enable built-in `animated` prop for count-up effect
  - StatusBadge: Add `transition: background-color 200ms ease` for status changes
  - Files: All quota tier views, form views
  - _Requirements: R12 (Animation — all criteria)_
  - - [ ] 12.2.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on modified files
  - - [ ] 12.2.IV Instruction Verification: `frontend/AGENTS.md`

- [ ] 12.3 Guard against CodeScene 150-line limit
  - Each tier file (`.desktop.tsx`, `.mobile.tsx`) must be under 150 lines
  - Current `QuotaInsightsContainer.tsx` is 433 lines — split insights logic into VM + sub-components
  - Extract charts, filters, KPI cards into `components/` subdirectory if any tier file approaches 150 lines
  - Files: All quota tier files, insights container
  - _Requirements: R12 (Animation — Maintainability)_
  - - [ ] 12.3.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on split files
  - - [ ] 12.3.IV Instruction Verification: `frontend/AGENTS.md`

---

### Task Group 13: Storybook Stories — Wave 4 (parallel with Groups 14, 17)

- [ ] 13.1 Create QuotaContainer stories
  - States: Default, Loading, Empty, Error
  - File: `frontend/common/views/dashboard/billing/quota/QuotaContainer.stories.tsx`
  - _Requirements: R13 (Storybook)_
  - - [ ] 13.1.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on stories file
  - - [ ] 13.1.IV Instruction Verification: `frontend/AGENTS.md`

- [ ] 13.2 Create QuotaDetailContainer stories
  - States: Default, Loading, NotFound, Error
  - File: `frontend/common/views/dashboard/billing/quota/QuotaDetailContainer.stories.tsx`
  - _Requirements: R13_
  - - [ ] 13.2.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on stories file
  - - [ ] 13.2.IV Instruction Verification: `frontend/AGENTS.md`

- [ ] 13.3 Create QuotaFormContainer stories
  - States: Default (create), Edit, ValidationErrors
  - File: `frontend/common/views/dashboard/billing/quota/QuotaFormContainer.stories.tsx`
  - _Requirements: R13_
  - - [ ] 13.3.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on stories file
  - - [ ] 13.3.IV Instruction Verification: `frontend/AGENTS.md`

- [ ] 13.4 Create QuotaInsightsContainer stories
  - States: Default, Loading, Empty, Error
  - File: `frontend/common/views/dashboard/billing/quota/QuotaInsightsContainer.stories.tsx`
  - _Requirements: R13_
  - - [ ] 13.4.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on stories file
  - - [ ] 13.4.IV Instruction Verification: `frontend/AGENTS.md`

- [ ] 13.5 Create audience view stories
  - Student: Default, Loading, Empty, Error, Exhausted
  - Parent: Default, Loading, Empty
  - Teacher: Default, Empty
  - Supervisor: Default, Loading, Empty, AllStudents overview
  - Files: Co-located with audience view components
  - _Requirements: R13_
  - - [ ] 13.5.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on all stories files
  - - [ ] 13.5.IV Instruction Verification: `frontend/AGENTS.md`

---

### Task Group 14: Component Tests — Wave 4 (parallel with Groups 13, 17)

- [ ] 14.1 Create QuotaContainer component tests (desktop + mobile)
  - Desktop: DataGrid renders, pagination, empty state, loading, error
  - Mobile: CardList renders, no DataGrid (`MuiDataGrid-root` count = 0), pagination, empty, loading
  - Files: `test/ui/components/quota/QuotaContainer.desktop.test.tsx`, `QuotaContainer.mobile.test.tsx`
  - _Requirements: R14 (Tests — Component)_
  - - [ ] 14.1.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on test files
  - - [ ] 14.1.IV Instruction Verification: `.agents/instructions/tests.instructions.md` + `test/ui/AGENTS.md`

- [ ] 14.2 Create QuotaFormContainer component tests
  - Test: validation errors, student picker interaction, date picker, submit success/error
  - File: `test/ui/components/quota/QuotaFormContainer.test.tsx`
  - _Requirements: R14_
  - - [ ] 14.2.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on test file
  - - [ ] 14.2.IV Instruction Verification: `tests.instructions.md` + `test/ui/AGENTS.md`

- [ ] 14.3 Create QuotaDetailContainer component tests
  - Test: metadata rendering, delete dialog flow, not-found state
  - File: `test/ui/components/quota/QuotaDetailContainer.test.tsx`
  - _Requirements: R14_
  - - [ ] 14.3.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on test file
  - - [ ] 14.3.IV Instruction Verification: `tests.instructions.md`

- [ ] 14.4 Create QuotaInsightsContainer component tests
  - Test: KPI cards, charts, filter interaction, empty, error
  - File: `test/ui/components/quota/QuotaInsightsContainer.test.tsx`
  - _Requirements: R14_
  - - [ ] 14.4.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on test file
  - - [ ] 14.4.IV Instruction Verification: `tests.instructions.md`

- [ ] 14.5 Create audience view component tests
  - Test each audience view with mocked data
  - Files: `test/ui/components/quota/StudentQuotaView.test.tsx`, `ParentQuotaView.test.tsx`, `TeacherQuotaView.test.tsx`, `SupervisorQuotaView.test.tsx`
  - _Requirements: R14, R6_
  - - [ ] 14.5.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on test files
  - - [ ] 14.5.IV Instruction Verification: `tests.instructions.md`

---

### Task Group 15: E2E Tests — Wave 4+ (after component tests + build:test)

- [ ] 15.1 Create quota E2E test suite
  - `setupBrowserLifecycle()`, `loginAsDemoUser(DEMO_USERS.academyAdmin.groupSlug)`
  - Desktop: DataGrid visible, breadcrumbs, pagination, filters
  - Mobile: CardList visible, `.MuiDataGrid-root` count = 0
  - Create quota: navigate, fill, submit, success toast, redirect
  - Delete quota: click delete, confirm dialog, success, redirect
  - Insights: KPI cards, charts, filters
  - Bilingual regex assertions `/English|العربية/i`
  - No `waitForTimeout` / `networkidle`
  - File: `test/ui/e2e/quota.test.ts`
  - Prerequisite: `bun run build:test`
  - _Requirements: R14 (E2E)_
  - - [ ] 15.1.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on test file
  - - [ ] 15.1.IV Instruction Verification: `tests.instructions.md` + `test/ui/AGENTS.md`

---

### Task Group 16: Role-Based Access Matrix (R16) — Wave 2 (after audience views from Group 8)

- [ ] 16.1 Implement `QuotaFormAccessProvider` context for permission-based field gating
  - Create React context + hook `useQuotaFormAccess()` that reads from `usePermission` for `QUOTAS_MANAGE`, `QUOTAS_VIEW`, `QUOTA_TAB_GROUPS`
  - Gate fields: `studentId` (manage only), `kind` (manage only), `totalClasses` (manage only), `priority` (manage only), `validFrom`/`validUntil` (manage only), `periodType`/`periodDays` (manage only)
  - Read-only users see all fields disabled with `readOnly` + `helperText` explaining restricted access
  - File: `frontend/common/views/dashboard/billing/quota/components/QuotaFormAccessProvider.tsx`
  - _Requirements: R16 (Role-Based Access)_
  - - [ ] 16.1.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on provider file
  - - [ ] 16.1.IV Instruction Verification: `frontend/AGENTS.md`

- [ ] 16.2 Implement role-based visibility for audience views
  - Student: sees only own quotas (`studentQuotasQueryDocument` with own ID)
  - Parent: sees child quotas (filtered by `childIds` from parent context)
  - Teacher: sees student quotas for their classes (filtered by `studentIds` from class enrollment)
  - Supervisor: sees all quotas (`quotasQueryDocument`) + per-student `quotaBalance` for detail
  - Hide "New Quota" CTA for non-manage roles
  - Hide delete/edit actions for view-only roles
  - Files: `frontend/common/views/dashboard/students/quota/audience/*.tsx`
  - _Requirements: R16, R6_
  - - [ ] 16.2.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on audience files
  - - [ ] 16.2.IV Instruction Verification: `frontend/AGENTS.md`

- [ ] 16.3 Add permission checks to navigation config
  - Ensure `/quotas`, `/quotas/new`, `/quotas/insights` nav entries have correct `permission` fields
  - Hide "New Quota" sidebar entry for users without `QUOTAS_MANAGE`
  - Hide "Insights" for users without `QUOTAS_VIEW`
  - File: `frontend/common/views/dashboard/config/navigationConfig.ts`
  - _Requirements: R16_
  - - [ ] 16.3.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on nav config
  - - [ ] 16.3.IV Instruction Verification: `frontend/AGENTS.md`

---

### Task Group 17: GraphQL Cache Optimization — Wave 4 (parallel with Groups 13, 14)

- [ ] 16.1 Add cache update functions to quota mutations
  - Create: `update` function adds new item to `QUOTAS` list cache
  - Update: `update` function modifies existing item in list + detail cache
  - Delete: `update` function removes item from list cache (not `refetch()`)
  - Pass `version` field for optimistic concurrency (handle conflicts)
  - Files: `frontend/common/views/dashboard/billing/quota/useQuotaFormViewModel.ts`, `useQuotaDetailViewModel.ts`
  - _Requirements: R15 (GraphQL Cache)_
  - - [ ] 16.1.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on VM files
  - - [ ] 16.1.IV Instruction Verification: `frontend/AGENTS.md` + `frontend/common/graphql/AGENTS.md`

---

### Task Group 18: Knowledge Propagation & Documentation — Wave 5 (after all waves)

- [ ] 18.1 Create canonical reference doc
  - Read all outcome files in `.ai/plans/quota/ui/outcome/`
  - Create `docs/frontend/quota-ui-patterns.md` consolidating patterns, rules, gotchas
  - _Requirements: R0 (Outcome Protocol)_
  - - [ ] 18.1.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on doc file
  - - [ ] 18.1.IV Instruction Verification: `frontend/AGENTS.md`

- [ ] 18.2 Update layer AGENTS.md files
  - Update `frontend/AGENTS.md` with quota UI rules
  - Update `frontend/views/AGENTS.md` with quota tier isolation notes
  - Update root `AGENTS.md` Important References with new doc
  - Files: `frontend/AGENTS.md`, `frontend/views/AGENTS.md`, `AGENTS.md`
  - _Requirements: R0_
  - - [ ] 18.2.QL Quality Loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on AGENTS.md files
  - - [ ] 18.2.IV Instruction Verification: root `AGENTS.md`

---

## Tasks Checklist

- [x] All design components have implementation tasks
- [x] Tasks ordered to respect dependencies (i18n → schema → tier views → nav → a11y → tests)
- [x] Each task produces testable code
- [x] Requirements references included
- [x] Scope is appropriate (2-4 hours each)
- [x] Quality loop task per file (run scripts/health/sub-loop.ts --lifecycle codescene)
- [x] Instruction verification task per subtask (layer AGENTS.md + .agents/instructions)
- [x] No Drizzle schema changes (UI-only plan)
- [x] Knowledge propagation task included
- [x] R16 (Role-Based Access) task group included
- [x] SupervisorQuotaView included in Storybook (13.5) and component tests (14.5)
- [x] Accessibility sub-tasks for keyboard nav, focus trap, WCAG contrast (10.4, 10.5)
- [x] Design system sub-tasks for *Outlined icons, typography variants, on<Color> siblings (11.4, 11.5)
- [x] Animation sub-tasks for MetricCard count-up, StatusBadge color transition, CodeScene LOC budget (12.2, 12.3)
- [x] Parallel execution via subagent waves (6 waves, see implementation.md)
- [x] Each task group annotated with its wave and parallelization context
