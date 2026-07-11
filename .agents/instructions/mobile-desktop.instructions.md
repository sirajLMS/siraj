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
- `import { useViewport } from "@/frontend/hooks/useViewport"` — already tier-specific
- `import { ViewportContext } from "@/frontend/context/ViewportContext"` — never read context directly
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

### Switcher Pattern

```tsx
// xxView.tsx — the ONLY file that reads viewport
"use client";
import { useViewport } from "@/frontend/hooks/useViewport";
import { XxMobileView } from "./mobile/xx.mobile";
import { XxDesktopView } from "./desktop/xx.desktop";
import { ResponsiveViewSwitch } from "@/frontend/components/ui";

export function XxView(props: Readonly<XxViewModel>) {
  const { isMobile } = useViewport();
  return isMobile ? <XxMobileView {...props} /> : <XxDesktopView {...props} />;
  // Or: return <ResponsiveViewSwitch mobile={<XxMobileView {...props} />} desktop={<XxDesktopView {...props} />} />;
}
```

### Mobile Shared Components (`frontend/components/ui/`)

These non-versioned components are used BY mobile views, not by both tiers:

- `MobilePageHeader` — wraps `PageHeader` with `titleVariant="headlineMd"`, edge-to-edge padding
- `MobileContentStack` — flex column container with configurable gap/paddingBottom
- `MobileCardList<T>` — generic list container (loading, empty, pagination, row mapping via `renderItem`)
- `MobileCardListItem` — generic card shell (`edge-to-edge` | `rounded`, dimmed, accentBorder, interactive)
- `MobileMetricCardGrid` — 2-col grid or horizontal scroll of `MetricCard`
- `MobileFab` — fixed FAB with theme colors
- `MobileEmptyState` — centered title + subtitle box
- `ResponsiveViewSwitch` — ONLY shared component that imports `useViewport()`

### Desktop Shared Components (unchanged)

- `PageHeader` (default `headlineLg`), `Grid`, `SectionPanel`, `AppDataGrid`, `MetricCardGrid`, `PaginationControls`
- Used directly by `.desktop.tsx` views

### Truly Shared (viewport-agnostic)

- `StatusBadge`, `MetricCard`, `BaseCard`, `ActionIconLink`, `PersonProfileLink`, `PaginationControls`
- NO `useMediaQuery`, NO `useViewport`, NO viewport logic
- Both `.mobile.tsx` and `.desktop.tsx` import these

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
      patterns: [{ group: ["@/frontend/hooks/useViewport", "@/frontend/context/ViewportContext"], message: "Versioned files must not read viewport context" }],
    }],
  },
},
```

### Commands

- Verify ESLint rules: `~/.bun/bin/bun run lint` (via lint queue server)
- Type check: `~/.bun/bin/bun tsgo`
- Format: `~/.bun/bin/bun biome:check`
- Quality gate: `~/.bun/bin/bun quality-gate`