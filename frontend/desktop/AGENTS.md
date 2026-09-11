# Desktop Module AGENTS.md

This document provides essential context for AI agents working in the `frontend/desktop/` module.

## Module Overview

The `frontend/desktop/` module is the **desktop-only UI layer** containing:
- **Desktop UIKit primitives** (`components/ui/`) - only tier-paired `.desktop.*` component variants. No standalone `Desktop*`-prefixed primitives exist, and variants never use `useViewport`/null-return (the parent switcher already guarantees the tier).
- **Desktop view components** (`views/dashboard/**/`) - complete page-level desktop views, mirroring the `frontend/common/views/dashboard/` hierarchy minus the `desktop/` segment. Desktop views consume shared primitives from `@/frontend/common/components/ui` (`AppDataGrid`, `PageHeader`, `SectionPanel`, `StatusBadge`, `BaseCard`, `PageContainer`, …) and tier metric rows from `DesktopMetricCardGrid` (`@/frontend/desktop/components/ui/card/MetricCardGrid`).

## Architecture Rules

### 1. Desktop-Only Primitives (`components/ui/`)
- The desktop `components/ui/` directory holds ONLY tier-paired `.desktop.*` variants (no standalone `Desktop*`-prefixed primitives exist)
- Components in this directory **MUST NOT** be used in mobile code
- Variants **MUST NOT** use `useViewport` or null-return — the parent switcher already guarantees the tier
- Export via per-group barrels + top-level `components/ui/index.ts`
- **NEVER** export Desktop* components from `frontend/common/components/ui/`

### 2. Desktop Views (`views/dashboard/**/`)
- Mirror the `frontend/common/views/dashboard/` structure exactly (minus the `desktop/` segment — no nested `desktop/` directory inside `frontend/desktop/views/`)
- Desktop variants are addressed as `@/frontend/desktop/views/**/*.desktop.tsx`
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

// ❌ WRONG - Desktop views importing Desktop* from common (Desktop* must not exist in common)
import { DateNavigatorDesktop } from "@/frontend/common/components/ui/filter";
```

### 3a. Scaffold Import Rule (Cross-Tier)
- Desktop view variants (`.desktop.tsx`) that share logic with mobile variants MUST import the shared scaffold from `__shared__/` directories — never from sibling mobile paths
- Scaffold files (`*Shared.tsx`) live in `frontend/common/views/.../components/__shared__/` or `frontend/desktop/views/.../__shared__/`

### 4. Switcher Pattern (ResponsiveViewSwitch)
- Parent switchers live at `frontend/common/views/dashboard/<domain>/XxView.tsx` (the tier-neutral home)
- Desktop variants: dynamically imported from `frontend/desktop/views/dashboard/<domain>/*.desktop.tsx`
- Mobile variants: dynamically imported from `frontend/mobile/views/dashboard/<domain>/*.mobile.tsx`
- Use `createLazyView` from `@/frontend/common/components/ui/container/ResponsiveViewSwitch`

### 5. Type Definitions
- Desktop primitives use their own type definitions (co-located with components)
- View props types remain in their original locations (e.g., `frontend/views/.../types.ts`)
- NO new shared type files in `frontend/desktop/types/`

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
| Importing a `*Desktop` component from `@/frontend/common/components/ui/**` | Import from `@/frontend/desktop/components/ui/**` |
| Nesting files under `frontend/desktop/views/**/desktop/` | No `desktop/` segment — files live directly at `frontend/desktop/views/**/` |
| Creating `frontend/desktop/types/` | Don't - types stay co-located or in view locations |
| Exporting Desktop* from common barrels | Remove from common, only export from desktop barrels |
| Importing `@/frontend/mobile/...` in desktop code | ESLint enforced via `no-restricted-imports` on `.desktop$` suffix |
