# Siraj Frontend Patterns Analysis

> Source: `/home/ahmed/Projects/siraj-cert/frontend/`, `/home/ahmed/Projects/siraj-cert/app/`
> Purpose: Reference for certificate feature integration.

## 1. Top-Level Architecture

The frontend is split across three locations that together implement a server-rendered Next.js (App Router) application with a tiered (mobile/desktop) client presentation layer.

| Location | Role |
|---|---|
| `app/(dashboard)/` | Next.js App Router route groups — **server components** that do auth, permissions, audience resolution, metadata, then render a `<…Container>` client component. |
| `frontend/common/views/dashboard/<domain>/` | Tier-neutral home: ViewModel hooks, switcher (`XxView.tsx`), Container, schemas, types, shared non-tiered components. |
| `frontend/mobile/views/dashboard/<domain>/` & `frontend/desktop/views/dashboard/<domain>/` | Tier-specific presentation views (`*.mobile.tsx` / `*.desktop.tsx`) — pure render of props, no business logic. |

> `frontend/views/` is **DEPRECATED** (only `auth/` + residual `config/` remain). Switchers/Containers/ViewModels relocated to `frontend/common/views/`. Tier views moved to `frontend/mobile/views/` and `frontend/desktop/views/`.
> — `frontend/views/AGENTS.md:44`

### Mobile/Desktop Isolation (strict, ESLint-enforced)

- File naming: `.mobile.tsx` / `.desktop.tsx`; shared components have no suffix.
- Directory: `mobile/` and `desktop/` subdirs per domain; shared in `shared/`.
- **Zero `useMediaQuery`** and **zero `useViewport`/`ViewportContext`** imports in `.mobile.tsx`/`.desktop.tsx` (ESLint `no-restricted-imports` enforced).
- No cross-imports between `.mobile.tsx` and `.desktop.tsx`.
- Only `ResponsiveViewSwitch` reads the viewport; the switcher file delegates to it.
- — `frontend/AGENTS.md:201-257`

### Per-domain three-module layout

```
frontend/common/views/dashboard/<domain>/   # tier-neutral home
  useXxViewModel.ts
  xxView.tsx                                 # switcher (often inlined into Container)
  xxContainer.tsx
  types/, schemas/, utils/
  components/                                # shared non-tiered

frontend/mobile/views/dashboard/<domain>/
  xx.mobile.tsx
  components/xxCard.mobile.tsx

frontend/desktop/views/dashboard/<domain>/
  xx.desktop.tsx
  components/xxGrid.desktop.tsx
```
— `frontend/views/AGENTS.md:25-43`

## 2. App Router Pages (server components)

Dashboard pages live in `app/(dashboard)/`. They are **async server components** that perform a consistent ceremony:

1. `await getLocale()` + `generateMetadata()` (server-side metadata with translated titles).
2. `await getServerUserContext()` → redirect to login if no `userId`.
3. `await requirePermissionForPage(userId, [...AppPermission], locale, context)`.
4. Optional **audience resolution** (admin/teacher/parent) → render the matching `<…Container>`.
5. Optional feature-flag redirect (e.g., `isUsersDirectoryEnabled()` → `/users?tab=…`).

### Example — `app/(dashboard)/teachers/page.tsx`
```tsx
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.teachersDirectory;
  return { title: t.pageTitle };
}

export default async function TeachersPage() {
  if (await isUsersDirectoryEnabled()) redirect("/users?tab=teachers");
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) { await redirectToLogin(); return; }
  await requirePermissionForPage(userId, [AppPermission.STAFF_VIEW_DIRECTORY], locale, context);
  return <TeachersContainer />;
}
```

### Example — `app/(dashboard)/students/page.tsx` (audience resolution)
Resolves audience to `admin` | `teacher` | `parent` and renders `StudentsContainer` / `TeacherStudentsContainer` / `ParentStudentsContainer` accordingly. Admin with `isUsersDirectoryEnabled()` redirects to `/users?tab=students`.

### Example — `app/(dashboard)/billing/page.tsx`
```tsx
await requirePermissionForPage(userId,
  [AppPermission.BILLING_VIEW_HISTORY, AppPermission.BILLING_VIEW_EXCHANGE_RATES,
   AppPermission.BILLING_MANAGE_CURRENCY_HEDGES, AppPermission.BILLING_CREATE_INVOICE],
  locale, context);
return <BillingPageContainer />;
```
- `app/(dashboard)/billing/invoices/page.tsx` is a redirect shim → `/billing?tab=invoices`.

### Dashboard layout — `app/(dashboard)/layout.tsx`
- Server component, async.
- `getServerUserContext()` → redirect login if no user/context; `forbidden()` on prefetch.
- Reads sidebar cookie (`SIDEBAR_COOKIE_NAME`) for `initialSidebarOpen`.
- Wraps children in `<Suspense fallback={<DashboardShellSkeleton />}><DashboardProfileShell …>{children}</DashboardProfileShell></Suspense>`.
- `DashboardProfileShell` (server) fetches user profile via `getCurrentUser(userId, context)` (service layer), maps to GraphQL `User`, enforces teacher profile-completion redirect, then renders `<DashboardLayoutContainer>` which wraps `<DashboardClientProviders>` (Apollo + Auth) → `<DashboardClientBridge>` (client islands: sidebar, navbar, user store).

**Server→client boundary**: Server components must go through the service layer (e.g., `SessionService`, `PermissionsService`, `getCurrentUser`), **never** repositories/DB directly. Client components fetch via Apollo `useQuery`. — `frontend/views/AGENTS.md:6-7`

## 3. Container + ViewModel + ResponsiveViewSwitch Pattern

This is the central client composition pattern. A page renders one Container; the Container calls the ViewModel hook, wraps in `<RequirePermission>`, and passes the view model to `<ResponsiveViewSwitch>` with lazy mobile/desktop component refs.

### Container — `frontend/common/views/dashboard/teachers/home/TeachersContainer.tsx`
```tsx
export function TeachersContainer(props: Readonly<UseTeachersViewModelProps> = {}) {
  const viewModel = useTeachersViewModel(props);
  return (
    <RequirePermission permissions={[AppPermission.StaffViewDirectory, AppPermission.TeachersList]}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}
```
- `createLazyView<TeachersViewModel>(mobileLoader, desktopLoader)` is called at **module top level** (static import paths required by `next/dynamic`). Each loader returns `{ default: m.XxMobileView }`.
- Loader paths: `@/frontend/mobile/views/dashboard/<domain>/xx.mobile` and `@/frontend/desktop/views/dashboard/<domain>/xx.desktop`.
- `<RequirePermission>` gates the whole switch; permission checks belong in the Container, not tier views. — `frontend/views/AGENTS.md:6`

### ViewModel hook — `frontend/common/views/dashboard/teachers/home/useTeachersViewModel.ts`
Encapsulates **ALL** business logic and returns a flat plain object (the "view model") — identical interface for both tiers.
```tsx
export function useTeachersViewModel(): TeachersViewModel {
  const labels = useAppTranslation(Translation.Dashboard.TeachersDirectory);
  const { searchQuery, setSearchQuery, page, pageSize, setPage } = useTeacherDirectoryStore();
  const { hasPermission } = useUserStore();
  const router = useRouter();
  const { data } = useQuery(teacherDirectoryQueryDocument, {
    variables: { search: searchQuery || null,
      paginationArgs: { first: pageSize, page: page + 1, skip: null, after: null, before: null, last: null, maxCount: null } },
    fetchPolicy: "cache-and-network",
  });
  // navigation callbacks owned by ViewModel (router stays here, not in tier views)
  const onNavigateToSchedule = useCallback((id) => router.push(`/teachers/${id}/schedule/weekly`), [router]);
  const onNavigateToProfile  = useCallback((t) => { const href = profileHrefForTeacher({...}); if (href) router.push(href); }, [router]);
  const canCreateTeacher = hasPermission(AppPermission.TeachersCreate);
  return { labels, metrics: data?.teacherDirectory?.metrics ?? null, rows: …, page, pageSize,
           totalCount: …, onPageChange: setPage, onNavigateToSchedule, onNavigateToProfile, canCreateTeacher };
}
```
Rules:
- **No `useMediaQuery`/`useViewport`** in ViewModels (viewport-agnostic). — `frontend/views/AGENTS.md:14`
- **Zustand holds all mutable state** (filters, pagination, dialog open, form values) so it survives tier switching on resize.
- Truly ephemeral UI state (tooltip hover) may use `useState`.
- `useRouter` and permission checks live in the ViewModel, not in tier views. — `useTeachersViewModel.ts:29-38`

### Tier views are pure presentation
`.mobile.tsx` / `.desktop.tsx` receive the view model via props and only render. Example — `frontend/desktop/views/dashboard/teachers/home/teachersView.desktop.tsx`:
```tsx
export function TeachersDesktopView({ labels, metrics, rows, page, pageSize, totalCount, onPageChange,
  canCreateTeacher, onNavigateToSchedule, onNavigateToProfile }: Readonly<TeachersDesktopViewProps>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={t.pageTitle} subtitle={t.pageSubtitle}
        actions={<> {canCreateTeacher ? (<Link href="/teachers/onboarding"><DesktopPrimaryPageAction …/></Link>) : null} …</>} />
      <Box sx={{ mb: 4 }}><TeacherMetricsRow metrics={metrics} labels={labels.metrics} /></Box>
      <DesktopSectionPanel contentPadding={false} title={…}>
        <TeacherDataGrid rows={rows} page={page} pageSize={pageSize} totalCount={totalCount} onPageChange={onPageChange} … />
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
```

### Tabbed/blueprint variant — Billing
`BillingPageContainer` → `useBillingTabsViewModel()` → `<BillingView>` which uses `<ResponsiveViewSwitch>` for the **shell** and embeds shared `<BillingPageChrome>` + `<BillingTabPanels>` inside `children` (so the shell switches tier but tab content stays shared). This is the pattern for tabbed dashboards.

## 4. Shared UI Components (`frontend/common/components/ui/`)

Barrel `frontend/common/components/ui/index.ts` exports:
- **badge**: `StatusBadge` (use for status — no inline status chips; AGENTS.md:196).
- **button**: `PrimaryPageAction`, `FilterButton`, `ExportButton` (action presets), `ActionIconLink`.
- **card**: card primitives; metric **cards** are NOT imported by views — use tier `*MetricCardGrid` (AGENTS.md:194, views AGENTS.md:24).
- **container**: `SectionPanel`, `HorizontalScrollRow`, `ResponsiveViewSwitch`, `createLazyView`, `page/` (PageContainer types, MUI v9 compliant).
- **dataGrid**: `AppDataGrid` (+ loading/no-rows overlays), `mapPaginationOptionsToDataGridProps`, `ListPaginationOptions` helpers.
- **display**: `PersonProfileLink`, `PersonProfileLinkCell`, `TimezoneDisplay`, `MeetingJoinAction`.
- **filter**: `DateNavigator`, `PaginationControls`, `buildServerPaginationOptions`, `ListPaginationOptions`.
- **form**: `FormErrorSnackbar`, `FormSuccessSnackbar`.
- **input**, **state** (loading/error states), **story** (Storybook page container).

Tier-specific barrels mirror these at `frontend/desktop/components/ui/index.ts` and `frontend/mobile/...` — e.g., `DesktopAppDataGrid`, `DesktopPageContainer`, `DesktopPageHeader`, `DesktopPrimaryPageAction`, `DesktopSectionPanel`, `DesktopPersonProfileLinkCell`.

### MUI v9 compliance rules (`frontend/AGENTS.md:173-185` and 187-199)
- Layout/spacing props are **NOT** valid direct props — must go in `sx`: `Typography` (`fontWeight`, `mb`…), `Stack` (`alignItems`, `gap`…), `Box` (`p`, `display`, `flex`, `component`…), `Grid`, `ListItemText`.
- Icons: `*Outline` → `*Outlined`.
- **No hardcoded colors**: all colors from theme palette; never hex/rgb/names; never string-based palette access (`color="primary.main"`).
- Theme callback pattern: `sx={theme => ({ color: theme.palette.primary.main })}`.
- Use Material 3 `on<Color>` siblings instead of `contrastText` (e.g., `theme.palette.onPrimary`).
- Typography variants: `headlineLg`, `titleLg`, `labelUppercase`, `bodyMd`, `bodyLg`, `labelMd` (avoid hardcoded font `sx`).
- MUI `Table` / `Pagination` are banned — lists use `AppDataGrid` / `DesktopAppDataGrid` / `MobileCardList`. — `frontend/AGENTS.md:194`

### `mergeSx` utility
`@/frontend/common/utils/sx/mergeSx` merges default + caller `sx` (used by `AppDataGrid`, `DesktopPageContainer`). Always use it when combining sx objects.

## 5. AppDataGrid (`frontend/common/components/ui/dataGrid/AppDataGrid.tsx`)

Wrapper over MUI X `DataGrid` that standardizes pagination, overlays, and styling. **Required**: pass `paginationOptions` (never omit; use `false` to disable, otherwise pager stays visible even on a single page).

```tsx
export interface AppDataGridProps<R> extends Omit<DataGridProps<R>, …> {
  readonly emptyMessage?: string;
  readonly ariaLabel?: string;
  readonly paginationOptions: ListPaginationOptions;   // required
  readonly slots?: Omit<…, "pagination">;             // pagination slot is forced
}
```
Behavior:
- Omits pagination-related MUI props; computes them via `mapPaginationOptionsToDataGridProps`.
- Forced slots: `slots.pagination = GridPagination` (shared) — **never** pass `slots.pagination` or sibling `MobilePaginationControls` next to a list (AGENTS.md:194). `noRowsOverlay` and `loadingOverlay` set to shared overlays.
- Default `sx`: borderless, focus outline removed; merged with caller `sx` via `mergeSx`.
- Wraps in `<Box sx={{ width: "100%" }} aria-label={ariaLabel}>`.

### `DesktopAppDataGrid` (`frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid.tsx`)
Identical interface but uses desktop-tier overlays and `DesktopGridPagination`. View grids import `DesktopAppDataGrid` (not the shared `AppDataGrid`).

### Column definition example — `teacherDataGrid.desktop.tsx`
```tsx
const columns: GridColDef<TeacherDirectoryRow>[] = [
  { field: "index", headerName: t.table.hash, width: 72, sortable: false,
    renderCell: (params) => { /* compute display index from page*pageSize+relativeIndex+1 */ } },
  { field: "name", headerName: t.table.name, flex: 1.5, minWidth: 200,
    renderCell: (params) => <DesktopPersonProfileLinkCell href={profileHrefForTeacher({...})} name={…} avatarUrl={params.row.avatarUrl} avatarSize={40} typographyVariant="bodyLg" fontWeight={700} /> },
  { field: "email", headerName: t.table.email, flex: 1.5, minWidth: 200,
    renderCell: (params) => <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>{params.value as string}</Typography> },
  { field: "schedule", …, renderCell: (params) => <TeacherActionButton icon={<CalendarMonthOutlined />} variant="error" onClick={() => onNavigateToSchedule(params.row.id)} /> },
  { field: "options", …, renderCell: (params) => <>{<ViewAsUserButton …/>}<TeacherActionButton …/></> },
];
```
Patterns:
- `GridColDef<T>[]` typed against the row type from generated GraphQL types.
- Header names come from translated labels (`t.table.…`) — no hardcoded strings.
- `renderCell` returns theme-callback `sx`; custom action cells call ViewModel callbacks (navigation owned by VM).
- `getRowId={row => row.id ?? ""}`, `rowHeight={72}`, `disableRowSelectionOnClick`.

### Data loading
Data is loaded **by Apollo `useQuery` in the ViewModel**, not inside the grid. The grid is purely presentational: receives `rows`, `page`, `pageSize`, `totalCount`, `onPageChange` from the VM. `fetchPolicy: "cache-and-network"` is used for directory queries.

### Pagination — `ListPaginationOptions` (`filter/listPaginationOptions.ts`)
Discriminated union; the grid decides client vs server pagination from it:
```ts
type ListPaginationOptions = false
  | { mode: "client"; pageSize?: number; pageSizeOptions?: readonly number[] }
  | { mode: "server"; page; pageSize; totalCount; onPageChange; onPageSizeChange?; pageSizeOptions? };
```
- `false` → hide footer.
- `client` → MUI client pagination (`paginationMode: "client"`, default page size 10, options `[10,25,50]`).
- `server` → `paginationMode: "server"`, `rowCount`, controlled `paginationModel`, `onPaginationModelChange` dispatches to `onPageChange`/`onPageSizeChange`.
- Helper `buildServerPaginationOptions({page,pageSize,totalCount,onPageChange,onPageSizeChange?,pageSizeOptions?})`.

### Sorting/filtering
Sorting is delegated to MUI X DataGrid's column props (`sortable: false` per column as needed). Filtering values live in Zustand stores (e.g., `studentDirectoryStore.filterArgs`); the VM passes them as query variables. MUI X DataGrid built-in filter row is generally not used for server-paged grids — the AGENTS rules favor external filter panels + `FilterButton`.

## 6. PageContainer pattern

Two-tier wrapper enforcing the "no double padding" rule (dashboard layout already applies `pageMargin`).

- **Type** `frontend/common/components/ui/container/page/types/pageContainer.types.ts`:
  ```ts
  export interface PageContainerProps { readonly sx?: SxProps<Theme>; readonly children: ReactNode; }
  ```
- **Desktop** `frontend/desktop/components/ui/container/page/DesktopPageContainer.tsx` (`"use client"`):
  - Renders `<Box sx={{ display:"flex", flexDirection:"column", gap: theme => theme.layout.sectionGap, width:"100%", position:"relative" }}>` + caller `sx` via `mergeSx`.
  - Shows a fixed `LinearProgress` bar (top: 64px) while theme/language is switching (`useThemeMode`, `useLanguageSwitch`).
  - **Desktop views must NOT add outer `p:2/3`** (double-padding with `DashboardLayout.pageMargin`). — `frontend/AGENTS.md:192`
- **Mobile**: `MobilePageContainer` is edge-to-edge (`px: 0`); content owns inset via `mobileContentGutterSx`, `MobileContentInset`, `MobilePageHeader`, scroll rows, and section panels. — `frontend/AGENTS.md:193`

### PageHeader — `DesktopPageHeader.tsx`
```tsx
<DesktopPageHeader title subtitle titleVariant="headlineLg" breadcrumbs? breadcrumbOptions? actions? />
```
- Title in `theme.palette.primary.main`, subtitle in `text.secondary`.
- Breadcrumbs: explicit `breadcrumbs` prop OR auto-generated from current pathname via `usePageBreadcrumbs(breadcrumbOptions)` (walks the sidebar nav config). Current crumb styled `primary.main`/700; link crumbs `text.secondary`.
- `actions` slot (right-aligned, wrapped).

Desktop pattern for a page: `<DesktopPageContainer><DesktopPageHeader …/>…<DesktopSectionPanel>…<DesktopAppDataGrid/></DesktopSectionPanel></DesktopPageContainer>`. Headers use `PageHeader` + `SectionPanel`, not ad-hoc flex. Actions use `DesktopPrimaryPageAction`/`FilterButton`/`ExportButton`. — `frontend/AGENTS.md:197-198`

## 7. Apollo Client

### Client setup — `frontend/common/providers/apollo/AppApolloProvider.tsx`
- A **single module-level `ApolloClient`** created at module scope (synchronous on first render, zero useEffect cycles):
  ```ts
  const apolloClient = new ApolloClient({
    link: ApolloLink.from([
      createErrorLinkHandler(…),      // error handling w/ connectivity awareness
      createConnectivityLink(…),      // network gating
      createAuthLink(() => apolloLinkState.authToken),  // injects bearer token
      new PersistedQueryLink({ sha256 }),               // APQ via sha256
      new HttpLink({ uri: "/api/graphql", credentials: "include" }),
    ]),
    cache: createApolloCache(),
    defaultOptions: {
      watchQuery: { errorPolicy: "none", notifyOnNetworkStatusChange: true },
      query: { errorPolicy: "none" }, mutate: { errorPolicy: "none" },
    },
  });
  ```
- Auth/connectivity state is kept in a **module-level mutable object `apolloLinkState`** (links read at request time, mutated in `useEffect` after render — satisfies React compiler "no ref access during render").
- `useAuthRecoveryRegistration(apolloClient, updateAuthToken)` handles silent token refresh.
- Blocks rendering with `<InitializingUI>` **only** when a real disconnection is confirmed (`initialCheckDone && !isConnected`); otherwise renders immediately.
- Wraps children in `<NetworkConnectivityContext.Provider>…<ApolloProvider client={apolloClient}>`.

### Cache — `frontend/common/providers/apollo/apolloCache.ts`
```ts
new InMemoryCache({ typePolicies: {
  AdminDashboardScheduleResult: { fields: { rows: { merge: false } } },  // replace, don't merge (filter/pagination)
} });
```
Comment: paginated/filtered list `.rows` must **replace** (not merge) because filter/pagination changes legitimately return different arrays. **Always include `id` fields** in selections for normalization. — `sharedDocuments/AGENTS.md:106`

### Providers wiring
- `AppClientProviders` (`frontend/common/providers/AppClientProviders.tsx`): `<AppApolloProvider><AuthProvider>…</AuthProvider></AppApolloProvider>`. Used by route groups needing client mutations/session refresh (kept out of root layout so server-only routes skip connectivity probes).
- `DashboardLayoutContainer` (server) wraps children in `<DashboardClientProviders>` (Apollo + Auth) → `<DashboardClientBridge>`.

### Hook usage rules (`sharedDocuments/AGENTS.md:108-111`, graphql AGENTS.md:26-29)
- Import from `"@apollo/client/react"`: `import { useQuery, useApolloClient } from "@apollo/client/react";`.
- **No `useLazyQuery`** — banned. Use stateful `useQuery` exclusively (tracks loading/error).
- Use generated `TypedDocumentNode<Operations.XQuery, Types.QueryXArgs>` documents.
- `useMutationWrapper` (`frontend/common/graphql/utils.ts`) wraps `useMutation` into a `(variables) => Promise<MutateResult>` callback.

## 8. GraphQL Documents (`frontend/common/graphql/sharedDocuments/`)

Organized **by domain** in subdirectories, each with an `index.ts` barrel; top-level `index.ts` re-exports all subdirectory barrels.

```
sharedDocuments/
├── auth/ billing/ classes/ complaints/ meeting/ notifications/ parents/
├── permissions/ profile/ reports/ resources/ scheduling/ shared/
├── students/ suggestions/ supervisor/ teachers/
└── index.ts   # re-exports sub barrels
```

### Naming convention (strict)
- File: `<domain>.documents.ts` (e.g., `student-directory.documents.ts`, `schedule.documents.ts`).
- Const: `<entityName>QueryDocument` / `<entityName>MutationDocument`.
- Type: `TypedDocumentNode<Operations.<EntityName>Query, Types.Query<EntityName>Args>`; no-arg queries omit the second type param.
- Imports: `import { gql, type TypedDocumentNode } from "@apollo/client";` (never `/core`); `import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";`; `import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";`.

### Example — `students/student-directory.documents.ts`
```ts
export const studentDirectoryRowFragment = gql`fragment StudentDirectoryRowFragment on StudentDirectoryRow { id name email avatarUrl status … createdAt updatedAt }`;

export const studentDirectoryQueryDocument: TypedDocumentNode<
  Operations.StudentDirectoryQuery, Types.QueryStudentDirectoryArgs
> = gql`
  ${studentDirectoryRowFragment}
  query studentDirectory($paginationArgs: PaginationArgs, $orderBy: [StudentsOrderByClause!], $filterArgs: StudentFilterArgs) {
    studentDirectory(paginationArgs: $paginationArgs, orderBy: $orderBy, filterArgs: $filterArgs) {
      id totalCount rows { ...StudentDirectoryRowFragment }
      pageInfo { count currentPage hasMorePages lastPage perPage total }
    }
  }
`;
```
Patterns:
- Define reusable GraphQL **fragments** (e.g., `StudentDirectoryRowFragment`) and spread them into queries (`${fragment}`).
- Every selection set includes `id` (cache normalization requirement).
- List queries return `{ id, totalCount, rows { ...frag }, pageInfo { count currentPage hasMorePages lastPage perPage total } }` — this is the canonical paginated list shape (mirrored by the VM: `totalCount` from `pageInfo.total`).
- Pagination variables: `PaginationArgs { first, page, skip, after, before, last, maxCount }` (relay-style); VM passes `first: pageSize, page: page+1`.

### Consumer import conventions
- **Preferred** (barrel): `import { fooQueryDocument } from "@/frontend/common/graphql/sharedDocuments";`
- **Deep import** (valid): `…from "@/frontend/common/graphql/sharedDocuments/<subdir>/foo.documents";`
- **Never** stale flat path.
- Adding a new doc: create `<domain>.documents.ts` in matching subdir, add to subdir `index.ts`, ensure top-level `index.ts` exports the subdir, run `bun run generate:gqlSchema && bun codegen`.

## 9. Zustand Stores (`frontend/common/stores/`)

~60 stores, one per page/domain/feature (e.g., `userStore.ts`, `studentDirectoryStore.ts`, `teacherDirectoryStore.ts`, `billingTabsStore.ts`, `dashboardStore.ts`, `layoutStore.ts`, `settingsStore.ts`). Rules — `frontend/common/stores/AGENTS.md`:

- **Strict typing** with GraphQL generated types (`graphql-types.ts` for entity types; `operations.ts` only for operation result/variable types). Avoid redefining types that exist in the schema.
- Import entity types from `graphql-types.ts`, NOT `operations.ts`:
  ```ts
  import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";   // ✅ entity types
  import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";  // ✅ op result/vars only
  ```
- **All mutable UI state** (filters, pagination, dialog open, form values) lives in Zustand so it survives viewport tier switching on resize.
- `useUserStore().hasPermission(AppPermission.X)` is the permission check used by ViewModels and `<RequirePermission>`.

### Example — `studentDirectoryStore.ts`
```ts
import { create } from "zustand";
import type { StudentFilterArgs } from "@/frontend/common/graphql/generated/gql/graphql-types";

const DEFAULT_PAGE_SIZE = 10;
interface StudentDirectoryState {
  readonly searchQuery: string; readonly page: number; readonly pageSize: number;
  readonly filterArgs: StudentFilterArgs | null; readonly filterPanelOpen: boolean;
  setSearchQuery: (q: string) => void; setPage: (p: number) => void;
  setFilterArgs: (a: StudentFilterArgs) => void; setFilterPanelOpen: (o: boolean) => void; clearFilters: () => void;
}
export const useStudentDirectoryStore = create<StudentDirectoryState>(set => ({
  searchQuery: "", page: 0, pageSize: DEFAULT_PAGE_SIZE, filterArgs: null, filterPanelOpen: false,
  setSearchQuery: query => set({ searchQuery: query, page: 0 }),   // resets page on filter change
  setPage: page => set({ page }),
  setFilterArgs: args => set({ filterArgs: args, page: 0 }),
  setFilterPanelOpen: open => set({ filterPanelOpen: open }),
  clearFilters: () => set({ filterArgs: null, page: 0, filterPanelOpen: false }),
}));
```
Patterns: state + setters in one `create<T>(set => ({…}))`; filter/search setters reset `page` to 0; immutable via `set`; readonly fields; no `persist` shown here (most directory stores are in-memory).

### Serialization rules (`AGENTS.md:22-31`)
- **Never** store non-serializable `File`/`Blob`/`FormData`/`Promise` in `persist`-enabled stores.
- Three mitigations: (1) non-persisted store, (2) `partialize` to exclude non-serializable fields, (3) keep `File` in a `useRef` in the ViewModel hook (recommended) — the hook lives above the tier-switch unmount boundary so the ref survives.
- `userAutocompleteStore` caches fetched autocomplete options (by audience+search+scope) in an in-memory LRU (no `persist`).

## 10. MUI v9 usage patterns (concrete)

- **Theme callback `sx`** everywhere instead of direct props or string palette access:
  ```tsx
  <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>…</Typography>
  <IconButton sx={theme => ({ backgroundColor: theme.palette.primaryContainer, color: theme.palette.onPrimaryContainer, "&:hover": { opacity: 0.8 } })}>…</IconButton>
  ```
- **Layout tokens from theme**: `gap: theme => theme.layout.sectionGap`, `zIndex: theme => theme.zIndex.appBar + 1`.
- **Responsive `sx` objects** for shared layout: `sx={{ mt: { xs: 2, md: 3 }, gap: { xs: 2, md: 3 } }}` (used in `BillingView`).
- Use Material 3 `on<Color>` siblings (`onPrimaryContainer`, `onErrorContainer`, `onPrimary`) rather than `contrastText`.
- Typography variants: `headlineLg` (page titles), `bodyLg` / `bodyMd` (cells), `labelMd` (breadcrumbs), `labelUppercase` — never hardcoded font `sx`.
- Spacing: `gap`, `mb`, `mt`, `p`, `px`, `py` all go in `sx` (not direct Box/Stack/Grid props).
- MUI X DatePicker slot props pattern: `slotProps={{ textField: { slotProps: { htmlInput: { autoComplete: "off" } } } }}`.
- React 19: use `React.SubmitEvent` / `React.SyntheticEvent<HTMLFormElement>`, NOT `FormEvent`; cast `FormData.get` results.

## 11. Routing & Navigation / Sidebar

- Next.js App Router with `app/(dashboard)/…` route group; locale-aware routing via `@/shared/i18n` (`Link`, `useRouter`, `redirect` from `@/shared/i18n/routing`); `getLocale`/`getTranslations` from `@/shared/locale`.
- **Dashboard layout chain** (server → client):
  `app/(dashboard)/layout.tsx` (Suspense) → `DashboardProfileShell` (server, loads user/profile, teacher completion guard) → `DashboardLayoutContainer` (wraps `<DashboardClientProviders>` = Apollo+Auth) → `DashboardClientBridge` (client island bridge wiring `userProfile`, `isSuperAdmin`, `initialSidebarOpen`, `enableUsersDirectory`, `hideSidebarNavigation`).
- **Sidebar/nav config**: `frontend/common/views/dashboard/config/navigationConfig.ts` (the authoritative nav tree) with `mockNavigationConfig.ts` for tests/stories. `navIconKeys.ts` + `navIconRegistry.tsx` map icon keys → MUI `*Outlined` icons.
- **Navbar** (`frontend/common/views/dashboard/components/navbar/`): `NavbarChrome`, `NavbarIcon`, `NavbarStaticShell`, `LanguageSwitcher`, `ThemeSwitcher`, `NotificationButton`, `UnpaidInvoicesSection`, `UserMenuButton`.
- **Breadcrumbs** auto-generated in `DesktopPageHeader` via `usePageBreadcrumbs({})` which walks the sidebar nav config against the current pathname (locale-stripped via `stripLocaleFromPath`); can be overridden via `breadcrumbs` / `breadcrumbOptions` props from the ViewModel.
- **Navigation from view code**: `useRouter` (from `@/shared/i18n/navigation`) lives in the **ViewModel**; tier views receive `onNavigateTo…` callbacks. Links in headers use `<Link href="/…">` from `@/shared/i18n`.
- **Feature flags** affect routing: `isUsersDirectoryEnabled()` redirects `/teachers` and `/students` to `/users?tab=…` for admin audience.

## 12. Workflow / Conventions for Adding a New Page

Reference: `frontend/NEW_PAGE_WORKFLOW.md`, `frontend/COMPONENT_PATTERNS.md`, `.github/CODE_REVIEW_CHECKLIST.md`.

1. **App Router page** (server component) in `app/(dashboard)/<route>/page.tsx`: metadata, auth (`getServerUserContext`), permission (`requirePermissionForPage`), audience resolution, render `<…Container>`.
2. **Container** in `frontend/common/views/dashboard/<domain>/XxContainer.tsx`: `createLazyView` (top-level), call `useXxViewModel`, wrap `<RequirePermission><ResponsiveViewSwitch …/></RequirePermission>`.
3. **ViewModel** `useXxViewModel.ts`: `useQuery` with `TypedDocumentNode`, Zustand store for state, `useRouter` for navigation, `hasPermission` for gates; return flat view model.
4. **Tier views** `frontend/{mobile,desktop}/views/dashboard/<domain>/xx.{mobile,desktop}.tsx`: pure presentation using `MobilePageContainer` / `DesktopPageContainer`, `*PageHeader`, `*SectionPanel`, `*AppDataGrid` / `MobileCardList`, `*MetricCardGrid`.
5. **GraphQL documents** in `frontend/common/graphql/sharedDocuments/<subdir>/<domain>.documents.ts` (fragments + query/mutation, include `id`, follow naming), register in barrels, run `bun run generate:gqlSchema && bun codegen`.
6. **Zustand store** in `frontend/common/stores/<domain>Store.ts` for mutable state (serialize-safe; `File` in `useRef`).
7. **Quality gate**: `bun quality-gate` (tsgo, biome, lint, CodeScene, Sonar). No nested ternaries; no `console` (use `logger` from `@/frontend/utils/logger`); `bun quality-gate:fresh` to reset state.

### Cert feature integration hooks
- New domain → `frontend/common/graphql/sharedDocuments/cert/` (e.g., `certificate.documents.ts`, `certificate-template.documents.ts`).
- Views → `frontend/common/views/dashboard/cert/` (Container + ViewModel + switcher) + `frontend/{mobile,desktop}/views/dashboard/cert/`.
- Store → `frontend/common/stores/certificatesStore.ts` (paginated list state, filter args, dialog open).
- Route → `app/(dashboard)/certificates/page.tsx` (+ `app/(dashboard)/certificates/[id]/page.tsx` for detail).
- Grid → `DesktopAppDataGrid<Row>` with `buildServerPaginationOptions` + `ListPaginationOptions` `{ mode: "server" }`; mobile → `MobileCardList` + `MobileCardListItem` with `paginationOptions: "server"`.
- Page shell: `<DesktopPageContainer><DesktopPageHeader …/><DesktopSectionPanel>…</DesktopSectionPanel></DesktopPageContainer>`.
