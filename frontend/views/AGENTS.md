# Frontend Views Layer Rules

- **Functional Components**: All React components must be written as functional components using hooks. Do NOT use React class components.
- **Domain Structure**: Components are structured by domain (e.g., `frontend/views/dashboard`). Group related views and sub-components logically within their domain folder.
- **Access Control**: When rendering components that require specific permissions, wrap them in the `<RequirePermission>` component to dynamically check user permissions against the active Zustand store.
- **Data Fetching (Client Components)**: Data fetching inside client components should be performed by Apollo hooks (`useQuery`) with generated TypedDocumentNodes.
- **Data Fetching (Server Components)**: Server components may fetch data directly from the backend service layer (e.g., `SessionService`, `PermissionsService`) without going through GraphQL. Use cached wrappers (see `app/AGENTS.md`) to enable per-request deduplication. Server components must not call repositories or the database directly — always go through the service layer.

## Storybook Best Practices

- **Permission Seeding**: Components wrapped in `<RequirePermission>` will default to admin permissions in Storybook via the global `StoryWrapper`. If you need to test a specific permission state (e.g., Parent vs Teacher), use `useUserStore.setState()` within the story or a local decorator to seed the required permissions.
- **Translation Context**: All stories are automatically wrapped in `NextIntlClientProvider`. Ensure your component uses `useTranslations` from `next-intl` for all user-facing text to maintain compatibility with the Storybook localization toggle.
- **Mock Stores**: Storybook is configured to alias the real `userStore` to `mockUserStore`. When writing stories for views that rely on global state (like filters or user data), prefer using the mock stores to provide predictable initial states.
- **Story Decorators**: If a story requires additional context (e.g., specific providers or layout wrappers), define them in the `decorators` array of the story metadata rather than wrapping the component directly in the story function.
