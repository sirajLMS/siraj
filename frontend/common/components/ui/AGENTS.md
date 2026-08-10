# Frontend Common UI Components Layer Rules

This document governs the **viewport-agnostic** (shared) UI primitives in `frontend/common/components/ui/`. These primitives are imported by BOTH mobile and desktop tier views — they contain no viewport logic.

For tier-specific primitives, see:
- [`frontend/mobile/AGENTS.md`](../../mobile/AGENTS.md) — `Mobile*`-prefixed primitives (3 behavioral categories)
- [`frontend/desktop/AGENTS.md`](../../desktop/AGENTS.md) — tier-paired `.desktop.*` variants only

### Form field labels

- **ALWAYS** use MUI Material labels on form inputs: `label` on `TextField` / Autocomplete / date-time `slotProps.textField`, or `FormControl` + `InputLabel` + `Select`.
- **NEVER** render a separate label above an input (`Box component="label"`, `Typography` field label, or retired `FieldWrapper`-style wrappers).
- Prefer outlined controls so the label notches into the border (see `TimezoneSelect`).
- `labelSx` is only for non-input section/stat chrome — not for form fields. See `frontend/COMPONENT_PATTERNS.md` Forms section.

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

### Person / audience Autocomplete (`input/userSelect/`)

- Common owns the Autocomplete **engine** + audience facades + hooks; types/utils live only here.
- Desktop/mobile **compose** the common facade with locked platform styles — they must **not** re-export common under a new name.
- Views must import tier components (`TeacherAutocompleteDesktop` / `TeacherAutocompleteMobile`, etc.), never common facades.
- Speak in **audience** / **permission** terms — never “role” for these pickers.
- Options cache: `frontend/common/stores/userAutocompleteStore.ts` (no selected value).

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

**ESLint Configuration Pattern (already enforced):**

```javascript
// eslint.config.mjs
{
  files: ['frontend/**/*.mobile.tsx', 'frontend/**/*.desktop.tsx'],
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
- **ALWAYS** create `use<ComponentName>ViewModel.ts` for components with business logic (this file lives in `frontend/common/views/dashboard/<domain>/`)
- **NEVER** put data fetching, state management, handlers, or derived values in components
- **ALWAYS** return a plain object from the ViewModel hook — same interface for mobile and desktop
- **NEVER** call `useMediaQuery` or `useViewport` inside ViewModel hooks — they are viewport-agnostic
- **ALWAYS** use Zustand stores for ALL mutable state (filters, pagination, dialog open state, form values, File objects)
- **NEVER** store non-serializable values (`File`, `Blob`, `FormData`, `Promise`) in `persist`-enabled Zustand stores — use `partialize` to exclude or `useRef` in the ViewModel hook
- **ONLY** truly ephemeral presentation state (tooltip open, popover hover) may use `useState`

**ViewModel Hook Template:**

```typescript
// frontend/common/views/dashboard/dataGrid/useAppDataGridViewModel.ts
import { useAppDataGridStore } from '@/frontend/common/stores/appDataGridStore';
import { useQuery } from '@apollo/client/react';
import { AppDataGridQueryDocument } from '@/frontend/common/graphql/sharedDocuments/appDataGrid.documents';

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

**Switcher Component Template (lazy loading via ResponsiveViewSwitch):**

The switcher lives in `frontend/common/views/dashboard/<domain>/` (post-Block-2 relocation). It dynamically imports mobile and desktop tier views:

```tsx
// frontend/common/views/dashboard/dataGrid/AppDataGridView.tsx
import { createLazyView, ResponsiveViewSwitch } from '@/frontend/common/components/ui/container/ResponsiveViewSwitch';
import { type AppDataGridViewModel, useAppDataGridViewModel } from './useAppDataGridViewModel';

// createLazyView MUST be at module top level (required by next/dynamic).
const lazyViews = createLazyView<AppDataGridViewModel>(
  () => import("@/frontend/mobile/views/dashboard/dataGrid/AppDataGrid.mobile").then(m => ({ default: m.AppDataGridMobileView })),
  () => import("@/frontend/desktop/views/dashboard/dataGrid/AppDataGrid.desktop").then(m => ({ default: m.AppDataGridDesktopView })),
);

export function AppDataGridView() {
  const viewModel = useAppDataGridViewModel();
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

**Examples:** `AppDataGrid`, `PageHeader`, `SectionPanel`, `StatusBadge`, `BaseCard`, `PageContainer`, `ActionIconLink`, `PersonProfileLink`, `PaginationControls`.

**Metric cards:** Common `MetricCard` / `MetricCardGrid` exist as shared/grid primitives, but **views must not import the card**. Mobile views use only `MobileMetricCardGrid`; desktop views use only `DesktopMetricCardGrid` (including single-metric cases). Cards are internal to the grid (+ Storybook).

**Rules:**
- **ONLY** create a non-suffixed component in `common` when it has **zero** viewport-dependent rendering
- **NEVER** import or use `useViewport` or `useMediaQuery` in this layer
- **MAY** use `useState` for purely local UI state (tooltip, popover)
- Export from `index.ts` using named exports
- The ONLY component in this layer that imports `useViewport()` is `ResponsiveViewSwitch` (the infrastructure switcher)

### Tier-paired parent switchers (in this layer)

Three un-suffixed parent switchers in `frontend/common/components/ui/` lazy-import BOTH tier halves via dynamic `import()`:
- `filter/DateNavigator.tsx` — imports `dateNavigator.mobile.tsx` + `dateNavigator.desktop.tsx`
- `input/localizedString/LocaleAdornmentSwitch.tsx` — imports `localeAdornmentSwitch.mobile.tsx` + `localeAdornmentSwitch.desktop.tsx`
- `input/localizedString/LocalizedStringDrawer.tsx` — imports `localizedStringDrawer.mobile.tsx` + `localizedStringDrawer.desktop.tsx`

These files are NOT `.mobile.tsx`/`.desktop.tsx`; their cross-tier dynamic `import()` is allowed (ESLint cross-tier rule only fires on tier-versioned files).

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
- **Common Views (switcher home):** `frontend/common/views/AGENTS.md` — switcher/Container/ViewModel relocation home
- **Stores Layer Rules:** `frontend/common/stores/AGENTS.md` — Zustand patterns, persistence, serialization
- **Mobile Module:** `frontend/mobile/AGENTS.md` — Mobile* primitives (3 behavioral categories)
- **Desktop Module:** `frontend/desktop/AGENTS.md` — tier-paired `.desktop.*` variants
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

When a UI component exists in common/desktop/mobile tiers with similar logic, extract a `*Shared.tsx` scaffold with slot props. See `docs/frontend/ui-shared-scaffold-pattern.md` for the complete pattern reference.

Key rules:
- Scaffold file: `<ComponentName>Shared.tsx` in `common/components/ui/<category>/`
- All styling via MUI v9 `sx` prop (NEVER direct style props)
- Tier variants import ONLY the shared scaffold from `common/` (no cross-tier imports)
- See `docs/frontend/duplication-elimination-patterns.md` for deletion and consolidation patterns


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
