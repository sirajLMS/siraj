# Frontend Views Layer Rules

- **Functional Components**: All React components must be written as functional components using hooks. Do NOT use React class components.
- **Domain Structure**: Components are structured by domain (e.g., `frontend/views/dashboard`). Group related views and sub-components logically within their domain folder.
- **Access Control**: When rendering components that require specific permissions, wrap them in the `<RequirePermission>` component to dynamically check user permissions against the active Zustand store.
- **Data Fetching (Client Components)**: Data fetching inside client components should be performed by Apollo hooks (`useQuery`) with generated TypedDocumentNodes.
- **Data Fetching (Server Components)**: Server components may fetch data directly from the backend service layer (e.g., `SessionService`, `PermissionsService`) without going through GraphQL. Use cached wrappers (see `app/AGENTS.md`) to enable per-request deduplication. Server components must not call repositories or the database directly — always go through the service layer.

## ViewModel Pattern

- **ViewModel hooks**: Each page/domain gets a `useXxViewModel()` hook that encapsulates ALL business logic (data fetching, state, handlers, derived values). The hook returns a flat plain object (the "view model") — same interface for both mobile and desktop views.
- **No useMediaQuery/viewport**: ViewModel hooks must NEVER import or call `useMediaQuery` or `useViewport`. They are viewport-agnostic.
- **Zustand for all state**: All mutable state (filters, pagination, dialog open, form values, File objects) lives in Zustand stores so it survives viewport tier switching during resize (when React unmounts the desktop tree and mounts the mobile tree).
- **Ephemeral state only**: Truly ephemeral presentation state (e.g., tooltip open, popover hover) may use `useState` — it resets on tier switch but that's acceptable for pure UI hover states.
- **Container calls hook**: The Container component calls the ViewModel hook and passes the view model to the switcher `View.tsx`.
- **Switcher is the ONLY viewport consumer**: The `View.tsx` switcher component is the ONLY file that reads `useViewport()` and decides which tier to render. It delegates to `ResponsiveViewSwitch` or uses a simple ternary.
- **Mobile/desktop views are pure presentation**: `.mobile.tsx` and `.desktop.tsx` files contain ZERO business logic, ZERO hooks (except for purely local UI state), and ZERO viewport branching. They only render the props passed from the view model.
- **Directory structure per domain**:
  ```
  <domain>/
    mobile/
      xx.mobile.tsx
      components/
        xxCard.mobile.tsx
    desktop/
      xx.desktop.tsx
      components/
        xxGrid.desktop.tsx
    shared/
      xxShared.tsx
    useXxViewModel.ts
    xxView.tsx          (switcher)
  ```
- **ESLint enforcement**: `no-restricted-imports` rules block `useMediaQuery` and `useViewport` imports in `.mobile.tsx`/`.desktop.tsx` files.
- **State serialization**: Non-serializable values (`File`, `Blob`, `FormData`, `Promise`) must NOT be stored in `persist`-enabled Zustand stores. Use `partialize` to exclude them or keep in a `useRef` in the ViewModel hook.
- **Cross-reference**: See `frontend/components/ui/AGENTS.md`, `frontend/stores/AGENTS.md`, `.agents/instructions/mobile-desktop.instructions.md`.

## Storybook Best Practices

- **Permission Seeding**: Components wrapped in `<RequirePermission>` will default to admin permissions in Storybook via the global `StoryWrapper`. If you need to test a specific permission state (e.g., Parent vs Teacher), use `useUserStore.setState()` within the story or a local decorator to seed the required permissions.
- **Translation Context**: All stories are automatically wrapped in `NextIntlClientProvider`. Ensure your component uses `useTranslations` from `next-intl` for all user-facing text to maintain compatibility with the Storybook localization toggle.
- **Mock Stores**: Storybook is configured to alias the real `userStore` to `mockUserStore`. When writing stories for views that rely on global state (like filters or user data), prefer using the mock stores to provide predictable initial states.
- **Story Decorators**: If a story requires additional context (e.g., specific providers or layout wrappers), define them in the `decorators` array of the story metadata rather than wrapping the component directly in the story function.
