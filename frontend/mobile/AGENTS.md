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
| `MobileContentStack` | `container/` | pure presentational | no `useViewport`, no null-return; gap/pb only — no horizontal px |
| `MobileContentInset` | `container/` | pure presentational | shared content gutter wrapper for toolbars / buttons / ad-hoc blocks |
| `MobileSectionTitleRow` | `container/` | pure presentational | title + actions row with content gutter |
| `MobilePageHeader` | `container/page/` | pure presentational | no `useViewport`; always content gutter; `edgeToEdge` = chrome only |
| `MobileEmptyState` | `state/` | pure presentational | no `useViewport`; includes content gutter |
| `dateNavigator.mobile.tsx` | `filter/` | tier-paired variant | paired with `DateNavigator.tsx` parent in `common` |
| `localeAdornmentSwitch.mobile.tsx`, `localizedStringDrawer.mobile.tsx` | `input/localizedString/` | tier-paired variant | paired with parents in `common` |

> **Do NOT "fix" pure-presentational primitives** by adding `useViewport()` null-return — they are intentionally presentational-only.

### 1b. Mobile padding ownership (edge-to-edge shell)

`DashboardLayoutMobile` uses `px: 0`. Horizontal inset is **not** on `MobilePageContainer` / `MobileContentStack`.

| Owns gutter | Notes |
|---|---|
| `mobileContentGutterSx` / `MobileContentInset` | Shared `paddingInline: theme.spacing(2)` for ad-hoc content |
| `MobilePageHeader` | Always pads; `edgeToEdge` does not remove inset |
| `MobileSectionTitleRow` | Title + SEE ALL / actions rows |
| `MobileSectionPanel` | Title bar padded; body padded unless `contentInset={false}` |
| `MobileHorizontalScrollRow` / `MobileMetricCardGrid` | Own peek-scroll padding — do not wrap in `MobileContentInset` |
| `MobileEmptyState` | Includes content gutter |

**Full-bleed containers** (heroes, edge-to-edge panels with `contentInset={false}`) must pad their own children via the helpers above or list primitives (`MobileCardList` edge-to-edge layout).

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


## Oxlint Rules (CRITICAL — NO `oxlint-disable` comments allowed)

Oxlint is the project's linter (`bun run oxlint`). It uses type-aware mode (`typeAware: true`, `typeCheck: true` in `oxlint.config.mts`). NEVER add `oxlint-disable` comments — fix the root cause instead.

### no-unsafe-type-assertion (STRICT — stricter than ESLint)

Oxlint's `no-unsafe-type-assertion` rule flags ALL `as Type` assertions that narrow from a wider type to a narrower one. **`as unknown as Type` (double assertion) does NOT bypass this rule.**

**Use type guards instead of `as`:**
```ts
// WRONG — flagged by oxlint
const record = value as Record<string, unknown>;
const error = caught as Error;
const row = result as EntitySelectType;

// RIGHT — type guard (not flagged)
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
const record = isRecord(value) ? value : {};

// RIGHT — instanceof for errors
if (error instanceof Error) return error;
throw new Error(String(error));

// RIGHT — find() with widening cast for enum narrowing
const match = Object.values(SomeEnum).find(v => (v as string) === value);
// `(v as string)` is a widening cast (safe, not flagged)
```

**For Drizzle pgEnum columns** (inferred as `string` not the enum type):
- Add `.$type<EnumType>()` to the column definition in the schema to fix at source
- OR use type guards: `function isStatus(value: string): value is Status { return (Object.values(Status) as readonly string[]).includes(value); }`

**For `response.json()` (returns `any`):**
- Type the variable: `const data: SomeType = await response.json();`
- OR use a type guard: `const data: unknown = await response.json(); if (!isSomeType(data)) throw ...;`

### no-await-in-loop

`await` inside `for`, `while`, `do...while`, `for...of` loops is flagged.

**Use `Promise.all` for independent iterations:**
```ts
// WRONG
for (const item of items) { await process(item); }

// RIGHT — parallel
await Promise.all(items.map(item => process(item)));
```

**Use recursive helper for sequential iterations (shared transactions, ordered timestamps):**
```ts
async function processNext(index: number): Promise<void> {
  if (index >= items.length) return;
  await process(items[index]);
  return processNext(index + 1);
}
await processNext(0);
```

**Use `reduce` chain as alternative:**
```ts
await items.reduce(async (prev, item) => {
  await prev;
  return processOne(item);
}, Promise.resolve());
```

**`for await...of` is NOT flagged** (async iterable iteration).

**DO NOT parallelize when:** iterations share a DB transaction connection, each depends on the previous result, or ordering matters (e.g., sequential timestamps for pagination tests).

### consistent-function-scoping

Functions defined inside another function that don't capture any variables from the enclosing scope should be at module scope.

```ts
// WRONG — doesn't capture anything from parent
function component() {
  const helper = (x: string) => x.toUpperCase(); // flagged
  return helper("test");
}

// RIGHT — moved to module scope
const helper = (x: string) => x.toUpperCase();
function component() {
  return helper("test");
}
```

### no-object-type-as-default-prop

React component default props must not be object/array literals (re-created every render, breaks referential equality).

```ts
// WRONG
function Component({ options = {} }: Props) { ... }
function Component({ items = [] }: Props) { ... }

// RIGHT — stable module-level reference
const DEFAULT_OPTIONS = {};
const DEFAULT_ITEMS: readonly ItemType[] = [];
function Component({ options = DEFAULT_OPTIONS, items = DEFAULT_ITEMS }: Props) { ... }
```

### no-underscore-dangle

Identifiers with leading underscores are flagged. Fix by renaming, or use bracket notation for external API fields:

```ts
// WRONG
const value = obj._ref;
function _helper() { ... }

// RIGHT — rename
const value = obj.ref;
function helper() { ... }

// RIGHT — bracket notation for external API fields (not flagged)
const refKey = "_ref";
const value = obj[refKey];
// OR: const { _ref } = obj; (destructuring not flagged)
```

### no-unsafe-enum-comparison

Comparing values of different enum types (or enum vs string) is flagged.

```ts
// WRONG — enum vs string
if (row.status === SomeEnum.VALUE) { ... }

// RIGHT — both sides as string
if (String(row.status) === String(SomeEnum.VALUE)) { ... }
// OR use string literals
if (row.status === "VALUE") { ... }
// OR use Set-based lookup
const VALID_STATUSES = new Set(Object.values(SomeEnum) as string[]);
if (VALID_STATUSES.has(row.status)) { ... }
```

### no-shadow

Variable names shadowing an outer scope variable are flagged. Fix with destructuring rename or `_` prefix for unused params:

```ts
// WRONG
const studentHref = "...";
function Card({ studentHref }: Props) { ... } // shadows

// RIGHT — destructuring rename
function Card({ studentHref: href }: Props) { ... }

// RIGHT — unused param prefix (config: argsIgnorePattern: "^_")
async function test(_tx: DBTransaction) { ... }
```

### consistent-return

Functions must consistently return values or not return values (no mixing `return value` and `return;`).

```ts
// WRONG — mixes void and value returns
function getStatus(active: boolean) {
  if (active) return "ACTIVE";
  return; // void return — flagged
}

// RIGHT — consistent value returns
function getStatus(active: boolean) {
  if (active) return "ACTIVE";
  return undefined; // or return null;
}
```

**Config override exists** for `useEffect` callbacks (false positives — the rule doesn't understand React cleanup patterns). Already configured in `oxlint.config.mts`.

### Config Overrides (legitimate — NOT `oxlint-disable`)

The `oxlint.config.mts` has `overrides` for:
- **Test files**: `@typescript-eslint/unbound-method: "off"` (false positive for mock function references)
- **`useEffect` files**: `@typescript-eslint/consistent-return: "off"` (false positive for cleanup callbacks)
- **Logger/scripts**: `no-console: "off"` (intentional console usage)

These are config-level overrides, NOT inline `oxlint-disable` comments.
