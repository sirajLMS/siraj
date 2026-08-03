# 08 — App Router, Navigation & Page Patterns

> Analysis of the Siraj project's Next.js App Router structure, navigation system,
> page patterns, API routes, and per-role rendering — for certificate feature integration.
> Generated 2026-08-01.

---

## 1. App Router Overview

**Source root:** `app/` (Next.js App Router, no `src/`).

```
app/
├── layout.tsx                     # Root layout (Server): fonts, theme, LocaleProvider, MuiProvider
├── page.tsx                       # Root "/" → redirects to /dashboard or /login
├── index.css                      # Global styles
├── manifest.ts                    # PWA manifest
├── icon.png / apple-icon.png / favicon.ico
├── logout/                         # route handler: clears session → /login
│   └── route.ts
├── (auth)/                        # Route group — unauthenticated/auth pages
│   ├── layout.tsx
│   └── login/page.tsx
├── (dashboard)/                   # Route group — authenticated dashboard
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── not-found.tsx
│   ├── [...slug]/page.tsx          # Catch-all → notFound() (renders not-found.tsx in layout)
│   ├── lib/                        # Page-local helpers (resolve-students-page-audience, profile-enum-bridge)
│   ├── dashboard/page.tsx
│   ├── students/  teachers/  parents/  staff/  users/
│   ├── billing/   payment-catalogs/  meeting-providers/  teacher-dues/
│   ├── classes/   recurring-schedules/  schedule/  search-schedule/
│   ├── subjects/  resources/
│   ├── reports/   monthly-reports/  lesson-reports/
│   ├── complaints/  feedback/  suggestions/
│   ├── permissions/  settings/  tools/  profile/
│   └── ... (see full route table below)
└── api/                            # Route handlers (REST-ish + GraphQL)
    ├── cron/class-reminders/route.ts
    ├── graphql/route.ts
    ├── fx/refresh/route.ts
    ├── invoices/[id]/download/route.ts
    ├── logs/route.ts
    ├── set-locale/route.ts
    ├── storage/{cleanup,files,upload,vercel-upload}/.../route.ts
```

**Route groups** `(auth)` and `(dashboard)` are path-orthogonal — `(name)` is not in the URL.
The dashboard root is at `/dashboard`, auth at `/login`.

**`app/AGENTS.md`** (`/app/AGENTS.md`) is the canonical rules doc for the app layer:
- All files under `app/` are **Server Components by default** (no `"use client"`).
- Server Components call **services** (`SessionService`, `PermissionsService`, …), never repositories or DB directly.
- Auth guard uses `getServerUserContext()` + `redirectToLogin()`.
- Page-level access control table (auth ≠ permission):

  | Concern | Helper | Redirect |
  |---|---|---|
  | Not logged in | Layout / `redirectToLogin` | Login |
  | Missing teacher/parent identity | `requireTeacherIdForPage` / `requireParentIdForPage` | `/dashboard` |
  | Missing `AppPermission`(s) | `requirePermissionForPage` | `/dashboard` |
  | Profile view/edit | `resolveProfilePageContext` | `/dashboard` or `/profile` |
  | Client defense-in-depth | `<RequirePermission>` in Containers | renders `fallback` (often `null`) |

- Cached request pattern via `React.cache()` wrappers (e.g. `getCurrentUser`) to share data between layout+page without duplicate fetches.
- Locale is from `getLocale()` (`@/shared/locale/server-cookies`) — **there is no `[locale]` URL segment** under `(dashboard)`.

---

## 2. Route Groups

### (auth) — `app/(auth)/`
**Layout** `app/(auth)/layout.tsx` (async Server Component):
- Calls `getServerUserContext()`.
- If `userId && context` (already authenticated) → bounce away to `getAuthenticatedAuthBounceHref()` (redirect). Prevents logged-in users from seeing `/login`.
- Otherwise wraps children in `AppClientProviders` (Apollo + client stores for the auth flow).

**Page** `app/(auth)/login/page.tsx`:
- Server Component. Reads `IS_DEMO` env (both client + server flags), fetches `DemoAuthService.getAvailableDemoGroups(locale)` when demo, passes `demoGroups` to `<LoginContainer>` (client).

### (dashboard) — `app/(dashboard)/`
**Layout** `app/(dashboard)/layout.tsx` (async Server Component): **Central auth gate.**
```tsx
export default async function DashboardLayout({ children }) {
  const { userId, context, isImpersonating, isSimulatingGroup } = await getServerUserContext();
  if (!userId || !context) {
    if (await isPrefetchRequest()) { forbidden(); return; }  // avoid prefetch redirect loop
    await redirectToLogin();
    return;
  }
  const initialSidebarOpen = getSidebarStateFromCookies((await cookies()).get(SIDEBAR_COOKIE_NAME)?.value);
  return (
    <Suspense fallback={<DashboardShellSkeleton />}>
      <DashboardProfileShell userId context initialSidebarOpen>
        {children}
      </DashboardProfileShell>
    </Suspense>
  );
}
```
Key details:
- **Prefetch-aware**: prefetch requests get `forbidden()` instead of a redirect to avoid the `/dashboard → /forbidden → /dashboard` infinite loop documented in `require-permission.ts`.
- Reads sidebar open/close state from a cookie (`SIDEBAR_COOKIE_NAME`) for SSR-correct initial render.
- Delegates to `DashboardProfileShell` (Server Component) which:
  - Fetches user profile via cached `getCurrentUser(userId, context)`.
  - Teacher with incomplete national ID → redirects to profile-completion flow (`handleTeacherProfileCompletionRedirect`) and passes `hideSidebarNavigation` to the shell.
  - Maps backend profile → GraphQL `User` type (incl. `mapBackendPermissionsToGraphql`), then renders `<DashboardLayoutContainer>`.

**`app/(dashboard)/[...slug]/page.tsx`** — required catch-all → `notFound()`. Uses required (not optional) catch-all so it doesn't clash with root `app/page.tsx` at `/`. Ensures 404s render inside the authenticated `not-found.tsx` instead of the bare root 404.

**`app/(dashboard)/lib/`** — page-local helpers (not a route):
- `resolve-students-page-audience.ts` — maps permission context to `"admin" | "teacher" | "parent"` for the students page.
- `profile-enum-bridge.ts` — maps backend ProfileMode/Scope/Audience enums to GraphQL enums.

---

## 3. Dashboard Layout / Shell Structure

The layout is a layered Server→Client bridge. **Layering (all in `frontend/common/views/dashboard/components/`):**

```
DashboardLayout (layout.tsx)
 └─ DashboardProfileShell        [Server] fetches user profile, teacher-completion redirect
    └─ DashboardLayoutContainer  [Server] locale, translations, feature flags (users-directory)
       └─ DashboardClientProviders  [Client] Apollo/stores providers for dashboard
          └─ DashboardClientBridge  [Client] live notificationCount (poll meQuery 60s),
                                      getDashboardLayoutData(permissions) → nav filtering
             ├─ UserStoreInitializer
             ├─ TeacherProfileCompletionRedirect (active when hideSidebarNavigation)
             ├─ DashboardLayout  ← ResponsiveViewSwitch (mobile/desktop)
             │    ├─ DashboardLayoutDesktop   (TopNavbarDesktop + SidebarDesktop)
             │    └─ DashboardLayoutMobile    (NavbarChrome + SidebarShell(Drawer) + BottomNavbarMobile)
             └─ NotificationDrawer
```

**`DashboardClientBridge`** (`DashboardClientBridge.tsx`) is where permission-based nav is computed **on the client**:
- Filters `userProfile.permissions` to valid `AppPermission` values.
- Calls `getDashboardLayoutData(permissions, { enableUsersDirectory })` → `{ sidebarGroups, sidebarItems, bottomNavItems }` (empty arrays when `hideSidebarNavigation` for teacher-completion flow).
- Passes filtered+translated nav to `<DashboardLayout>` (which switches mobile vs desktop).

**Desktop shell** (`dashboardLayout.desktop.tsx`): fixed `TopNavbarDesktop` + `DashboardLayoutIsland` (sidebar + content). Uses CSS `--layout.navbarHeight` padding.
**Mobile shell** (`dashboardLayout.mobile.tsx`): `NavbarChrome` (mobile menu button + theme/language/notification/user slots) + `SidebarShell` as a `<Drawer>` + `MobileMainScrollArea` + fixed `BottomNavbarMobile`.

> Note: the client `useViewport().isMobile` decides mobile vs desktop — see §10.

---

## 4. Navigation / Sidebar — Configuration & Permissions

### Nav config file
**`frontend/common/views/dashboard/config/navigationConfig.ts`** (~1000+ lines). This is the **central nav config**. Exports:

- **`SIDEBAR_NAV_GROUPS: readonly NavGroup[]`** — 7 groups (`grp_users`, `grp_schedule`, `grp_content`, `grp_finance`, `grp_reports`, `grp_feedback`, `grp_admin`). Each group has `id`, `labelKey`, `iconKey`, `section: "main"|"footer"`, `permission` (any-of array), optional `separator`.
- **`SIDEBAR_NAV_ITEMS: readonly NavItem[]`** — ~40 items. Each `NavItem` (`frontend/common/views/dashboard/types/dashboard.ts`):
  ```ts
  interface NavItem {
    key: string; labelKey: keyof DashboardNavigationLabels;
    iconKey: NavIconKey; href: string;
    section: "main" | "footer";
    permission?: AppPermission | readonly AppPermission[];  // any-of (OR)
    audience?: "teacher" | "parent" | "student" | "supervisor";
    groupId?: string;  // matches a NavGroup.id
  }
  ```
- **`BOTTOM_NAV_ITEMS: readonly NavItem[]`** — flattened mobile bottom-rail list (ignores `groupId`), specific entries per portal/role.
- **`SIDEBAR_END_NAV_ITEM_KEYS`** — items pinned above the account footer (e.g. `teacher-rules`, `parent-rules`).
- **`getNavItemsForPermissions(...)`** — the filtering engine (two overloads: one for items, one for groups). Returns the subset surviving the user's permission + audience gate + per-portal overrides.

### How permissions gate menu items
1. **Item-level `permission`** — OR-semantics: `hasItemPermission(item, permissions)` returns `true` if user has any listed permission (`navigationConfig.ts:738`).
2. **Audience gate** — items with `audience: "teacher"|"parent"|"student"|"supervisor"` are hidden unless the user matches that *portal user* detector:
   - `isTeacherPortalUser` = `TeacherViewDashboard && !DashboardViewMetrics`
   - `isParentPortalUser` = `ScheduleViewFamily && !DashboardViewMetrics`
   - `isStudentPortalUser` = `StudentViewOwnDashboard && !DashboardViewMetrics`
   - `isSupervisorPortalUser` = `SupervisorViewDashboard && !DashboardViewMetrics`
   - i.e. "portal users" = non-admin roles lacking `DashboardViewMetrics`. SUPER_ADMIN (has `DashboardViewMetrics`) is treated as admin, not a portal user.
3. **SUPERADMIN inherits supervisor-only items** (`pending-reviews`, `teacher-dues`, `monthly-reports`) **except** `supervisor-home` (admin `home` already serves `/dashboard`). Gate: `isSuperAdminNavUser` = has `PermissionGroupsManage`.
4. **Per-portal override filters** (applied in order): `applyUsersDirectoryNavOverrides` → `applyTeacherNavOverrides` → `applyParentNavOverrides` → `applyStudentNavOverrides` → `applySupervisorNavOverrides` → `applyProfileNavOverrides`. Each drops a hardcoded `hiddenKeys` set specific to that portal.
5. **Group-level** (`getNavItemsForPermissions(groups, items, …)` overload): a group survives only if (a) it passes its own audience+permission gate AND (b) it has ≥1 surviving child item. **Empty groups never surface** — portals don't see empty headers in the sidebar.
6. **Profile route** is filtered out of the sidebar everywhere — it's only reachable via the `SidebarAccountFooter`.

### Page → nav-object permissions mapping
**`frontend/common/types/page-permissions.types.ts`** — `PAGE_PERMISSIONS` object maps each page/route to its required `AppPermission[]` (OR-semantics). Each nav item's `permission` references a `PAGE_PERMISSIONS.<key>` entry (e.g. `teachers → PAGE_PERMISSIONS.teachers = [StaffViewDirectory]`, `settings → PAGE_PERMISSIONS.settings` = 7 settings-or-view perms). This same object is reused by:
- Sidebar item `permission` field (drives client nav visibility).
- `requirePermissionForPage(...)` server guard in `page.tsx` (drives page access).
- Client `<RequirePermission>` defense-in-depth in Containers.

### Feature flags
`NavFeatureFlags { enableUsersDirectory: boolean }` — when the unified "users directory" is enabled (detect via `isUsersDirectoryEnabled()`), the separate `teachers/parents/students/staff` items collapse into a single `users-directory` item.

### Icon registry
**`frontend/common/views/dashboard/config/navIconKeys.ts`** — union `NavIconKey` of ~35 keys (e.g. `dashboard`, `accountBalanceWallet`, `security`, `receiptLong`, `payments`).
**`frontend/common/views/dashboard/config/navIconRegistry.tsx`** (`"use client"`) — `NavIcon` component lazy-loads each MUI icon (`import("@mui/icons-material/XxxOutlined")`) with `<Suspense>`. Icons are code-split per-key.

### Active-item matching
**`frontend/common/views/dashboard/lib/getDashboardLayoutData.ts`**:
- `getActiveNavKey(pathname, sidebarItems)` — longest-prefix match (`stripped.startsWith(item.href)`, sorted by href length desc). Returns `null` when no match (orphan page → no highlight, *not* the old buggy fallback to "home").
- `PROFILE_NAV_KEY = "own-profile"` special-cased for `/profile*`.
- `getDashboardLayoutData(permissions, featureFlags)` = the single entry point called by `DashboardClientBridge`; returns `{ sidebarGroups, sidebarItems, bottomNavItems }` already filtered + grouped.

### Roles & audiences (summary)
Roles: **SUPER_ADMIN, ACADEMY_ADMIN, TEACHER, PARENT, STUDENT, SUPERVISOR, STAFF.** The nav config doesn't branch on `UserRole` directly — it branches on the **permission set** (`AppPermission[]`). Roles map to permission groups via `PermissionGroupSimulationService` / seeded permission groups. The audience discriminators above (`DashboardViewMetrics` presence) are the practical role-ish gates.

---

## 5. Page Patterns (4 detailed examples)

**The canonical pattern** for dashboard pages is:

> **Server Component `page.tsx`** (auth guard + permission guard + `generateMetadata`) → renders a **Client `Container`** (`"use client"`) which builds a view-model (`useXxxViewModel` — usually Apollo `useQuery`), then renders `<ResponsiveViewSwitch>` with mobile/desktop `*View` components. Client defense-in-depth via `<RequirePermission permissions={PAGE_PERMISSIONS.xxx} fallback={null}>`.

### 5a. Students list — `app/(dashboard)/students/page.tsx`
**Multi-audience list page** (admin / teacher / parent can all hit `/students`).
```tsx
export default async function StudentsPage() {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) { await redirectToLogin(); return; }
  await requirePermissionForPage(userId, getStudentsPagePermissions(), locale, context);
  const audience = resolveStudentsPageAudience(context);                 // "admin"|"teacher"|"parent"|null
  if ((await isUsersDirectoryEnabled()) && audience === "admin") redirect("/users?tab=students");
  if (audience === "teacher") return <TeacherStudentsContainer />;
  if (audience === "parent")  return <ParentStudentsContainer />;
  return <StudentsContainer />;
}
```
`resolveStudentsPageAudience` (`app/(dashboard)/lib/resolve-students-page-audience.ts`): `isSuperAdmin || StudentsList → "admin"`; else `TeacherViewStudents → "teacher"`; else `ParentViewStudents → "parent"`. So **page-level role routing is by permission, not URL**.

**`StudentsContainer`** (`frontend/common/views/dashboard/admin/parents/students/StudentsContainer.tsx`, `"use client"`):
```tsx
const viewModel = useStudentsViewModel();   // Apollo useQuery(studentDirectoryQueryDocument, ...)
return (
  <RequirePermission permissions={[AppPermission.StudentsList]} fallback={null}>
    <ResponsiveViewSwitch
      mobile={lazyViews.mobile}    // StudentsMobileView  (frontend/mobile/...)
      desktop={lazyViews.desktop}  // StudentsDesktopView (frontend/desktop/...)
      props={viewModel}
    />
  </RequirePermission>
);
```
- `useStudentsViewModel` uses Apollo `useQuery` (client-side data fetch). The server page only fetches **auth context**, not list data.

### 5b. Billing invoices — `app/(dashboard)/billing/invoices/page.tsx`
**A redirect stub.** The parent landing `/billing/invoices` redirects to the tabbed admin/parent billing page:
```tsx
export default async function InvoicesRedirectPage() {
  redirect("/billing?tab=invoices");
}
```
The real billing page is **`app/(dashboard)/billing/page.tsx`** (tabbed, `?tab=invoices|exchange-rates|currencies|...`):
```tsx
export default async function BillingPage() {
  const { userId, context } = await getServerUserContext();
  if (!userId) { await redirectToLogin(); return; }
  await requirePermissionForPage(userId, [
    AppPermission.BILLING_VIEW_HISTORY, AppPermission.BILLING_VIEW_EXCHANGE_RATES,
    AppPermission.BILLING_MANAGE_CURRENCY_HEDGES, AppPermission.BILLING_CREATE_INVOICE,
  ], locale, context);
  return <BillingPageContainer />;
}
```
Same Server-page / Client-container pattern. Permissions inline (not via `PAGE_PERMISSIONS.billingAdmin`) — both styles seen in the codebase.

### 5c. Teacher detail — `app/(dashboard)/teachers/[id]/`
Teachers directory detail uses **param-based nested routes** with a redirect-by-default at the root.

`app/(dashboard)/teachers/[id]/profile/page.tsx` — **server-side resolve redirect** (no UI):
```tsx
export default async function TeacherProfileRedirectPage({ params }) {
  const { id } = await params;           // params is a Promise in Next 15+
  const { userId } = await getServerUserContext();
  if (!userId) { await redirectToLogin(); return; }
  const targetUserId = await ProfileService.resolveUserIdForTeacherId(id);  // service call
  if (!targetUserId) { redirect({ href: "/dashboard" }); return; }
  redirect({ href: `/users/${targetUserId}/profile` });    // → unified users-directory profile
}
```
**`app/(dashboard)/teachers/[id]/schedule/weekly/page.tsx`** — a real detail page using `params.id`:
```tsx
export async function generateMetadata({ params }) {
  const { id } = await params; const teacherName = await getTeacherPageTitle(id);  // cached
  return { title: t.pageTitle(teacherName) };
}
export default async function TeacherWeeklySchedulePage({ params }) {
  const { id } = await params;
  const { userId, context } = await getServerUserContext();
  if (!userId) { await redirectToLogin(); return; }
  await requirePermissionForPage(userId, [AppPermission.SCHEDULE_VIEW_WEEKLY], locale, context);
  return <TeacherWeeklyScheduleContainer teacherId={id} />;   // pass param as prop
}
```
Pattern: **Server resolves metadata (cached service helper `getTeacherPageTitle`), guards permissions, passes `id` as a prop** into the Client Container. The nested folder structure (`teachers/[id]/{profile,schedule/{weekly,future},availability,reassignment}`) is the standard for entity detail pages.

### 5d. Settings — `app/(dashboard)/settings/page.tsx`
```tsx
export default async function SettingsPage() {
  const { userId, context } = await getServerUserContext();
  if (!userId) { await redirectToLogin(); return; }
  await requirePermissionForPage(userId, [/* 7 settings perms OR */], locale, context);
  return <SettingsPageContainer />;
}
```
**`SettingsPageContainer`** (`frontend/common/views/dashboard/settings/SettingsPageContainer.tsx`, `"use client"`):
```tsx
const viewModel = useSettingsViewModel();
return (
  <RequirePermission permissions={PAGE_PERMISSIONS.settings} fallback={null}>
    <SettingsView {...viewModel} />
  </RequirePermission>
);
```
Note **double-permission-gate**: server `requirePermissionForPage` (redirect) **+** client `<RequirePermission>` (defense-in-depth, `fallback={null}`). This is the recommended pattern per `app/AGENTS.md`.

### 5e. Dashboard landing — `app/(dashboard)/dashboard/page.tsx`
```tsx
export default function DashboardPage() {
  return (
    <Suspense fallback={<CircularProgress/>}>
      <DashboardContainer />   {/* Client: useDashboardContainerViewModel → Apollo */}
    </Suspense>
  );
}
```
**Not permission-gated** at the page level per AGENTS.md ("Do not gate `/dashboard` itself — it is the redirect landing page"). Role-specific rendering happens **inside** `DashboardContainer`/its view model (different home view per permission/role).

### Data-fetching summary
| Where | Mechanism |
|---|---|
| Server `layout.tsx` / `page.tsx` | `getServerUserContext()`, **service-layer calls** (`SessionService`, `PermissionsService`, `ProfileService`, cached helpers like `getCurrentUser`, `getTeacherPageTitle`). Never repositories/DB directly. |
| Client `*Container` / `useXxxViewModel` | **Apollo `useQuery` / `useMutation`** against `/api/graphql`. View-Model hook owns loading/error/data + Zustand stores. |
| Cross-request dedup | `React.cache()` wrappers (`getCurrentUser` etc.) so layout+page don't double-fetch. |

---

## 6. API Routes — `app/api/`

All are App Router **route handlers** (`route.ts` exporting `GET`/`POST`). 10 route files total:

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `api/graphql/route.ts` | POST | session cookie + Apollo context | **Main GraphQL endpoint**. Apollo Server (`graphQLSchema` Pothos), `createGraphQLContext`, depth-limit 7, constraint plugin, persisted queries, rate-limit, idempotency. Landing page disabled in prod. HMR-aware schema swap in dev. |
| `api/set-locale/route.ts` | GET, POST | public (locale is non-sensitive) | Sets `NEXT_LOCALE` cookie, then GET redirects or POST returns JSON. Origin-checked (POST), redirect-path sanitized (no open redirect). |
| `api/logout/route.ts` | GET, POST | session cookie | `SessionService.logoutUser` (clears access_token + session), clears auth cookies, redirects to `/login`. |
| `api/fx/refresh/route.ts` | GET | (cron secret) | Vercel Cron `0 6 * * *` — currency exchange-rate refresh. |
| `api/cron/class-reminders/route.ts` | GET | `CRON_SECRET` (`verifyCronSecretAuth`) | Vercel Cron `0 6 * * *` — `ClassReminderService.dispatchDailyReminders`. |
| `api/invoices/[id]/download/route.ts` | GET | session | Streams an invoice PDF (param `id`). |
| `api/logs/route.ts` | POST | — | Client-side log collector. Sanitizes `sessionId` (regex) against path traversal; batched, sequenced writes to `logs/`. |
| `api/storage/upload/[id]/route.ts` | PUT | signed-url | Validates Content-Type/Length/MD5 against signed-url data, streams to local storage. |
| `api/storage/files/[[...slug]]/route.ts` | GET | — | Optional catch-all — serves stored files by path. |
| `api/storage/cleanup/route.ts` | * | (admin) | Storage cleanup. |
| `api/storage/vercel-upload/route.ts` | * | (admin) | Vercel Blob upload helper. |

**Vercel Cron** (`vercel.json`):
```json
"crons": [
  { "path": "/api/fx/refresh",  "schedule": "0 6 * * *" },
  { "path": "/api/cron/class-reminders", "schedule": "0 6 * * *" }
]
```
Cron handlers use `verifyCronSecretAuth` (GET-only, `CRON_SECRET`).

> **No data-fetch in `page.tsx` beyond auth/profile-resolution** — list/aggregation data goes through Apollo → `api/graphql`. REST-ish handlers are only for cron, file streaming, locale, logout, logs.

---

## 7. Middleware

**There is NO `middleware.ts`** anywhere in the repo (verified: `find . -name middleware.ts` → none; `src/middleware.ts` → none). 

- **Auth** is enforced in the **layout RSC chain** (`getServerUserContext()` in `(dashboard)/layout.tsx` → `redirectToLogin`) instead of middleware.
- **Locale/routing** is handled by `localePrefix: "never"` (see §9), the `/api/set-locale` route, and `proxy.ts` (a custom request proxy at repo root) — not Next middleware.
- The dashboard layout special-cases prefetch requests (`isPrefetchRequest()`) returning `forbidden()` to break the prefetch redirect loop — a concern normally handled by middleware, here done in the layout.

---

## 8. Per-Role / Per-Permission Rendering

Siraj uses a **two-layer, permission-based** model (not role-string-based). Roles `SUPER_ADMIN | ACADEMY_ADMIN | TEACHER | PARENT | STUDENT | SUPERVISOR | STAFF` map to permission groups; the rendering code keys off the **`AppPermission[]`** set.

### Layer 1 — Server page guard (`page.tsx`)
```tsx
await requirePermissionForPage(userId, permissions, locale, context);
// → context.isSuperAdmin || permissions.some(p => context.permissions.includes(p))
// else: forbidden() on prefetch, else redirect("/dashboard")
```
Some pages also **switch containers by audience** before rendering (server-side role routing):
- `/students` → `TeacherStudentsContainer` / `ParentStudentsContainer` / `StudentsContainer` based on `resolveStudentsPageAudience`.
- `/dashboard` → single `DashboardContainer`, but its `useDashboardContainerViewModel` renders role-specific metrics/view (admin vs teacher vs supervisor vs parent vs student home).
- `/profile` → `resolveProfilePageContext` returns `{scope, mode, audience, targetUserId}` or a `redirect`, then `<ProfilePageClient>` adapts by scope/audience.

### Layer 2 — Client defense-in-depth
```tsx
// Container
<RequirePermission permissions={PAGE_PERMISSIONS.xxx} fallback={null}>
  <XxxView {...viewModel} />
</RequirePermission>
```
`RequirePermission` (`frontend/common/components/auth/RequirePermission.tsx`) reads `useUserStore().hasPermission` (Zustand, initialized from SSR `userProfile.permissions` via `UserStoreInitializer`). OR-semantics for arrays.

### Nav (sidebar/bottom-nav) per-role
As in §4: `getNavItemsForPermissions` filters groups+items by (a) item permission (any-of), (b) `audience` portal gate, (c) SUPERADMIN supervisor-inheritance, (d) per-portal `hiddenKeys` override lists. So:
- **ACADEMY_ADMIN / SUPER_ADMIN** → full sidebar with groups (Users, Schedule, Content, Finance, Reports, Feedback, Admin); SUPER_ADMIN additionally sees `pending-reviews`, `teacher-dues`, `monthly-reports` (supervisor items) but not `supervisor-home`.
- **TEACHER** portal → flat list (no groups): today-classes, regular-schedule, your-students, teacher-class-details, teacher-rules; admin `home` + `books-and-bags` + admin `classes` hidden.
- **PARENT** portal → today-classes, your-students, billing-parent (invoices), parent-suggest, parent-rules, parent-social (footer); admin chrome hidden.
- **STUDENT** portal → student-today-classes, student-schedule, student-sessions, student-credits; admin + search-schedule + own-profile hidden.
- **SUPERVISOR** portal → supervisor-home, pending-reviews, teacher-dues, monthly-reports; almost everything else hidden via a large `hiddenKeys` set.
- **STAFF** → shares `StaffViewDirectory`-gated items rendered as admin-lite (no separate audience flag; gated purely by `permission` arrays).

Conditional rendering inside views (per-role UI) is also common via `<RequirePermission>` around sub-sections and `useUserStore().hasPermission(...)` checks in view-models.

---

## 9. Locale Routing

**No `[locale]` URL segment.** Configuration (`shared/i18n/routing.ts`):
```ts
export const routing: RoutingConfig = {
  locales,         // ["ar", "en"] (shared/locale/AppLocale.ts)
  defaultLocale,   // "ar"
  localePrefix: "never",   // ← locale never appears in the path
};
```
- Locale is stored in the **`NEXT_LOCALE` cookie** (non-httpOnly, 1yr, set by `proxy.ts` on first visit and by `/api/set-locale`).
- Server reads it via `getLocale()` (`@/shared/locale/server-cookies`).
- `app/layout.tsx` sets `<html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>`.
- Translations: `getTranslations(locale)` (sync, returns namespace chain) in Server Components; `useAppTranslation(Translation.X)` / `Translation` in Client Components. The sidebar/bottom-nav use `useNavLabels()` (`Translation.Dashboard.CoreNav`).
- `redirect(...)` (`shared/i18n/routing.ts`) wraps `next/navigation#redirect`; accepts either a string href or `{ href, locale }` — **but locale is unused because `localePrefix:"never"`** (href stays locale-less).

> Implication for certificate feature: routes live directly at `/certificates`, `/certificates/[id]`, etc. — no `[locale]` wrapper. Read locale from cookie for any localized labels.

---

## 10. Mobile vs Desktop Layouts

**Responsive design via runtime viewport detection, not separate route trees.** The pattern is consistent across the dashboard:

### Shell
`DashboardLayout` (`frontend/common/views/dashboard/components/DashboardLayout.tsx`, `"use client"`) is itself a thin wrapper:
```tsx
const lazyViews = createLazyView<DashboardLayoutProps>(
  () => import("@/frontend/mobile/.../dashboardLayout.mobile").then(m => ({ default: m.DashboardLayoutMobile })),
  () => import("@/frontend/desktop/.../dashboardLayout.desktop").then(m => ({ default: m.DashboardLayoutDesktop })),
  { loading: () => <DashboardLayoutLoading /> }
);
return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
```
`ResponsiveViewSwitch` (`frontend/common/components/ui/container/ResponsiveViewSwitch.tsx`):
- Uses `useViewport().isMobile` → picks `<MobileComponent>` or `<DesktopComponent>`.
- Lite components are `React.lazy`-imported (code-split per platform).
- Wrapped in `Suspense` + `ViewSwitchErrorBoundary` (retry button on load failure).

### `*Container` page pattern
Every page Container follows this. Example (`StudentsContainer`):
```tsx
const lazyViews = createLazyView<StudentsViewModel>(
  () => import("@/frontend/mobile/.../students.mobile").then(m => ({ default: m.StudentsMobileView })),
  () => import("@/frontend/desktop/.../students.desktop").then(m => ({ default: m.StudentsDesktopView }))
);
return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
```

### Directory split
- **Common** (`frontend/common/views/...`): Server layout chain, `*Container` ("use client" view-model + View-Switch wrapper), `SidebarShell`, nav config, `RequirePermission`, stores.
- **Desktop** (`frontend/desktop/views/...`): `dashboardLayout.desktop`, `sidebar.desktop`, `topNavbar.desktop`, `dashboardLayoutIsland.desktop`, `genericTabNav.desktop`, `*.desktop.tsx` view variants.
- **Mobile** (`frontend/mobile/views/...`): `dashboardLayout.mobile`, `bottomNavbar.mobile`, `mobileMenuButton.mobile`, `bottomNavItemView.mobile`, `genericTabNav.mobile`, `*.mobile.tsx` view variants.

### Layout differences
| | Desktop | Mobile |
|---|---|---|
| Sidebar | Permanent left `SidebarDesktop` (collapsible 260px ↔ ~80px icon-rail, grouped `<List>` with `<Collapse>`, account footer) | `SidebarShell` inside a `<Drawer>` opened by `MobileMenuButton` |
| Top bar | Fixed `TopNavbarDesktop` (search, theme, language, notifications, user menu) | `NavbarChrome` (menu button + theme/language/notification/user slots) |
| Bottom nav | none | Fixed `BottomNavbarMobile` — flat horizontal rail (scrollable when > threshold), ignores `groupId` |
| Content | `<main>` in `DashboardLayoutIsland` next to sidebar | `MobileMainScrollArea` (scroll resets to top on mount, safe-area-inset bottom padding, `FxStaleBanner`) |

The theme token `theme.layout.navbarHeight` / `theme.layout.bottomNavHeight` standardizes chrome heights across both.

---

## 11. Add-a-Certificate-Feature — Integration Checklist

Based on the patterns above, a new `/certificates[/:id]` feature should:

1. **Routes** under `app/(dashboard)/certificates/`:
   - `page.tsx` (list), `[id]/page.tsx` (detail), optional `new/page.tsx`, `loading.tsx`.
   - Use **required `[...slug]` catch-all** pattern only if needed; rely on existing `app/(dashboard)/[...slug]` for 404s.
2. **Server page**: `getLocale()` → `getServerUserContext()` → `if(!userId) redirectToLogin()` → `requirePermissionForPage(userId, [new AppPermission(s)], locale, context)` → render `<CertificatesContainer>`. Add `generateMetadata` (cached title helper for detail).
3. **Permissions**: add `AppPermission.CERTIFICATES_*` to backend enum + GraphQL generated types; add `PAGE_PERMISSIONS.certificates` entry; gate both the page (`requirePermissionForPage`) and the Container (`<RequirePermission fallback={null}>`).
4. **Container** (`frontend/common/views/dashboard/certificates/CertificatesContainer.tsx`, `"use client"`): `useCertificatesViewModel()` (Apollo `useQuery`), `createLazyView` for mobile/desktop views, wrap in `<ResponsiveViewSwitch>`.
5. **Views**: `CertificMobileView` under `frontend/mobile/views/dashboard/certificates/` and `CertificatesDesktopView` under `frontend/desktop/views/dashboard/certificates/certificates.{mobile,desktop}.tsx`.
6. **Nav**: add a `NavItem` to `SIDEBAR_NAV_ITEMS` (and `BOTTOM_NAV_ITEMS`) in `navigationConfig.ts` with `permission: PAGE_PERMISSIONS.certificates`, pick a `NavIconKey` (add to `navIconKeys.ts` + registry if new), optionally assign a `groupId` (e.g. `"grp_reports"` or a new `"grp_certificates"` in `SIDEBAR_NAV_GROUPS`). Add label keys to `shared/locale/{en,ar}/dashboard/core/nav.ts`.
7. **Audience**: if certificates are admin-only, leave `audience` unset (gated purely by `permission`); if teachers/parents can see their own, set `audience: "teacher"|"parent"` and add overrides in the portal `applyXxxNavOverrides` lists as needed.
8. **No locale segment, no middleware** — read locale via `getLocale()`; redirects via `redirect({ href, locale })` from `@/shared/i18n/routing`.
9. **Data**: list/detail via Apollo documents against `/api/graphql` (add Pothos resolvers + operations in `frontend/common/graphql/sharedDocuments/`). Avoid direct DB/repo access from the page; go through services for any SSR needs.
10. **Metadata**: `generateMetadata` Server-side via `getTranslations(locale)`; for per-entity titles use a cached helper like `getTeacherPageTitle`.

---

## Appendix A — Full Dashboard Route Inventory (`app/(dashboard)/`)

| Path | Notes |
|---|---|
| `/dashboard` | Role-aware home (not permission-gated; Suspense + CircularProgress) |
| `/students` | Multi-audience (admin/teacher/parent) → redirect to `/users?tab=students` if users-directory feature on |
| `/students/{new,onboarding,me,history,sessions,credits,[id]}` | nested |
| `/teachers` | list |
| `/teachers/{[id]/{profile,schedule/{weekly,future},availability,reassignment}, dashboard, me, onboarding, rules}` | profile is a server-side redirect to `/users/[userId]/profile` |
| `/parents` | list + `/parents/{rules,social,onboarding}` |
| `/staff` | list |
| `/users` (+ `/users/[id]/profile`) | unified users-directory (feature-flagged) |
| `/billing` | tabbed admin (invoices / exchange-rates / currencies / currency-hedges / manual) |
| `/billing/invoices` | redirect → `/billing?tab=invoices` |
| `/payment-catalogs`, `/meeting-providers` | admin catalogs |
| `/teacher-dues` | supervisor billing |
| `/classes`, `/recurring-schedules` | class mgmt (`ScheduleManageRecurring`) |
| `/schedule/{tracking, weekly}`, `/search-schedule` | schedule |
| `/subjects`, `/resources` (+ `/resources/books-and-bags`) | content |
| `/reports`, `/monthly-reports`, `/lesson-reports` | reporting |
| `/complaints`, `/feedback/manage`, `/suggestions` | feedback/complaints |
| `/permissions`, `/settings`, `/tools/dst-migration` | admin admin |
| `/profile` (+ `/profile/edit`) | self-profile — `resolveProfilePageContext` decides scope/audience |
| `/[...slug]` | catch-all → notFound() |

## Appendix B — Key File Paths

| Area | File |
|---|---|
| App-layer rules | `/app/AGENTS.md` |
| Root layout | `/app/layout.tsx` |
| Root page (redirect hub) | `/app/page.tsx` |
| Auth layout | `/app/(auth)/layout.tsx` |
| Login page | `/app/(auth)/login/page.tsx` |
| Dashboard layout | `/app/(dashboard)/layout.tsx` |
| Dashboard catch-all | `/app/(dashboard)/[...slug]/page.tsx` |
| Profile shell (server) | `frontend/common/views/dashboard/components/DashboardProfileShell.tsx` |
| Layout container (server) | `frontend/common/views/dashboard/components/DashboardLayoutContainer.tsx` |
| Client bridge | `frontend/common/views/dashboard/components/DashboardClientBridge.tsx` |
| Responsive shell | `frontend/common/views/dashboard/components/DashboardLayout.tsx` |
| Desktop shell | `frontend/desktop/views/dashboard/components/dashboardLayout.desktop.tsx` |
| Mobile shell | `frontend/mobile/views/dashboard/components/dashboardLayout.mobile.tsx` |
| Sidebar (desktop) | `frontend/desktop/views/dashboard/components/sidebar.desktop.tsx` |
| Sidebar (mobile Drawer) | `frontend/mobile/views/dashboard/components/bottomNavbar.mobile.tsx` + `SidebarShell` |
| Sidebar render | `frontend/common/views/dashboard/components/client/SidebarShell.tsx` |
| **Nav config** | `frontend/common/views/dashboard/config/navigationConfig.ts` |
| Nav icon registry | `frontend/common/views/dashboard/config/navIconRegistry.tsx` |
| Nav icon keys | `frontend/common/views/dashboard/config/navIconKeys.ts` |
| Nav filter entry | `frontend/common/views/dashboard/lib/getDashboardLayoutData.ts` |
| **Page permissions** | `frontend/common/types/page-permissions.types.ts` |
| Nav types | `frontend/common/views/dashboard/types/dashboard.ts` |
| Server auth context | `backend/lib/auth/server-auth.ts` |
| Server page permission guard | `backend/lib/auth/require-permission.ts` |
| Client permission guard | `frontend/common/components/auth/RequirePermission.tsx` |
| Profile page guard | `backend/lib/auth/cached-profile.ts` (`resolveProfilePageContext`) |
| Locale routing config | `shared/i18n/routing.ts` |
| Locale enum | `shared/locale/AppLocale.ts` |
| Responsive switch | `frontend/common/components/ui/container/ResponsiveViewSwitch.tsx` |
| `createLazyView` | `frontend/common/components/ui/container/createLazyView.ts` |
| i18n navigation hooks | `shared/i18n/navigation.ts` |
| Logout handler | `app/logout/route.ts` |
| Set-locale handler | `app/api/set-locale/route.ts` |
| GraphQL handler | `app/api/graphql/route.ts` |
