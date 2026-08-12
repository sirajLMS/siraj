# Desktop Module AGENTS.md

This document provides essential context for AI agents working in the `frontend/desktop/` module.

## Module Overview

The `frontend/desktop/` module is the **desktop-only UI layer** containing:
- **Desktop UIKit primitives** (`components/ui/`) - ONLY the 3 tier-paired `.desktop.*` variants (`DateNavigatorDesktop`, `LocaleAdornmentSwitchDesktop`, `LocalizedStringDrawerDesktop`). No standalone `Desktop*`-prefixed primitives exist, and none use `useViewport`/null-return (the parent switcher already guarantees the tier).
- **Desktop view components** (`views/dashboard/**/`) - complete page-level desktop views, mirroring the `frontend/common/views/dashboard/` hierarchy minus the `desktop/` segment. Desktop views consume shared primitives from `@/frontend/common/components/ui` (`AppDataGrid`, `PageHeader`, `SectionPanel`, `StatusBadge`, `BaseCard`, `PageContainer`, …) and tier metric rows from `DesktopMetricCardGrid` (`@/frontend/desktop/components/ui/card/MetricCardGrid`).

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
- **Metric cards:** Views must never import or render `DesktopMetricCard`, common `MetricCard`, or common `MetricCardGrid`. Use only `DesktopMetricCardGrid` (including when there is a single metric). `DesktopMetricCard` is internal to the grid (+ Storybook).

### 3. Import Conventions
```typescript
// ✅ CORRECT - Desktop views import desktop tier-paired primitives
import { DateNavigatorDesktop } from "@/frontend/desktop/components/ui/filter";

// ✅ CORRECT - Desktop views ALSO consume shared (viewport-agnostic) primitives from common
import { AppDataGrid, PageHeader, SectionPanel, StatusBadge, BaseCard, PageContainer } from "@/frontend/common/components/ui";

// ✅ CORRECT - Metric rows via tier grid only
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";

// ✅ CORRECT - Mobile views import common primitives (non-Mobile*)
import { PageContainer, PageHeader } from "@/frontend/common/components/ui";

// ❌ WRONG - Desktop views importing Desktop* from common (Desktop* removed from common)
import { DateNavigatorDesktop } from "@/frontend/common/components/ui/filter";

// ❌ WRONG - DesktopCardGrid does NOT exist — there are no standalone Desktop*-prefixed primitives
```

### 3a. Scaffold Import Rule (Cross-Tier)
- Desktop view variants (`.desktop.tsx`) that share logic with mobile variants MUST import the shared scaffold from `__shared__/` directories — never from sibling mobile paths
- Scaffold files (`*Shared.tsx`) live in `frontend/common/views/.../components/__shared__/` or `frontend/desktop/views/.../__shared__/`
- See `docs/frontend/ui-shared-scaffold-pattern.md` for the complete pattern

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
