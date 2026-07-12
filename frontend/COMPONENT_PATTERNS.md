# Dashboard UI Component Patterns

**Last updated:** 2026-06-13  
**Status:** Phases 0–2 complete; card/header migration complete on implemented pages; typography standardized on class detail cards

This document defines the shared UI layer for Siraj dashboard pages. All new dashboard views **must** follow these patterns.

**Related docs:**

- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — page rollout and workflow
- [AGENTS.md](AGENTS.md) — Dashboard UI Patterns (agent rules)
- [`.kiro/design-consistency-analysis.md`](.kiro/design-consistency-analysis.md) — original audit + progress
- [`.gemini/ui-consistency-analysis.md`](.gemini/ui-consistency-analysis.md) — findings + guidelines
- [`.cursor/plans/UI Pattern Analysis-d1994f10.plan.md`](.cursor/plans/UI%20Pattern%20Analysis-d1994f10.plan.md) — rollout plan + todos

---

## Architecture

```
DashboardLayout (pageMargin only)
  └── PageContainer (section gap — NO extra p: 2/3)
        ├── PageHeader (title, subtitle, breadcrumbs?, actions?)
        ├── MetricCard grid
        └── SectionPanel (title bar + actions)
              ├── AppDataGrid (desktop, ≥ md)
              └── *CardList (mobile, < md)
```

**Import from:** `@/frontend/components/ui`

---

## Layout

### PageContainer

- **Purpose:** Single content wrapper inside `DashboardLayout`. Fixes double-padding.
- **Rule:** Views must **not** add outer `p: 2`, `p: 3`, or `p: { xs: 2, md: 3 }`.
- **Spacing:** Uses `theme.layout.sectionGap` between child sections.

```tsx
<PageContainer>
  <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
  {/* sections */}
</PageContainer>
```

### PageHeader

- **Title:** `variant="headlineLg"` (use `titleVariant="headlineMd"` on mobile if needed)
- **Subtitle:** `variant="bodyLg"`
- **Actions:** Pass `FilterButton`, `PrimaryPageAction`, `ExportButton` presets
- **Breadcrumbs:** Optional `breadcrumbs` prop (see class audit `ClassAuditView`)

### SectionPanel

- **Purpose:** Bordered `Paper` with optional title bar and action slot
- **Use for:** Table sections, list sections with filter/export buttons
- **Children:** `AppDataGrid` (desktop) or card lists (mobile)

---

## Tables — AppDataGrid

**Default:** Use `@mui/x-data-grid` via [`AppDataGrid`](src/components/ui/AppDataGrid.tsx). Do **not** hand-build MUI `Table` for list pages.

### Wrapper features

- Themed headers (`palette.table.header`)
- Built-in pagination (client or server mode)
- Empty state overlay (`emptyMessage` prop)
- Loading overlay (`loading` prop)
- `disableRowSelectionOnClick` by default

### Page-specific DataGrid components

Place column definitions in `src/views/dashboard/<feature>/components/*DataGrid.tsx`:

| Component                    | Route                           | Pagination                         |
| ---------------------------- | ------------------------------- | ---------------------------------- |
| `StudentDirectoryDataGrid`   | `/students`                     | Client                             |
| `AcademicScheduleDataGrid`   | `/schedule/alerts`              | Server (`paginationMode="server"`) |
| `StatusTrackingDataGrid`     | `/schedule/tracking/status`     | Client                             |
| `RescheduleTrackingDataGrid` | `/schedule/tracking/reschedule` | Client                             |
| `ScheduleOverviewDataGrid`   | `/dashboard`                    | Client                             |

### Mobile strategy

- **Desktop (`≥ md`):** `AppDataGrid` inside `SectionPanel`
- **Mobile (`< md`):** Keep existing `*CardList` components — do not force DataGrid on small screens

### Exceptions (keep MUI Table)

- `RegisteredStudentsSection` on class audit — embedded 2/4-column section inside a card
- Style these tables to match `palette.table.header` tokens

---

## Cards

### BaseCard

Low-level wrapper enforcing `theme.layout.radius.card`, `theme.layout.cardPadding`, `theme.palette.border.light`, `theme.palette.shadow.card`.

Use for all class detail and audit section cards (e.g. `ClassInfoCard`, `MetadataCard`, `RegisteredStudentsSection` shell). Override with `sx={{ p: 0 }}` when the card has a custom header bar or table body.

### MetricCard

Use for all stat/metric displays. Variants: `default | error | highlight | danger | compact`. Optional `animated` for dashboard home.

```tsx
<MetricCard icon={Icon} label="Total Students" value={1284} variant="default" />
```

**Do not create** new per-feature metric card components.

Dashboard home uses [`MetricCardGrid`](../src/views/dashboard/reports/components/MetricCardGrid.tsx) wrapping shared `MetricCard` with `animated`. Class admin live metrics use shared `MetricCard` in [`LivePerformanceGrid`](../src/views/dashboard/classes/components/LivePerformanceGrid.tsx).

---

## Status badges

Use shared [`StatusBadge`](src/components/ui/StatusBadge.tsx):

```tsx
<StatusBadge category="studentAccount" status={row.accountStatus} label={label} />
<StatusBadge category="classSession" status="active" label={labels.active} />
<StatusBadge category="sessionTracking" status={row.status} label={label} icon={<BlockOutlined />} />
```

### Categories

| Category          | Use case                       | Palette mapping                                            |
| ----------------- | ------------------------------ | ---------------------------------------------------------- |
| `studentAccount`  | Student directory              | `palette.status.active / .pending / .blocked`              |
| `classSession`    | Schedule alerts session status | active → active, upcoming → pending, missed → blocked      |
| `classStatus`     | Dashboard schedule overview    | scheduled → confirmed, in_progress → active, etc.          |
| `sessionTracking` | Status tracking rows           | regular, suspended_pending, on_leave, pending_verification |
| `trackingStatus`  | Reschedule tracking            | rescheduled, pending_leave                                 |
| `session`         | Direct `palette.status` key    | Pass status key directly                                   |
| `enrollment`      | Enrollment labels              | `palette.status.active / .pending / .cancelled`            |

**Do not** use inline `Chip` with hardcoded colors for status display.

---

## Action buttons

Use presets from `@/frontend/components/ui`:

| Component           | Use case                                 |
| ------------------- | ---------------------------------------- |
| `PrimaryPageAction` | Contained page actions (Add, New Report) |
| `FilterButton`      | Outlined filter triggers                 |
| `ExportButton`      | Outlined export/download                 |

Table cell actions (approve/reject, join session) may use compact `Button` with `borderRadius: 1.5` until a `CompactTableAction` preset is added.

---

## Date navigation

Use shared [`DateNavigator`](src/components/ui/DateNavigator.tsx) from `@/frontend/components/ui`:

```tsx
<DateNavigator
  dateValue={filterDate}
  todayLabel={labels.dateFilter.today}
  previousDayLabel={labels.dateFilter.previousDay}
  nextDayLabel={labels.dateFilter.nextDay}
  dateLabel={labels.dateFilter.dateLabel}
  onDateChange={setFilterDate}
/>
```

### Props

| Prop                | Type       | Use case                                        |
| ------------------- | ---------- | ----------------------------------------------- |
| `dateValue`         | `string`   | Current date in `yyyy-MM-dd` format             |
| `todayLabel`        | `string`   | Label for the "Today" quick-jump button         |
| `previousDayLabel`  | `string`   | Tooltip for the previous-day chevron button      |
| `nextDayLabel`      | `string`   | Tooltip for the next-day chevron button         |
| `dateLabel`         | `string?`  | Label displayed on the `AppDatePicker` field    |
| `onDateChange`      | `function` | Callback with new `yyyy-MM-dd` string            |

### Date utilities

Date shift/parse helpers live in `@/frontend/utils/scheduleFilterDate`:

- `shiftScheduleFilterDate(date, offset)` — add/subtract days
- `getTodayScheduleFilterDate()` — today as `yyyy-MM-dd`
- `isScheduleFilterDateToday(date)` — check if a date is today
- `parseScheduleFilterDate(date)` — parse `yyyy-MM-dd` to `Date | null`

### Usage pattern

Wire the `DateNavigator` to a Zustand store `filterDate` field so a single value drives both the navigator UI and the GraphQL query variables (same pattern as `AdminDashboardContainer`).

**Do not** hand-build date picker + prev/next button rows. Always use `DateNavigator`.

---

## Forms

Use shared form field styles from `@/frontend/components/ui/form`:

```tsx
import { labelSx, standardInputSx, outlinedInputSx } from "@/frontend/components/ui/form";

<Box component="label" sx={labelSx}>
  {label}
</Box>
<Input sx={standardInputSx} />
```

### Available styles

| Export                    | Use case                                |
| ------------------------- | --------------------------------------- |
| `labelSx`                 | Uppercase form field labels             |
| `standardInputSx`         | MUI Input variant with themed underline |
| `outlinedInputSx`         | Outlined inputs with `borderRadius: 3`  |
| `timeInputStandardSx`     | TimePicker standard variant             |
| `timeInputOutlinedSx`     | TimePicker outlined variant             |
| `durationBoxSx(isMobile)` | Custom duration input container         |
| `AppDatePicker`           | MUI DatePicker with Arabic localization |
| `AppTimePicker`           | MUI TimePicker with Arabic localization |

**Note on Date & Time Pickers**: Always use `AppDatePicker` or `AppTimePicker` from `@/frontend/components/ui/form` rather than manually configuring MUI pickers and `LocalizationProvider`. They automatically handle the Arabic localization mappings and provider wrapping.

---

## Typography

Use theme variants — avoid hardcoded `fontFamily` / `fontSize` in `sx`:

| Element       | Variant                                         |
| ------------- | ----------------------------------------------- |
| Page title    | `headlineLg` via `PageHeader`                   |
| Section title | `titleLg` via `SectionPanel`                    |
| Metric label  | `labelUppercase`                                |
| Body text     | `bodyMd` / `bodyLg`                             |
| Table headers | `labelUppercase` (via DataGrid theme overrides) |

---

## Theme tokens

Defined in [`src/providers/theme/types.ts`](src/providers/theme/types.ts):

```typescript
theme.layout.radius.card      // 3
theme.layout.radius.button    // 2
theme.layout.radius.badge     // 3
theme.layout.sectionGap       // 1.5rem
theme.layout.cardPadding      // 1.5rem
theme.typography.labelUppercase
theme.palette.table.header.background / .text
theme.palette.shadow.card
theme.palette.border.light
```

DataGrid overrides: `MuiDataGrid` in theme `components`.

---

## Page migration checklist

When building or refactoring a dashboard page:

- [ ] Wrap content in `PageContainer` (no extra outer padding)
- [ ] Add `PageHeader` with title + subtitle + actions
- [ ] Use `MetricCard` for stat rows
- [ ] Use `SectionPanel` for table/list sections
- [ ] Desktop table → feature `*DataGrid` wrapping `AppDataGrid`
- [ ] Mobile → existing or new `*CardList`
- [ ] Status cells → shared `StatusBadge`
- [ ] Pass i18n `noEntries` / `noClasses` to DataGrid `emptyMessage`
- [ ] Wire real pagination (no decorative prev/next buttons)

### Migrated pages (2026-06-13)

| Route                           | PageContainer | PageHeader | MetricCard                | AppDataGrid                |
| ------------------------------- | ------------- | ---------- | ------------------------- | -------------------------- |
| `/dashboard`                    | Yes           | —          | Yes (MetricCardGrid)      | ScheduleOverviewDataGrid   |
| `/students`                     | Yes           | Yes        | Yes                       | StudentDirectoryDataGrid   |
| `/schedule/alerts`              | Yes           | Yes        | Yes                       | AcademicScheduleDataGrid   |
| `/schedule/tracking/status`     | Yes           | Yes        | Yes                       | StatusTrackingDataGrid     |
| `/schedule/tracking/reschedule` | Yes           | Yes        | Yes                       | RescheduleTrackingDataGrid |
| `/classes/[id]/audit`           | Yes           | Yes        | —                         | — (embedded table)         |
| `/classes/[id]`                 | Yes           | Yes        | Yes (LivePerformanceGrid) | —                          |
| /classes/new                  | Yes           | Yes        | —                         | —                          |
| /parents                      | Yes           | Yes        | Yes                       | ParentsDataGrid            |

---

## Remaining work

1. Add RTL `localeText` to `AppDataGrid` when Arabic DataGrid labels are needed
2. ESLint custom rules (mobile/desktop isolation — see "Mobile/Desktop Isolation" section below; implemented in Phase 0)

---

## Mobile/Desktop Isolation

**Related docs:**

- [`.agents/instructions/mobile-desktop.instructions.md`](../.agents/instructions/mobile-desktop.instructions.md) — ESLint-enforced rules and full spec
- [`frontend/views/AGENTS.md`](../frontend/views/AGENTS.md) — ViewModel hook conventions
- [`frontend/stores/AGENTS.md`](../frontend/stores/AGENTS.md) — Zustand serialization rules

Siraj renders distinct component trees for mobile (`< md`) and desktop (`≥ md`) viewports. The two tiers are **fully isolated** — no shared render code, no `useMediaQuery` branching inside views. A thin switcher picks the tier; everything below it is tier-specific.

### File naming convention

| File | Role |
| --- | --- |
| `*.mobile.tsx` | Mobile-only view or component (rendered when `isMobile`) |
| `*.desktop.tsx` | Desktop-only view or component (rendered when `!isMobile`) |
| `*.tsx` (no suffix) | Truly viewport-agnostic primitive (e.g., `StatusBadge.tsx`, `MetricCard.tsx`) |
| `useXxViewModel.ts` | Business-logic hook (viewport-agnostic) |
| `xxView.tsx` | Switcher — the ONLY page-level file that reads `useViewport()` |
| `xxContainer.tsx` | Container — calls the ViewModel hook and passes the result to `XxView` |

### Directory structure per domain

```
<domain>/
  mobile/
    xx.mobile.tsx              (main mobile view)
    components/
      xxCard.mobile.tsx        (mobile-specific card content)
  desktop/
    xx.desktop.tsx             (main desktop view)
    components/
      xxGrid.desktop.tsx       (desktop-specific grid/data components)
  shared/
    xxShared.tsx               (truly viewport-agnostic primitives)
  useXxViewModel.ts            (business logic hook)
  xxContainer.tsx              (calls hook, passes view model down)
  xxView.tsx                   (switcher — reads viewport)
```

### ViewModel pattern

The `useXxViewModel()` hook encapsulates ALL business logic for a page/domain. It returns a **flat plain object** (the "view model") consumed by both mobile and desktop views — same interface for both tiers.

```tsx
// useXxViewModel.ts
import { useTranslations } from "next-intl";
import { useXxStore } from "@/frontend/stores/xxStore";

export function useXxViewModel(): XxViewModel {
  const t = useTranslations("xx");
  const store = useXxStore();
  // Apollo hooks, derived values, handlers, etc.
  return {
    rows: store.rows,
    loading: store.loading,
    onFilterChange: store.setFilter,
    labels: { title: t("title"), empty: t("empty") },
  };
}
```

Rules:

- **No viewport logic in the hook**: never import `useMediaQuery`, `useViewport`, or `ViewportContext` inside `useXxViewModel.ts`.
- **All mutable state in Zustand**: filters, pagination, dialog open, form values — all in stores so they survive the tier switch (React unmounts one tier tree and mounts the other during resize).
- **Ephemeral state only in `useState`**: tooltip/popover open state may use `useState` inside a tier component — it resets on tier switch, which is acceptable for pure UI hover states.
- **Serialization safety**: non-serializable values (`File`, `Blob`, `FormData`, `Promise`) must NOT be stored in `persist`-enabled Zustand stores. Use a non-persisted store, `partialize` exclusion, or `useRef` inside the ViewModel hook.
- **Container calls the hook**: `xxContainer.tsx` calls `useXxViewModel()` and passes the result to `<XxView {...viewModel} />`. The Container itself is viewport-agnostic.

### Switcher pattern

The switcher (`xxView.tsx`) is the ONLY page-level file that reads viewport. It must be a client component.

```tsx
// xxView.tsx — the switcher (uses ResponsiveViewSwitch for lazy loading)
"use client";
import { createLazyView, ResponsiveViewSwitch } from "@/frontend/components/ui/container/ResponsiveViewSwitch";
import { type XxViewModel, useXxViewModel } from "./useXxViewModel";

// createLazyView MUST be at module top level (required by next/dynamic).
// Static import paths only — no variables or template strings.
const lazyViews = createLazyView<XxViewModel>(
  () => import("./mobile/xx.mobile").then(m => ({ default: m.XxMobileView })),
  () => import("./desktop/xx.desktop").then(m => ({ default: m.XxDesktopView })),
);

export function XxView(props: Readonly<XxViewModel>) {
  const viewModel = useXxViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
```

### Tier isolation rules (ESLint enforced)

**NEVER inside `.mobile.tsx` or `.desktop.tsx` files:**

- `import { useMediaQuery } from "@mui/material"` — the tier is decided by the parent switcher
- `import { useViewport } from "@/frontend/hooks/useViewport"` — already tier-specific
- `import { ViewportContext } from "@/frontend/context/ViewportContext"` — never read context directly
- Cross-tier imports: `.mobile.tsx` must not import `.desktop.tsx` and vice versa

**ONLY in `xxView.tsx` switcher and `ResponsiveViewSwitch`:**

- `ResponsiveViewSwitch` internally reads `useViewport()` — the switcher file itself does not import `useViewport` directly
- `createLazyView` wraps the mobile/desktop components with `next/dynamic` for code splitting

**ONLY in infrastructure components:**

- `DashboardLayout`, `Sidebar`, `BottomNavbar` may read viewport for layout decisions (sidebar vs bottom-nav)
- Prefer CSS `sx` responsive props where possible: `sx={{ display: { xs: "block", md: "none" } }}`

### ESLint boundary rules

These three rule blocks live in `eslint.config.mjs` and enforce the isolation:

```javascript
// 1. Block mobile → desktop imports
{
  files: ["**/*.mobile.tsx", "**/*.mobile.ts"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [{ regex: "\\.desktop(\\.tsx?)?$", message: "Mobile must not import desktop" }],
    }],
  },
},

// 2. Block desktop → mobile imports
{
  files: ["**/*.desktop.tsx", "**/*.desktop.ts"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [{ regex: "\\.mobile(\\.tsx?)?$", message: "Desktop must not import mobile" }],
    }],
  },
},

// 3. Block useMediaQuery / viewport context in versioned files
{
  files: ["**/*.mobile.tsx", "**/*.desktop.tsx", "**/*.mobile.ts", "**/*.desktop.ts"],
  rules: {
    "no-restricted-imports": ["error", {
      paths: [{ name: "@mui/material", importNames: ["useMediaQuery"], allowTypeImports: true, message: "Versioned files must not use useMediaQuery" }],
      patterns: [{ group: ["@/frontend/hooks/useViewport", "@/frontend/context/ViewportContext"], message: "Versioned files must not read viewport context" }],
    }],
  },
},
```

### Mobile shared component catalog

These non-versioned components live in `@/frontend/components/ui/` and are used **BY mobile views** (not by both tiers). They contain no `useMediaQuery` and no viewport logic — they are simply mobile-shaped UI primitives.

| Component | Purpose | Key props |
| --- | --- | --- |
| `ResponsiveViewSwitch` | Lazy-loads and switches between mobile/desktop subtrees. Internally calls `useViewport()`, wraps in `Suspense` + `ErrorBoundary`. | `mobile`, `desktop` (ComponentType), `props` (T), `fallback`?, `errorFallback`? |
| `MobilePageHeader` | Wraps `PageHeader` with `titleVariant="headlineMd"`, edge-to-edge padding. | `title`, `subtitle`, `actions?` |
| `MobileContentStack` | Flex column container with configurable gap/paddingBottom for mobile page bodies. | `gap`, `paddingBottom` |
| `MobileCardList<T>` | Generic list container — handles loading spinner, empty state, pagination, row mapping via `renderItem`. | `items`, `renderItem`, `loading`, `emptyMessage`, `onLoadMore?` |
| `MobileCardListItem` | Generic card shell with `edge-to-edge` or `rounded` variant, `dimmed`, `accentBorder`, `interactive` flags. | `variant`, `dimmed`, `accentBorder`, `interactive` |
| `MobileMetricCardGrid` | 2-column grid (or horizontal scroll) of `MetricCard` for mobile. | `metrics`, `scroll?` |
| `MobileFab` | Fixed floating action button with theme colors. | `onClick`, `icon`, `label` |
| `MobileEmptyState` | Centered title + subtitle box for empty lists/pages. | `title`, `subtitle?` |

Example usage:

```tsx
// resources.mobile.tsx
import { MobilePageHeader, MobileContentStack, MobileCardList, MobileCardListItem } from "@/frontend/components/ui";
import { logger } from "@/frontend/utils/logger";

export function ResourcesMobileView({ rows, loading, labels, onOpen }: Readonly<ResourcesViewModel>) {
  return (
    <>
      <MobilePageHeader title={labels.title} subtitle={labels.subtitle} />
      <MobileContentStack>
        <MobileCardList
          items={rows}
          loading={loading}
          emptyMessage={labels.empty}
          renderItem={(row) => <MobileCardListItem key={row.id} variant="edge-to-edge">{row.name}</MobileCardListItem>}
        />
      </MobileContentStack>
    </>
  );
}
```

### Desktop shared components (unchanged)

`PageHeader` (default `headlineLg`), `Grid`, `SectionPanel`, `AppDataGrid`, `MetricCardGrid`, `PaginationControls` — used directly by `.desktop.tsx` views. See the "Architecture" and "Tables" sections above.

### Truly shared (viewport-agnostic) components

Non-versioned components imported by BOTH `.mobile.tsx` and `.desktop.tsx`:

- `StatusBadge`, `MetricCard`, `BaseCard`, `ActionIconLink`, `PersonProfileLink`, `PaginationControls`

These contain **NO** `useMediaQuery`, **NO** `useViewport`, **NO** viewport logic. They render identically on any viewport.

### Mobile/desktop migration checklist

When refactoring a page to mobile/desktop isolation:

- [ ] Create `useXxViewModel.ts` — extract all business logic into the hook
- [ ] Create `xxContainer.tsx` — calls the hook, renders `<XxView {...viewModel} />`
- [ ] Create `xxView.tsx` switcher — uses `ResponsiveViewSwitch` or ternary
- [ ] Create `mobile/xx.mobile.tsx` and `desktop/xx.desktop.tsx` — pure presentation
- [ ] Move all mutable state into Zustand stores (survives tier switch)
- [ ] Keep `File`/`Blob` state in `useRef` inside the ViewModel hook (serialization safety)
- [ ] Verify NO `useMediaQuery` / `useViewport` imports inside `.mobile.tsx` or `.desktop.tsx`
- [ ] Verify NO cross-tier imports (`.mobile` ↔ `.desktop`)
- [ ] Use `MobilePageHeader` + `MobileContentStack` + `MobileCardList` on mobile (no hand-built shells)
- [ ] Use `PageHeader` + `SectionPanel` + `AppDataGrid` on desktop
- [ ] Both tiers share the same `StatusBadge`, `MetricCard`, `BaseCard` primitives
- [ ] `bun tsgo`, `bun biome:check`, lint queue, and manual resize test all pass
