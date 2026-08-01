# Frontend Views Layer Rules

- **Functional Components**: All React components must be written as functional components using hooks. Do NOT use React class components.
- **Domain Structure**: Components are structured by domain (e.g., `frontend/views/dashboard`). Group related views and sub-components logically within their domain folder.
- **Access Control**: When rendering components that require specific permissions, wrap them in the `<RequirePermission>` component to dynamically check user permissions against the active Zustand store.
- **Data Fetching (Client Components)**: Data fetching inside client components should be performed by Apollo hooks (`useQuery`) with generated TypedDocumentNodes.
- **Data Fetching (Server Components)**: Server components may fetch data directly from the backend service layer (e.g., `SessionService`, `PermissionsService`) without going through GraphQL. Use cached wrappers (see `app/AGENTS.md`) to enable per-request deduplication. Server components must not call repositories or the database directly — always go through the service layer.

## ViewModel Pattern

- **ViewModel hooks**: Each page/domain gets a `useXxViewModel()` hook that encapsulates ALL business logic (data fetching, state, handlers, derived values). The hook returns a flat plain object (the "view model") — same interface for both mobile and desktop views.
- **Hook location**: `useXxViewModel.ts` lives at `frontend/common/views/dashboard/<domain>/` (the tier-neutral home). Tier view files import the ViewModel **type** from `@/frontend/common/views/dashboard/<domain>/useXxViewModel`.
- **No useMediaQuery/viewport**: ViewModel hooks must NEVER import or call `useMediaQuery` or `useViewport`. They are viewport-agnostic.
- **Zustand for all state**: All mutable state (filters, pagination, dialog open, form values, File objects) lives in Zustand stores (`frontend/common/stores/`) so it survives viewport tier switching during resize (when React unmounts the desktop tree and mounts the mobile tree).
- **Ephemeral state only**: Truly ephemeral presentation state (e.g., tooltip open, popover hover) may use `useState` — it resets on tier switch but that's acceptable for pure UI hover states.
- **Container calls hook**: The Container component (`frontend/common/views/dashboard/<domain>/XxxContainer.tsx`) calls the ViewModel hook and passes the view model to the switcher (`XxView.tsx`).
- **Switcher uses `ResponsiveViewSwitch` with lazy loading**: The `XxView.tsx` switcher (in `frontend/common/views/dashboard/<domain>/`) calls `createLazyView()` at module top level to create lazy-loaded mobile/desktop component references, then passes them to `<ResponsiveViewSwitch>`. The switcher file no longer directly imports `useViewport` — `ResponsiveViewSwitch` reads it internally. Only the matching tier's code is fetched (mobile devices never download desktop component code).
- **Switcher lazy imports**: The switcher imports mobile and desktop tier views via:
  ```tsx
  () => import("@/frontend/mobile/views/dashboard/<domain>/xx.mobile").then(m => ({ default: m.XxMobileView })),
  () => import("@/frontend/desktop/views/dashboard/<domain>/xx.desktop").then(m => ({ default: m.XxDesktopView })),
  ```
- **Mobile/desktop views are pure presentation**: `.mobile.tsx` and `.desktop.tsx` files (in `frontend/mobile/views/` and `frontend/desktop/views/`) contain ZERO business logic, ZERO hooks (except for purely local UI state), and ZERO viewport branching. They only render the props passed from the view model.
- **Metric cards:** Tier views must never import or render `MetricCard` / `MobileMetricCard` / `DesktopMetricCard`. Use only `MobileMetricCardGrid` (mobile) or `DesktopMetricCardGrid` (desktop), including when there is a single metric.
- **Directory structure** (per domain, across the three top-level modules):
  ```
  frontend/common/views/dashboard/<domain>/   # tier-neutral home
    useXxViewModel.ts
    xxView.tsx                                 # switcher
    xxContainer.tsx
    types/, schemas/, utils/
    components/                                # shared non-tiered

  frontend/mobile/views/dashboard/<domain>/
    xx.mobile.tsx                              # mobile tier view
    components/
      xxCard.mobile.tsx

  frontend/desktop/views/dashboard/<domain>/
    xx.desktop.tsx                             # desktop tier view
    components/
      xxGrid.desktop.tsx
  ```
  > Note: `frontend/views/` is DEPRECATED. Switchers, Containers, ViewModels, schemas, types, utils, and shared non-tiered components have been relocated to `frontend/common/views/`. Tier views moved to `frontend/mobile/views/` and `frontend/desktop/views/`. Only `frontend/views/dashboard/config/` (navigationConfig) and any residual non-switcher view trees remain.
- **ESLint enforcement**: `no-restricted-imports` rules block `useMediaQuery` and `useViewport` imports in `.mobile.tsx`/`.desktop.tsx` files.
- **State serialization**: Non-serializable values (`File`, `Blob`, `FormData`, `Promise`) must NOT be stored in `persist`-enabled Zustand stores. Use `partialize` to exclude them or keep in a `useRef` in the ViewModel hook.
- **Cross-reference**: See `frontend/common/components/ui/AGENTS.md`, `frontend/common/views/AGENTS.md`, `frontend/common/stores/AGENTS.md`, `frontend/mobile/AGENTS.md`, `frontend/desktop/AGENTS.md`, `.agents/instructions/mobile-desktop.instructions.md`.

## Quota Views

The Quota System frontend follows the standard ViewModel pattern. See `docs/billing/quota-system.md` for the complete reference. Key quota-specific view conventions:

### ViewModel Location

All quota views live under `frontend/common/views/dashboard/billing/quota/`:
- `useQuotaViewModel.ts` — list/filter/pagination logic
- `useQuotaDetailViewModel.ts` — detail view logic
- `useQuotaFormViewModel.ts` — create/edit form logic
- `QuotaInsightsContainer.tsx` — insights dashboard

Student quota tab views live under `frontend/common/views/dashboard/students/quota/`:
- `StudentQuotaContainer.tsx` — Container (calls ViewModel)
- `useStudentQuotaViewModel.ts` — ViewModel hook
- `QuotaFormAccessProvider.tsx` — permission gating
- `frontend/common/views/dashboard/students/quota/schemas/studentQuotaSchema.ts` — Zod schema

### State Management

- `frontend/common/stores/quotaStore.ts` — Zustand store for form state that survives viewport tier switching
- Never store non-serializable values (File, Blob) in persist-enabled stores

### Permissions

- All quota views require `QUOTAS_VIEW` permission
- Administrative views (create/edit) require `QUOTAS_MANAGE`
- Student quota tab is registered in `studentProfileTabs.ts` with `QUOTA_TAB_GROUPS`
- Tab shows per-audience rendering: student/parent see PENDING_CREDIT prominently; teacher sees CONFLICT_HELD

## Storybook Best Practices

- **Permission Seeding**: Components wrapped in `<RequirePermission>` will default to admin permissions in Storybook via the global `StoryWrapper`. If you need to test a specific permission state (e.g., Parent vs Teacher), use `useUserStore.setState()` within the story or a local decorator to seed the required permissions.
- **Translation Context**: All stories are wrapped by the project's custom `LocaleProvider` (frontend/common/providers/LocaleProvider). Use `useAppTranslation` from `@/shared/locale/client` for all user-facing text to maintain compatibility with the Storybook localization toggle.
- **Mock Stores**: Storybook is configured to alias the real `userStore` to `mockUserStore`. When writing stories for views that rely on global state (like filters or user data), prefer using the mock stores to provide predictable initial states.
- **Story Decorators**: If a story requires additional context (e.g., specific providers or layout wrappers), define them in the `decorators` array of the story metadata rather than wrapping the component directly in the story function.
