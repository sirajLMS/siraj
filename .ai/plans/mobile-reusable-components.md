# Plan: Reusable Mobile/Desktop Components + Viewport Context + ViewModel Architecture

## Architecture Summary

This is a **ViewModel architecture** with strict **mobile/desktop tree isolation**:

```
Container.tsx                         (orchestrates data fetching, calls ViewModel hook)
  └─ useXxViewModel() hook             (business logic: states, effects, derived props)
       └─ View.tsx                     (switcher: reads useViewport(), renders mobile or desktop)
            ├─ xx.mobile.tsx            (pure mobile presentation — NO useMediaQuery, NO viewport logic)
            └─ xx.desktop.tsx          (pure desktop presentation — NO useMediaQuery, NO viewport logic)
```

- **ViewModel hook** owns all business logic (states, effects, data fetching, handlers). Returns plain props ready to spread onto both mobile and desktop views.
- **All state lives in Zustand stores** — survives viewport tier switching when state lives inside the unmounted `.mobile.tsx`/`.desktop.tsx` subtree. Note: state living in the switcher component itself (e.g., `ResourcesView.tsx`) already survives tier changes because the switcher stays mounted; only child state is at risk. The ViewModel hook lifts all state above the unmount boundary, guaranteeing survival regardless of where the switch happens.
- **No React Context for business logic** — only the viewport context (infrastructure, read only by the switcher) uses Context.
- **Zero `useMediaQuery` in `.mobile.tsx` or `.desktop.tsx` files** — entire component trees are pure presentation for their tier.
- **ESLint import boundary** prevents `.mobile.tsx` from importing `.desktop.tsx` and vice versa.
- **Zero code duplication** between mobile and desktop versions — shared structure extracted into reusable components.

---

## Decisions

- **3-tier viewport**: mobile (<600px), tablet (600-900px), desktop (>=900px)
- **Viewport context**: inside `AppThemeProvider` — single `useMediaQuery` evaluation, shared via React Context, consumed ONLY by `ResponsiveViewSwitch` (never by mobile/desktop view files)
- **Rendering**: separate `xx.mobile.tsx` / `xx.desktop.tsx` files with dot-separated naming convention
- **ViewModel pattern**: business logic in `useXxViewModel()` hooks, all state in Zustand stores
- **Components**: new wrapper components that internally reuse `MetricCard`, `BaseCard`, `PageHeader`
- **Scope**: create components + migrate ALL existing pages
- **ESLint enforcement**: ban `useMediaQuery` in mobile/desktop files, ban cross-imports between `.mobile.` and `.desktop.` files

---

## File Naming Convention

All versioned files use dot-separated naming:

| File type | Pattern | Example |
|-----------|---------|---------|
| Mobile view | `xx.mobile.tsx` | `resources.mobile.tsx` |
| Desktop view | `xx.desktop.tsx` | `resources.desktop.tsx` |
| Shared mobile component | `xx.mobile.tsx` | `mobileCardList.mobile.tsx` |
| Shared desktop component | `xx.desktop.tsx` | `dataGrid.desktop.tsx` |
| ViewModel hook | `useXxViewModel.ts` | `useResourcesViewModel.ts` |
| Container (orchestrator) | `xxContainer.tsx` | `ResourcesContainer.tsx` |
| Switcher (thin) | `xxView.tsx` | `ResourcesView.tsx` |
| Shared (non-versioned) | `xx.tsx` | `StatusBadge.tsx`, `MetricCard.tsx` |

Rules:
- `.mobile.tsx` files must NOT import `.desktop.tsx` files (ESLint enforced)
- `.desktop.tsx` files must NOT import `.mobile.tsx` files (ESLint enforced)
- `.mobile.tsx` and `.desktop.tsx` files must NOT import `useMediaQuery` (ESLint enforced)
- `.mobile.tsx` and `.desktop.tsx` files must NOT import `useViewport` / `ViewportContext` (ESLint enforced)
- Only `View.tsx` (switcher) and infrastructure files may import `useViewport` / `useMediaQuery`
- Versioned shared components in `components/ui/` follow the same convention

---

## Phase 0: ESLint Boundaries (Enforcement Foundation)

### eslint.config.mjs additions

Add three new rule blocks after the existing frontend/backend boundary rules:

```javascript
// Mobile files must not import desktop files (and vice versa).
// IMPORTANT: no-restricted-imports matches the raw import specifier string (the `from` value).
// TypeScript imports omit the .tsx extension, so patterns must match extensionless imports.
// Use regex for precise matching instead of glob group to catch both "foo.desktop" and "foo.desktop.tsx".
{
  files: ["**/*.mobile.tsx", "**/*.mobile.ts"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            regex: "\\.desktop(\\.tsx?)?$",
            message: "Mobile components must not import desktop components — see architecture rules in AGENTS.md",
          },
        ],
      },
    ],
  },
},
{
  files: ["**/*.desktop.tsx", "**/*.desktop.ts"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            regex: "\\.mobile(\\.tsx?)?$",
            message: "Desktop components must not import mobile components — see architecture rules in AGENTS.md",
          },
        ],
      },
    ],
  },
},

// Mobile and desktop files must not use useMediaQuery or useViewport.
// They are pure presentation — the viewport tier is decided by the parent switcher.
// `paths` and `patterns` coexist in the same rule entry (both fire independently).
{
  files: ["**/*.mobile.tsx", "**/*.desktop.tsx", "**/*.mobile.ts", "**/*.desktop.ts"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "@mui/material",
            importNames: ["useMediaQuery"],
            allowTypeImports: true,
            message: "Mobile/desktop components must not use useMediaQuery — viewport tier is decided by the parent View switcher",
          },
        ],
        patterns: [
          {
            group: ["@/frontend/common/hooks/useViewport", "@/frontend/common/context/ViewportContext"],
            message: "Mobile/desktop components must not read viewport context — they are already tier-specific",
          },
        ],
      },
    ],
  },
},
```

**Notes on ESLint syntax**:
- The `no-restricted-imports` rule matches against the raw import specifier string (the `from` value), not the file path on disk. TypeScript imports omit the `.tsx` extension, so `import { Foo } from "./bar.desktop"` must be caught by a pattern that matches without the extension. Use `regex` instead of `group` globs for this reason.
- The `files` selector on the outer ESLint config block scopes which files the rule applies to (e.g., `files: ["**/*.mobile.tsx"]` means "this rule only checks imports inside `.mobile.tsx` files"). This is how "mobile files must not import desktop files" is expressed.
- `paths.importNames` bans specific named imports from a specific module. `allowTypeImports: true` allows `import type` from the same module (type-only imports don't execute at runtime, so they're safe).
- `paths` and `patterns` coexist in the same rule entry and fire independently. An import can trigger both a `path` violation and a `pattern` violation.

### Update AGENTS.md files

Add a new section to root `AGENTS.md` and `frontend/AGENTS.md`:

```markdown
## Mobile/Desktop Isolation Rules

- **File naming**: `.mobile.tsx` for mobile views, `.desktop.tsx` for desktop views
- **Zero useMediaQuery**: `.mobile.tsx` and `.desktop.tsx` files must never import or call `useMediaQuery`
- **Zero viewport context**: `.mobile.tsx` and `.desktop.tsx` files must never import `useViewport` or `ViewportContext`
- **No cross-imports**: `.mobile.tsx` must not import `.desktop.tsx` and vice versa (ESLint enforced)
- **ViewModel pattern**: Business logic lives in `useXxViewModel()` hooks, not in view components or Context
- **Zustand for state**: All UI state (filters, pagination, dialog open, form values) lives in Zustand stores so it survives viewport tier switching during resize
- **Serialization safety**: Non-serializable values (`File`, `Blob`, `FormData`, `Promise`) must NOT be stored in `persist`-enabled Zustand stores. Either use a non-persisted store, use `partialize` to exclude them, or keep them in a `useRef` in the ViewModel hook. Add a serialization guideline to `frontend/stores/AGENTS.md`.
- **Only `View.tsx` reads viewport**: The switcher component is the only place that reads `useViewport()` — it renders either `.mobile.tsx` or `.desktop.tsx`
```

---

## Phase 1: Viewport Context + Hook (Foundation)

### New files

| # | File | Purpose |
|---|------|---------|
| 1 | `frontend/context/ViewportContext.ts` | `createContext<ViewportContextType \| undefined>(undefined)`. Type: `{ tier: "mobile" \| "tablet" \| "desktop"; isMobile: boolean; isTablet: boolean; isDesktop: boolean }`. |
| 2 | `frontend/providers/theme/ViewportProvider.tsx` | Client component. Calls `useTheme()` + `useMediaQuery` for `down("sm")` (mobile) and `between("sm","md")` (tablet), default desktop. Uses `noSsr: true`. Wraps `ViewportContext.Provider` with memoized value. |
| 3 | `frontend/hooks/useViewport.ts` | `useContext(ViewportContext)`, throws if outside provider. Returns `{ tier, isMobile, isTablet, isDesktop }`. |

### Tier boundaries (MUI default breakpoints)

- `mobile`: below `sm` (< 600px)
- `tablet`: `sm` to `md` (600px-900px)
- `desktop`: `md` and up (>= 900px)
- `isMobile` = tier is "mobile" or "tablet" (i.e., `down("md")` — matches the 80% majority pattern)
- `isTablet` = tier is "tablet" only
- `isDesktop` = tier is "desktop" only

### Wiring

- `ThemeProvider.tsx` line 101: Insert `<ViewportProvider>` as a child of `<ColorSchemeStateBridge>`:
  ```tsx
  <ColorSchemeStateBridge>
    <ViewportProvider>{children}</ViewportProvider>
  </ColorSchemeStateBridge>
  ```
- `.storybook/StoryWrapper.tsx`: Add `ViewportProvider` (or a stub) after `<ThemeProvider>`. Add `viewport` global knob so stories can test mobile/tablet/desktop.
- `test/ui/components/TestWrapper.tsx`: Add `ViewportProvider` (or allow `viewport` prop override).

### Who may consume useViewport()

| Consumer | Allowed? | Reason |
|----------|----------|--------|
| `ResponsiveViewSwitch` | YES | The switcher needs tier to pick mobile/desktop |
| `View.tsx` switcher files | YES (or delegate to `ResponsiveViewSwitch`) | Switching is the view's job |
| `*.mobile.tsx` / `*.desktop.tsx` | **NO** (ESLint enforced) | They are already tier-specific |
| `components/ui/**` non-versioned | **NO** | Use TierAware wrappers or split into `.mobile.tsx`/`.desktop.tsx` |
| Infrastructure (`DashboardLayout`, `Sidebar`, `BottomNav`) | YES | Layout chrome needs tier for sidebar vs bottom-nav |

### Migration of existing useMediaQuery call sites

- Replace all 100+ `useMediaQuery(theme.breakpoints.down("md"))` -> `useViewport().isMobile` in **switcher and infrastructure files only**
- Replace the ~5 `useMediaQuery(theme.breakpoints.down("lg"))` -> `useViewport().isMobile` (unify to md boundary)
- Replace `StatusTrackingDataGrid`'s `up("lg")` -> `useViewport().isDesktop`
- For components currently using `useMediaQuery` internally (e.g., `DateNavigator`, `LocalizedStringDrawer`, `DashboardMetricsSection`): either split into `.mobile.tsx`/`.desktop.tsx` variants, or refactor so the parent passes the tier as a prop
- **Exclude `useNarrowContainer`**: `frontend/components/ui/input/localizedString/useNarrowContainer.ts` uses `ResizeObserver` for container-scoped (not viewport-scoped) responsiveness. It is intentionally an alternative to viewport `useMediaQuery` and should NOT be migrated to `useViewport()`.
- **Infrastructure CSS-based hiding stays as-is**: `SidebarShell`, `BottomNavbar`, `MobileMenuButton` use `sx={{ display: { xs: "block", md: "none" } }}` CSS responsive props — not `useMediaQuery`. These are more performant and SSR-safe; they should NOT be migrated to `useViewport()`.

---

## Phase 2: ViewModel Pattern + Shared Components

### 2a. ViewModel hook conventions

Each page/domain gets a `useXxViewModel()` hook that encapsulates ALL business logic:

```typescript
// Example: useResourcesViewModel.ts
export function useResourcesViewModel() {
  // Data fetching (Apollo queries)
  const { data, loading, refetch } = useResourcesQuery();

  // Read/write Zustand store state (survives resize)
  const { filterType, sortBy, setFilterType, setSortBy } = useResourcesStore();

  // Local form state that needs to survive resize -> also in Zustand
  const { documentName, selectedFile, setDocumentName, setSelectedFile } = useResourcesStore();

  // Derived/computed values
  const filteredResources = useMemo(() => /* filter + sort */, [resources, filterType, sortBy]);

  // Event handlers
  const handleUpload = useCallback(() => { /* ... */ }, [...]);
  const handleDelete = useCallback(() => { /* ... */ }, [...]);

  // Return plain props ready to spread onto both .mobile.tsx and .desktop.tsx
  return {
    labels,
    resources: filteredResources,
    loading,
    filterType,
    sortBy,
    documentName,
    selectedFileName: selectedFile?.name ?? "",
    onFilterTypeChange: setFilterType,
    onSortByChange: setSortBy,
    onDocumentNameChange: setDocumentName,
    onFormSubmit: handleUpload,
    onFileSelect: setSelectedFile,
    // ... all props both views need
  };
}
```

**Rules:**
- Hook returns a flat plain object (the "view model") — same interface for both mobile and desktop
- No `useMediaQuery`, no `useViewport` inside the hook
- All mutable state in Zustand stores (survives unmount/remount on resize)
- **Non-serializable state** (e.g., `File` objects from `<input type="file">`) must NOT be stored in a `persist`-enabled Zustand store — `JSON.stringify(new File(...))` produces `{}`, destroying the file on rehydration. Either: (a) use a non-persisted store for `File` objects, (b) use `partialize` to exclude them from persistence, or (c) keep `File` in a `useRef` inside the ViewModel hook (survives tier switch since the hook lives above the unmount boundary) and store only serializable metadata in Zustand
- Truly ephemeral presentation state (e.g., tooltip open) may use `useState` — it resets on tier switch but that's acceptable for pure UI hover states
- Container component calls the hook, passes the view model to `<View>`
- **Precedent**: The admin dashboard already uses granular hooks in `adminDashboardHooks.ts` (`useAdminScheduleQuery`, `useTeachers`, `useAdminDashboardHandlers`). The ViewModel hook is a cohesion improvement that aggregates these into a single return object. Extend existing `__shared__/*Hooks.ts` files rather than creating parallel structures.
- **Cleanup target**: `useAdminDashboard.ts` is byte-identical to `adminDashboardHooks.ts` (dead code), and `adminDashboardViewProps.ts` has zero consumers. Delete both during admin dashboard migration (Phase 3a).

### 2b. View switcher convention

```typescript
// Example: ResourcesView.tsx (the switcher — the ONLY file that reads viewport)
"use client";
import { useViewport } from "@/frontend/common/hooks/useViewport";
import type { ResourcesViewModel } from "@/frontend/views/dashboard/resources/useResourcesViewModel";
import { ResourcesMobileView } from "./resources.mobile";
import { ResourcesDesktopView } from "./resources.desktop";

export function ResourcesView(props: Readonly<ResourcesViewModel>) {
  const { isMobile } = useViewport();
  return isMobile ? <ResourcesMobileView {...props} /> : <ResourcesDesktopView {...props} />;
}
```

Or using `ResponsiveViewSwitch`:
```typescript
export function ResourcesView(props: Readonly<ResourcesViewModel>) {
  return (
    <ResponsiveViewSwitch
      mobile={<ResourcesMobileView {...props} />}
      desktop={<ResourcesDesktopView {...props} />}
    />
  );
}
```

### 2c. Reusable Shared Components

All new components go under `frontend/components/ui/` and are exported via `frontend/components/ui/index.ts`.

These are **non-versioned** (no `.mobile.`/`.desktop.` suffix) because they are used exclusively BY mobile or desktop views, not by both:

| # | Component | File | Purpose |
|---|-----------|------|---------|
| 1 | `ResponsiveViewSwitch` | `frontend/components/ui/container/ResponsiveViewSwitch.tsx` | Reads `useViewport().isMobile`, renders mobile or desktop branch. The ONLY shared component that imports `useViewport`. |
| 2 | `MobilePageHeader` | `frontend/components/ui/container/page/MobilePageHeader.tsx` | Wraps `PageHeader` with `titleVariant="headlineMd"`, optional `edgeToEdge` padding, optional sticky. |
| 3 | `MobileContentStack` | `frontend/components/ui/container/MobileContentStack.tsx` | `Box` with `flexDirection: column`, configurable `gap` (default 3) and `paddingBottom` (default 4, or 10/12 with Fab). Replaces the repeated flex-column pattern in all mobile views. |
| 4 | `MobileCardList<T>` | `frontend/components/ui/container/MobileCardList.tsx` | Generic list container: handles loading state (`CircularProgress`), empty state, row mapping via `renderItem`, optional pagination. |
| 5 | `MobileCardListItem` | `frontend/components/ui/card/MobileCardListItem.tsx` | Generic card shell with `variant="edge-to-edge" \| "rounded"`, optional `dimmed`, `accentBorder`, `interactive`. |
| 6 | `MobileMetricCardGrid` | `frontend/components/ui/card/MobileMetricCardGrid.tsx` | 2-col grid or horizontal scroll of `MetricCard` items. Uses existing `MetricCard` internally. |
| 7 | `MobileFab` | `frontend/components/ui/button/MobileFab.tsx` | Fixed FAB with theme colors. Replaces duplicated `styled(Fab)` patterns. |
| 8 | `MobileEmptyState` | `frontend/components/ui/state/MobileEmptyState.tsx` | Box with `py: 6, textAlign: center` + `headlineMd` title + `bodyMd` subtitle. |

#### Component Interfaces

**ResponsiveViewSwitch:**
```typescript
interface ResponsiveViewSwitchProps {
  readonly mobile: ReactNode;
  readonly desktop: ReactNode;
}
```

**MobilePageHeader:**
```typescript
interface MobilePageHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly breadcrumbs?: readonly PageHeaderBreadcrumb[];
  readonly actions?: ReactNode;
  readonly edgeToEdge?: boolean;  // default true
  readonly sticky?: boolean;      // default false
  readonly sx?: SxProps<Theme>;
}
```

**MobileContentStack:**
```typescript
interface MobileContentStackProps {
  readonly children: ReactNode;
  readonly gap?: number;           // default 3
  readonly paddingBottom?: number;  // default 4
  readonly sx?: SxProps<Theme>;
}
```

**MobileCardList<T>:**
```typescript
interface MobileCardListProps<T> {
  readonly rows: readonly T[];
  readonly renderItem: (row: T, index: number) => ReactNode;
  readonly getKey: (row: T) => string;
  readonly loading?: boolean;
  readonly emptyMessage?: string;
  readonly gap?: number;                       // default 2
  readonly layout?: "edge-to-edge" | "rounded"; // default "edge-to-edge"
  readonly pagination?: PaginationConfig;
  readonly sx?: SxProps<Theme>;
}
interface PaginationConfig {
  readonly page: number;
  readonly pageCount: number;
  readonly rowCount: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
}
```

**MobileCardListItem:**
```typescript
interface MobileCardListItemProps {
  readonly children: ReactNode;
  readonly variant?: "edge-to-edge" | "rounded";  // default "edge-to-edge"
  readonly dimmed?: boolean;
  readonly dimmedOpacity?: number;    // override default 0.85
  readonly accentBorder?: {
    readonly color: "primary" | "info" | "error" | "warning";
    readonly side: "inline-start" | "inline-end" | "top" | "bottom";
    readonly width?: number;          // default 4
  };
  readonly interactive?: boolean;     // &:active scale 0.98
  readonly sx?: SxProps<Theme>;
}
```

**MobileMetricCardGrid:**
```typescript
interface MobileMetricCardGridProps {
  readonly metrics: readonly MetricItem[];
  readonly layout?: "grid" | "scroll";   // "grid" = 2-col, "scroll" = horizontal
  readonly onMetricClick?: (key: string) => void;
  readonly selectedKey?: string;
}
```

**MobileFab:**
```typescript
interface MobileFabProps {
  readonly icon: ReactNode;
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly bottom?: number;  // default spacing(3)
  readonly right?: number;   // default spacing(3)
}
```

**MobileEmptyState:**
```typescript
interface MobileEmptyStateProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly icon?: ReactNode;
}
```

---

## Phase 3: Migrate Existing Dashboard Views

For each dashboard, the migration follows this exact pattern:

1. **Extract ViewModel hook**: `useXxViewModel.ts` — all business logic (data fetching, state, handlers)
2. **Split view into `.mobile.tsx` + `.desktop.tsx` + switcher `View.tsx`**
3. **Move all state to Zustand** (most domains already have a store — extend it)
4. **Mobile view** uses `MobilePageHeader`, `MobileContentStack`, `MobileCardList`, `MobileCardListItem`, `MobileMetricCardGrid`, `MobileFab`, `MobileEmptyState` as needed
5. **Desktop view** keeps existing desktop patterns (`PageHeader`, `Grid`, `SectionPanel`, `AppDataGrid`)
6. **Container** calls the ViewModel hook and passes the view model to the switcher

### 3a. Admin Dashboard

**Current**: `ScheduleOverviewSection.tsx` (has inline `MobileLayout`/`DesktopLayout` + `useMediaQuery`)

**Target structure:**
```
admin/home/
  scheduleOverview/
    useScheduleOverviewViewModel.ts    (data fetching, filters, pagination, handlers)
    scheduleOverviewView.tsx           (switcher: reads useViewport, picks mobile/desktop)
    mobile/
      scheduleOverview.mobile.tsx        (pure mobile: MobileContentStack + MobileCardList + MobileCardListItem)
      components/
        scheduleOverviewCard.mobile.tsx  (domain-specific mobile card content via renderItem)
    desktop/
      scheduleOverview.desktop.tsx       (pure desktop: SectionPanel + AppDataGrid + filters)
      components/
        scheduleOverviewColumns.tsx      (shared DataGrid column defs — used only by desktop)
    shared/
      scheduleOverviewShared.tsx         (if any truly shared components)
```

- `ScheduleOverviewCardList` content becomes the `renderItem` callback passed to `MobileCardList`
- `ScheduleOverviewDataGrid` stays as-is (desktop only)
- `ScheduleOverviewSection` becomes the thin switcher

### 3b. Teacher Dashboard

**Current**: `TeacherDashboardView.tsx` (inline `useMediaQuery` + conditional rendering)

**Target structure:**
```
teachers/dashboard/
  useTeacherDashboardViewModel.ts       (schedule query, metrics, action handlers, missed alerts)
  teacherDashboardView.tsx             (switcher)
  mobile/
    teacherDashboard.mobile.tsx          (pure mobile: MobilePageHeader, MobileContentStack, MobileCardList)
    components/
      teacherScheduleCard.mobile.tsx     (domain-specific mobile card content)
  desktop/
    teacherDashboard.desktop.tsx         (pure desktop: PageHeader, TeacherDailyScheduleSection + DataGrid)
  shared/
    missedClassAlertBanner.tsx         (shared — no viewport logic, just styled differently by parent)
```

### 3c. Parent Dashboard

**Current**: `ParentDashboardView.tsx` (inline `useMediaQuery(down("lg"))` + conditional rendering)

**Target structure:**
```
parent/dashboard/
  useParentDashboardViewModel.ts       (schedule query, metrics, handlers)
  parentDashboardView.tsx             (switcher)
  mobile/
    parentDashboard.mobile.tsx          (pure mobile: MobileMetricCardGrid, MobileCardList, MobileContentStack)
    components/
      parentScheduleCard.mobile.tsx     (domain-specific mobile card content)
  desktop/
    parentDashboard.desktop.tsx         (pure desktop: MetricCardGrid, ParentScheduleDataGrid)
  shared/
```

- Unify breakpoint from `down("lg")` to `down("md")` (now `useViewport().isMobile`)

---

## Phase 4: Migrate All 11 Existing Desktop/Mobile View Pairs

### Naming convention migration

Current files use `XxMobileView.tsx` / `XxDesktopView.tsx` — these need to be renamed to `xx.mobile.tsx` / `xx.desktop.tsx`.

| # | Domain | Current Files | Target Files |
|---|--------|---------------|--------------|
| 1 | Resources | `ResourcesView.tsx`, `ResourcesDesktopView.tsx`, `ResourcesMobileView.tsx` | `resourcesView.tsx` (switcher), `resources.desktop.tsx`, `resources.mobile.tsx` |
| 2 | Reports | `ReportsView.tsx`, `ReportsDesktopView.tsx`, `ReportsMobileView.tsx` | `reportsView.tsx`, `reports.desktop.tsx`, `reports.mobile.tsx` |
| 3 | Students | `StudentsView.tsx`, `StudentsDesktopView.tsx`, `StudentsMobileView.tsx` | `studentsView.tsx`, `students.desktop.tsx`, `students.mobile.tsx` |
| 4 | AdminComplaints | `AdminComplaintsView.tsx`, `AdminComplaintsDesktopView.tsx`, `AdminComplaintsMobileView.tsx` | `adminComplaintsView.tsx`, `adminComplaints.desktop.tsx`, `adminComplaints.mobile.tsx` |
| 5 | ParentComplaints | `ParentComplaintsView.tsx`, `ParentComplaintsDesktopView.tsx`, `ParentComplaintsMobileView.tsx` | `parentComplaintsView.tsx`, `parentComplaints.desktop.tsx`, `parentComplaints.mobile.tsx` |
| 6 | AdminBilling | `AdminBillingView.tsx`, `AdminBillingDesktopView.tsx`, `AdminBillingMobileView.tsx` | `adminBillingView.tsx`, `adminBilling.desktop.tsx`, `adminBilling.mobile.tsx` |
| 7 | UserBillingProfile | `UserBillingProfileView.tsx`, `UserBillingProfileDesktopView.tsx`, `UserBillingProfileMobileView.tsx` | `userBillingProfileView.tsx`, `userBillingProfile.desktop.tsx`, `userBillingProfile.mobile.tsx` |
| 8 | ParentBilling | `ParentBillingView.tsx`, `ParentBillingDesktopView.tsx`, `ParentBillingMobileView.tsx` | `parentBillingView.tsx`, `parentBilling.desktop.tsx`, `parentBilling.mobile.tsx` |
| 9 | ManualInvoice | `ManualInvoiceView.tsx`, `ManualInvoiceDesktopView.tsx`, `ManualInvoiceMobileView.tsx` | `manualInvoiceView.tsx`, `manualInvoice.desktop.tsx`, `manualInvoice.mobile.tsx` |
| 10 | AdminSuggestions | `AdminSuggestionsView.tsx`, `AdminSuggestionsDesktopView.tsx`, `AdminSuggestionsMobileView.tsx` | `adminSuggestionsView.tsx`, `adminSuggestions.desktop.tsx`, `adminSuggestions.mobile.tsx` |
| 11 | ParentSuggestions | `ParentSuggestionsView.tsx`, `ParentSuggestionsDesktopView.tsx`, `ParentSuggestionsMobileView.tsx` | `parentSuggestionsView.tsx`, `parentSuggestions.desktop.tsx`, `parentSuggestions.mobile.tsx` |

### Per-view migration steps:

1. **Create ViewModel hook** (`useXxViewModel.ts`):
   - Extract all data fetching, state, handlers from current `*View.tsx`
   - Move all state to the domain's existing Zustand store (extend if needed)
   - Return a flat view model object
2. **Rename and refactor**:
   - `*View.tsx` becomes the switcher — reads `useViewport()`, renders `.mobile.tsx` or `.desktop.tsx`
   - `*MobileView.tsx` -> `*.mobile.tsx` — remove all `useMediaQuery`, use new shared mobile components
   - `*DesktopView.tsx` -> `*.desktop.tsx` — remove all `useMediaQuery` (shouldn't have any, but verify)
3. **In `.mobile.tsx` files**:
   - Replace raw `PageHeader titleVariant="headlineMd"` with `MobilePageHeader`
   - Replace `Box sx={{ display: "flex", flexDirection: "column", gap: 3, pb: 4 }}` with `MobileContentStack`
   - Replace custom `styled(Fab)` with `MobileFab`
   - Replace custom empty state boxes with `MobileEmptyState`
   - Replace `*CardList` container code with `MobileCardList<T>` + `MobileCardListItem`
4. **Move state to Zustand**:
   - Form values (document name, selected file, search query) -> Zustand store
   - Filter/sort state -> Zustand store (most already there)
   - Pagination page -> Zustand store (most already there)
   - Dialog open/close states -> Zustand store
   - Local form `useState` in View -> ViewModel hook reads from Zustand

### Existing CardList components to migrate

Each `*CardList.tsx` component migrates to use `MobileCardList` + `MobileCardListItem`:

| Current File | Target |
|---|---|
| `ScheduleOverviewCardList.tsx` | Container logic -> `MobileCardList`, card content -> `scheduleOverviewCard.mobile.tsx` (renderItem) |
| `ParentScheduleCardList.tsx` | Container logic -> `MobileCardList`, card content -> `parentScheduleCard.mobile.tsx` |
| `TeacherScheduleCardList.tsx` | Container logic -> `MobileCardList`, card content -> `teacherScheduleCard.mobile.tsx` |
| `StudentDirectoryCardList.tsx` | Container logic -> `MobileCardList`, card content -> `studentDirectoryCard.mobile.tsx` |
| `ComplaintRecordCardList.tsx` | Container -> `MobileCardList`, content -> `complaintRecordCard.mobile.tsx` |
| `StatusTrackingCardList.tsx` | Container -> `MobileCardList`, content -> `statusTrackingCard.mobile.tsx` |
| etc. (all 22 card lists) | Same pattern |

---

## Phase 5: Migrate Non-View Components That Use useMediaQuery

For the ~20 non-view components that call `useMediaQuery` internally, each must be handled:

### Strategy A: Split into `.mobile.tsx` / `.desktop.tsx` variants

For components that have significant mobile/desktop layout differences:

| Component | Strategy |
|---|---|
| `DashboardMetricsSection.tsx` | Split into `dashboardMetricsSection.mobile.tsx` (scroll layout + edgeToEdge) and `dashboardMetricsSection.desktop.tsx` (grid layout), switcher reads viewport |
| `DateNavigator.tsx` | Split into `dateNavigator.mobile.tsx` (compact) and `dateNavigator.desktop.tsx` (full) |
| `LocalizedStringDrawer.tsx` | Split into `localizedStringDrawer.mobile.tsx` and `localizedStringDrawer.desktop.tsx` |
| `SearchScheduleFilterDrawer.tsx` | Split into `searchScheduleFilterDrawer.mobile.tsx` and `searchScheduleFilterDrawer.desktop.tsx` |
| `ParentsView.tsx` | Split + ViewModel + Zustand |
| `ScheduleAlertsView.tsx` | Split + ViewModel + Zustand |
| `ScheduleAlertBanners.tsx` | Split |
| `InstitutionalReportCard.tsx` | Split |
| `DstMigrationView.tsx` | Split + ViewModel + Zustand |
| `UpdatedSessionsSection.tsx` | Split |
| `FutureScheduleView.tsx` | Split + ViewModel + Zustand |
| `JumpToDateHeader.tsx` | Split |
| `FutureClassCard.tsx` | Split |
| `CreateRecurringClassView.tsx` | Split + ViewModel + Zustand |
| `UpcomingClassesTable.tsx` | Split |
| `StudentStatusHeader.tsx` | Split |
| `OnlineMeetingCard.tsx` | Split |
| `CommunicationLogCard.tsx` | Split |
| `ClassAuditView.tsx` | Split |
| `AdminNoteCard.tsx` | Split |
| `RescheduleTrackingView.tsx` | Split + ViewModel + Zustand |
| `TeacherAvailabilityView.tsx` | Split + ViewModel + Zustand |
| `PermissionManagementView.tsx` | Split + ViewModel + Zustand |
| `PermissionCatalogSection.tsx` | Split |
| `NotificationPreferencesTab.tsx` | Split |
| `RescheduleView.tsx` | Split + ViewModel + Zustand |
| `TeacherReassignmentView.tsx` | Split + ViewModel + Zustand |
| `ManagersView.tsx` | Split + ViewModel + Zustand |
| `TeacherWeeklyScheduleView.tsx` | Split + ViewModel + Zustand |
| `ClassDetailsContainer.tsx` | Split + ViewModel + Zustand |
| `SubjectsView.tsx` | Split + ViewModel + Zustand |
| `LocaleAdornmentSwitch.tsx` | Split |
| `StatusTrackingDataGrid.tsx` | Split |

### Strategy B: Keep as shared non-versioned, but remove useMediaQuery

For components that use `useMediaQuery` only for minor visual tweaks (not structural):

Before:
```tsx
const isMobile = useMediaQuery(theme.breakpoints.down("md"));
const padding = isMobile ? 2 : 3;
```

After: Use `sx` responsive props instead:
```tsx
sx={{ px: { xs: 2, md: 3 } }}
```

These components stay non-versioned because the responsive `sx` prop handles the difference without branching.

---

## Phase 6: Update Storybook + Tests

### Storybook

- Add `viewport` global knob to `.storybook/preview.tsx` (mobile/tablet/desktop) — add a new `viewport` key in `globalTypes` following the existing `locale`/`theme` pattern, with `initialGlobals.viewport: "desktop"`. Three items: `{ value: "mobile", icon: "mobile", title: "Mobile" }`, `{ value: "tablet", icon: "tablet", title: "Tablet" }`, `{ value: "desktop", icon: "browser", title: "Desktop" }`.
- Add `ViewportProvider` to `.storybook/StoryWrapper.tsx` — consume `context.globals.viewport` and constrain the wrapper `<Box>` `maxWidth` based on tier (mobile: 600px, tablet: 900px, desktop: none) so stories visually simulate the viewport
- Add stories for all new shared components:
  - `ResponsiveViewSwitch.stories.tsx`
  - `MobilePageHeader.stories.tsx`
  - `MobileContentStack.stories.tsx`
  - `MobileCardList.stories.tsx`
  - `MobileCardListItem.stories.tsx`
  - `MobileMetricCardGrid.stories.tsx`
  - `MobileFab.stories.tsx`
  - `MobileEmptyState.stories.tsx`
- Test each in all 3 viewport tiers (mobile/tablet/desktop)

### Tests

- Add `ViewportProvider` to `test/ui/components/TestWrapper.tsx` with `viewport` prop override
- Add test that `.mobile.tsx` and `.desktop.tsx` files don't import each other (ESLint rule verification)
- Add test that `.mobile.tsx` and `.desktop.tsx` files don't import `useMediaQuery`

### Documentation

- Update `frontend/COMPONENT_PATTERNS.md` with:
  - ViewModel pattern
  - Mobile/desktop isolation rules
  - File naming convention
  - ESLint boundary rules
  - New shared component catalog
- Update `frontend/AGENTS.md` with mobile/desktop isolation rules section (see Phase 0)
- Update `frontend/views/AGENTS.md` with ViewModel hook convention

---

## Zero Duplication Guarantee

| Duplicated Pattern | Eliminated By |
|---|---|
| Loading state (centered `CircularProgress`) | `MobileCardList` loading prop |
| Empty state (centered `Typography`) | `MobileCardList` emptyMessage / `MobileEmptyState` |
| Card shell (edge-to-edge `Paper`) | `MobileCardListItem variant="edge-to-edge"` |
| Card shell (rounded `Card`) | `MobileCardListItem variant="rounded"` |
| Card list container (`Stack gap={2}`) | `MobileCardList` container |
| Mobile FAB | `MobileFab` |
| Mobile empty state | `MobileEmptyState` |
| `useMediaQuery` + `if (isMobile)` switch | `ResponsiveViewSwitch` + `useViewport()` in switcher only |
| Mobile page header (`headlineMd`) | `MobilePageHeader` |
| Mobile content stack (flex column, gap, pb) | `MobileContentStack` |
| 2-col metric grid on mobile | `MobileMetricCardGrid layout="grid"` |
| Horizontal scroll metrics | `MobileMetricCardGrid layout="scroll"` |
| Business logic in view components | `useXxViewModel()` hook |
| Form/filter state lost on resize | Zustand stores (survives tier switch) |

### Domain-specific content stays in domain `.mobile.tsx` files

Only the container, shell, loading/empty, and pagination are extracted. Domain-specific elements (time highlights, meta stat bars, person rows, action buttons) live in `xxCard.mobile.tsx` files and are passed via `renderItem` to `MobileCardList`. This ensures zero duplication of structural code while preserving domain-specific presentation.

### Shared (non-versioned) components are truly shared

Components like `StatusBadge`, `MetricCard`, `BaseCard`, `PaginationControls`, `ActionIconLink`, `PersonProfileLink` remain non-versioned — both `.mobile.tsx` and `.desktop.tsx` files import them. They contain NO `useMediaQuery` and NO viewport branching.

---

## Architecture: Full Component Tree Example

```
ResourcesContainer.tsx                      (server component → client bridge)
  └─ useResourcesViewModel()                (hook: Apollo query, Zustand state, handlers)
       └─ <ResourcesView {...viewModel} />   (switcher: reads useViewport)
            ├─ <resources.mobile.tsx>         (if isMobile)
            │    ├─ <MobilePageHeader title=... />
            │    ├─ <MobileContentStack>
            │    │    ├─ <Accordion> (upload form collapsible)
            │    │    ├─ <FilterChips ... />
            │    │    └─ <MobileCardList rows={...} renderItem={...} />
            │    │         └─ <MobileCardListItem>
            │    │              └─ <resourceCard.mobile.tsx> (domain-specific content)
            │    └─ <MobileFab onClick={onUpload} />
            │
            └─ <resources.desktop.tsx>       (if !isMobile)
                 ├─ <PageHeader title=... actions={<PrimaryPageAction/>} />
                 ├─ <Grid container>
                 │    ├─ <Grid size={{ md: 4 }}><ResourceUploadForm /></Grid>
                 │    └─ <Grid size={{ md: 8 }}><ResourceLibraryGrid /></Grid>
                 └─ <ResourceDeleteDialog />
```

**Key guarantees:**
- Neither `resources.mobile.tsx` nor `resources.desktop.tsx` imports `useMediaQuery` or `useViewport`
- Neither imports the other (ESLint enforced)
- All state in `useResourcesViewModel` + `useResourcesStore` (Zustand) — survives resize
- `resourceCard.mobile.tsx` is mobile-only; desktop uses `ResourceLibraryGrid` instead
- Shared components (`StatusBadge`, `MetricCard`, `BaseCard`, etc.) imported by both

---

## File Summary

### Phase 0: ESLint (1 file modified)
- `eslint.config.mjs` (3 new rule blocks)

### Phase 1: Viewport Context (3 new + 3 modified)
| Type | File |
|------|------|
| New | `frontend/context/ViewportContext.ts` |
| New | `frontend/providers/theme/ViewportProvider.tsx` |
| New | `frontend/hooks/useViewport.ts` |
| Modified | `frontend/providers/theme/ThemeProvider.tsx` |
| Modified | `.storybook/StoryWrapper.tsx` |
| Modified | `test/ui/components/TestWrapper.tsx` |

### Phase 2: Shared Components (8 new + stories + barrel)
| Type | File |
|------|------|
| New | `frontend/components/ui/container/ResponsiveViewSwitch.tsx` |
| New | `frontend/components/ui/container/page/MobilePageHeader.tsx` |
| New | `frontend/components/ui/container/MobileContentStack.tsx` |
| New | `frontend/components/ui/container/MobileCardList.tsx` |
| New | `frontend/components/ui/card/MobileCardListItem.tsx` |
| New | `frontend/components/ui/card/MobileMetricCardGrid.tsx` |
| New | `frontend/components/ui/button/MobileFab.tsx` |
| New | `frontend/components/ui/state/MobileEmptyState.tsx` |
| New | 8 Storybook story files |
| Modified | `frontend/components/ui/index.ts` (barrel) |

### Phase 3: Dashboard Migrations (3 dashboards - ~15 new, ~9 modified)
Each dashboard produces:
- 1 ViewModel hook (new)
- 1 `.mobile.tsx` (new)
- 1 `.desktop.tsx` (new or refactored from existing)
- 1 switcher `View.tsx` (modified)
- Domain-specific `.mobile.tsx` card components (new, from existing CardList content)
- Zustand store (modified if needed)

### Phase 4: 11 View Pair Migrations (~33 new, ~33 modified)
Each view pair produces:
- 1 ViewModel hook (new)
- 1 `.mobile.tsx` (renamed from `*MobileView.tsx` + refactored)
- 1 `.desktop.tsx` (renamed from `*DesktopView.tsx`)
- 1 switcher `View.tsx` (modified)
- Domain-specific `.mobile.tsx` card components if applicable
- Zustand store (modified if needed)

### Phase 5: Non-View Component Migrations (~33 components split)
Each component produces:
- 1 `.mobile.tsx` (new or split from existing)
- 1 `.desktop.tsx` (new or split from existing)
- 1 switcher (if applicable)

### Phase 6: Documentation + Storybook
- `frontend/COMPONENT_PATTERNS.md` (modified)
- `frontend/AGENTS.md` (modified)
- `frontend/views/AGENTS.md` (modified)
- `.storybook/preview.tsx` (modified)

---

## Execution Order

1. **Phase 0** (ESLint rules) — enforce boundaries BEFORE any file creation
2. **Phase 1** (viewport context + hook + wiring) — foundation for all switching
3. **Phase 2** (create all shared mobile components + stories)
4. **Phase 3** (migrate 3 dashboards as reference implementations) — verify the full pattern works
5. **Phase 4** (migrate 11 Desktop/Mobile view pairs) — can parallelize across subagents
6. **Phase 5** (split non-view `useMediaQuery` components) — can parallelize
7. **Phase 6** (documentation + stories + test updates)

Each phase is independently verifiable via `bun tsgo` + `bun biome:check` + lint queue. Phases 3-5 can be parallelized across subagents (one per domain area).
