# App Router Layer Rules

## Server Components

- All files under `app/` are Server Components by default (no `"use client"` directive).
- Server Components may call backend services directly (e.g., `SessionService`, `PermissionsService`).
- Server Components must **not** call repositories or the database directly — always go through the service layer.
- Server Components must **not** use React hooks (`useState`, `useEffect`, etc.) or browser APIs.

## Authentication Guards

- Use `getServerUserContext()` from `@/backend/lib/auth/server-auth` to verify authentication in layout files.
- Redirect unauthenticated users with `redirectToLogin()` from `@/frontend/common/lib/redirectToLogin` (or `redirect()` from `next/navigation`).

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
| Client defense-in-depth | `<RequirePermission>` in Containers | Renders `fallback` (often `null`) |

**Permission-gated pages** must call `requirePermissionForPage` in `page.tsx` before rendering the Container. Keep client `<RequirePermission>` as defense-in-depth. Do **not** gate `/dashboard` itself — it is the redirect landing page.

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

- Use `getTranslations()` from `next-intl/server` for server-side translations.
- Use `getMessages()` from `next-intl/server` when passing messages to client providers.

## Locale Handling

- Locale is available via `params` (as a Promise in Next.js 15+): `const { locale } = await params;`
- Use locale for redirects: `redirect(`/${locale}/login`)`.
