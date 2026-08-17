# Quota UI Patterns — Canonical Reference

This document consolidates recurring patterns, rules, and gotchas discovered during the Quota UI production-readiness implementation across Waves 0–4. It serves as the canonical reference for building and maintaining quota UI components.

For backend quota system details, see `docs/billing/quota-system.md`.

## 1. Tier Isolation Pattern — Containers as Switchers

Quota views follow the standard tier isolation architecture. The Container component is a thin switcher using `createLazyView` + `ResponsiveViewSwitch`:

```tsx
// QuotaContainer.tsx — thin switcher (~20-30 lines)
const lazyViews = {
  desktop: createLazyView(() =>
    import("@/frontend/desktop/views/dashboard/billing/quota/quotaList.desktop").then(m => ({ default: m.QuotaListDesktopView }))),
  mobile: createLazyView(() =>
    import("@/frontend/mobile/views/dashboard/billing/quota/quotaList.mobile").then(m => ({ default: m.QuotaListMobileView }))),
};

export function QuotaContainer() {
  const vm = useQuotaViewModel();
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={vm} />;
}
```

### Key Rules
- **Container** calls the ViewModel hook and passes the entire view model as props via `ResponsiveViewSwitch` spread.
- **Tier views** (`.desktop.tsx`/`.mobile.tsx`) receive the entire ViewModel as props: `function QuotaListDesktopView(props: Readonly<QuotaListViewModel>)`.
- The `createLazyView<T>` type parameter must match the ViewModel interface, NOT a `{ vm: ViewModel }` wrapper.
- Tier views are pure presentation — zero business logic, zero hooks (except local UI state), zero `useMediaQuery`/`useViewport`.
- Container guards null/loading/not-found states before passing to tier views. Tier views double-guard with `if (!data) return null` after loading check.

### ViewModel Null Handling
The ViewModel returns `quota: QuotaItem | null` for detail views. The container renders not-found UI when `viewModel.notFound || !viewModel.quota`. The `quotaName` computation must occur AFTER the null guard, not before.

## 2. RHF + zodResolver 3-Generic Pattern

When using Zod schemas with `z.coerce.number()`, the input type differs from the output type. The correct `useForm` invocation uses three type parameters:

```ts
const form = useForm<QuotaFormInput, undefined, QuotaFormData>({
  resolver: zodResolver(schema),
  defaultValues,
});
```

- `TFieldValues` = `QuotaFormInput` (input — what the fields receive, `unknown` for coerced fields)
- `TTransformedValues` = `QuotaFormData` (output — what `handleSubmit` receives after Zod parsing)

All exported types in the ViewModel interface must use the 3-generic RHF types:
- `UseFormReturn<QuotaFormInput, undefined, QuotaFormData>`
- `Control<QuotaFormInput, undefined, QuotaFormData>`
- `FieldErrors<QuotaFormInput>`
- `UseFormHandleSubmit<QuotaFormInput, QuotaFormData>`

Form section components that receive `control` and `errors` props must also use these 3-generic types.

### Type Guards for Enum Selects

When using MUI `Select` with RHF `Controller`, `e.target.value` is `string`. Don't use `as EnumType` (oxlint `no-unsafe-type-assertion`). Use type guards:

```ts
function isQuotaKind(value: string): value is QuotaKind {
  return (Object.values(QuotaKind) as readonly string[]).includes(value);
}
```

The `(Object.values(Enum) as readonly string[])` cast is a widening cast (safe, not flagged).

## 3. Backend vs Frontend GraphQL Input Types

`formStateToSubmitInput()` returns the **backend** `QuotaSubmitInput` (from `@/backend/types`), but Apollo mutations expect the **frontend GraphQL** `QuotaSubmitInput` (from `@/frontend/common/graphql/generated/gql/graphql-types`). These are structurally different:

| Type | Optional field syntax |
|------|----------------------|
| Backend | `T \| null \| undefined` |
| Frontend GraphQL | `InputMaybe<T>` = `T \| null` |

Build GraphQL mutation inputs inline using `?? null` to convert `undefined` to `null`:

```ts
function buildCreateInput(data: QuotaFormData): QuotaSubmitInput {
  return {
    studentId: data.studentId,
    kind: data.kind,
    name: data.name,
    totalClasses: data.totalClasses,
    validFrom: data.validFrom ?? null,
    validUntil: data.validUntil ?? null,
    periodType: data.periodType ?? null,
    periodDays: data.periodDays ?? null,
    priority: data.priority,
    idempotencyKey: null,
    rolloverPolicy: null,
  };
}
```

### QuotaUpdateInput Field Constraint

The frontend GraphQL `QuotaUpdateInput` has only: `name`, `priority`, `status`, `validUntil` (all `InputMaybe`). It does NOT have `validFrom`, `kind`, `totalClasses`, `studentId`, `periodType`, or `periodDays`.

### Generated Type Source Alignment

When mixing `QuotaQuery` and `QuotasQuery` in the same file, import from compatible sources:
- `QuotaQuery` from `@/frontend/common/graphql/generated/gql/operations`
- `QuotasQuery` from `@/frontend/common/graphql/generated/gql/graphql`

Do NOT import `QuotaQuery` from `graphql.ts` when the file also imports `QuotaKind` from `graphql-types.ts` — the nominally different enum types cause TS2322.

## 4. Cache Update Pattern — `cache.updateQuery` for Paginated Lists

`cache.modify` updates normalized entity fields but does NOT update denormalized arrays in query results (e.g., the `quotas.rows` array). Use `cache.updateQuery` instead:

```ts
// Create — add new item to list cache
cache.updateQuery({ query: quotasQueryDocument }, cached => {
  if (!cached?.quotas?.rows) return cached;
  return {
    ...cached,
    quotas: {
      ...cached.quotas,
      rows: [...cached.quotas.rows, created],
      totalCount: (cached.quotas.totalCount ?? 0) + 1,
    },
  };
});
```

### Delete — `cache.evict` + `cache.updateQuery` + `cache.gc`

```ts
cache.evict({ id: cache.identify({ __typename: "Quota", id: quotaId }) });
cache.updateQuery({ query: quotasQueryDocument }, removeQuotaFromListCache(quotaId));
cache.gc();
```

### Module-Level Cache Functions

Cache update functions (`replaceQuotaInListCache`, `removeQuotaFromListCache`, `updateQuotasCache`) must be at **module level**, not inside `useCallback` or `useMutation` callbacks. Placing a function inside `useCallback` → `useMutation` → `update` creates 4+ levels of nesting, triggering `sonarjs/no-nested-functions`.

### Never use `refetch()` for mutation side-effects

All cache updates after mutations use `cache.updateQuery` — not `refetch()`. The `refetch` in `useQuotaInsightsViewModel` is a user-triggered manual refresh button, not a mutation side-effect.

## 5. StatusBadge Quota Category

To add a new status badge category:

1. **Add to union type** (`statusBadgeShared.types.ts`): `"quotaStatus"` in the `StatusBadgeCategory` union.
2. **Add to resolver** (`statusBadgeShared.utils.ts`): Add a `quotaStatus` case to `resolveStatusPaletteKey` mapping each status to a palette key:
   - `ACTIVE` → `"active"`
   - `EXPIRED` → `"completed"`
   - `ARCHIVED` → `"blocked"`
   - `PENDING` → `"pending"`
3. **Use in views**: `<DesktopStatusBadge category="quotaStatus" status={quota.status} label={label} />` or `<MobileStatusBadge>` equivalent.

For quota **kind** values (PACKAGE/PERIODIC), there is no dedicated mapping — they fall back to the `"pending"` palette color.

### StatusBadge `component` prop for accessibility

Use `component="output"` on StatusBadge instances in quota views for screen reader accessibility. This was added to `StatusBadgeSharedProps` as `component?: "output"`.

## 6. MetricCard Animated Prop

`MetricCard` has `animated={true}` by default. `MetricCardMotionWrapper` handles the count-up motion. `DesktopMetricCardGrid` passes `animationIndex={index}` automatically for staggered count-up.

- **Views must never import or render `MetricCard`/**`MobileMetricCard`**/**`DesktopMetricCard`** directly.** Use only `MobileMetricCardGrid` (mobile) or `DesktopMetricCardGrid` (desktop), including for a single metric.
- The `MetricItem.icon` type is `SvgIconComponent` (from `@mui/icons-material`), NOT `SvgIcon` or `() => null`. MUI outlined icons (`*Outlined`) are already `SvgIconComponent`.

## 7. Reduced Motion CSS in `sx` Props

**Never use `useMediaQuery` for reduced motion in `.mobile.tsx`/`.desktop.tsx` files** — it violates the mobile/desktop isolation rules. Instead, use CSS `@media (prefers-reduced-motion: reduce)` directly in the `sx` prop:

```tsx
<Box sx={{
  animation: `${growIn} 300ms ease ${index * 50}ms both`,
  "@keyframes growIn": {
    from: { opacity: 0, transform: "scale(0.95)" },
    to: { opacity: 1, transform: "scale(1)" },
  },
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none",
  },
}}>
```

### Keyframes in `sx`

Embed `@keyframes` directly in `sx` prop objects — not via `@mui/material/styles` `keyframes`. The keyframes name must be unique within the `sx` object.

### Page Mount Animation

Wrap page content in `<Fade in timeout={300}>` for page-mount animation on all tier views.

### Spinner Animation

Ensure `@keyframes` are defined in the same `sx` object as the `animation` property:
```tsx
sx={{
  animation: "spin 1s linear infinite",
  "@keyframes spin": { to: { transform: "rotate(360deg)" } },
}}
```

## 8. Storybook Error Story Naming

**Never name a Storybook story export `Error`** — it shadows the global `Error` constructor, causing TypeScript TS2448. Use `ErrorState` instead:

```ts
export const ErrorState: StoryObj<typeof Component> = { ... };
```

### Storybook Patterns

- **CSF 3.0**: `satisfies Meta<typeof Component>` with `Meta` and `StoryObj` from `@storybook/nextjs-vite`.
- **MockedProvider**: From `@apollo/client/testing/react`. Loading state = empty `mocks={[]}`. Error state = `error: new Error(...)` in mock result.
- **Zustand store seeding**: `useUserStore.setState({ role, permissions, user })` for audience view role-specific stories.

## 9. Component Test Tier-View Mocking

Container tests use the "cron test pattern":

1. **Import tier views directly** (e.g., `QuotaListDesktop`, `QuotaListMobile`) — bypasses `next/dynamic` lazy loading.
2. **Mock ViewModel hooks** via `mock.module()` — return a `Record<string, unknown>` mock object.
3. **Test wrapper component** calls the mocked hook and spreads the result into the tier view: `<QuotaListDesktop {...vm} />`.
4. **`renderWithWrapper`** provides MUI theme, Apollo cache, viewport, and locale providers.

### Key Test Discoveries

- **`next/link` mock required**: `mockNextNavigation()` does NOT mock `next/link`. Add explicit mock:
  ```ts
  await mock.module("next/link", () => ({
    default: ({ children, href, ...rest }) => createElement("a", { href, ...rest }, children),
  }));
  ```
- **`getAllByText` instead of `getByText`**: Some components render the same text in multiple places. Use `getAllByText(container, text).length > 0` inside `waitFor()`.
- **`expect.assertions(0)`** in skipped tests to satisfy `sonarjs/assertions-in-tests`.

## 10. i18n CLDR Plural Patterns — Arabic

Arabic pluralization uses CLDR rules with the following pattern:

```ts
quotaCount(count: number): string {
  if (count === 0) return "لا توجد حصص";
  if (count === 1) return "حصة واحدة";
  if (count === 2) return "حصتان";
  if (count >= 3 && count <= 10) return `${count} حصص`;
  return `${count} حصة`; // many/other
}
```

The order is: `zero → one → two → few (3-10) → many/other`.

### Locale File Pattern

- `types/*.ts` — interface definition with typed functions
- `en/*.ts` — English translations: `export const quotaEn: QuotaLabels = { ... }`
- `ar/*.ts` — Arabic translations with CLDR rules: `export const quotaAr: QuotaLabels = { ... }`

### Translation Function Typing

Use the concrete label type (e.g., `QuotaLabels` from `@/shared/locale/types/dashboard/billing/quota`) instead of `ReturnType<typeof useAppTranslation>` — the latter resolves to `unknown` in tsgo.

## 11. CodeScene 150-Line Limit

Keep tier view files (`.mobile.tsx`/`.desktop.tsx`) under 150 lines by extracting sub-components into the `components/` subdirectory. For chart-heavy views, extract chart rendering logic into dedicated chart component files.

### Extraction Strategy

- **Large methods**: Functions > ~65-70 lines trigger "Large Method" warning. Extract sub-logic into a separate custom hook (e.g., `useQuotaDelete`) at module level, then spread the returned handlers in the main hook's return.
- **Chart duplication**: Recharts sharing the same axis configuration triggers "Code Duplication". Extract a `ChartAxisGrid` component.
- **Nested functions**: `sonarjs/no-nested-functions` limits nesting to 4 levels. Extract `useCallback` → `mutation` → `update` → `updateQuery` → `filter` chains into module-level functions.

### SX Array Gotcha

SX arrays containing theme callbacks — `(theme) => [{ fontWeight: 700 }, { color: ... }]` — cause TS2769. Must merge into a single object: `(theme) => ({ fontWeight: 700, ...getDeltaColor(value, theme) })`.

## 12. Permission Gating — QuotaFormAccessProvider

The billing `QuotaFormAccessProvider` provides field-level RBAC for form components:

### Provider Pattern

```tsx
// QuotaFormAccessProvider.tsx
export function QuotaFormAccessProvider({ children }: { children: React.ReactNode }) {
  const hasPermission = useUserStore(s => s.hasPermission);
  const canManage = hasPermission(AppPermission.QuotasManage);
  const access = useMemo(() => ({
    canManage,
    fields: { /* per-field disabled/helperText */ },
  }), [canManage]);
  return <QuotaFormAccessContext.Provider value={access}>{children}</QuotaFormAccessContext.Provider>;
}
```

### Two Distinct Providers

- **Billing provider** (`frontend/common/views/dashboard/billing/quota/QuotaFormAccessProvider.tsx`) — uses `AppPermission` enum model (`QuotasManage`/`QuotasView`).
- **Student provider** (`frontend/common/views/dashboard/students/quota/QuotaFormAccessProvider.tsx`) — uses field-group ACL model (`useStudentFieldAccess`).

Do not merge these — they serve different access models.

### Permission Check Pattern

```ts
const hasPermission = useUserStore(s => s.hasPermission);
const canManage = hasPermission(AppPermission.QuotasManage);
```

### Form Field Gating

Form section components use `useQuotaFormAccess()` to apply `disabled` and `helperText` to managed fields. Tier views conditionally render the submit button based on `canManage`.

### Audience View Visibility

- **Supervisor view**: Permission-gated "New Quota" CTA and edit/delete actions — users with `QuotasManage` see actions, `QuotasView` sees read-only.
- **Student/Parent/Teacher views**: Inherently read-only — these roles don't have `QuotasManage`.

## 13. Import Deduplication

Mixing `import type { X } from "..."` and `import { Y } from "..."` from the same module triggers `import-x/no-duplicates`. Combine into one import:

```ts
import { type ReactElement, useState } from "react";
import { type SvgIconComponent, WarningAmberOutlined } from "@mui/icons-material";
```

## 14. Enum Safety Patterns

### `no-unsafe-enum-comparison` (oxlint)

When comparing GraphQL enum fields to string literals, use `String()` wrapping or `Record<string, string>` lookup tables:

```ts
// ✅ Use String() wrapping
String(q.status) === "ACTIVE"

// ✅ Use lookup table
const STATUS_LABELS: Record<string, string> = { ACTIVE: "Active", EXPIRED: "Expired" };
```

### `no-unsafe-type-assertion` (oxlint)

Use type guards (`value is Type`) instead of `as` casts. Apollo query results use `DeepPartialObject<T>` — use `satisfies` (not `as`) and null-check with `?.`:

```ts
.filter((opt): opt is QuotaAutocompleteOption => opt !== null);
```

## 15. Typography Variants

Available custom variants: `display`, `headlineLg`, `headlineMd`, `titleLg`, `bodyLg`, `bodyMd`, `labelMd`, `labelSm`, `labelUppercase`, `buttonText`.

**Do NOT use**: `titleMd`, `bodySm`, `headlineSm` — these do not exist in the theme.

## 16. Reusable Component APIs

| Component | Key Props | Source |
|-----------|-----------|--------|
| `BaseDeleteDialog` | `open`, `onClose`, `onConfirm`, `isLoading`, `title`, `body`, `cancelLabel`, `confirmLabel`, `fullScreen?` | `@/frontend/common/components/ui/dialog` |
| `FormErrorSnackbar` | `open`, `message`, `onClose` | `@/frontend/common/components/ui/form/snackbar/FormErrorSnackbar` |
| `FormSuccessSnackbar` | `open`, `message`, `onClose` | `@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar` |
| `DesktopSectionPanel` | `title`, `children`, `contentPadding` (false for grids) | `@/frontend/desktop/components/ui/container` |
| `MobileSectionPanel` | `title`, `children`, `contentInset` (false for edge-to-edge) | `@/frontend/mobile/components/ui/container` |
| `DesktopAppDataGrid<R>` | `rows`, `columns`, `loading`, `paginationOptions`, `emptyMessage?`, `ariaLabel?` | `@/frontend/desktop/components/ui/datagrid` |
| `MobileCardList<T>` | `rows`, `renderItem`, `getKey`, `loading?`, `paginationOptions`, `layout?` | `@/frontend/mobile/components/ui/container` |
| `MobileFab` | `icon`, `label`, `onClick`, `disabled?` | self-gates on `isMobile` |
| `QuotaAutocomplete` | `studentId`, `value`, `onChange`, `disabled`, i18n labels | `@/frontend/common/components/ui/input/quotaSelect` |

### Pagination

- **Server**: `{ mode: "server", page (1-based), pageSize, totalCount, onPageChange }`
- **Client**: `{ mode: "client", pageSize: N }`
- `paginationOptions` is required on `AppDataGrid`/`MobileCardList` — never omit it.
