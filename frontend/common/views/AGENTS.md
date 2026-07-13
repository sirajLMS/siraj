# Frontend Common Views Layer Rules

This document governs the **tier-neutral home** for switchers, Containers, ViewModels, schemas, types, utils, and shared components in `frontend/common/views/`.

## Module Contract

- **Location**: `frontend/common/views/dashboard/<domain>/`
- **Imports allowed from**:
  - `@/frontend/common/...` (components, stores, hooks, utils, graphql)
  - `@/shared/...` (messages, types, lib)
  - `@/backend/types/...` (canonical type definitions)
- **MUST NOT import statically** from `@/frontend/mobile/...` or `@/frontend/desktop/...` — tier views are consumed via dynamic `import()` in switchers only
- **Tier views import their ViewModel type** from `@/frontend/common/views/dashboard/<domain>/useXxViewModel` (type-only imports are fine)

## Directory Structure per Domain

```
frontend/common/views/dashboard/<domain>/
  useXxViewModel.ts          # business logic hook (viewport-agnostic)
  XxView.tsx                 # switcher — createLazyView + ResponsiveViewSwitch
  XxContainer.tsx            # calls hook, renders <XxView {...viewModel} />
  types/                     # shared type definitions
  schemas/                   # Zod validation schemas
  utils/                     # shared utilities
  components/                # shared non-tiered components (NOT .mobile/.desktop)
```

## Switcher Pattern (Lazy Loading)

The switcher (`XxView.tsx`) is the ONLY file in this layer that orchestrates tier selection. It uses `createLazyView` with static import paths to the tier-specific views:

```tsx
"use client";
import { createLazyView, ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { type XxViewModel, type UseXxViewModelProps, useXxViewModel } from "./useXxViewModel";

const lazyViews = createLazyView<XxViewModel>(
  () => import("@/frontend/mobile/views/dashboard/<domain>/xx.mobile").then(m => ({ default: m.XxMobileView })),
  () => import("@/frontend/desktop/views/dashboard/<domain>/xx.desktop").then(m => ({ default: m.XxDesktopView })),
);

export function XxView(props: Readonly<UseXxViewModelProps>) {
  const viewModel = useXxViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
```

## ViewModel Pattern

- `useXxViewModel()` encapsulates ALL business logic (data fetching, state, handlers, derived values)
- Returns a **flat plain object** (the "view model") — same interface for both tiers
- **No viewport logic**: never import `useMediaQuery`, `useViewport`, or `ViewportContext`
- **All mutable state in Zustand stores** (`frontend/common/stores/`) to survive tier switch
- **Serialization safety**: non-serializable values (`File`, `Blob`, `FormData`, `Promise`) in `useRef` inside the hook, NOT in Zustand `persist` stores

## Cross-References

- `.agents/instructions/mobile-desktop.instructions.md` — full tier isolation rules, ESLint config, primitive catalog
- `frontend/mobile/AGENTS.md` — Mobile* primitives (3 behavioral categories)
- `frontend/desktop/AGENTS.md` — tier-paired `.desktop.*` variants only
- `frontend/common/components/ui/AGENTS.md` — viewport-agnostic primitives layer
- `frontend/views/AGENTS.md` — ViewModel conventions (legacy location, will point here after Block 2)