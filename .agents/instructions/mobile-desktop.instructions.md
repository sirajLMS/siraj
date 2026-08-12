---
applyTo: "frontend/**/*.ts,frontend/**/*.tsx"
---

# Mobile/Desktop Isolation Rules

### File Naming Convention

- Mobile components: `*.mobile.tsx` (e.g., `resources.mobile.tsx`, `resourceCard.mobile.tsx`)
- Desktop components: `*.desktop.tsx` (e.g., `resources.desktop.tsx`, `resourceGrid.desktop.tsx`)
- Shared components: `*.tsx` (no suffix, e.g., `StatusBadge.tsx`, `MetricCard.tsx`)

### Directory Structure

Each domain feature follows this structure:

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
  xxView.tsx                   (switcher - reads viewport)
```

### Tier Isolation Rules (ESLint Enforced)

**NEVER in `.mobile.tsx` or `.desktop.tsx` files:**

- `import { useMediaQuery } from "@mui/material"` — viewport tier decided by parent switcher
- `import { useViewport } from "@/frontend/common/hooks/useViewport"` — already tier-specific
- `import { ViewportContext } from "@/frontend/common/context/ViewportContext"` — never read context directly
- Import from sibling tier (`import { X } from "./something.desktop"` from a `.mobile.tsx` file)
- Import from sibling tier (`import { X } from "./something.mobile"` from a `.desktop.tsx` file)

**ONLY in `View.tsx` switcher:**

- `useViewport()` to read tier and decide which tier to render
- `ResponsiveViewSwitch` component (which internally uses `useViewport`)

**ONLY in infrastructure components:**

- `DashboardLayout`, `Sidebar`, `BottomNavbar` may read viewport for layout decisions (sidebar vs bottom-nav)
- These use CSS `sx` responsive props where possible (`display: { xs: "block", md: "none" }`)

### ViewModel Pattern

- **Hook**: `useXxViewModel()` returns a flat plain object (the "view model") — same interface for both tiers
- **No viewport logic in ViewModel**: Never call `useMediaQuery`, `useViewport`, or read `ViewportContext` inside the ViewModel hook
- **All state in Zustand**: Filters, pagination, dialogs, form values, File objects — all in Zustand stores to survive tier switch (React unmounts one tier, mounts the other)
- **Ephemeral only**: Tooltip/popover open state may use `useState` (resets on tier switch — acceptable)
- **Serialization safety**: Non-serializable values (`File`, `Blob`, `FormData`, `Promise`) must NOT be in `persist`-enabled stores. Use: non-persisted store, `partialize` exclusion, or `useRef` in ViewModel hook
- **Container calls hook**: The Container component calls `useXxViewModel()` and passes the result to `<XxView {...viewModel} />`

### Switcher Pattern (Lazy Loading)

The switcher uses `createLazyView` + `ResponsiveViewSwitch` to **lazy-load** only the needed tier.
Mobile devices never download the desktop component code, and vice versa.

```tsx
// xxView.tsx — the ONLY file that reads viewport (via ResponsiveViewSwitch)
"use client";
import { createLazyView, ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { type XxViewModel, type UseXxViewModelProps, useXxViewModel } from "./useXxViewModel";

// createLazyView MUST be called at module top level (required by next/dynamic).
// Static import paths only — no variables or template strings.
const lazyViews = createLazyView<XxViewModel>(
  () => import("./mobile/xx.mobile").then(m => ({ default: m.XxMobileView })),
  () => import("./desktop/xx.desktop").then(m => ({ default: m.XxDesktopView })),
);

export function XxView(props: Readonly<UseXxViewModelProps>) {
  const viewModel = useXxViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
```

**For components without a ViewModel hook** (pass props directly):

```tsx
const lazyViews = createLazyView<XxProps>(
  () => import("./mobile/xx.mobile").then(m => ({ default: m.XxMobileView })),
  () => import("./desktop/xx.desktop").then(m => ({ default: m.XxDesktopView })),
);

export function XxView(props: Readonly<XxProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
```

**For complex switchers** (surrounding JSX like dialogs/snackbars around the mobile/desktop render):

```tsx
export function XxView(props: Readonly<UseXxViewModelProps>) {
  const viewModel = useXxViewModel(props);
  return (
    <>
      <SomeNotice />
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
      <SomeDialog open={...} onClose={...} />
    </>
  );
}
```

**API Reference:**

- `createLazyView<T>(mobileImporter, desktopImporter, options?)` — Returns `{ mobile, desktop }` lazy component references. Uses `next/dynamic` internally. `options.ssr` defaults to `true`.
- `<ResponsiveViewSwitch mobile={...} desktop={...} props={...} fallback={...} errorFallback={...} />` — Reads `useViewport()` internally (the ONLY component that does), wraps in `Suspense` with a `CircularProgress` fallback by default, and an `ErrorBoundary` with a retry button by default. Both `fallback` and `errorFallback` are optional.

### Mobile Primitives (`frontend/mobile/components/ui/`)

These non-versioned components are used BY mobile views, not by both tiers:

- `MobilePageHeader` — always applies content gutter; `edgeToEdge` is full-width chrome only (does not strip text inset)
- `MobileContentStack` — flex column with gap/paddingBottom only (no horizontal px — shell is edge-to-edge)
- `MobileContentInset` / `MobileSectionTitleRow` — apply shared `mobileContentGutterSx` for toolbars, buttons, ad-hoc titles
- `MobileSectionPanel` — title bar always guttered; body defaults to `contentInset`; set `contentInset={false}` for `MobileCardList` / scroll rows / metric grids
- `MobileCardList<T>` — generic list container (loading, empty, required `paginationOptions`, row mapping via `renderItem`)
- `MobileCardListItem` — generic card shell (`edge-to-edge` | `rounded`, dimmed, accentBorder, interactive)
- `MobileMetricCardGrid` — always horizontal scroll row of internal `MobileMetricCard` (views must never import the card primitive)
- `MobileFab` — fixed FAB with theme colors
- `MobileEmptyState` — centered title + subtitle box
- `ResponsiveViewSwitch` — ONLY shared component that imports `useViewport()`

### Desktop Shared Components (unchanged)

- `PageHeader` (default `headlineLg`), `Grid`, `SectionPanel`, `AppDataGrid`, `PaginationControls`
- Metric rows: `DesktopMetricCardGrid` only (never import `DesktopMetricCard` / common `MetricCard` / common `MetricCardGrid` from views)
- Used directly by `.desktop.tsx` views

### Truly Shared (viewport-agnostic)

- `StatusBadge`, `BaseCard`, `ActionIconLink`, `PersonProfileLink`, `PaginationControls`
- Common `MetricCard` / `MetricCardGrid` are grid/internal primitives — **views must not import the card**; tier views use `MobileMetricCardGrid` / `DesktopMetricCardGrid`
- NO `useMediaQuery`, NO `useViewport`, NO viewport logic
- Both `.mobile.tsx` and `.desktop.tsx` import shared non-metric primitives

### ESLint Rules (`eslint.config.mjs`)

```javascript
// Block cross-tier imports
{
  files: ["**/*.mobile.tsx", "**/*.mobile.ts"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [{ regex: "\\.desktop(\\.tsx?)?$", message: "Mobile must not import desktop" }],
    }],
  },
},
{
  files: ["**/*.desktop.tsx", "**/*.desktop.ts"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [{ regex: "\\.mobile(\\.tsx?)?$", message: "Desktop must not import mobile" }],
    }],
  },
},

// Block useMediaQuery/viewport in versioned files
{
  files: ["**/*.mobile.tsx", "**/*.desktop.tsx", "**/*.mobile.ts", "**/*.desktop.ts"],
  rules: {
    "no-restricted-imports": ["error", {
      paths: [{ name: "@mui/material", importNames: ["useMediaQuery"], allowTypeImports: true, message: "Versioned files must not use useMediaQuery" }],
      patterns: [{ group: ["@/frontend/common/hooks/useViewport", "@/frontend/common/context/ViewportContext"], message: "Versioned files must not read viewport context" }],
    }],
  },
},
```

### Commands

### Scaffold Import Convention (`__shared__/` Directories)

When desktop and mobile view variants share presentation logic, the shared scaffold (`*Shared.tsx`) lives in a `__shared__/` directory:

```
frontend/common/views/dashboard/<domain>/components/
  __shared__/
    <componentName>Shared.tsx      # Scaffold with slot props
  <componentName>.desktop.tsx       # Imports from __shared__/
  <componentName>.mobile.tsx        # Imports from __shared__/
```

- Desktop and mobile variants import ONLY from `__shared__/` — never from each other
- Scaffold accepts slot props for tier-specific components, sx styles, configuration
- See `docs/frontend/ui-shared-scaffold-pattern.md` for the full pattern

- Verify ESLint rules: `~/.bun/bin/bun run lint` (this script calls `requestFullRepoLint` from `scripts/lint-queue-client.ts` and serializes through the lint queue server). Ensure `bun run lint:server` is running first.
- Type check: `~/.bun/bin/bun tsgo`
- Format: `~/.bun/bin/bun biome:check`
- Quality gate: `~/.bun/bin/bun quality-gate`

### Oxlint Rules (CRITICAL — NO `oxlint-disable` comments)

- **no-unsafe-type-assertion**: Oxlint is STRICTER than ESLint. `as unknown as T` does NOT bypass it. Use type guards (`value is Type`), `instanceof Error`, `find()` with widening cast `(v as string)`, or `.$type<Enum>()` on Drizzle columns. For `response.json()` use `const data: Type = await response.json()` or type guards.
- **no-await-in-loop**: Use `Promise.all(items.map(async ...))` for independent iterations. Use recursive helpers or `reduce` chains for sequential iterations (shared transactions). `for await...of` is NOT flagged.
- **consistent-function-scoping**: Move functions that don't capture parent variables to module scope.
- **no-object-type-as-default-prop**: Extract `{}` / `[]` defaults to module-level constants.
- **no-underscore-dangle**: Rename `_field` → `field`, or use bracket notation `obj["_ref"]` for external APIs.
- **no-unsafe-enum-comparison**: Use `String(a) === String(Enum.VALUE)`, string literals, or `Set`-based lookups.
- **no-shadow**: Use destructuring rename `{ prop: newName }` or `_` prefix for unused params.
- **consistent-return**: Use `return undefined` instead of bare `return;`. Config override exists for `useEffect`.
- Config overrides in `oxlint.config.mts` for test files (`unbound-method: off`) and `useEffect` files (`consistent-return: off`) are legitimate — NOT `oxlint-disable` comments.
