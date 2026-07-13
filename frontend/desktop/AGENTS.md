# Desktop Module AGENTS.md

This document provides essential context for AI agents working in the `frontend/desktop/` module.

## Module Overview

The `frontend/desktop/` module is the **desktop-only UI layer** containing:
- **Desktop UIKit primitives** (`components/ui/`) - ONLY the 3 tier-paired `.desktop.*` variants (`DateNavigatorDesktop`, `LocaleAdornmentSwitchDesktop`, `LocalizedStringDrawerDesktop`). No standalone `Desktop*`-prefixed primitives exist, and none use `useViewport`/null-return (the parent switcher already guarantees the tier).
- **Desktop view components** (`views/dashboard/**/`) - complete page-level desktop views, mirroring the `frontend/common/views/dashboard/` hierarchy minus the `desktop/` segment. Desktop views consume shared primitives directly from `@/frontend/common/components/ui` (`AppDataGrid`, `PageHeader`, `SectionPanel`, `MetricCardGrid`, `StatusBadge`, `BaseCard`, `PageContainer`, …).

## Architecture Rules

### 1. Desktop-Only Primitives (`components/ui/`)
- The desktop `components/ui/` directory holds ONLY the 3 tier-paired `.desktop.*` variants (no standalone `Desktop*`-prefixed primitives exist):
  - `filter/dateNavigator.desktop.tsx` → `DateNavigatorDesktop`
  - `input/localizedString/localeAdornmentSwitch.desktop.tsx` → `LocaleAdornmentSwitchDesktop`
  - `input/localizedString/localizedStringDrawer.desktop.tsx` → `LocalizedStringDrawerDesktop`
- Components in this directory **MUST NOT** be used in mobile code
- None use `useViewport` or null-return — the parent switcher already guarantees the tier
- Export via per-group barrels + top-level `components/ui/index.ts`
- **NEVER** export Desktop* components from `frontend/common/components/ui/`

### 2. Desktop Views (`views/dashboard/**/`)
- Mirror the `frontend/common/views/dashboard/` structure exactly (minus the `desktop/` segment)
- Each `.desktop.tsx` file moved from `frontend/views/**/desktop/` → `frontend/desktop/views/**/`
- Import paths rewritten: `@/frontend/views/**/desktop/...` → `@/frontend/desktop/views/**/...`
- Switchers in `frontend/common/views/...` dynamically import from `@/frontend/desktop/views/...`

### 3. Import Conventions
```typescript
// ✅ CORRECT - Desktop views import desktop tier-paired primitives
import { DateNavigatorDesktop } from "@/frontend/desktop/components/ui/filter";

// ✅ CORRECT - Desktop views ALSO consume shared (viewport-agnostic) primitives from common
import { AppDataGrid, PageHeader, SectionPanel, StatusBadge, BaseCard, PageContainer } from "@/frontend/common/components/ui";

// ✅ CORRECT - Mobile views import common primitives (non-Mobile*)
import { PageContainer, PageHeader } from "@/frontend/common/components/ui";

// ❌ WRONG - Desktop views importing Desktop* from common (Desktop* removed from common)
import { DateNavigatorDesktop } from "@/frontend/common/components/ui/filter";

// ❌ WRONG - DesktopCardGrid does NOT exist — there are no standalone Desktop*-prefixed primitives
```

### 4. Switcher Pattern (ResponsiveViewSwitch)
- Parent switchers live at `frontend/common/views/dashboard/<domain>/XxView.tsx` (the tier-neutral home)
- Desktop variants: dynamically imported from `frontend/desktop/views/dashboard/<domain>/*.desktop.tsx`
- Mobile variants: dynamically imported from `frontend/mobile/views/dashboard/<domain>/*.mobile.tsx`
- Use `createLazyView` from `@/frontend/common/components/ui/container/ResponsiveViewSwitch`

### 5. Type Definitions
- Desktop primitives use their own type definitions (co-located with components)
- View props types remain in their original locations (e.g., `frontend/views/.../types.ts`)
- NO new shared type files in `frontend/desktop/types/`

## Directory Structure

```
frontend/desktop/
├── AGENTS.md                    # This file
├── components/
│   └── ui/
│       ├── index.ts             # Top-level barrel
│       ├── filter/
│       │   ├── index.ts
│       │   └── dateNavigator.desktop.tsx
│       └── input/
│           └── localizedString/
│               ├── index.ts
│               ├── localeAdornmentSwitch.desktop.tsx
│               └── localizedStringDrawer.desktop.tsx
└── views/
    └── dashboard/
        ├── admin/
        │   ├── billing/
        │   │   ├── adminBilling.desktop.tsx
        │   │   └── components/
        │   │       └── adminInvoiceCard.desktop.tsx
        │   ├── home/
        │   │   └── scheduleOverview/
        │   │       ├── scheduleOverview.desktop.tsx
        │   │       └── components/
        │   │           └── scheduleOverviewCard.desktop.tsx
        │   └── parents/
        │       ├── home/
        │       │   └── parentsView.desktop.tsx
        │       └── students/
        │           ├── students.desktop.tsx
        │           └── components/
        │               └── studentDirectoryCard.desktop.tsx
        ├── billing/
        │   ├── parentBilling.desktop.tsx
        │   └── manual/
        │       └── manualInvoice.desktop.tsx
        ├── classes/
        │   ├── audit/
        │   │   ├── classAuditView.desktop.tsx
        │   │   ├── adminNoteCard.desktop.tsx
        │   │   ├── communicationLogCard.desktop.tsx
        │   │   └── onlineMeetingCard.desktop.tsx
        │   ├── details/
        │   │   └── classDetailsContainer.desktop.tsx
        │   ├── recurring/
        │   │   └── createRecurringClassView.desktop.tsx
        │   └── status/
        │       └── tracking/
        │           ├── statusTrackingView.desktop.tsx
        │           └── statusTrackingDataGrid.desktop.tsx
        ├── complaints/
        │   ├── adminComplaints.desktop.tsx
        │   └── parentComplaints.desktop.tsx
        ├── components/
        │   └── dashboardMetricsSection.desktop.tsx
        ├── managers/
        │   └── home/
        │       └── managersView.desktop.tsx
        ├── permissions/
        │   ├── permissionManagementView.desktop.tsx
        │   └── components/
        │       └── permissionCatalogSection.desktop.tsx
        ├── profile/
        │   └── core/
        │       └── notifications/
        │           └── notificationPreferencesTab.desktop.tsx
        ├── reports/
        │   └── reports.desktop.tsx
        ├── reschedule/
        │   ├── home/
        │   │   └── rescheduleView.desktop.tsx
        │   └── tracking/
        │       └── rescheduleTrackingView.desktop.tsx
        ├── resources/
        │   └── resources.desktop.tsx
        ├── schedule/
        │   └── alerts/
        │       ├── scheduleAlertsView.desktop.tsx
        │       ├── scheduleAlertBanners.desktop.tsx
        │       └── institutionalReportCard.desktop.tsx
        ├── search-schedule/
        │   └── searchScheduleFilterDrawer.desktop.tsx
        ├── students/
        │   └── status/
        │       └── components/
        │           ├── upcomingClassesTable.desktop.tsx
        │           └── studentStatusHeader.desktop.tsx
        ├── subjects/
        │   └── home/
        │       └── subjectsView.desktop.tsx
        ├── suggestions/
        │   ├── adminSuggestions.desktop.tsx
        │   └── parentSuggestions.desktop.tsx
        ├── teachers/
        │   ├── availability/
        │   │   └── teacherAvailabilityView.desktop.tsx
        │   ├── dashboard/
        │   │   ├── teacherDashboard.desktop.tsx
        │   │   └── components/
        │   │       └── teacherScheduleCard.desktop.tsx
        │   ├── futureSchedule/
        │   │   ├── futureScheduleView.desktop.tsx
        │   │   └── components/
        │   │       ├── jumpToDateHeader.desktop.tsx
        │   │       └── futureClassCard.desktop.tsx
        │   ├── home/
        │   │   └── teachersView.desktop.tsx
        │   ├── reassignment/
        │   │   └── teacherReassignmentView.desktop.tsx
        │   └── schedule/
        │       └── weekly/
        │           └── teacherWeeklyScheduleView.desktop.tsx
        ├── tools/
        │   └── dst-migration/
        │       ├── dstMigrationView.desktop.tsx
        │       └── components/
        │           └── updatedSessionsSection.desktop.tsx
        ├── users/
        │   └── billing-profile/
        │       └── userBillingProfile.desktop.tsx
        └── parent/
            └── dashboard/
                ├── parentDashboard.desktop.tsx
                └── components/
                    └── parentScheduleCard.desktop.tsx
```

## Verification Checklist

When making changes to this module:

1. **No Desktop* exports in common** - Verify `frontend/common/components/ui/**/index.ts` don't export Desktop* components
2. **Import paths correct** - Desktop views import tier-paired primitives from `@/frontend/desktop/components/ui` and shared primitives from `@/frontend/common/components/ui`
3. **Switchers updated** - Switchers in `frontend/common/views/...` import desktop variants from `@/frontend/desktop/views/...`
4. **Storybook paths** - Stories in `desktop/components/ui/**/*.stories.tsx` import from desktop paths
5. **TypeScript passes** - Run `bun tsgo` to verify
6. **Lint passes** - Run lint queue for modified files

## Common Mistakes to Avoid

| Mistake | Correction |
|---------|------------|
| Importing `DesktopDateNavigator` from `@/frontend/common/components/ui/filter` | Import from `@/frontend/desktop/components/ui/filter` |
| Keeping `.desktop.tsx` files in `frontend/views/**/desktop/` | Move to `frontend/desktop/views/**/` (no `desktop/` segment) |
| Creating `frontend/desktop/types/` | Don't - types stay co-located or in view locations |
| Exporting Desktop* from common barrels | Remove from common, only export from desktop barrels |
| Importing `@/frontend/mobile/...` in desktop code | ESLint enforced via `no-restricted-imports` on `.desktop$` suffix |