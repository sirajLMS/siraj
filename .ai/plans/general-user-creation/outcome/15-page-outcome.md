# Task 15: App Router Page — Outcome

## Date: 2026-08-14

## Summary

Created the Next.js App Router page for the general user creation feature at `app/(dashboard)/users/create/page.tsx`. The page is a server component wrapped with `withPageAuth` for permission gating (`AppPermission.STAFF_CREATE`) and includes a `generateMetadata` function for the page title using the project's compile-time i18n system.

The page follows the exact pattern established by comparable pages (`parents/onboarding`, `teachers/onboarding`, `staff/create`) — all of which use `withPageAuth` with `async ()` (no locale destructure) and `generateMetadata` with `getLocale()` + `getTranslations(locale)`.

## File Created

| File | Purpose |
|------|---------|
| `app/(dashboard)/users/create/page.tsx` | Next.js App Router server component page for general user creation |

## Exact File Path

```
app/(dashboard)/users/create/page.tsx
```

## Full File Content

```tsx
import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { GeneralUserCreateContainer } from "@/frontend/common/views/dashboard/users/createUser/GeneralUserCreateContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.usersCreateUser;
  return { title: t.pageTitle };
}

export default withPageAuth([AppPermission.STAFF_CREATE], async () => {
  return <GeneralUserCreateContainer />;
});
```

## `withPageAuth` Signature Used

```typescript
withPageAuth([AppPermission.STAFF_CREATE], async () => {
  return <GeneralUserCreateContainer />;
});
```

**Confirmed: No `locale` destructure.** The `withPageAuth` higher-order function accepts `(permissions, handler)` where `handler` receives `(auth: PageAuthContext, props: T)`. Since this page has no `params` or `searchParams`, the handler is simply `async () => { ... }` with no parameters.

This matches the exact pattern in existing comparable pages:
- `app/(dashboard)/parents/onboarding/page.tsx` — `withPageAuth([AppPermission.PARENTS_CREATE], async () => { ... })`
- `app/(dashboard)/teachers/onboarding/page.tsx` — `withPageAuth([AppPermission.TEACHERS_CREATE], async () => { ... })`
- `app/(dashboard)/staff/create/page.tsx` — `withPageAuth([AppPermission.STAFF_CREATE], async () => { ... })`

## How `generateMetadata` Is Implemented

```typescript
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.usersCreateUser;
  return { title: t.pageTitle };
}
```

### Pattern Details

1. **`getLocale()`** — imported from `@/shared/locale/server-cookies`; reads the locale from the server-side cookie (no params needed since this page has no locale segment in the URL — the `(dashboard)` route group uses locale cookies)
2. **`getTranslations(locale)`** — imported from `@/shared/locale` (the main barrel); returns the full `Translations` object for the locale
3. **`dashboardTranslations.usersCreateUser`** — accesses the `CreateUserLabels` namespace registered in Task 6; `t.pageTitle` provides the localized page title
4. Returns `Metadata` with `title` only (matching the pattern from all comparable pages — none of them set `description`)

### i18n Namespace Access Path

```
getTranslations(locale).dashboardTranslations.usersCreateUser.pageTitle
```

This corresponds to the i18n namespace `"dashboard.users.createUser"` registered in Task 6 (outcome 6) and the type key `usersCreateUser: CreateUserLabels` added to `DashboardTranslations` in `shared/locale/types/message.ts`.

## Import Patterns

| Import | Path | Type |
|--------|------|------|
| `Metadata` | `next` | `import type` |
| `AppPermission` | `@/backend/enum` | value (used in runtime array `[AppPermission.STAFF_CREATE]`) |
| `withPageAuth` | `@/backend/lib/auth/withPageAuth` | value |
| `GeneralUserCreateContainer` | `@/frontend/common/views/dashboard/users/createUser/GeneralUserCreateContainer` | value (from Task 14 outcome) |
| `getTranslations` | `@/shared/locale` | value |
| `getLocale` | `@/shared/locale/server-cookies` | value |

All imports use `@/` path aliases (no relative imports).

## Directory Structure

The `create` directory was created under the existing `users` directory in the `(dashboard)` route group:

```
app/
  (dashboard)/
    users/
      create/
        page.tsx   ← new file (this task)
      [id]/
        billing-profile/page.tsx
        profile/page.tsx
        profile/edit/page.tsx
      page.tsx    ← existing users directory page
```

## Carry-Forward Knowledge

### The Page Is the Entry Point

The page at `app/(dashboard)/users/create/page.tsx` is the server-side entry point for the general user creation feature. The route is `/users/create` (the `(dashboard)` route group is a pathless group). The page:

1. **Auth + Permission**: `withPageAuth([AppPermission.STAFF_CREATE], ...)` ensures the user is authenticated and has the `STAFF_CREATE` permission (matching `PAGE_PERMISSIONS.usersCreate` from Task 16)
2. **Renders**: `<GeneralUserCreateContainer />` (from Task 14) — a client component that handles all the UI logic via `ResponsiveViewSwitch` (mobile/desktop tier selection)
3. **Metadata**: `generateMetadata` sets the page title from the i18n namespace `dashboard.users.createUser`

### Navigation Integration

The "Create User" action button on the `/users` directory page (added in Task 16) navigates to `/users/create` via `router.push("/users/create")`. This is the target route — the page created in this task.

### Container Import Path (from Task 14)

```typescript
import { GeneralUserCreateContainer } from "@/frontend/common/views/dashboard/users/createUser/GeneralUserCreateContainer";
```

The container is a client component (`"use client"` directive) that can be rendered from a server component page. It takes no props — all business logic is encapsulated in the ViewModel hook called by the tier views internally.

## Verification Results

```
✅ tsgo passed (no errors for app/(dashboard)/users/create/page.tsx)
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
✅ All checks for lifecycle "codescene" passed with exit code 0
```

## Semantic Review Checklist

- [x] `withPageAuth` uses `async ()` (no locale destructure) — matches existing pages
- [x] `AppPermission` is a VALUE import (used in runtime array)
- [x] `GeneralUserCreateContainer` imported from correct path (Task 14 outcome)
- [x] `getTranslations` imported from `@/shared/locale` (matching existing pages)
- [x] `getLocale` imported from `@/shared/locale/server-cookies` (matching existing pages)
- [x] All imports use `@/` path aliases (no relative imports)
- [x] `generateMetadata` returns `Metadata` with `title` from i18n namespace
- [x] i18n namespace key `usersCreateUser` matches the one registered in Task 6
- [x] Permission `STAFF_CREATE` matches `PAGE_PERMISSIONS.usersCreate` from Task 16
- [x] Page is a server component (no `"use client"` directive, no client hooks)
- [x] Matches exact pattern from `app/(dashboard)/staff/create/page.tsx` and `app/(dashboard)/parents/onboarding/page.tsx`
