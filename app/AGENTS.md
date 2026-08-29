# App Router Layer Rules

## Server Components

- All files under `app/` are Server Components by default (no `"use client"` directive).
- Server Components may call backend services directly (e.g., `SessionService`, `PermissionsService`).
- Server Components must **not** call repositories or the database directly — always go through the service layer.
- Server Components must **not** use React hooks (`useState`, `useEffect`, etc.) or browser APIs.

## Error Boundaries

- Database outages surface through `DatabaseUnavailableError` + a digest sentinel recognized by the root error boundary. See `docs/backend/db-availability-fail-fast.md`.

## Authentication Guards

- Use `getServerUserContext()` from `@/backend/lib/auth/server-auth` to verify authentication in layout files.
- Redirect unauthenticated users with `redirectToLogin()` from `@/frontend/common/lib/redirectToLogin` (or `redirect()` from `next/navigation`).
- For dashboard pages, use the shared `withPageAuth()` wrapper from `app/(dashboard)/__shared__/withPageAuth.ts` instead of inline auth checks. See `docs/app/with-page-auth.md` for the complete pattern reference.

```tsx
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";

const { userId, context } = await getServerUserContext();
if (!userId || !context) {
  await redirectToLogin();
  return;
}
```

### Page-level access control (auth ≠ permission)

| Concern | Helper | Redirect |
|---------|--------|----------|
| Not logged in | Layout / `redirectToLogin` | Login |
| Missing teacher/parent identity | `requireTeacherIdForPage` / `requireParentIdForPage` | `/dashboard` |
| Missing `AppPermission`(s) | `requirePermissionForPage` | `/dashboard` |
| Profile view/edit | `resolveProfilePageContext` | `/dashboard` or `/profile` |
| UX-level gating | `<RequirePermission>` on buttons/tabs/sections | Renders `fallback` (often `null`) |

**Permission-gated pages** must call `requirePermissionForPage` in `page.tsx` before rendering the Container. Do **not** add container-level `<RequirePermission>` wrappers that gate entire page returns — the server guard is the security boundary and the client wrapper is trivially bypassable. Fine-grained `<RequirePermission>` on individual buttons/tabs/sections is encouraged for UX (e.g., hiding buttons users can't use). Do **not** gate `/dashboard` itself — it is the redirect landing page. See `docs/auth/permission-architecture.md` for the full 3-tier model.

```tsx
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { getLocale } from "@/shared/locale/server-cookies";

export default async function ExamplePage() {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }
  await requirePermissionForPage(userId, [AppPermission.SESSION_RESCHEDULE], locale, context);
  return <ExampleContainer />;
}
```

- Permission arrays use **OR** semantics (any one permission grants access), matching client `RequirePermission`.
- Prefer passing `context` from `getServerUserContext()` so impersonation / group simulation stay correct.
- Locale comes from `getLocale()` (`@/shared/locale/server-cookies`) — there is no `[locale]` URL segment under `(dashboard)`.

## Cached Request Pattern

- Next.js layouts **cannot pass props to page children**. Pages only receive `params` and `searchParams`.
- To share data between a layout and its pages without duplicate fetches, use `React.cache()` wrappers.
- `React.cache()` memoizes function results per request, so calling the same function in both layout and page executes only once.

### Example: `getCurrentUser()`

```tsx
// backend/lib/auth/cached-user.ts
import { cache } from "react";
import { SessionService } from "@/backend/services/auth/session.service";

export const getCurrentUser = cache(async (userId: string) => {
  return SessionService.getCurrentUserProfile(userId);
});
```

**Usage in layout:**

```tsx
import { getCurrentUser } from "@/backend/lib/auth/cached-user";

const userProfile = await getCurrentUser(userId);
```

**Usage in page (same request, no duplicate fetch):**

```tsx
import { getCurrentUser } from "@/backend/lib/auth/cached-user";

const userProfile = await getCurrentUser(userId);
```

## Creating New Cached Wrappers

- Place cached wrappers in `backend/lib/auth/` or a similar shared location.
- Always wrap with `cache()` from `react`.
- Import types from `@/backend/types`.
- Name functions clearly (e.g., `getCurrentUser`, `getDashboardMetrics`).

## Translations in Server Components

- Use `getTranslations(locale)` from `@/shared/locale/server` for server-side translations (synchronous — returns a `<namespace>` property-chain, NOT a promise).
- Pass already-translated strings as props to client components; do NOT use `getMessages()`.
- Example: `const t = getTranslations(locale).commonTranslations;` then use `t.fieldName`.

## Locale Handling

- Locale is NOT part of the URL — there is no `[locale]` segment anywhere under `app/`. Read it with `getLocale()` from `@/shared/locale/server-cookies` (async; cookie/header based via `proxy.ts`).
- Redirects use plain paths: `redirect("/login")` or `await redirectToLogin()` from `@/frontend/common/lib/redirectToLogin`. Never prefix paths with the locale.

## Linting Rules

- See `docs/quality/linting-rules.md` for Oxlint & ESLint/sonarjs fix recipes. NEVER use `oxlint-disable` comments.

