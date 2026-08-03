# Quota UI Production-Readiness Plan — Design

**Version**: 1.0
**Date**: 2025-01-20
**Author**: AI Agent (spec-driven-development skill)

---

## Overview

The quota system backend, GraphQL API, database schema, and i18n strings are complete, but the frontend UI has significant gaps preventing production readiness. This design document specifies the comprehensive UI/UX improvements needed to bring the quota admin pages, student quota tab, insights dashboard, and audience views to full production quality.

The approach follows the project's established patterns: Container → ViewModel → Switcher → Desktop/Mobile tier isolation, using shared UI primitives (PageContainer, PageHeader, SectionPanel, AppDataGrid, MobileCardList, StatusBadge, MetricCardGrid), react-hook-form + Zod validation, AppDatePicker, FormSuccessSnackbar/FormErrorSnackbar, and the custom compile-time i18n system.

### Design Goals

1. **Pattern Compliance** — All billing quota views follow the Container→ViewModel→Switcher→Tier pattern with proper PageContainer, PageHeader, SectionPanel, MetricCardGrid
2. **Form Validation** — Connect the currently dead Zod schemas (`quotaSchema.ts`) to react-hook-form with zodResolver
3. **Student Picker** — Replace free-text UUID TextField with Autocomplete using `studentOpenQuotas` query
4. **Delete Confirmation** — Use `BaseDeleteDialog` instead of immediate deletion
5. **Breadcrumbs & Cross-Linking** — Add breadcrumbs to all quota pages; wire cross-links from billing/teacher/parent dashboards
6. **Insights Aggregation** — Fetch aggregated data from `quotaBalance` query instead of client-side paginated computation
7. **Audience View Data** — Wire Student/Parent/Teacher/Supervisor views to live GraphQL queries
8. **Accessibility** — Add ARIA labels, role="status", aria-busy, keyboard navigation across all components
9. **i18n Completeness** — Add missing keys (PENDING, deleteFailed, deleteConfirm, pluralization), RTL FAB mirroring
10. **Animation** — Define list enter/exit, dialog transitions, page transitions, save spinner, reduced-motion fallback

---

## Key Design Decisions

### Decision 1: Tier-Isolated File Layout for Billing Quota
**Context**: Billing quota views currently co-locate desktop/mobile components in `frontend/common/views/dashboard/billing/quota/components/` — violating ESLint mobile/desktop isolation rules.
**Options**: (1) Keep co-located components, (2) Move to proper `frontend/mobile/views/` and `frontend/desktop/views/` tiers.
**Decision**: Move to proper tier directories.
**Rationale**: ESLint enforces isolation; the student quota already follows the correct pattern as a reference.

### Decision 2: React-Hook-Form + ZodResolver for Billing Form
**Context**: Billing form uses plain controlled state; student form uses RHF + zodResolver — inconsistency.
**Options**: (1) Keep plain state for billing, (2) Migrate to RHF + zodResolver.
**Decision**: Migrate to RHF + zodResolver.
**Rationale**: Consistency, validation, and the Zod schema already exists (`quotaSchema.ts`) but is dead code.

### Decision 3: StudentAutocomplete for Student Picker
**Context**: Billing form has free-text `studentId` UUID TextField; `studentOpenQuotas` query exists but is unused.
**Options**: (1) Keep free-text UUID, (2) Use existing `StudentAutocompleteDesktop`/`StudentAutocompleteMobile`, (3) Create custom autocomplete.
**Decision**: Use existing `StudentAutocompleteDesktop` (desktop) and `StudentAutocompleteMobile` (mobile) from `@/frontend/{desktop,mobile}/components/ui/input/userSelect` barrel exports.
**Rationale**: These are the canonical student picker components in the project. The `userSelect` directory exports role-specific Autocomplete components (not a generic `userSelect` component). Do NOT create a custom `StudentQuotaPicker` — reuse the existing typed Autocomplete.

### Decision 4: BaseDeleteDialog for Delete Confirmation
**Context**: `handleDelete` in `useQuotaViewModel.ts` (the list view model) calls mutation directly — no confirmation. Note: `useQuotaDetailViewModel.ts` has no delete flow; delete currently lives in the list VM only.
**Options**: (1) Add inline confirm, (2) Use `BaseDeleteDialog` shared component.
**Decision**: Use `BaseDeleteDialog`.
**Rationale**: Existing shared component with proper styling, i18n, loading state.

### Decision 5: Insights Aggregation Strategy
**Context**: Insights charts compute from paginated list (10 rows) — misleading. The existing `quotaBalanceQueryDocument` is per-student (requires `$studentId` arg), NOT a global aggregation. It cannot be used directly for billing-wide insights.
**Options**: (1) Fetch all quotas client-side, (2) Use `quotaBalance` per-student (limited to one student), (3) Add new server-side aggregation query (`quotaInsightsSummary`), (4) Use `quotasQueryDocument` with large pageSize + client-side aggregation.
**Decision**: Propose new `quotaInsightsSummary` server-side aggregation query (see Proposed New API Elements). Use `quotasQueryDocument` with expanded pagination as interim fallback. Do NOT use `quotaBalance` for billing-wide insights — it is per-student only.
**Rationale**: `quotaBalance` requires a mandatory `$studentId` argument and returns a single student's balance. Billing insights need cross-student aggregation. A new server-side query is the correct approach.

### Decision 6: StatusBadge Category Extension
**Context**: Quota statuses (ACTIVE/EXPIRED/ARCHIVED/PENDING) need StatusBadge but no `quota` category exists.
**Options**: (1) Use existing `invoice` category, (2) Extend `StatusBadgeCategory` with `quota`.
**Decision**: Extend `StatusBadgeCategory` with `quota` category mapping to palette keys.
**Rationale**: Quota statuses are semantically distinct from invoice statuses; cleaner palette mapping.

### Decision 7: Zustand Store for Pagination State
**Context**: `page`/`pageSize` in `useQuotaViewModel` use local `useState` — won't survive tier switching.
**Options**: (1) Keep local useState, (2) Move to Zustand store.
**Decision**: Move to `quotaStore.ts` Zustand store.
**Rationale**: Tier switching destroys component state but Zustand persists; `buildPaginationVars` already exists.

### Decision 8: AppDatePicker Replaces TextField type="date"
**Context**: Billing form uses `<TextField type="date">` — explicitly forbidden in AGENTS.md.
**Options**: (1) Keep type="date", (2) Use `AppDatePicker`.
**Decision**: Use `AppDatePicker` from `@/frontend/common/components/ui/form`.
**Rationale**: Project standard; provides locale-aware formatting, MUI v9 compliance.

### Decision 9: FormSuccessSnackbar + FormErrorSnackbar
**Context**: Billing form shows error Snackbar but no success toast.
**Options**: (1) Just redirect on success, (2) FormSuccessSnackbar + redirect, (3) notifications.show.
**Decision**: Use `FormSuccessSnackbar` for success + `FormErrorSnackbar` for errors.
**Rationale**: Shared components with proper a11y (role="status"/"alert"), i18n, themed styling.

### Decision 10: RTL FAB Mirroring via theme.direction
**Context**: Mobile FAB hardcoded `right: 24px` — breaks RTL.
**Options**: (1) Conditional position based on locale, (2) Use theme.direction + logical properties.
**Decision**: Use `theme.direction === 'rtl'` to mirror FAB to `left: 24px`; apply `dir="rtl"` to containers.
**Rationale**: MUI theme already tracks direction; logical CSS properties may not be supported everywhere.

---

## UX/Navigation Specification

### Route Table

| Path | Purpose | Permission | Breadcrumbs |
|------|---------|------------|-------------|
| `/quotas` | Quota list (admin) | `QUOTAS_VIEW` | Dashboard > Finance > Quotas |
| `/quotas/new` | Create quota form | `QUOTAS_MANAGE` | Dashboard > Finance > Quotas > New |
| `/quotas/[id]` | Quota detail + ledger | `QUOTAS_VIEW` | Dashboard > Finance > Quotas > [student name] |
| `/quotas/[id]/edit` | Edit quota form | `QUOTAS_MANAGE` | Dashboard > Finance > Quotas > [student name] > Edit |
| `/quotas/insights` | Quota analytics | `QUOTAS_VIEW` | Dashboard > Finance > Quotas > Insights |
| `/students/[id]/profile?tab=quota` | Student quota tab (canonical route) | `QUOTA_TAB_GROUPS` | Dashboard > Students > [student name] > Quotas |

> **Note**: `/students/[id]/quotas` is a redirect shim that redirects to `/students/[id]/profile?tab=quota`. Do not treat it as a direct render route. The canonical student quota URL is the profile tab route.

### Sidebar/Navigation Integration

**Desktop Sidebar:**
- Existing group: `grp_finance` (NOT "Billing" — the nav config uses `grp_finance` as the groupId)
- Quota items are flat siblings in `grp_finance` alongside other finance entries
- Entries: "All Quotas" (`/quotas`), "Insights" (`/quotas/insights`), "New Quota" (`/quotas/new`)
- Fix orphaned `quotas-view` (`href: "/quotas/[id]"` with literal `[id]`) and `quotas-edit` (`href: "/quotas/[id]/edit"`) entries — wire to valid routes or remove
- Note: A duplicate `quotas` nav entry exists at `navigationConfig.ts:662` in a separate nav array (likely portal/bottom-nav) — deduplicate or keep intentionally

**Mobile Bottom Navigation:**
- Add "Insights" entry to billing section (currently missing)
- Add "Create Quota" quick-action accessible from quota list

### Role-Based Access Matrix

| Role | `/quotas` | `/quotas/new` | `/quotas/[id]` | `/quotas/[id]/edit` | `/quotas/insights` | `/students/[id]/quotas` | Actions |
|------|-----------|---------------|-----------------|----------------------|---------------------|--------------------------|---------|
| SUPER_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | View, Create, Edit, Delete |
| ACADEMY_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | View, Create, Edit, Delete |
| SUPERVISOR | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | View only |
| TEACHER | ❌ | ❌ | ✅ (own students) | ❌ | ❌ | ✅ | View student quota |
| PARENT | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (own children) | View child quota |
| STUDENT | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (self) | View own quota |
| STAFF | ✅ (view) | ❌ | ✅ (view) | ❌ | ✅ (view) | ❌ | View only |
| USER | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | No access |
| GUEST | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | No access |

### Per-Audience Rendering

| Audience | Quota Tab Content | Data Source | Key Display Elements |
|----------|-------------------|------------|---------------------|
| Student | Own quota: balance, remaining classes, status, recent ledger | `studentQuotas` / `quotaBalance` | Balance card, status badge, expiry warning, recent 5 entries |
| Parent | Child's quota: same as student + child name header | `studentQuotas` (by childId) | Child name avatar, balance, status, expiry warning |
| Teacher | Student's quota: remaining balance, kind, next-class eligibility | `studentQuotas` (by studentId) | Balance, kind, "Eligible for next class" indicator |
| Supervisor | Full audit: all quotas, override history, status breakdown | `studentQuotas` + list | All quotas table, override log, status summary |

### Mobile vs Desktop Variants

| Page | Desktop Layout | Mobile Layout |
|------|---------------|---------------|
| Quota List | `DesktopPageContainer` + `DesktopPageHeader` + `DesktopMetricCardGrid` + `SectionPanel` + `DesktopAppDataGrid` | `MobilePageContainer` (edge-to-edge) + `MobilePageHeader` + `MobileMetricCardGrid` + `MobileSectionPanel` + `MobileCardList` + pagination |
| Quota Form | `DesktopPageContainer` + form sections in `SectionPanel` components, 2-column grid | `MobilePageContainer` + stacked form sections, single column |
| Quota Detail | `DesktopPageContainer` + summary grid (4 columns) + `DesktopAppDataGrid` for ledger | `MobilePageContainer` + stacked summary cards + `MobileCardList` for ledger |
| Quota Insights | `DesktopPageContainer` + `DesktopMetricCardGrid` + 2x2 chart grid + filter bar | `MobilePageContainer` + `MobileMetricCardGrid` + stacked charts + collapsible filters |

### Permission Mapping

| Permission String | Routes Protected | Action Level |
|-------------------|-----------------|-------------|
| `AppPermission.QUOTAS_VIEW` | `/quotas`, `/quotas/[id]`, `/quotas/insights`, `/students/[id]/quotas` | Read |
| `AppPermission.QUOTAS_MANAGE` | `/quotas/new`, `/quotas/[id]/edit` | Write |
| `QUOTA_TAB_GROUPS` (per-audience) | `/students/[id]/quotas` (student profile tab) | Read (audience-gated) |

---

## Component Specifications

### 1. QuotaContainer (Switcher)

```tsx
// frontend/common/views/dashboard/billing/quota/QuotaContainer.tsx
// Current imports (co-located in common/):
//   from "@/frontend/common/views/dashboard/billing/quota/components/QuotaListDesktop"
//   from "@/frontend/common/views/dashboard/billing/quota/components/QuotaListMobile"
// After migration to tier isolation:
const lazyViews = createLazyView<QuotaListViewModel>(
  () => import("@/frontend/mobile/views/dashboard/billing/quota/quotaList.mobile")
    .then(m => ({ default: m.QuotaListMobileView })),
  () => import("@/frontend/desktop/views/dashboard/billing/quota/quotaList.desktop")
    .then(m => ({ default: m.QuotaListDesktopView }))
);
export function QuotaContainer() {
  const viewModel = useQuotaViewModel();
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
```

> **Migration note**: The current `QuotaListDesktop.tsx` and `QuotaListMobile.tsx` live in `frontend/common/views/dashboard/billing/quota/components/`. Task 3.1/3.2 must relocate these to `frontend/desktop/views/dashboard/billing/quota/quotaList.desktop.tsx` and `frontend/mobile/views/dashboard/billing/quota/quotaList.mobile.tsx` respectively, then DELETE the original co-located files.

### 2. QuotaListDesktop

- **Props**: `Readonly<QuotaListViewModel>`
- **Layout**: `DesktopPageContainer` → `DesktopPageHeader` (breadcrumbs, title, actions) → `DesktopMetricCardGrid` → `SectionPanel` (FilterButton + ExportButton + PrimaryPageAction) → `DesktopAppDataGrid`
- **States**: Loading (AppDataGridLoadingOverlay), Empty (i18n emptyMessage), Error (ErrorState)
- **Accessibility**: `ariaLabel` on DataGrid, `aria-busy` on loading region
- **Animation**: Fade-in on mount (MUI Fade)

### 3. QuotaListMobile

- **Props**: `Readonly<QuotaListViewModel>`
- **Layout**: `MobilePageContainer` (edge-to-edge) → `MobilePageHeader` (breadcrumbs) → `MobileMetricCardGrid` → `MobileSectionPanel` → `MobileCardList` + `MobileCardListItem`
- **States**: Loading (skeleton cards), Empty (centered message), Error (ErrorState)
- **Accessibility**: Card items have `role="listitem"`, list has `role="list"`
- **Animation**: Card enter via MUI Grow staggered

### 4. QuotaFormDesktop / QuotaFormMobile

- **Props**: `Readonly<QuotaFormViewModel>`
- **Layout**: `DesktopPageContainer`/`MobilePageContainer` + `FormProvider` wrapping form sections
- **Form**: `react-hook-form` with `zodResolver(createQuotaSchema(labels))`
- **Fields**: StudentAutocomplete (existing component), Kind (Select: PACKAGE/PERIODIC), PeriodType (Radio), PeriodDays (Number, conditional), ValidFrom (AppDatePicker), ValidUntil (AppDatePicker), TotalClasses (Number), Priority (Select: LOW/MEDIUM/HIGH)
- **Feedback**: `FormSuccessSnackbar` on success, `FormErrorSnackbar` on error
- **Submit**: `DesktopPrimaryPageAction`/`MobilePrimaryPageAction` with spinner (SyncOutlined spin)
- **Accessibility**: `helperText`, `required`, `error` on all fields; `aria-label` on icon buttons

### 5. QuotaDetailDesktop / QuotaDetailMobile

- **Props**: `Readonly<QuotaDetailViewModel>`
- **Layout**: Page container + header (breadcrumbs, back button, edit/delete actions)
- **Summary**: SectionPanel with Grid (student, kind, periodType, periodDays, validFrom, validUntil, createdAt, updatedAt, status as StatusBadge)
- **Ledger**: DesktopAppDataGrid (desktop) / MobileCardList (mobile) with server pagination
- **Delete**: `BaseDeleteDialog` confirmation → mutation → FormSuccessSnackbar → redirect
- **Not Found**: Localized "Quota not found" with back button
- **Accessibility**: `aria-busy` on loading, `role="status"` on StatusBadge, `aria-label` on action buttons

### 6. QuotaInsightsDesktop / QuotaInsightsMobile

- **Props**: `Readonly<QuotaInsightsViewModel>`
- **Data**: `quotaBalance` GraphQL query for aggregated metrics
- **KPI**: `DesktopMetricCardGrid`/`MobileMetricCardGrid` (totalActiveClasses, totalRemaining, totalReserved, pendingBacklog)
- **Charts**: recharts components with theme palette via `sx` callback
- **Filters**: `AppDateRangePicker`, status Select, kind Select, student filter
- **Export**: `ExportButton` (CSV)
- **Accessibility**: Charts with `aria-label` summarizing data

### 7. Audience Views (StudentQuotaView, ParentQuotaView, TeacherQuotaView, SupervisorQuotaView)

- **Data**: `studentQuotas` or `quotaBalance` GraphQL query
- **Student**: Balance card (remaining/total), StatusBadge, valid period, recent 5 ledger entries, expiry warning (amber banner if <7 days), exhausted banner (red if 0 remaining)
- **Parent**: Same as student + child name + avatar header
- **Teacher**: Balance + kind + "Eligible for next class" indicator
- **Supervisor**: Full audit table, override history, status breakdown
- **States**: Loading (skeleton), Empty ("No quota assigned"), Error (ErrorState)

### 8. QuotaDeleteDialog

- **Component**: `BaseDeleteDialog` with i18n keys: `deleteConfirmTitle`, `deleteConfirmBody`, `deleteConfirmCancel`, `deleteConfirmConfirm`
- **Behavior**: Opens on delete click → confirms → calls delete mutation → success notification → redirect to list
- **Error**: `FormErrorSnackbar` with `deleteFailed` key

### 9. Student Picker (reuse existing)

> **NOTE**: Do NOT create a custom `StudentQuotaPicker` component. Use the existing `StudentAutocompleteDesktop` (desktop tier) and `StudentAutocompleteMobile` (mobile tier) from `@/frontend/{desktop,mobile}/components/ui/input/userSelect` barrel exports.

- **Component**: `StudentAutocompleteDesktop` / `StudentAutocompleteMobile` (existing, reusable)
- **Props**: `value`, `onChange`, `error`, `helperText` (matches existing Autocomplete API)
- **Data**: Student list from existing Apollo query (already wired in the component)
- **Rendering**: Shows student name + avatar in option; filters by name or ID
- **Empty**: "No students found" message (already handled by component)

---

## View Model Specifications

### useQuotaViewModel

```typescript
interface QuotaListViewModel {
  readonly quotas: QuotaListItem[];
  readonly loading: boolean;
  readonly error: ApolloError | null;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (size: number) => void;
  readonly filterStatus: string | "ALL";
  readonly filterKind: string | "ALL";
  readonly searchQuery: string;
  readonly onFilterStatusChange: (status: string) => void;
  readonly onFilterKindChange: (kind: string) => void;
  readonly onSearchChange: (query: string) => void;
  readonly refetch: () => void;
  readonly labels: DashboardBillingQuota;  // typed labels from useAppTranslation(Translation.Dashboard.BillingQuota)
}
```
- **State**: Zustand store (`page`, `pageSize`, `filterStatus`, `filterKind`, `searchQuery`)
- **Apollo**: `useQuery(quotasQueryDocument, { variables, fetchPolicy: "cache-and-network" })`
- **Permissions**: `QUOTAS_VIEW` for view, `QUOTAS_MANAGE` for "New Quota" action
- **i18n**: Labels come from `useAppTranslation(Translation.Dashboard.BillingQuota)` — NOT a `t: (key: string) => string` function. The VM receives the full typed translation object.

### useQuotaFormViewModel

```typescript
interface QuotaFormViewModel {
  readonly methods: UseFormReturn<QuotaFormData>;
  readonly isSubmitting: boolean;
  readonly isSubmitted: boolean;
  readonly error: string | null;
  readonly onSubmit: (data: QuotaFormData) => Promise<void>;
  readonly onCancel: () => void;
  readonly editingQuotaId: string | null;
  readonly permissions: { canEdit: boolean; canView: boolean };
  readonly labels: DashboardBillingQuota;  // typed labels from useAppTranslation(Translation.Dashboard.BillingQuota)
}
```
- **Form**: `useForm` with `zodResolver(createQuotaSchema(labels))` — schema factory takes typed labels, NOT a `t` function
- **Apollo**: `useMutation` (create/update) with cache `update` function
- **Feedback**: `FormSuccessSnackbar` + `FormErrorSnackbar`
- **Permissions**: `QUOTAS_MANAGE`
- **i18n**: Labels come from `useAppTranslation(Translation.Dashboard.BillingQuota)` — the schema factory receives the typed translation object, not a string-keyed translator.

### useQuotaDetailViewModel

```typescript
interface QuotaDetailViewModel {
  readonly quota: QuotaDetail | null;
  readonly ledger: LedgerEntry[];
  readonly loading: boolean;
  readonly error: ApolloError | null;
  readonly notFound: boolean;
  readonly onDelete: () => void;
  readonly deleteDialogOpen: boolean;
  readonly onDeleteDialogClose: () => void;
  readonly onDeleteConfirm: () => Promise<void>;
  readonly isDeleting: boolean;
  readonly ledgerPage: number;
  readonly ledgerPageSize: number;
  readonly ledgerTotalCount: number;
  readonly onLedgerPageChange: (page: number) => void;
  readonly permissions: { canEdit: boolean; canDelete: boolean };
  readonly labels: DashboardBillingQuota;  // typed labels from useAppTranslation(Translation.Dashboard.BillingQuota)
}
```

### useQuotaInsightsViewModel

```typescript
interface QuotaInsightsViewModel {
  readonly balance: QuotaInsightsSummary | null;  // From proposed quotaInsightsSummary query (NOT quotaBalance — that's per-student)
  readonly loading: boolean;
  readonly error: ApolloError | null;
  readonly filters: { dateRange: [Date, Date] | null; kind: string; status: string; studentId: string | null };
  readonly onFiltersChange: (filters: Partial<InsightsFilters>) => void;
  readonly onExport: () => void;
  readonly refetch: () => void;
  readonly labels: DashboardBillingQuota;  // typed labels from useAppTranslation(Translation.Dashboard.BillingQuota)
}
```
- **Apollo**: `useQuery(quotasQueryDocument, { variables: { pageSize: 999 } })` for client-side aggregation (interim). See Decision 5 for proposed `quotaInsightsSummary` server-side query.
- **i18n**: Labels come from `useAppTranslation(Translation.Dashboard.BillingQuota)` — NOT a `t` function.

### useStudentQuotaViewModel (audience)

```typescript
interface StudentQuotaViewModel {
  readonly quota: StudentQuotaData | null;
  readonly loading: boolean;
  readonly loadingState: "loading" | "missing" | "error" | "ready";
  readonly error: ApolloError | null;
  readonly audience: "student" | "parent" | "teacher" | "supervisor";
  readonly permissions: QuotaFormAccess;
  readonly refetch: () => void;
  readonly labels: DashboardStudentQuota;  // typed labels from useAppTranslation(Translation.Dashboard.StudentQuota)
}
```
- **Apollo**: `useQuery(studentQuotasQueryDocument, { variables: { studentId } })`

---

## Form Schema Design

### createQuotaSchema Factory

> **IMPORTANT**: The real schema functions are `createQuotaSchema` and `createQuotaEditSchema` (NOT `createBillingQuotaSchema`). The real i18n type is `QuotaLabels` (NOT `BillingQuotaValidationMessages`). See `frontend/common/views/dashboard/billing/quota/schemas/quotaSchema.ts` for the actual implementation.

```typescript
// frontend/common/views/dashboard/billing/quota/schemas/quotaSchema.ts
import { z } from "zod";
import type { DashboardBillingQuota } from "@/shared/locale/types/dashboard/billing/quota";

// Existing function names: createQuotaSchema and createQuotaEditSchema
// Existing i18n type: DashboardBillingQuota (the full quota namespace type)

export function createQuotaSchema(labels: DashboardBillingQuota) {
  return z.object({
    studentId: z.string().min(1, labels.errors.studentRequired),
    name: z.string().min(1, labels.errors.nameRequired),           // NEW: quota name field
    kind: z.enum(["PACKAGE", "PERIODIC"], { required_error: labels.errors.kindRequired }),  // NOTE: PERIODIC, NOT ON_DEMAND
    periodType: z.enum(["MONTHLY", "WEEKLY", "CUSTOM"], { required_error: labels.errors.periodTypeRequired }),
    periodDays: z.number().int().min(1, labels.errors.periodDaysMin).optional(),
    validFrom: z.string().min(1, labels.errors.validFromRequired),
    validUntil: z.string().min(1, labels.errors.validUntilRequired),
    totalClasses: z.number().int().min(1, labels.errors.totalClassesMin).optional(),  // totalClasses, NOT maxClasses
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),  // NEW: priority field (NOT notes)
  }).refine(data => {
    if (data.periodType === "CUSTOM" && (!data.periodDays || data.periodDays < 1)) {
      return false;
    }
    return true;
  }, { message: labels.errors.periodDaysRequired, path: ["periodDays"] })
  .refine(data => {
    if (data.validUntil && data.validFrom && new Date(data.validUntil) <= new Date(data.validFrom)) {
      return false;
    }
    return true;
  }, { message: labels.errors.validUntilAfterValidFrom, path: ["validUntil"] });
}
```

export type QuotaFormData = z.infer<ReturnType<typeof createQuotaSchema>>;
export type QuotaFormInput = z.input<ReturnType<typeof createQuotaSchema>>;
```

### Validation Messages from i18n

All validation messages come from `DashboardBillingQuota["validation"]` i18n namespace — type-safe, compile-time checked.

---

## GraphQL API Consumption Plan

### Existing Queries to Wire

| Query | Current Status | Target Component |
|-------|---------------|-------------------|
| `quotasQueryDocument` | Used (list) | QuotaListDesktop/Mobile |
| `quotaQueryDocument` | Used (detail) | QuotaDetailDesktop/Mobile |
| `quotaBalanceQueryDocument` | UNUSED (per-student, requires `$studentId`) | SupervisedStudentQuotaView (per-student only) |
| `studentQuotasQueryDocument` | UNUSED | Audience views |
| `studentOpenQuotasQueryDocument` | UNUSED | StudentAutocomplete in recurring class dialog |
| `availableClassSlotsQueryDocument` | UNUSED | Recurring class dialog (to show charged quota) — lives in `scheduling/available-slots.documents.ts` |
| ~~`quotasInsightsQueryDocument`~~ | **DOES NOT EXIST** | — (see Proposed New API Elements for `quotaInsightsSummary`) |

### Cache Update Strategies

| Mutation | Strategy |
|----------|----------|
| Create | `update` function: add new item to `QUOTAS` list cache |
| Update | `update` function: modify existing item in list + detail cache |
| Delete | `update` function: remove item from list cache (not `refetch()`) |

### Proposed New API Elements (Documented for backend team)

| Element | Purpose |
|---------|---------|
| `addQuotaCredit` mutation | Manual credit addition to existing quota |
| `expireQuota` mutation | Manual expiry of a quota (administrative override) |
| `orderBy` / `sort` in `QuotaPaginatedFilterInput` | Server-side sorting for list |
| `ON_DEMAND` kind in schema | Currently uses PACKAGE as proxy — **NOTE**: actual `QuotaKind` GraphQL enum is `PACKAGE` and `PERIODIC` (NOT `ON_DEMAND`). The form schema must use `["PACKAGE", "PERIODIC"]`. |
| `PENDING` status in schema | Quotas created but not yet active — **NOTE**: `QuotaStatus` GraphQL enum currently has `ACTIVE`, `ARCHIVED`, `EXPIRED` (NO `PENDING`). Adding `PENDING` requires a backend schema change. |

---

## i18n Key Additions

### Billing Quota Namespace (`DashboardBillingQuota`)

| Key | Type | Description |
|-----|------|-------------|
| `status.PENDING` | `string` | "Pending" status label |
| ~~`statusFormatters.PENDING`~~ | ~~`(label: string) => string`~~ | REMOVED — use `statuses.PENDING` nested object pattern (see above) |
| `deleteConfirmTitle` | `string` | "Delete Quota?" |
| `deleteConfirmBody` | `(studentName: string) => string` | "Are you sure you want to delete the quota for {studentName}?" |
| `deleteConfirmCancel` | `string` | "Cancel" |
| `deleteConfirmConfirm` | `string` | "Delete" |
| `deleteFailed` | `string` | "Failed to delete quota. Please try again." |
| `deleteSuccess` | `string` | "Quota deleted successfully." |
| `periodDays` | `string` | "Period Days" |
| `periodDaysHelperText` | `string` | "Number of days in the billing period" |
| `periodDaysRequired` | `string` | "Period days is required for custom period type" |
| `validUntilAfterValidFrom` | `string` | "Valid until must be after valid from" |
| `studentPickerPlaceholder` | `string` | "Search student..." |
| `studentPickerNoOptions` | `string` | "No students found" |
| `studentPickerLoading` | `string` | "Loading students..." |
| `notFoundTitle` | `string` | "Quota Not Found" |
| `notFoundMessage` | `string` | "The requested quota could not be found." |
| `notFoundBackButton` | `string` | "Back to Quotas" |
| `emptyListMessage` | `string` | "No quotas yet" |
| `emptyListCta` | `string` | "Create your first quota" |
| `insights filters...` | `string` | (multiple filter labels) |
| `exportSuccess` | `string` | "Insights exported successfully" |
| `quotaCount` | `(count: number) => string` | Pluralized quota count |
| `ledgerCount` | `(count: number) => string` | Pluralized ledger entry count |

### Student Quota Namespace (`DashboardStudentQuota`)

| Key | Type | Description |
|-----|------|-------------|
| `quotaCount` | `(count: number) => string` | Pluralized (Arabic singular/dual/plural) |
| `ledgerCount` | `(count: number) => string` | Pluralized ledger entries |
| `expiryWarning` | `(days: number) => string` | "Expires in {days} days" |
| `quotaExhausted` | `string` | "Quota exhausted — contact academy admin" |
| `eligibleForNextClass` | `string` | "Eligible for next class" |
| `notEligibleForNextClass` | `string` | "Not eligible — quota balance insufficient" |

---

## Accessibility Specification

### ARIA Attributes Per Component

| Component | ARIA Attributes |
|-----------|----------------|
| AppDataGrid | `ariaLabel="Quotas"`, `aria-busy={loading}` on container |
| StatusBadge | `role="status"`, `aria-label="{status label}"` |
| Icon buttons (back, edit, delete) | `aria-label="{localized action}"` |
| Loading skeletons | `aria-busy="true"` on parent container |
| Dialogs | Focus trap, `aria-labelledby`, `aria-describedby` |
| Form fields | `helperText`, `required`, `error` — screen reader announces validation |
| Toast/Snackbar (error) | `role="alert"` |
| Toast/Snackbar (success) | `role="status"` |
| Charts | `aria-label="{summary}"` or `aria-hidden` with text alternative |
| Mobile FAB | `aria-label="Add quota"` |

### Keyboard Navigation

- **Tab**: Moves through actionable elements (buttons, form fields, DataGrid rows)
- **Enter**: Activates button/link/row action
- **Escape**: Closes dialog, filters popover, search
- **Arrow keys**: Navigate within Autocomplete, Select, DataGrid

### Focus Management

- Dialog open → focus moves to dialog title
- Dialog close → focus returns to trigger button
- Page navigation → focus moves to page header

---

## Animation Specification

| Element | Animation | Implementation |
|---------|-----------|----------------|
| List item enter | Fade-in + slide-up | MUI `Grow` with `timeout={300}` or CSS `@keyframes` |
| List item exit | Fade-out | MUI `Fade` with `timeout={200}` before DOM removal |
| Dialog open | Slide up | MUI `Dialog` default transition |
| Page mount | Fade | MUI `Fade` wrapper on page container |
| Save button (submitting) | Spin icon | `SyncOutlined` with CSS `animation: spin 1s linear infinite` |
| MetricCard value | Count-up | `MetricCard` built-in `animated` prop (default true) |
| Status change | Color transition | `transition: background-color 200ms ease` |
| Charts | Recharts built-in | `isAnimationActive`, `animationDuration={500}` |
| Snackbar | Slide | MUI Snackbar default slide transition |

### Reduced Motion

> **IMPORTANT**: Do NOT use `useMediaQuery("(prefers-reduced-motion: reduce)")` in tier view files — this violates the ESLint mobile/desktop isolation rules (no `useMediaQuery` in tier components). Instead, use CSS-based media queries:

```css
/* In component sx prop or CSS module */
@media (prefers-reduced-motion: reduce) {
  /* Disable transitions and animations */
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

```tsx
// Pass isAnimationActive={false} to recharts by default; enable only via CSS
// For MUI Grow/Fade, wrap with reduced-motion CSS override instead of JS detection
```

---

## Testing Strategy

### Component Tests (`test/ui/components/quota/`)

| File | Tests |
|------|-------|
| `QuotaContainer.desktop.test.tsx` | Desktop: DataGrid renders, pagination, empty state, loading, error |
| `QuotaContainer.mobile.test.tsx` | Mobile: CardList renders, no DataGrid, pagination, empty, loading |
| `QuotaFormContainer.test.tsx` | Validation errors, student picker interaction, date picker, submit success/error |
| `QuotaDetailContainer.test.tsx` | Renders metadata, ledger, delete dialog flow, not-found state |
| `QuotaInsightsContainer.test.tsx` | KPI cards, charts, filter interaction, empty, error |
| `StudentQuotaView.test.tsx` | Balance, status, recent entries, expiry warning, exhausted |
| `ParentQuotaView.test.tsx` | Same as student + child header |
| `TeacherQuotaView.test.tsx` | Eligibility indicator |
| `SupervisorQuotaView.test.tsx` | All-student overview, role-based visibility, cross-student aggregation |

- **Mocking**: `TestWrapper` for Apollo, Happy DOM, preloads `test-env.ts`/`happy-dom-preload.ts`/`next-dynamic-mock.ts`
- **Split**: `.desktop.test.tsx` / `.mobile.test.tsx` variants

### E2E Tests (`test/ui/e2e/quota.test.ts`)

| Scenario | Viewport | Assertions |
|----------|----------|------------|
| Admin views quota list | Desktop | DataGrid visible, breadcrumbs, pagination works |
| Admin views quota list | Mobile | CardList visible, `.MuiDataGrid-root` count = 0 |
| Admin creates quota | Desktop | navigate to form, fill, submit, success toast, redirect |
| Admin deletes quota | Desktop | click delete, confirm dialog, success toast, redirect |
| Admin views insights | Desktop | KPI cards, charts render, filters work |
| Teacher views student quota | Desktop | audience view with live data |
| Mobile bottom nav | Mobile | Insights and Create entries navigate correctly |

- **Setup**: `setupBrowserLifecycle()`, `loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug)`
- **Assertions**: Bilingual regex `/English|العربية/i`
- **No**: `waitForTimeout`, `networkidle`
- **Build**: `bun run build:test` before running

### Storybook Stories (co-located)

| Story | States |
|-------|--------|
| `QuotaContainer.stories.tsx` | Default, Loading, Empty, Error |
| `QuotaDetailContainer.stories.tsx` | Default, Loading, NotFound, Error |
| `QuotaFormContainer.stories.tsx` | Default (create), Edit, ValidationErrors |
| `QuotaInsightsContainer.stories.tsx` | Default, Loading, Empty, Error |
| `StudentQuotaView.stories.tsx` | Default, Loading, Empty, Error, Exhausted |
| Each: `tags: ["autodocs"]`, `layout: "fullscreen"`, locale+theme+viewport switchable |

---

## File Organization

### Tier-Isolated File Tree (Billing Quota)

```
frontend/common/views/dashboard/billing/quota/
  ├── QuotaContainer.tsx                    # Switcher (createLazyView + ResponsiveViewSwitch)
  ├── QuotaFormContainer.tsx                # Form switcher
  ├── QuotaDetailContainer.tsx              # Detail switcher
  ├── QuotaInsightsContainer.tsx            # Insights switcher
  ├── useQuotaViewModel.ts                   # List VM
  ├── useQuotaFormViewModel.ts               # Form VM
  ├── useQuotaDetailViewModel.ts             # Detail VM
  ├── useQuotaInsightsViewModel.ts           # Insights VM
  ├── schemas/
  │   └── quotaSchema.ts                     # Zod factory (createQuotaSchema / createQuotaEditSchema — existing, not dead)
  ├── types/
  │   ├── quotaForm.types.ts                 # Form type definitions
  │   ├── quotaList.types.ts                  # List VM type
  │   ├── quotaDetail.types.ts               # Detail VM type
  │   └── quotaInsights.types.ts             # Insights VM type
  ├── utils/
  │   ├── quotaFormatters.ts                 # Date/number formatters
  │   └── quotaExport.ts                      # CSV export helper
  └── components/                             # Shared (non-tiered) components
      └── QuotaStatusBadge.tsx               # StatusBadge wrapper with quota category

frontend/desktop/views/dashboard/billing/quota/
  ├── quotaList.desktop.tsx                  # Desktop list tier
  ├── quotaForm.desktop.tsx                  # Desktop form tier
  ├── quotaDetail.desktop.tsx                # Desktop detail tier
  ├── quotaInsights.desktop.tsx              # Desktop insights tier
  └── components/
      ├── QuotaListDesktopActions.tsx         # Filter popovers, Export, New
      ├── QuotaFormSectionDesktop.tsx         # Form section groups
      ├── QuotaDetailSummaryDesktop.tsx       # Summary grid
      └── QuotaInsightsChartsDesktop.tsx      # Chart components

frontend/mobile/views/dashboard/billing/quota/
  ├── quotaList.mobile.tsx                   # Mobile list tier
  ├── quotaForm.mobile.tsx                   # Mobile form tier
  ├── quotaDetail.mobile.tsx                 # Mobile detail tier
  ├── quotaInsights.mobile.tsx               # Mobile insights tier
  └── components/
      ├── QuotaListItemMobile.tsx             # Card list item
      ├── QuotaFormSectionMobile.tsx          # Stacked form sections
      ├── QuotaDetailSummaryMobile.tsx        # Stacked summary cards
      └── QuotaInsightsChartsMobile.tsx       # Stacked charts
```

### Audience View Files (Student Quota)

```
frontend/common/views/dashboard/students/quota/audience/
  ├── StudentQuotaView.tsx                   # Wire to studentQuotas query
  ├── ParentQuotaView.tsx                    # Wire to studentQuotas (by childId)
  ├── TeacherQuotaView.tsx                   # Wire to studentQuotas (by studentId)
  └── SupervisorQuotaView.tsx                # Wire to studentQuotas + all quotas
```

### Test Files

```
test/ui/components/quota/
  ├── QuotaContainer.desktop.test.tsx
  ├── QuotaContainer.mobile.test.tsx
  ├── QuotaFormContainer.test.tsx
  ├── QuotaDetailContainer.test.tsx
  ├── QuotaInsightsContainer.test.tsx
  ├── StudentQuotaView.test.tsx
  ├── ParentQuotaView.test.tsx
  ├── TeacherQuotaView.test.tsx
  └── SupervisorQuotaView.test.tsx

test/ui/e2e/
  └── quota.test.ts
```

### Story Files (co-located with components)

```
frontend/common/views/dashboard/billing/quota/
  ├── QuotaContainer.stories.tsx
  ├── QuotaDetailContainer.stories.tsx
  ├── QuotaFormContainer.stories.tsx
  └── QuotaInsightsContainer.stories.tsx

frontend/common/views/dashboard/students/quota/audience/
  ├── StudentQuotaView.stories.tsx
  ├── ParentQuotaView.stories.tsx
  ├── TeacherQuotaView.stories.tsx
  └── SupervisorQuotaView.stories.tsx
```

> **CodeScene LOC Budget**: All tier view files (`.desktop.tsx`, `.mobile.tsx`) must stay under 150 lines. The current `QuotaInsightsContainer.tsx` is 433 lines — the insights logic must be split across the insights VM + desktop/mobile tier files. If a tier file risks exceeding 150 lines, extract sub-components (charts, filters, KPI cards) into the `components/` subdirectory.

---

## Design Checklist

- [x] All requirements addressed in design
- [x] Component responsibilities well-defined
- [x] Interfaces between components specified
- [x] Error handling covers expected failures
- [x] Security considerations addressed (role-based access matrix)
- [x] UX/Navigation Specification complete (routes, sidebar, roles, per-audience, mobile/desktop, permissions)
- [x] Accessibility specification complete
- [x] Animation specification complete
- [x] Testing strategy complete (component + E2E + Storybook)
- [x] File organization complete (tier-isolated)
