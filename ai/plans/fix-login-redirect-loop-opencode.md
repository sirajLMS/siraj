# Fix: Infinite Redirect Loop Between /login and /dashboard

**Status**: Planned
**Date**: 2026-07-01
**Severity**: Critical — login is completely broken for any user navigating directly to /dashboard or after a page refresh

## Root Cause Summary

`getServerUserContext()` (backend/lib/auth/server-auth.ts:13) reads `cookieStore.get("access_token")`, but **no code ever sets this cookie**. The access token is stored only in React client-side state (`AppApolloProvider.tsx:27` — `useState<string | null>(null)`). After a hard redirect (`globalThis.location.href`), that React state is destroyed. The server-side auth guard finds `session_id` but not `access_token` → redirects to `/login`. The client `AuthProvider` then refreshes tokens (succeeds) → `isAuthenticated=true` → redirects to `/dashboard` → server again finds no `access_token` cookie → **infinite loop**.

## The Loop (Step by Step)

```
/dashboard (Server SSR)
  → getServerUserContext() reads: session_id ✅, access_token ❌ (never set as cookie)
  → Returns { userId: null, context: null }
  → redirect({ href: "/login", locale })

/login (Client hydration)
  → AuthProvider.checkAuth() → refreshTokenMutation → SUCCESS (session_id + refresh_token cookies present)
  → isAuthenticated = true
  → LoginContainer useEffect → router.replace("/dashboard")

/dashboard (Server SSR)
  → getServerUserContext() → access_token cookie STILL missing
  → redirect({ href: "/login", locale })
  → INFINITE LOOP ♻️
```

## Fix Steps

### Phase 1: Core Fix — Set `access_token` Cookie

#### Step 1.1: Update `setAuthCookies()` in auth.mutation.ts

**File**: `backend/graphql/mutation/auth.mutation.ts:23-36`

- Add `accessToken` parameter to `setAuthCookies(ctx, sessionId, refreshToken, accessToken?)`
- Set `access_token` as httpOnly cookie with **900-second maxAge** (matches `JWT_ACCESS_TOKEN_EXPIRY = "15m"` in jwt.ts:9)

Cookie attributes for `access_token`:

| Attribute | Value | Rationale |
|-----------|-------|-----------|
| `httpOnly` | `true` | Prevents JS access (same as other auth cookies) |
| `secure` | `process.env.NODE_ENV === "production"` | HTTPS in prod, HTTP in dev |
| `sameSite` | `"strict"` | CSRF protection — same as other auth cookies |
| `maxAge` | `900` (15 min) | Matches JWT_ACCESS_TOKEN_EXPIRY — short-lived |
| `path` | `"/"` | Available on all routes including /dashboard |

#### Step 1.2: Pass `accessToken` at all 3 call sites

**File**: `backend/graphql/mutation/auth.mutation.ts`

1. **`login` mutation** (line ~202): `setAuthCookies(ctx, sessionId, refreshToken, accessToken)`
2. **`demoLogin` mutation** (line ~239): `setAuthCookies(ctx, result.sessionId, result.refreshToken, result.accessToken)`
3. **`rotateTokensAndSession` helper** (line ~116): `setAuthCookies(ctx, rawSessionId, newRefreshToken, newAccessToken)`
   - This is the critical one: `refreshToken` mutation calls `rotateTokensAndSession`, which sets a fresh `access_token` cookie every time the client silently refreshes — so after 15 minutes when the cookie expires, the next `checkAuth()` cycle resets it.

#### Step 1.3: Delete `access_token` cookie on logout

**File**: `backend/graphql/mutation/auth.mutation.ts:306-308`

Add `ctx.cookies.delete("access_token")` alongside existing deletions.

### Phase 2: Server-Side Auth Guard on Login Page

#### Step 2.1: Create `app/[locale]/(auth)/layout.tsx`

New file that calls `getServerUserContext()` and redirects authenticated users away from `/login` to `/dashboard` **before** the page renders on the server — eliminates the client-side-only redirect flash.

```tsx
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { type AppLocale, locales, redirect } from "@/shared/i18n/routing";

export default async function AuthLayout({
  children,
  params,
}: {
  readonly children: React.ReactNode;
  readonly params: Promise<{ locale: string }>;
}) {
  const { userId, context } = await getServerUserContext();
  let { locale } = await params;

  if (!locales.includes(locale as AppLocale)) {
    locale = locales[0];
  }

  if (userId && context) {
    redirect({ href: "/dashboard", locale });
    return;
  }

  return children;
}
```

### Phase 3: Fix Root Page Unconditional Redirect

#### Step 3.1: Update `app/[locale]/page.tsx`

**File**: `app/[locale]/page.tsx:10`

Currently unconditionally redirects to `/login`. Change to check auth first:

```tsx
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { type AppLocale, locales, redirect } from "@/shared/i18n/routing";

export default async function RootPage({ params }: { readonly params: Promise<{ locale: string }> }) {
  let { locale } = await params;
  if (!locales.includes(locale as AppLocale)) {
    locale = locales[0];
  }

  const { userId, context } = await getServerUserContext();
  if (userId && context) {
    redirect({ href: "/dashboard", locale });
  } else {
    redirect({ href: "/login", locale });
  }
}
```

### Phase 4: Fix Apollo ErrorLink locale prefix

#### Step 4.1: Update `frontend/providers/apollo/utils.ts:120`

**File**: `frontend/providers/apollo/utils.ts:120`

Current: `globalThis.window.location.href = /${detectedLocale}/login?redirect=...`
This uses `/ar/login` or `/en/login`, but with `localePrefix: "never"` in routing.ts, locale prefixes should NOT be in URLs.

Fix: Remove locale prefix from the redirect URL:
```ts
globalThis.window.location.href = `/login?redirect=${encodedRedirect}`;
```

### Phase 5: Verification

#### Step 5.1: Update E2E test helper

**File**: `test/ui/e2e/helpers.ts:52-59`

The helper manually sets `access_token` as a non-httpOnly Playwright cookie. After the fix, the real app flow sets it as httpOnly. Update the helper to match:
```ts
await context.addCookies([{
  name: "access_token",
  value: token,
  domain: "localhost",
  path: "/",
  httpOnly: true,
  sameSite: "Strict",
  secure: false,
}]);
```

#### Step 5.2: Run quality gate

```bash
bun quality-gate
```

#### Step 5.3: Run relevant tests

```bash
bun run test:graphql
bun run test:ui:e2e
```

## Cookie Lifecycle After Fix

```
Login/demoLogin mutation:
  → setAuthCookies(ctx, sessionId, refreshToken, accessToken)
  → Sets 3 cookies: session_id (7d), refresh_token (7d), access_token (15m httpOnly)

Hard redirect to /dashboard:
  → Browser sends all 3 cookies
  → getServerUserContext() reads session_id + access_token ✅
  → Server verifies JWT, validates session, loads permissions
  → Dashboard renders ✅

After 15 minutes (access_token cookie expired):
  → SSR page load → getServerUserContext() → JWT verify fails → returns null
  → Redirects to /login (or (auth)/layout.tsx still renders login since user unauthenticated)
  → AuthProvider.checkAuth() → refreshToken mutation (uses session_id + refresh_token cookies)
  → rotateTokensAndSession() → setAuthCookies() sets NEW access_token cookie (15m)
  → isAuthenticated=true → redirect to /dashboard
  → SSR succeeds with fresh access_token cookie ✅

Logout:
  → Deletes session_id, refresh_token, access_token cookies
  → Redirects to /login ✅
```

## Why This Approach (Not Alternatives)

### Rejected: Remove `access_token` cookie requirement from `getServerUserContext()`
- Weakens security: the access token JWT proves the user possesses a freshly-issued credential
- Session-only auth (just `session_id` + DB lookup) doesn't verify the client holds a valid JWT
- The dual check (session exists AND valid JWT) is a defense-in-depth pattern

### Rejected: Read `Authorization` header in `getServerUserContext()`
- Server Components don't receive custom headers from browser navigations — only cookies and standard headers
- The `Authorization` header is added by Apollo Link for XHR/fetch requests, not for page navigations

### Selected: Set `access_token` as httpOnly cookie
- Consistent with existing pattern (session_id and refresh_token are already httpOnly cookies)
- Server Components can read it via `cookies()` API
- Short 15-minute maxAge limits exposure — matches JWT expiry
- Refreshed automatically when `refreshToken` mutation runs
- Preserves existing XSS defense: httpOnly means JS can't read it

## Files to Modify

| File | Change | Phase |
|------|--------|-------|
| `backend/graphql/mutation/auth.mutation.ts` | Add `accessToken` param to `setAuthCookies()`; set `access_token` cookie; pass at 3 call sites; delete on logout | 1 |
| `backend/lib/auth/server-auth.ts` | Add comment explaining `access_token` cookie lifecycle | 1 |
| `app/[locale]/(auth)/layout.tsx` | **New file** — server-side auth guard, redirect authenticated users to `/dashboard` | 2 |
| `app/[locale]/page.tsx` | Smart redirect based on auth state | 3 |
| `frontend/providers/apollo/utils.ts` | Remove locale prefix from error link redirect URL | 4 |
| `test/ui/e2e/helpers.ts` | Match cookie attributes (httpOnly, sameSite) to real flow | 5 |

## Files to Verify (No Changes Expected)

| File | Why |
|------|-----|
| `frontend/providers/apollo/AuthProvider.tsx` | Still stores token in React state for Apollo auth link — no change |
| `frontend/providers/apollo/AppApolloProvider.tsx` | Apollo client setup unchanged |
| `frontend/views/auth/login/index.tsx` | Client-side useEffect redirect still works as fallback |
| `app/[locale]/(dashboard)/layout.tsx` | Dashboard auth guard unchanged |
| `backend/graphql/gqlContextFactory.ts` | GraphQL context reads `Authorization` header for API calls — unchanged |
