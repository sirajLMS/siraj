# Frontend Common UI Components Layer Rules

This document governs the **viewport-agnostic** (shared) UI primitives in `frontend/common/components/ui/`. These primitives are imported by BOTH mobile and desktop tier views — they contain no viewport logic.

For tier-specific primitives, see:
- [`frontend/mobile/AGENTS.md`](../../mobile/AGENTS.md) — `Mobile*`-prefixed primitives
- [`frontend/desktop/AGENTS.md`](../../desktop/AGENTS.md) — tier-paired `.desktop.*` variants only

### Form field labels

- **ALWAYS** use MUI Material labels on form inputs: `label` on `TextField` / Autocomplete / date-time `slotProps.textField`, or `FormControl` + `InputLabel` + `Select`.
- **NEVER** render a separate label above an input (`Box component="label"`, `Typography` field label, or retired `FieldWrapper`-style wrappers).
- Prefer outlined controls so the label notches into the border.
- `labelSx` is only for non-input section/stat chrome — not for form fields.

### Component Directory Structure

```
frontend/common/components/ui/<component-name>/
├── <ComponentName>.tsx           # Viewport-agnostic primitive (both tiers use)
├── <ComponentName>.stories.tsx   # Storybook entry (optional)
├── index.ts                      # Barrel export (named exports only)
└── components/                    # Sub-components (also viewport-agnostic)
    └── <SubComponent>.tsx
```

**Rules:**
- **NEVER** create `mobile/` or `desktop/` subdirectories under `frontend/common/components/ui/<component-name>/` — tier-specific variants live in `frontend/mobile/components/ui/` or `frontend/desktop/components/ui/`
- **NEVER** create flat `.tsx` files directly under `frontend/common/components/ui/` — always group in a component directory with `index.ts`
- **ALWAYS** export from `index.ts` using named exports only
- **NEVER** use default exports for components
- **NEVER** re-export `Mobile*` or `Desktop*`-prefixed primitives from this layer — they belong in `frontend/mobile/components/ui` / `frontend/desktop/components/ui`

### Mobile vs Desktop Isolation Rules

**ESLint Enforcement:** `eslint.config.mjs` enforces `no-restricted-imports` for:
- `useMediaQuery` from `@mui/material` or `@/frontend/hooks`
- `useViewport` from `@/frontend/hooks/useViewport`
- Any viewport-detection hooks in `.mobile.tsx` / `.desktop.tsx` files

**Rules:**
- **NEVER** import or use `useMediaQuery` in `.mobile.tsx` or `.desktop.tsx` files
- **NEVER** import or use `useViewport` in `.mobile.tsx` or `.desktop.tsx` files
- **NEVER** add viewport branching logic (`if (isMobile) ...`) in versioned files
- **ONLY** the switcher component (`<ComponentName>View.tsx`, which lives in `frontend/common/views/`) may consume `useViewport()` via `ResponsiveViewSwitch`
- Mobile and desktop components must be **pure presentation** — zero business logic, zero hooks (except purely local UI state like tooltip/popover open state)

### ViewModel Pattern

**ALL business logic MUST live in ViewModel hooks.** Components receive a flat plain object (the "view model") via props.

**Rules:**
- **ALWAYS** create `use<ComponentName>ViewModel.ts` for components with business logic (this file lives in `frontend/common/views/dashboard/<domain>/`)
- **NEVER** put data fetching, state management, handlers, or derived values in components
- **ALWAYS** return a plain object from the ViewModel hook — same interface for mobile and desktop
- **NEVER** call `useMediaQuery` or `useViewport` inside ViewModel hooks — they are viewport-agnostic
- **ALWAYS** use Zustand stores for ALL mutable state (filters, pagination, dialog open state, form values, File objects)
- **NEVER** store non-serializable values (`File`, `Blob`, `FormData`, `Promise`) in `persist`-enabled Zustand stores — use `partialize` to exclude or `useRef` in the ViewModel hook
- **ONLY** truly ephemeral presentation state (tooltip open, popover hover) may use `useState`

**ViewModel Hook Template:**

```typescript
// frontend/common/views/dashboard/<domain>/use<ComponentName>ViewModel.ts
export function use<ComponentName>ViewModel() {
  const { filters, pagination, setFilters, setPagination } = use<ComponentName>Store();

  const { data, loading, error, refetch } = useQuery(<ComponentName>QueryDocument, {
    variables: { filters, pagination },
    fetchPolicy: 'cache-and-network',
  });

  return {
    // Data
    rows: data?.items ?? [],
    totalCount: data?.totalCount ?? 0,
    loading,
    error,
    // State
    filters,
    pagination,
    // Handlers
    onFilterChange: setFilters,
    onRefresh: refetch,
  };
}
```

**Switcher Component Template (lazy loading via ResponsiveViewSwitch):**

The switcher lives in `frontend/common/views/dashboard/<domain>/`. It dynamically imports mobile and desktop tier views:

```tsx
// frontend/common/views/dashboard/<domain>/<ComponentName>View.tsx
import { createLazyView, ResponsiveViewSwitch } from '@/frontend/common/components/ui/container/ResponsiveViewSwitch';
import { type <ComponentName>ViewModel, use<ComponentName>ViewModel } from './use<ComponentName>ViewModel';

// createLazyView MUST be at module top level (required by next/dynamic).
const lazyViews = createLazyView<<ComponentName>ViewModel>(
  () => import("@/frontend/mobile/views/dashboard/<domain>/<ComponentName>.mobile").then(m => ({ default: m.<ComponentName>MobileView })),
  () => import("@/frontend/desktop/views/dashboard/<domain>/<ComponentName>.desktop").then(m => ({ default: m.<ComponentName>DesktopView })),
);

export function <ComponentName>View() {
  const viewModel = use<ComponentName>ViewModel();
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
```

### Component Naming Convention

| File Type | Suffix | Example |
|-----------|--------|---------|
| Viewport-agnostic component | `.tsx` (no suffix) | `MetricCard.tsx` |
| Mobile component | `.mobile.tsx` | `AppDataGrid.mobile.tsx` (in `frontend/mobile/views/`) |
| Desktop component | `.desktop.tsx` | `AppDataGrid.desktop.tsx` (in `frontend/desktop/views/`) |
| ViewModel hook | `use<Name>ViewModel.ts` | `useAppDataGridViewModel.ts` (in `frontend/common/views/`) |
| Switcher component | `<Name>View.tsx` | `AppDataGridView.tsx` (in `frontend/common/views/`) |

**Rules:**
- **ALWAYS** use the exact suffixes above — no variations
- **NEVER** omit `mobile`/`desktop` suffix for tier-specific files
- Viewport-agnostic primitives in `common` have NO tier suffix
- **ALWAYS** name the ViewModel hook `use<ComponentName>ViewModel`
- **ALWAYS** name the switcher `<ComponentName>View`

### Viewport-agnostic primitives (this layer)

Shared components (no suffix) are for truly viewport-agnostic UI primitives that render identically on mobile and desktop. Both tiers import them from `@/frontend/common/components/ui`.

When a parent switcher in this layer needs both tier halves, it lazy-imports them via dynamic `import()` — such files are NOT `.mobile.tsx`/`.desktop.tsx`, so the ESLint cross-tier rule does not fire on them.

**Rules:**
- **ONLY** create a non-suffixed component in `common` when it has **zero** viewport-dependent rendering
- **NEVER** import or use `useViewport` or `useMediaQuery` in this layer
- **MAY** use `useState` for purely local UI state (tooltip, popover)
- Export from `index.ts` using named exports
- The ONLY component in this layer that imports `useViewport()` is `ResponsiveViewSwitch` (the infrastructure switcher)

### MUI v9 Compliance

**MANDATORY:** Follow all MUI v9 breaking changes documented in `frontend/AGENTS.md` and `.agents/instructions/frontend.instructions.md`.

**Key Rules:**
- **NEVER** use style props directly on MUI components (`fontWeight`, `textAlign`, `mb`, `mt`, `p`, `display`, `gap`, `alignItems`, `justifyContent`, `flexWrap`, `component`, etc.)
- **ALWAYS** use `sx` prop: `<Typography sx={{ fontWeight: 700, mb: 1 }}>`
- **ALWAYS** use theme callback for palette access: `sx={(theme) => ({ color: theme.palette.primary.main })}`
- **ALWAYS** use Material 3 `on<Color>` tokens for contrast: `theme.palette.onPrimary`, `theme.palette.onSurface`
- **NEVER** use `*Outline` icon names — use `*Outlined` (e.g., `ErrorOutlined`, `CheckCircleOutlined`)
- **NEVER** use `FormEvent` — use `React.SubmitEvent` or `React.SyntheticEvent<HTMLFormElement>`
- **ALWAYS** cast FormData: `(formData.get('name') as string | null) ?? ''`
- Use theme typography variants (`headlineLg`, `titleLg`, `labelUppercase`, `bodyMd`) — avoid hardcoded font `sx`.

### Verification

**Component Verification Rules:**
- **ALWAYS** create Storybook stories for components covering both mobile and desktop viewports
- **ALWAYS** test ViewModel hooks with isolated unit tests if domain logic requires verification
- **ALWAYS** use Storybook stories as visual baselines

### Cross-References

- **Frontend Root Rules:** `frontend/AGENTS.md` — MUI v9, React 19, logging, quality gate, theming
- **Views Layer Rules:** `frontend/views/AGENTS.md` — ViewModel pattern, domain structure, Storybook
- **Common Views (switcher home):** `frontend/common/views/AGENTS.md` — switcher/ViewModel home
- **Stores Layer Rules:** `frontend/common/stores/AGENTS.md` — Zustand patterns, persistence, serialization
- **Mobile Module:** `frontend/mobile/AGENTS.md` — Mobile* primitives
- **Desktop Module:** `frontend/desktop/AGENTS.md` — tier-paired `.desktop.*` variants
- **Test Rules:** `.agents/instructions/tests.instructions.md`
- **Mobile/Desktop Instructions:** `.agents/instructions/mobile-desktop.instructions.md` — detailed mobile/desktop pattern

### Quick Reference: Do's and Don'ts

| DO | DON'T |
|---|---|
| Create viewport-agnostic primitives in `common` | Create `mobile/`/`desktop/` subdirs in `common` |
| Put all logic in `use<Name>ViewModel.ts` | Put logic in `.mobile.tsx`/`.desktop.tsx` |
| Use Zustand for mutable state | Use `useState` for filters/pagination/dialogs |
| Import Mobile* from `@/frontend/mobile/components/ui` | Re-export Mobile* from `@/frontend/common/components/ui` |
| Import Desktop* from `@/frontend/desktop/components/ui` | Re-export Desktop* from `@/frontend/common/components/ui` |
| Use `sx` prop for all styling | Use direct style props (`mb`, `p`, `fontWeight`) |
| Use theme callback for palette | Use `color="primary.main"` strings |
| Export from `index.ts` with named exports | Use default exports |
| Test ViewModel hooks in isolation | Test only via integration |
| Use non-suffixed `.tsx` for shared UI | Use `.shared.tsx` suffix (deprecated convention) |
| Call `useViewport` ONLY in switcher via `ResponsiveViewSwitch` | Call `useViewport` in primitives or versioned files |
| Use `*Outlined` icon names | Use `*Outline` icon names |

## Duplication Elimination — Shared Scaffold Pattern

When a UI component exists in common/desktop/mobile tiers with similar logic, extract a `*Shared.tsx` scaffold with slot props.

Key rules:
- Scaffold file: `<ComponentName>Shared.tsx` in `common/components/ui/<category>/`
- All styling via MUI v9 `sx` prop (NEVER direct style props)
- Tier variants import ONLY the shared scaffold from `common/` (no cross-tier imports)

## Linting Rules

- **NEVER** use `oxlint-disable` comments — fix the root cause.
