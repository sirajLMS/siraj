# Task 14: Container Component — Outcome

## Date: 2026-08-14

## Summary

Created `GeneralUserCreateContainer` — a thin container component that wires the general user creation mobile and desktop tier views via `ResponsiveViewSwitch`. The container uses `createLazyView` for dynamic imports (code-splitting per tier) and renders the appropriate tier view based on viewport detection.

Since the mobile and desktop tier views (Task 13) each call `useGeneralUserCreateViewModel()` internally and take no props, the container does NOT call the ViewModel hook — it simply passes an empty props object `{}` to `ResponsiveViewSwitch`.

## File Created

| File | Purpose |
|------|---------|
| `frontend/common/views/dashboard/users/createUser/GeneralUserCreateContainer.tsx` | Container component — thin wiring of tier views via `ResponsiveViewSwitch` |

## Exact Export Name

```typescript
GeneralUserCreateContainer
```

**Import path**: `@/frontend/common/views/dashboard/users/createUser/GeneralUserCreateContainer`

## How ResponsiveViewSwitch Is Used

The container follows the established pattern (matching `StudentOnboardingContainer`, `ParentOnboardingContainer`, etc.):

1. **`createLazyView`** at module top level (required by `next/dynamic` for static import paths) — creates lazy-loaded mobile and desktop component references
2. **`ResponsiveViewSwitch`** in the render body — selects the correct tier component based on `useViewport()` (internal to `ResponsiveViewSwitch`)
3. **Props**: `{}` — passed as the `props` prop since both tier views take no props (they call the ViewModel hook internally)

```tsx
const lazyViews = createLazyView<UseGeneralUserCreateViewModelProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/users/createUser/generalUserCreate.mobile").then(m => ({
      default: m.GeneralUserCreateMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/users/createUser/generalUserCreate.desktop").then(m => ({
      default: m.GeneralUserCreateDesktop,
    }))
);

export function GeneralUserCreateContainer() {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={{}} />;
}
```

### Key Design Decision: No ViewModel Call in Container

Unlike `ManagerOnboardingContainer` (which calls `useManagerOnboardingContainerViewModel(props)` and passes the view model down), the general user creation container does NOT call the ViewModel hook. This is because:

1. The ViewModel hook `useGeneralUserCreateViewModel` takes no arguments (`UseGeneralUserCreateViewModelProps = Record<string, never>`)
2. Both tier views (`GeneralUserCreateMobile`, `GeneralUserCreateDesktop`) call the hook internally (matching the pattern described in outcome 13)
3. This ensures each tier's form state is independent and survives tier switching via the ViewModel's internal Zustand store

### Import Patterns

| Import | Path | Type |
|--------|------|------|
| `createLazyView` | `@/frontend/common/components/ui/container/createLazyView` | value |
| `ResponsiveViewSwitch` | `@/frontend/common/components/ui/container/ResponsiveViewSwitch` | value |
| `UseGeneralUserCreateViewModelProps` | `@/frontend/common/views/dashboard/users/createUser/useGeneralUserCreateViewModel` | `import type` |
| Mobile view (dynamic) | `@/frontend/mobile/views/dashboard/users/createUser/generalUserCreate.mobile` | dynamic `import()` |
| Desktop view (dynamic) | `@/frontend/desktop/views/dashboard/users/createUser/generalUserCreate.desktop` | dynamic `import()` |

## What Props Are Passed to Mobile/Desktop Views

Both tier views take **no props** (`Record<string, never>`). The container passes `props={{}}` to `ResponsiveViewSwitch`, which spreads `{}` onto the selected tier component. The tier views then:

1. Call `useGeneralUserCreateViewModel()` to get the full view model (form state, labels, submit handler, etc.)
2. Construct tier-specific `options` (layout components, styling)
3. Render `<GeneralUserCreateShared {...vm} options={tierOptions} />` inside tier-specific page chrome

## Barrel File

No barrel file (`index.ts`) was created for the `createUser` directory — matching the pattern across comparable container directories (e.g., `students/onboarding/`, `staff/onboarding/`, `teachers/onboarding/`, `admin/parents/onboarding/` — none have barrel files). The container is imported directly by its file path.

## Verification Results

```
✅ tsgo passed (no errors for GeneralUserCreateContainer.tsx)
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
✅ All checks for lifecycle "codescene" passed with exit code 0
```

## Carry-Forward Knowledge for Task 15 (App Router Page)

### How to Import the Container

```typescript
import { GeneralUserCreateContainer } from "@/frontend/common/views/dashboard/users/createUser/GeneralUserCreateContainer";
```

### Usage in App Router Page

```tsx
// app/[locale]/dashboard/users/create/page.tsx
import { GeneralUserCreateContainer } from "@/frontend/common/views/dashboard/users/createUser/GeneralUserCreateContainer";

export default function CreateGeneralUserPage() {
  return <GeneralUserCreateContainer />;
}
```

### Key Notes for Task 15

1. **The container is a client component** (`"use client"` directive) — it can be rendered from a Server Component page or a client wrapper
2. **No props needed** — the container takes no props; all business logic is encapsulated in the ViewModel hook (called by tier views)
3. **`withPageAuth` wrapper** — if the page requires authentication, wrap the page export with the `withPageAuth` pattern (see `docs/app/with-page-auth.md`)
4. **i18n** — the page should await `params` for locale and pass it to any server-side translation needs; the container handles client-side translations internally via the ViewModel
5. **Metadata** — if page metadata (title) is needed, generate it in the Server Component page using `getTranslations(locale, "dashboard.users.createUser")` from `@/shared/locale/server`
