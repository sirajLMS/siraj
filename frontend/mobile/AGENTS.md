# Mobile Module AGENTS.md

This document provides essential context for AI agents working in the `frontend/mobile/` module.

## Module Overview

The `frontend/mobile/` module is the **mobile-only UI layer** containing:
- **Mobile UIKit primitives** (`components/ui/`) - `Mobile*`-prefixed primitives in three behavioral categories: viewport-gated null-return, hybrid responsive, and pure presentational (see Section 1)
- **Mobile view components** (`views/dashboard/**/`) - complete page-level mobile views, mirroring the `frontend/common/views/dashboard/` hierarchy minus the `mobile/` segment

## Architecture Rules

### 1. Mobile-Only Primitives (`components/ui/`)
- Components in this directory **MUST NOT** be used in desktop code
- Export via per-group barrels + top-level `components/ui/index.ts`
- **NEVER** export Mobile* components from `frontend/common/components/ui/`

Mobile primitives split into **three** behavioral categories (NOT all null-return):

| Primitive | Group | Category | Behavior |
|---|---|---|---|
| `MobileFab` | `button/` | **viewport-gated null-return** | `useViewport()`; `if (!isMobile) return null` |
| `MobileMetricCardGrid` | `card/` | **pure presentational** | always horizontal scroll row of internal `MobileMetricCard` — no `useViewport`, no Grid |
| `MobileCardListItem` | `card/` | **pure presentational** | no `useViewport`, no null-return |
| `MobileCardList` | `container/` | pure presentational | no `useViewport`, no null-return |
| `MobileContentStack` | `container/` | pure presentational | no `useViewport`, no null-return |
| `MobilePageHeader` | `container/page/` | pure presentational | no `useViewport`, no null-return (wraps `PageHeader`) |
| `MobileEmptyState` | `state/` | pure presentational | no `useViewport`, no null-return |
| `dateNavigator.mobile.tsx` | `filter/` | tier-paired variant | paired with `DateNavigator.tsx` parent in `common` |
| `localeAdornmentSwitch.mobile.tsx`, `localizedStringDrawer.mobile.tsx` | `input/localizedString/` | tier-paired variant | paired with parents in `common` |

> **Do NOT "fix" pure-presentational primitives** by adding `useViewport()` null-return — they are intentionally presentational-only.

### 2. Mobile Views (`views/dashboard/**/`)
- Mirror the `frontend/common/views/dashboard/` structure exactly (minus the `mobile/` segment)
- Each `.mobile.tsx` file moved from `frontend/views/**/mobile/` → `frontend/mobile/views/**/`
- Import paths rewritten: `@/frontend/views/**/mobile/...` → `@/frontend/mobile/views/**/...`
- Switchers in `frontend/common/views/...` dynamically import from `@/frontend/mobile/views/...`
- **Metric cards:** Views must never import or render `MobileMetricCard`, common `MetricCard`, or common `MetricCardGrid`. Use only `MobileMetricCardGrid` (including when there is a single metric). `MobileMetricCard` is internal to the grid (+ Storybook).

### 3. Import Conventions
```typescript
// ✅ CORRECT - Mobile views import mobile primitives
import { MobileCardList, MobilePageHeader, MobileMetricCardGrid } from "@/frontend/mobile/components/ui";

// ✅ CORRECT - Desktop views import common primitives
import { PageContainer, PageHeader } from "@/frontend/common/components/ui";

// ❌ WRONG - Mobile views importing from common (Mobile* removed from common)
import { MobileCardList } from "@/frontend/common/components/ui";

// ❌ WRONG - Views must not import the metric card primitive
import { MobileMetricCard } from "@/frontend/mobile/components/ui/card/MobileMetricCard";
```

### 4. Switcher Pattern (ResponsiveViewSwitch)
- Parent switchers live at `frontend/common/views/dashboard/<domain>/XxView.tsx` (the tier-neutral home)
- Mobile variants: dynamically imported from `frontend/mobile/views/dashboard/<domain>/*.mobile.tsx`
- Desktop variants: dynamically imported from `frontend/desktop/views/dashboard/<domain>/*.desktop.tsx`
- Use `createLazyView` from `@/frontend/common/components/ui/container/ResponsiveViewSwitch`

### 5. Type Definitions
- Mobile primitives use their own type definitions (co-located with components)
- View props types remain in their original locations (e.g., `frontend/views/.../types.ts`)
- NO new shared type files in `frontend/mobile/types/`

## Directory Structure

```
frontend/mobile/
├── AGENTS.md                    # This file
├── components/
│   └── ui/
│       ├── index.ts             # Top-level barrel
│       ├── button/
│       │   ├── index.ts
│       │   └── MobileFab.tsx
│       ├── card/
│       │   ├── index.ts
│       │   ├── MobileCardListItem.tsx
│       │   └── MobileMetricCardGrid.tsx
│       ├── container/
│       │   ├── index.ts
│       │   ├── MobileCardList.tsx
│       │   └── MobileContentStack.tsx
│       ├── container/
│       │   └── page/
│       │       ├── index.ts
│       │       └── MobilePageHeader.tsx
│       ├── filter/
│       │   ├── index.ts
│       │   └── dateNavigator.mobile.tsx
│       ├── input/
│       │   └── localizedString/
│       │       ├── index.ts
│       │       ├── localeAdornmentSwitch.mobile.tsx
│       │       └── localizedStringDrawer.mobile.tsx
│       └── state/
│           ├── index.ts
│           └── MobileEmptyState.tsx
└── views/
    └── dashboard/
        ├── admin/
        │   ├── billing/
        │   │   ├── adminBilling.mobile.tsx
        │   │   └── components/
        │   │       └── adminInvoiceCard.mobile.tsx
        │   ├── home/
        │   │   └── scheduleOverview/
        │   │       ├── scheduleOverview.mobile.tsx
        │   │       └── components/
        │   │           └── scheduleOverviewCard.mobile.tsx
        │   └── parents/
        │       ├── home/
        │       │   └── parentsView.mobile.tsx
        │       └── students/
        │           ├── students.mobile.tsx
        │           └── components/
        │               └── studentDirectoryCard.mobile.tsx
        ├── billing/
        │   ├── parentBilling.mobile.tsx
        │   └── manual/
        │       └── manualInvoice.mobile.tsx
        ├── classes/
        │   ├── audit/
        │   │   ├── classAuditView.mobile.tsx
        │   │   ├── adminNoteCard.mobile.tsx
        │   │   ├── communicationLogCard.mobile.tsx
        │   │   └── onlineMeetingCard.mobile.tsx
        │   ├── details/
        │   │   └── classDetailsContainer.mobile.tsx
        │   ├── recurring/
        │   │   └── createRecurringClassView.mobile.tsx
        │   └── status/
        │       └── tracking/
        │           ├── statusTrackingView.mobile.tsx
        │           └── statusTrackingDataGrid.mobile.tsx
        ├── complaints/
        │   ├── adminComplaints.mobile.tsx
        │   └── parentComplaints.mobile.tsx
        ├── components/
        │   └── dashboardMetricsSection.mobile.tsx
        ├── managers/
        │   └── home/
        │       └── managersView.mobile.tsx
        ├── permissions/
        │   ├── permissionManagementView.mobile.tsx
        │   └── components/
        │       └── permissionCatalogSection.mobile.tsx
        ├── profile/
        │   └── core/
        │       └── notifications/
        │           └── notificationPreferencesTab.mobile.tsx
        ├── reports/
        │   └── reports.mobile.tsx
        ├── reschedule/
        │   ├── home/
        │   │   └── rescheduleView.mobile.tsx
        │   └── tracking/
        │       └── rescheduleTrackingView.mobile.tsx
        ├── resources/
        │   └── resources.mobile.tsx
        ├── schedule/
        │   └── alerts/
        │       ├── scheduleAlertsView.mobile.tsx
        │       ├── scheduleAlertBanners.mobile.tsx
        │       └── institutionalReportCard.mobile.tsx
        ├── search-schedule/
        │   └── searchScheduleFilterDrawer.mobile.tsx
        ├── students/
        │   └── status/
        │       └── components/
        │           ├── upcomingClassesTable.mobile.tsx
        │           └── studentStatusHeader.mobile.tsx
        ├── subjects/
        │   └── home/
        │       └── subjectsView.mobile.tsx
        ├── suggestions/
        │   ├── adminSuggestions.mobile.tsx
        │   └── parentSuggestions.mobile.tsx
        ├── teachers/
        │   ├── availability/
        │   │   └── teacherAvailabilityView.mobile.tsx
        │   ├── dashboard/
        │   │   ├── teacherDashboard.mobile.tsx
        │   │   └── components/
        │   │       └── teacherScheduleCard.mobile.tsx
        │   ├── futureSchedule/
        │   │   ├── futureScheduleView.mobile.tsx
        │   │   └── components/
        │   │       ├── jumpToDateHeader.mobile.tsx
        │   │       └── futureClassCard.mobile.tsx
        │   ├── home/
        │   │   └── teachersView.mobile.tsx
        │   ├── reassignment/
        │   │   └── teacherReassignmentView.mobile.tsx
        │   └── schedule/
        │       └── weekly/
        │           └── teacherWeeklyScheduleView.mobile.tsx
        ├── tools/
        │   └── dst-migration/
        │       ├── dstMigrationView.mobile.tsx
        │       └── components/
        │           └── updatedSessionsSection.mobile.tsx
        ├── users/
        │   └── billing-profile/
        │       └── userBillingProfile.mobile.tsx
        └── parent/
            └── dashboard/
                ├── parentDashboard.mobile.tsx
                └── components/
                    └── parentScheduleCard.mobile.tsx
```

## Verification Checklist

When making changes to this module:

1. **No Mobile* exports in common** - Verify `frontend/common/components/ui/**/index.ts` don't export Mobile* components
2. **Import paths correct** - Mobile views import from `@/frontend/mobile/components/ui`
3. **Switchers updated** - Desktop view files import mobile variants from `@/frontend/mobile/views/...`
4. **Storybook paths** - Stories in `mobile/components/ui/**/*.stories.tsx` import from mobile paths
5. **TypeScript passes** - Run `bun tsgo` to verify
6. **Lint passes** - Run lint queue for modified files

## Common Mistakes to Avoid

| Mistake | Correction |
|---------|------------|
| Importing `MobilePageHeader` from `@/frontend/common/components/ui/container` | Import from `@/frontend/mobile/components/ui/container/page` |
| Keeping `.mobile.tsx` files in `frontend/views/**/mobile/` | Move to `frontend/mobile/views/**/` (no `mobile/` segment) |
| Creating `frontend/mobile/types/` | Don't - types stay co-located or in view locations |
| Exporting Mobile* from common barrels | Remove from common, only export from mobile barrels |
