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

- **viewport-gated null-return** — call `useViewport()` and `return null` when not mobile (e.g. `MobileFab`)
- **tier-paired variant** (`.mobile.tsx`) — paired with a same-named parent in `common`
- **pure presentational** — no `useViewport()`, no null-return (e.g. `MobileMetricCardGrid`, `MobileCardList`, `MobileContentStack`, `MobilePageHeader`, `MobileEmptyState`)

> **Do NOT "fix" pure-presentational primitives** by adding `useViewport()` null-return — they are intentionally presentational-only.

### 1b. Mobile padding ownership (edge-to-edge shell)

`DashboardLayoutMobile` uses `px: 0`. Horizontal inset is **not** on `MobilePageContainer` / `MobileContentStack`; it is owned by gutter components:

| Owns gutter | Notes |
|---|---|
| `mobileContentGutterSx` / `MobileContentInset` | Shared `paddingInline: theme.spacing(2)` for ad-hoc content |
| `MobilePageHeader` | Always pads; `edgeToEdge` does not remove inset |
| `MobileSectionTitleRow` | Title + SEE ALL / actions rows |
| `MobileSectionPanel` | Title bar padded; body padded unless `contentInset={false}` |
| `MobileHorizontalScrollRow` / `MobileMetricCardGrid` | Own peek-scroll padding — do not wrap in `MobileContentInset` |
| `MobileEmptyState` | Includes content gutter |

**Full-bleed containers** (heroes, edge-to-edge panels with `contentInset={false}`) must pad their own children via the gutter helpers or via list primitives (`MobileCardList` edge-to-edge layout).

### 2. Mobile Views (`views/dashboard/**/`)
- Mirror the `frontend/common/views/dashboard/` structure exactly (minus the `mobile/` segment)
- Mobile view files live directly at `frontend/mobile/views/**/` — there is no `mobile/` subsegment, and no view files remain under `frontend/views/**/mobile/`
- Import paths use `@/frontend/mobile/views/**/...`; switchers in `frontend/common/views/...` dynamically import from those paths
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

### 3a. Scaffold Import Rule (Cross-Tier)
- Mobile view variants (`.mobile.tsx`) that share logic with desktop variants MUST import the shared scaffold from `__shared__/` directories — never from sibling desktop paths
- Scaffold files (`*Shared.tsx`) live in `frontend/common/views/.../components/__shared__/` or `frontend/mobile/views/.../__shared__/`

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
├── components/ui/        # Mobile* primitives; per-group barrels + top-level index.ts
│   ├── button/ card/ state/            # per-behavior primitives
│   ├── container/ (incl. container/page/)
│   ├── filter/ input/                   # tier-paired .mobile.tsx variants
└── views/dashboard/      # mirrors frontend/common/views/dashboard/ (minus the mobile/ segment)
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

## Linting Rules

- NEVER use `oxlint-disable` comments; fix the root cause of Oxlint & ESLint/sonarjs findings.
