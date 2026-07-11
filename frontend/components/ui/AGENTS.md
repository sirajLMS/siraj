# Frontend UI Components Layer Rules

### Component Directory Structure (Mobile/Desktop/Shared)

All shared UI components MUST follow the mobile/desktop/shared directory convention:

```
frontend/components/ui/<component-name>/
├── mobile/
│   ├── <ComponentName>.mobile.tsx
│   ├── <ComponentName>.mobile.stories.tsx
│   └── components/
│       └── <SubComponent>.mobile.tsx
├── desktop/
│   ├── <ComponentName>.desktop.tsx
│   ├── <ComponentName>.desktop.stories.tsx
│   └── components/
│       └── <SubComponent>.desktop.tsx
├── shared/
│   ├── <ComponentName>.shared.tsx
│   ├── <ComponentName>.shared.stories.tsx
│   └── components/
│       └── <SubComponent>.shared.tsx
├── use<ComponentName>ViewModel.ts      # ViewModel hook (viewport-agnostic)
├── <ComponentName>View.tsx              # Switcher component (ONLY viewport consumer)
├── index.ts                             # Barrel export
└── index.stories.tsx                    # Storybook entry (optional)
```

**Rules:**
- **ALWAYS** create `mobile/`, `desktop/`, and `shared/` subdirectories for new components
- **NEVER** create flat `.tsx` files directly under `frontend/components/ui/<component-name>/`
- **ALWAYS** export from `index.ts` using named exports only
- **NEVER** use default exports for components

### Mobile vs Desktop Isolation Rules

**ESLint Enforcement:** `eslint.config.mjs` enforces `no-restricted-imports` for:
- `useMediaQuery` from `@mui/material` or `@/frontend/hooks`
- `useViewport` from `@/frontend/hooks/useViewport`
- Any viewport-detection hooks in `.mobile.tsx` / `.desktop.tsx` files

**Rules:**
- **NEVER** import or use `useMediaQuery` in `.mobile.tsx` or `.desktop.tsx` files
- **NEVER** import or use `useViewport` in `.mobile.tsx` or `.desktop.tsx` files
- **NEVER** add viewport branching logic (`if (isMobile) ...`) in versioned files
- **ONLY** the switcher component (`<ComponentName>View.tsx`) may consume `useViewport()`
- Mobile and desktop components must be **pure presentation** — zero business logic, zero hooks (except purely local UI state like tooltip/popover open state)

**ESLint Configuration Pattern (already enforced):**

```javascript
// eslint.config.mjs
{
  files: ['frontend/components/ui/**/*.mobile.tsx', 'frontend/components/ui/**/*.desktop.tsx'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          { group: ['@mui/material/useMediaQuery', '@/frontend/hooks/useMediaQuery', '@/frontend/hooks/useViewport'], message: 'Viewport hooks forbidden in mobile/desktop components. Use the View.tsx switcher instead.' }
        ]
      }
    ]
  }
}
```

### ViewModel Pattern

**ALL business logic MUST live in ViewModel hooks.** Components receive a flat plain object (the "view model") via props.

**Rules:**
- **ALWAYS** create `use<ComponentName>ViewModel.ts` for components with business logic
- **NEVER** put data fetching, state management, handlers, or derived values in components
- **ALWAYS** return a plain object from the ViewModel hook — same interface for mobile and desktop
- **NEVER** call `useMediaQuery` or `useViewport` inside ViewModel hooks — they are viewport-agnostic
- **ALWAYS** use Zustand stores for ALL mutable state (filters, pagination, dialog open state, form values, File objects)
- **NEVER** store non-serializable values (`File`, `Blob`, `FormData`, `Promise`) in `persist`-enabled Zustand stores — use `partialize` to exclude or `useRef` in the ViewModel hook
- **ONLY** truly ephemeral presentation state (tooltip open, popover hover) may use `useState`

**ViewModel Hook Template:**

```typescript
// frontend/components/ui/dataGrid/useAppDataGridViewModel.ts
import { useAppDataGridStore } from '@/frontend/stores/appDataGridStore';
import { useQuery } from '@apollo/client/react';
import { AppDataGridQueryDocument } from '@/frontend/graphql/sharedDocuments/appDataGrid.documents';

export function useAppDataGridViewModel() {
  const { filters, pagination, setFilters, setPagination, openDialog, closeDialog } = useAppDataGridStore();
  
  const { data, loading, error, refetch } = useQuery(AppDataGridQueryDocument, {
    variables: { filters, pagination },
    fetchPolicy: 'cache-and-network',
  });

  const handleFilterChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize });
  };

  return {
    // Data
    rows: data?.items ?? [],
    totalCount: data?.totalCount ?? 0,
    loading,
    error,
    // State
    filters,
    pagination,
    dialogOpen: openDialog,
    // Handlers
    onFilterChange: handleFilterChange,
    onPageChange: handlePageChange,
    onOpenDialog: openDialog,
    onCloseDialog: closeDialog,
    onRefresh: refetch,
  };
}
```

**Switcher Component Template (ONLY viewport consumer):**

```tsx
// frontend/components/ui/dataGrid/AppDataGridView.tsx
import { useViewport } from '@/frontend/hooks/useViewport';
import { AppDataGridDesktop } from './desktop/AppDataGrid.desktop';
import { AppDataGridMobile } from './mobile/AppDataGrid.mobile';
import { useAppDataGridViewModel } from './useAppDataGridViewModel';

export function AppDataGridView() {
  const viewModel = useAppDataGridViewModel();
  const { isMobile } = useViewport(); // ONLY place useViewport is called

  if (isMobile) {
    return <AppDataGridMobile {...viewModel} />;
  }
  return <AppDataGridDesktop {...viewModel} />;
}
```

### Component Naming Convention

| File Type | Suffix | Example |
|-----------|--------|---------|
| Mobile component | `.mobile.tsx` | `AppDataGrid.mobile.tsx` |
| Desktop component | `.desktop.tsx` | `AppDataGrid.desktop.tsx` |
| Shared component | `.shared.tsx` | `MetricCard.shared.tsx` |
| Mobile Storybook | `.mobile.stories.tsx` | `AppDataGrid.mobile.stories.tsx` |
| Desktop Storybook | `.desktop.stories.tsx` | `AppDataGrid.desktop.stories.tsx` |
| Shared Storybook | `.shared.stories.tsx` | `MetricCard.shared.stories.tsx` |
| ViewModel hook | `use<Name>ViewModel.ts` | `useAppDataGridViewModel.ts` |
| Switcher component | `<Name>View.tsx` | `AppDataGridView.tsx` |

**Rules:**
- **ALWAYS** use the exact suffixes above — no variations
- **NEVER** omit suffix for mobile/desktop files
- **ONLY** shared components omit the version suffix (use `.shared.tsx`)
- **ALWAYS** name the ViewModel hook `use<ComponentName>ViewModel`
- **ALWAYS** name the switcher `<ComponentName>View`

### Shared Components

Shared components (`.shared.tsx`) are for truly viewport-agnostic UI primitives that render identically on mobile and desktop.

**Rules:**
- **ONLY** create `.shared.tsx` when the component has **zero** viewport-dependent rendering
- **NEVER** use `.shared.tsx` as a dumping ground for "common code" — extract to hooks or utils instead
- Shared components **MUST NOT** import or use `useViewport` or `useMediaQuery`
- Shared components **MAY** use `useState` for purely local UI state (tooltip, popover)
- Export shared components from `index.ts` alongside mobile/desktop variants

**Example Shared Component:**

```tsx
// frontend/components/ui/metricCard/MetricCard.shared.tsx
import { MetricCardProps } from './MetricCard.types';
import { Box, Typography } from '@mui/material';

export function MetricCard({ title, value, trend, icon, sx }: MetricCardProps) {
  return (
    <Box sx={sx}>
      <Typography variant="labelUppercase">{title}</Typography>
      <Typography variant="headlineLg">{value}</Typography>
      {trend && <TrendIndicator trend={trend} />}
      {icon && <Box sx={{ mt: 1 }}>{icon}</Box>}
    </Box>
  );
}
```

**Example Shared Export (index.ts):**

```typescript
// frontend/components/ui/metricCard/index.ts
export { MetricCard } from './shared/MetricCard.shared';
export { MetricCardMobile } from './mobile/MetricCard.mobile';
export { MetricCardDesktop } from './desktop/MetricCard.desktop';
export { MetricCardView } from './MetricCardView';
export { useMetricCardViewModel } from './useMetricCardViewModel';
export type { MetricCardProps, MetricCardViewModel } from './MetricCard.types';
```

### MUI v9 Compliance

**MANDATORY:** Follow all MUI v9 breaking changes documented in `frontend/AGENTS.md` and `.github/instructions/frontend.instructions.md`.

**Key Rules (repeated for emphasis):**
- **NEVER** use style props directly on MUI components (`fontWeight`, `textAlign`, `mb`, `mt`, `p`, `display`, `gap`, `alignItems`, `justifyContent`, `flexWrap`, `component`, etc.)
- **ALWAYS** use `sx` prop: `<Typography sx={{ fontWeight: 700, mb: 1 }}>`
- **ALWAYS** use theme callback for palette access: `sx={(theme) => ({ color: theme.palette.primary.main })}`
- **ALWAYS** use Material 3 `on<Color>` tokens for contrast: `theme.palette.onPrimary`, `theme.palette.onSurface`
- **NEVER** use `*Outline` icon names — use `*Outlined` (e.g., `ErrorOutlined`, `CheckCircleOutlined`)
- **NEVER** use `FormEvent` — use `React.SubmitEvent` or `React.SyntheticEvent<HTMLFormElement>`
- **ALWAYS** cast FormData: `(formData.get('name') as string | null) ?? ''`

**Typography Variants:** Use theme variants (`headlineLg`, `titleLg`, `labelUppercase`, `bodyMd`) — avoid hardcoded font `sx`.

**See Also:**
- `frontend/AGENTS.md` — MUI Breaking Changes section
- `frontend/THEME_PALETTE.md` — Color tokens and access patterns
- `frontend/COMPONENT_PATTERNS.md` — Dashboard UI patterns

### Testing

**MANDATORY:** Follow all test rules in `.github/instructions/tests.instructions.md` and `tests.instructions.md`.

**UI Component Test Rules:**
- **ALWAYS** write component tests in `test/ui/components/` mirroring the component structure
- **ALWAYS** test both mobile and desktop variants separately
- **ALWAYS** test the ViewModel hook in isolation (unit test)
- **ALWAYS** test the switcher component with mocked `useViewport`
- **NEVER** test implementation details — test behavior via rendered output
- **ALWAYS** use Storybook stories as visual regression baselines

**Test Structure:**
```
test/ui/components/
├── dataGrid/
│   ├── AppDataGrid.mobile.test.tsx
│   ├── AppDataGrid.desktop.test.tsx
│   ├── AppDataGridView.test.tsx
│   └── useAppDataGridViewModel.test.ts
```

### Cross-References

- **Frontend Root Rules:** `frontend/AGENTS.md` — MUI v9, React 19, logging, quality gate, theming
- **Views Layer Rules:** `frontend/views/AGENTS.md` — ViewModel pattern, domain structure, Storybook
- **Stores Layer Rules:** `frontend/stores/AGENTS.md` — Zustand patterns, persistence, serialization
- **Test Rules:** `tests.instructions.md` — runInRollback, tx propagation, entity setup, coverage
- **Mobile/Desktop Instructions:** `.agents/instructions/mobile-desktop.instructions.md` — detailed mobile/desktop pattern
- **Theme Palette:** `frontend/THEME_PALETTE.md` — color tokens and access patterns
- **Component Patterns:** `frontend/COMPONENT_PATTERNS.md` — dashboard UI patterns
- **Implementation Learnings:** `frontend/IMPLEMENTATION_LEARNINGS.md` — error resolutions
- **New Page Workflow:** `frontend/NEW_PAGE_WORKFLOW.md` — required workflow for new pages
- **Code Review Checklist:** `.github/CODE_REVIEW_CHECKLIST.md` — review guidelines

### Quick Reference: Do's and Don'ts

| DO | DON'T |
|---|---|
| Create `mobile/`, `desktop/`, `shared/` dirs | Create flat `.tsx` files |
| Put all logic in `use<Name>ViewModel.ts` | Put logic in `.mobile.tsx`/`.desktop.tsx` |
| Use Zustand for mutable state | Use `useState` for filters/pagination/dialogs |
| Use `sx` prop for all styling | Use direct style props (`mb`, `p`, `fontWeight`) |
| Use theme callback for palette | Use `color="primary.main"` strings |
| Export from `index.ts` with named exports | Use default exports |
| Test ViewModel hooks in isolation | Test only via integration |
| Use `.shared.tsx` for truly shared UI | Use `.shared.tsx` for "common code" |
| Call `useViewport` ONLY in `<Name>View.tsx` | Call `useViewport` in ViewModel or versioned files |
| Use `*Outlined` icon names | Use `*Outline` icon names |