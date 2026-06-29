# Sidebar Permission Fix Plan

## Problem

The dashboard sidebar has 16 permission mismatches between what `navigationConfig.ts` requires to show an item vs what the actual page/container requires to function. This causes:

- **Users blocked from sidebar navigation** even though they can access the page (e.g., Parents can't see "Submit Complaint" or "Submit Suggestion")
- **Users seeing sidebar links that lead to blank pages** (e.g., Staff see "Teachers" link but page is gated by `StaffViewDirectory` which they lack)
- **Unguarded pages** with no permission checks at all (e.g., `/schedule/alerts`)
- **Wrong domain permissions** (e.g., suggestions pages gated by complaints permissions)
- **Action/form pages** cluttering the sidebar unnecessarily

---

## Implementation Phases

### Phase 1: Create `frontend/types/page-permissions.types.ts`

Define a `PagePermissions` type and per-page constants that align sidebar visibility to each page's actual `RequirePermission` gate.

```typescript
import type { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";

export type PagePermissions = readonly AppPermission[];

export const PAGE_PERMISSIONS = {
  dashboard: [AppPermission.DashboardView, AppPermission.DashboardViewMetrics] as PagePermissions,
  teacherDashboard: [AppPermission.TeacherViewDashboard] as PagePermissions,
  teacherDashboardActive: [AppPermission.SessionActivateClass] as PagePermissions,
  searchSchedule: [AppPermission.ScheduleSearchAvailability] as PagePermissions,
  scheduleTracking: [AppPermission.SessionReschedule] as PagePermissions,
  statusTracking: [AppPermission.ScheduleViewAll] as PagePermissions,
  scheduleAlerts: [AppPermission.ScheduleViewList] as PagePermissions,
  teachers: [AppPermission.StaffViewDirectory] as PagePermissions,
  parents: [AppPermission.ParentViewDirectory] as PagePermissions,
  students: [AppPermission.StudentsList] as PagePermissions,
  managers: [AppPermission.StaffViewDirectory] as PagePermissions,
  resources: [AppPermission.ResourcesList] as PagePermissions,
  booksAndBags: [AppPermission.ResourcesList] as PagePermissions,
  reports: [AppPermission.ReportGenerateCustom] as PagePermissions,
  billingAdmin: [AppPermission.BillingViewHistory] as PagePermissions,
  billingParent: [AppPermission.BillingViewHistory] as PagePermissions,
  complaintsManage: [AppPermission.ComplaintsRespond, AppPermission.ComplaintsList] as PagePermissions,
  suggestionsSubmit: [AppPermission.CommunicationSubmitSuggestion] as PagePermissions,
  suggestionsManage: [AppPermission.SuggestionsList] as PagePermissions,
  complaintsSubmit: [AppPermission.SupportSubmitComplaint] as PagePermissions,
  dstMigration: [AppPermission.SystemBulkUpdateDst] as PagePermissions,
  permissions: [AppPermission.PermissionGroupsManage] as PagePermissions,
} as const;
```

---

### Phase 2: Add Missing Permission Gate to `ScheduleAlertsContainer.tsx`

**File**: `frontend/views/dashboard/schedule/alerts/ScheduleAlertsContainer.tsx`

- Add `RequirePermission` import and `AppPermission` import
- Wrap the rendered content with `<RequirePermission permissions={[AppPermission.ScheduleViewList]}>`

This currently has **zero permission checks**, making the page accessible to any authenticated user.

---

### Phase 3: Update `navigationConfig.ts`

**File**: `frontend/views/dashboard/config/navigationConfig.ts`

Import `PAGE_PERMISSIONS` from the new types file and replace all hardcoded permissions:

| Sidebar Key | Old Permission | New Permission (from PAGE_PERMISSIONS) |
|---|---|---|
| `teachers` | `TeachersList` | `PAGE_PERMISSIONS.teachers` → `StaffViewDirectory` |
| `parents` | `ParentsList` | `PAGE_PERMISSIONS.parents` → `ParentViewDirectory` |
| `managers` | `StaffList` | `PAGE_PERMISSIONS.managers` → `StaffViewDirectory` |
| `billing-admin` | `InvoicesEdit` | `PAGE_PERMISSIONS.billingAdmin` → `BillingViewHistory` |
| `billing-parent` | `InvoicesList` | `PAGE_PERMISSIONS.billingParent` → `BillingViewHistory` |
| `billing-manual` | `InvoicesCreate` | `PAGE_PERMISSIONS.billingManual` → `BillingCreateInvoice` |
| `complaints-submit` | `ComplaintsList` | `PAGE_PERMISSIONS.complaintsSubmit` → `SupportSubmitComplaint` |
| `complaints-manage` | `ComplaintsRespond` | `PAGE_PERMISSIONS.complaintsManage` → `[ComplaintsRespond, ComplaintsList]` |
| `suggestions-submit` | `ComplaintsList` | `PAGE_PERMISSIONS.suggestionsSubmit` → `CommunicationSubmitSuggestion` |
| `suggestions-manage` | `ComplaintsRespond` | `PAGE_PERMISSIONS.suggestionsManage` → `SuggestionsList` |
| `reports` | `ReportsGenerate` | `PAGE_PERMISSIONS.reports` → `ReportGenerateCustom` |
| `dst-migration` | `ScheduleDstMigrate` | `PAGE_PERMISSIONS.dstMigration` → `SystemBulkUpdateDst` |
| `schedule-tracking` | `ScheduleManageRecurring` | `PAGE_PERMISSIONS.scheduleTracking` → `SessionReschedule` |
| `home` | `[DashboardView, DashboardViewMetrics]` | `PAGE_PERMISSIONS.dashboard` (no change in value) |
| `teacher-dashboard` | `TeacherViewDashboard` | `PAGE_PERMISSIONS.teacherDashboard` (no change in value) |
| `teacher-dashboard-active` | `SessionActivateClass` | `PAGE_PERMISSIONS.teacherDashboardActive` (no change in value) |
| `search-schedule` | `ScheduleSearchAvailability` | `PAGE_PERMISSIONS.searchSchedule` (no change in value) |
| `status-tracking` | `ScheduleViewAll` | `PAGE_PERMISSIONS.statusTracking` (no change in value) |
| `schedule-alerts` | `ScheduleViewList` | `PAGE_PERMISSIONS.scheduleAlerts` (no change in value) |
| `students` | `StudentsList` | `PAGE_PERMISSIONS.students` (no change in value) |
| `resources` | `ResourcesList` | `PAGE_PERMISSIONS.resources` (no change in value) |
| `books-and-bags` | `ResourcesList` | `PAGE_PERMISSIONS.booksAndBags` (no change in value) |
| `permissions` | `PermissionGroupsManage` | `PAGE_PERMISSIONS.permissions` (no change in value) |

---

### Phase 4: Remove Action Pages from Sidebar

Remove these items from both `SIDEBAR_NAV_ITEMS` and `BOTTOM_NAV_ITEMS` in `navigationConfig.ts`:

| Key | Href | Reason |
|---|---|---|
| `classes-create` | `/classes/new` | Create recurring class form |
| `manager-onboarding` | `/managers/onboarding` | Create staff form |
| `billing-manual` | `/billing/manual` | Create invoice form |
| `schedule-reschedule` | `/reschedule` | Action form requiring `classInstanceId` query param |

These are create/mutate forms triggered from other pages, not standalone navigation destinations.

---

### Phase 5: Verify Enum Mapping

Verify that all newly-referenced `AppPermission` keys exist in the GraphQL-generated enum at `frontend/graphql/generated/gql/graphql-types.ts`:

- `BillingViewHistory`
- `BillingCreateInvoice`
- `SystemBulkUpdateDst`
- `SuggestionsList`
- `CommunicationSubmitSuggestion`
- `SupportSubmitComplaint`
- `StaffViewDirectory`
- `ParentViewDirectory`
- `ReportGenerateCustom`

The `DashboardClientBridge.tsx` and `UserStoreInitializer.tsx` already map backend dot-notation (`billing.view_history`) → frontend SCREAMING_CASE (`BillingViewHistory`), so no structural changes should be needed there.

---

### Phase 6: Verify & Test

1. Run `bun tsgo` for type checking
2. Run `bun quality-gate` for full validation (tsgo → biome → lint → codescene → sonar)
3. Manual verification: confirm sidebar visibility per role group:
   - **Teacher**: sees home, teacher-dashboard, teacher-dashboard-active, resources, books-and-bags
   - **Parent**: sees home, complaints-submit, suggestions-submit
   - **Staff**: sees home, students, complaints-manage (via ComplaintsList), schedule status-tracking
   - **Academy Admin**: sees billing-admin, suggestions-manage, reports, schedule-tracking, etc.
   - **Super Admin**: sees everything

---

## Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Permission strategy | Align sidebar to page's actual `RequirePermission` | Single source of truth — page permissions drive visibility |
| Action pages | Remove all from sidebar | Forms triggered from context, not standalone nav destinations |
| Schedule alerts gate | Add `ScheduleViewList` `RequirePermission` | Matches sidebar config, closes security gap |
| Directory pages | Sidebar uses `StaffViewDirectory` / `ParentViewDirectory` | Matches what the page actually checks |
| Billing permissions | Sidebar uses `billing.*` permissions | Matches what the page actually checks; `invoices.*` is legacy |
| Type file location | `frontend/types/page-permissions.types.ts` | Clean separation from nav config |
| Server/client separation | Preserved | Server-side filtering stays in `DashboardClientBridge`; client-side gates stay as `RequirePermission` |

---

## Impact Summary by User Group

### Teacher Default Group
- **Before**: Could see home, teacher-dashboard, resources, books-and-bags. Schedule alerts hidden but accessible via URL.
- **After**: Same visible items. Schedule alerts now properly gated (same visibility, but page is secured).

### Parent Default Group
- **Before**: Could NOT see "Submit Complaint" or "Submit Suggestion" despite having the permissions. Critical bug.
- **After**: Parents CAN now see both sidebar links. Fixes the primary usability blocker.

### Staff Default Group
- **Before**: Saw "Teachers", "Parents" links leading to blank pages. Could not see "Manage Complaints" despite having `ComplaintsList`. Saw "Submit Suggestion/Complaint" links leading to blank pages.
- **After**: No longer sees directory links they can't access. CAN now see "Manage Complaints" (via `ComplaintsList`). No longer sees submit forms they can't access.

### Academy Admin Group
- **Before**: Could NOT see billing-admin, billing-manual, suggestions-manage, reports, schedule-tracking despite having the corresponding page permissions.
- **After**: All these sidebar items are now visible to Academy Admin.

---

## Files Modified

| File | Change |
|---|---|
| `frontend/types/page-permissions.types.ts` | **NEW** — page permission constants |
| `frontend/views/dashboard/config/navigationConfig.ts` | Import PAGE_PERMISSIONS, replace all hardcoded permissions, remove 4 action items |
| `frontend/views/dashboard/schedule/alerts/ScheduleAlertsContainer.tsx` | Add `RequirePermission` wrapper with `ScheduleViewList` |
| `frontend/views/dashboard/config/mockNavigationConfig.ts` | Update permissions to align with PAGE_PERMISSIONS (keep extra mock items) |

## Files NOT Modified (no changes needed)

| File | Reason |
|---|---|
| `frontend/views/dashboard/components/DashboardClientBridge.tsx` | Already maps all AppPermission enums correctly |
| `frontend/views/dashboard/components/client/UserStoreInitializer.tsx` | Already maps all AppPermission enums correctly |
| `frontend/components/auth/RequirePermission.tsx` | Logic unchanged |
| `frontend/stores/userStore.ts` | `hasPermission` logic unchanged |
| `backend/` | No backend changes needed — permission model is correct, only frontend sidebar config was wrong |
