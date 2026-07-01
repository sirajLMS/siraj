# Authentication Architecture & Redirect Loop Fix

## Overview

This document describes the authentication architecture in Siraj, explains the infinite redirect loop bug between `/login` and `/dashboard`, and documents the fix strategy.

## Current Auth Architecture

### Token Types

| Token | Storage | Lifetime | Purpose |
|-------|---------|----------|---------|
| `access_token` | **React memory only** (not a cookie) | Short-lived (~15min) | GraphQL API authorization header |
| `refresh_token` | **httpOnly cookie** | 7 days | Silent token rotation via GraphQL mutation |
| `session_id` | **httpOnly cookie** | 7 days | Server-side session validation |

### Auth Flow (Current)

```
┌─────────────────────────────────────────────────────────────┐
│ LOGIN                                                        │
│                                                              │
│ 1. User submits credentials                                 │
│ 2. Server: login mutation (auth.mutation.ts)                │
│    ├─ Generates: access_token, refresh_token, session_id    │
│    ├─ Sets cookies: session_id ✅, refresh_token ✅          │
│    ├─ Does NOT set: access_token cookie ❌                   │
│    └─ Returns: { token: access_token, user } in response    │
│ 3. Client: AuthProvider stores access_token in React state  │
│ 4. Client: hard redirect to /dashboard                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ TOKEN REFRESH (Client-side)                                  │
│                                                              │
│ 1. AuthProvider.checkAuth() calls refreshTokenMutation      │
│ 2. Server: reads session_id + refresh_token from cookies    │
│ 3. Server: validates + rotates tokens                        │
│    ├─ Sets cookies: session_id ✅, refresh_token ✅          │
│    ├─ Does NOT set: access_token cookie ❌                   │
│    └─ Returns: { token: new_access_token, user } in response│
│ 4. Client: AuthProvider stores new access_token in React state│
│ 5. Client: isAuthenticated = true                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SERVER-SIDE AUTH CHECK (Dashboard Layout SSR)               │
│                                                              │
│ 1. getServerUserContext() reads cookies                     │
│ 2. Finds: session_id ✅, access_token ❌ (NEVER SET!)       │
│ 3. Returns: { userId: null, context: null }                 │
│ 4. Layout: redirect({ href: "/login" })                     │
└─────────────────────────────────────────────────────────────┘
```

### The Infinite Redirect Loop

```
/dashboard (Server SSR)
  └─ getServerUserContext() → no access_token cookie → redirect /login
       │
/login (Client hydration)
  └─ AuthProvider.checkAuth() → refreshTokenMutation SUCCESS → isAuthenticated=true
  └─ LoginContainer useEffect → router.replace("/dashboard")
       │
/dashboard (Server SSR) ─── same failure ───→ redirect /login
       │
     ♻️ INFINITE LOOP
```

**Root cause**: The server-side `getServerUserContext()` requires an `access_token` cookie that is **never set** by any part of the auth flow. The `access_token` is intentionally stored only in React memory for XSS protection, but this creates a fundamental desync — the client thinks the user is authenticated (via `refreshToken` mutation), while the server always sees the user as unauthenticated (no `access_token` cookie).

## Fix Strategy

### Primary Fix: Update `getServerUserContext()` to Use Available Cookies

Change the server-side auth check to validate using `session_id` + `refresh_token` cookies (which are actually set as httpOnly cookies), instead of requiring an `access_token` cookie that doesn't exist.

**Updated flow:**

```
/dashboard (Server SSR)
  └─ getServerUserContext() reads cookies:
     ├─ session_id ✅ → validate session → get userId
     └─ refresh_token ✅ → fallback: verify JWT + match session → get userId
  └─ Returns: { userId, context } ✅ → renders dashboard
```

This aligns server-side auth with the reality of what cookies are available.

### Secondary Fixes

1. **Add `(auth)/layout.tsx`**: Server-side auth guard on login that redirects authenticated users to `/dashboard`, eliminating the client-side redirect flash.

2. **Fix `app/[locale]/page.tsx`**: Smart redirect based on auth state instead of unconditionally redirecting to `/login`.

## Security Considerations

### Why `access_token` is NOT a Cookie (Design Decision)

The `access_token` is intentionally kept in React memory only to mitigate XSS attacks:
- If an attacker executes JavaScript via XSS, they **cannot** read httpOnly cookies
- The access token in memory is lost on page reload (by design)
- The `refreshToken` mutation (which **does** use httpOnly cookies) can silently restore auth

This design is sound — the fix preserves it by making the server-side auth check use the httpOnly cookies that exist, rather than requiring a cookie that was deliberately excluded.

### `sameSite: "strict"` Consideration

Auth cookies use `sameSite: "strict"`, which blocks cookies on cross-site navigations. For a same-site app this is generally fine, but `"lax"` would be more forgiving for external redirects back to the app. This is a separate security decision and not part of the current fix.

## Files Reference

| File | Purpose |
|------|---------|
| `backend/lib/auth/server-auth.ts` | Server-side auth validation (SSR) |
| `backend/graphql/mutation/auth.mutation.ts` | Login/refresh/logout mutations + cookie setting |
| `backend/graphql/gqlContextFactory.ts` | GraphQL context factory (reads auth cookies) |
| `backend/lib/auth/jwt.ts` | JWT token generation and verification |
| `backend/lib/auth/cached-user.ts` | React.cache() wrapper for current user |
| `backend/services/auth/session.service.ts` | Session management service |
| `frontend/providers/apollo/AuthProvider.tsx` | Client-side auth state management |
| `frontend/views/auth/login/index.tsx` | Login container (client redirect logic) |
| `frontend/lib/safeRedirect.ts` | Safe redirect URL validation |
| `frontend/hooks/useAuthToken.ts` | Hook for auth token in React state |
| `app/[locale]/(dashboard)/layout.tsx` | Dashboard layout (server auth guard) |
| `app/[locale]/(auth)/login/page.tsx` | Login page (server component) |
| `app/[locale]/page.tsx` | Root locale page (unconditional login redirect) |
| `app/layout.tsx` | Root layout (providers including AuthProvider) |

## Cookie Configuration

| Cookie | httpOnly | sameSite | secure | maxAge | path |
|--------|----------|----------|--------|--------|------|
| `session_id` | true | strict | production-only | 7 days | `/` |
| `refresh_token` | true | strict | production-only | 7 days | `/` |
| `access_token` | ❌ Never set as cookie | — | — | — | — |
