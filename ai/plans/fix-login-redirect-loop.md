# Fix: Infinite Redirect Loop Between /login and /dashboard

## Root Cause

`getServerUserContext()` (backend/lib/auth/server-auth.ts:13) reads `cookieStore.get("access_token")`, but **no code ever sets this cookie**. After login, the hard redirect to `/dashboard` loses the in-memory React access token, and the server-side auth guard finds `session_id` but not `access_token` → redirects back to `/login`. The client AuthProvider then refreshes tokens (succeeds) → `isAuthenticated=true` → redirects to `/dashboard` → server again finds no `access_token` cookie → **infinite loop**.

## Cookie Flow After Login (Current — Broken)

```
Login mutation → setAuthCookies() sets:
  ✅ session_id (httpOnly cookie, 7d)
  ✅ refresh_token (httpOnly cookie, 7d)
  ❌ access_token — NOT set as cookie (only returned in response body, stored in React state)

Hard redirect to /dashboard → React state LOST
  → getServerUserContext() reads:
    ✅ session_id cookie — found
    ❌ access_token cookie — NOT found
  → Returns { userId: null, context: null }
  → Redirects to /login

AuthProvider.checkAuth() → refreshToken mutation (succeeds via session_id + refresh_token cookies)
  → isAuthenticated = true
  → LoginContainer redirects to /dashboard
  → LOOP
```

## Fix Plan

### Step 1: Add `access_token` to `setAuthCookies()` in auth.mutation.ts

**File**: `backend/graphql/mutation/auth.mutation.ts`

- Add `accessToken` parameter to `setAuthCookies(ctx, sessionId, refreshToken, accessToken?)`
- Set `access_token` as httpOnly cookie with **15-minute maxAge** (matching `JWT_ACCESS_TOKEN_EXPIRY = "15m"` in jwt.ts)
- Add security comment explaining why this cookie exists and why its maxAge differs from the 7-day session/refresh cookies

Cookie attributes for `access_token`:
| Attribute | Value | Rationale |
|-----------|-------|-----------|
| `httpOnly` | `true` | Prevents JS access (same as other auth cookies) |
| `secure` | `process.env.NODE_ENV === "production"` | HTTPS in prod, HTTP in dev |
| `sameSite` | `"strict"` | Same as other auth cookies — CSRF protection |
| `maxAge` | `900` (15 min) | Matches JWT_ACCESS_TOKEN_EXPIRY — short-lived |
| `path` | `"/"` | Available on all routes including /dashboard |

### Step 2: Pass `accessToken` to `setAuthCookies()` at all call sites

**File**: `backend/graphql/mutation/auth.mutation.ts`

Three call sites need updating:

1. **`login` mutation resolver** (line ~202): Pass the generated `accessToken`
   ```ts
   setAuthCookies(ctx, sessionId, refreshToken, accessToken);
   ```

2. **`demoLogin` mutation resolver** (line ~239): Pass `result.accessToken`
   ```ts
   setAuthCookies(ctx, result.sessionId, result.refreshToken, result.accessToken);
   ```

3. **`rotateTokensAndSession` helper** (line ~116): Pass `newAccessToken`
   - Called by `refreshToken` mutation — this is critical: after the access token cookie expires (15 min), the next server-side page load would fail. But the `refreshToken` mutation runs via Apollo Client's `checkAuth()`, which updates the `access_token` cookie for subsequent SSR requests.
   ```ts
   setAuthCookies(ctx, rawSessionId, newRefreshToken, newAccessToken);
   ```

### Step 3: Clear `access_token` cookie on logout

**File**: `backend/graphql/mutation/auth.mutation.ts` — `logout` resolver (line ~308)

Add `ctx.cookies.delete("access_token")` alongside existing `session_id` and `refresh_token` deletions:
```ts
ctx.cookies.delete("session_id");
ctx.cookies.delete("refresh_token");
ctx.cookies.delete("access_token"); // ← add this
```


### Step 5: Add security comment to server-auth.ts

**File**: `backend/lib/auth/server-auth.ts`

Document that `access_token` is an httpOnly cookie set by `setAuthCookies()` in auth.mutation.ts with a 15-minute expiry matching the JWT. When it expires (after 15 min), the next SSR page load will redirect to `/login`, but the client-side `AuthProvider.checkAuth()` runs the `refreshToken` mutation which sets a fresh `access_token` cookie, so subsequent SSR loads succeed.

### Step 6: Verify no other code reads `access_token` from unexpected sources

Search the codebase for other references to `access_token` cookie and ensure they are consistent. Known references:
- `backend/lib/auth/server-auth.ts:13` — reads it ✅

## Files to Modify

| File | Change |
|------|--------|
| `backend/graphql/mutation/auth.mutation.ts` | Add `accessToken` param to `setAuthCookies()`; set `access_token` cookie; pass token at 3 call sites; delete on logout |
| `backend/lib/auth/server-auth.ts` | Add comment explaining the `access_token` cookie lifecycle |

## Files to Verify (No Changes Expected)

| File | Why |
|------|-----|
| `frontend/providers/apollo/AuthProvider.tsx` | No change needed — still stores token in React state for Apollo auth link |
| `frontend/providers/apollo/utils.ts` | No change needed — `Authorization: Bearer` header still sent from React state |

## Cookie Lifecycle After Fix

```
Login/demoLogin mutation:
  → setAuthCookies(ctx, sessionId, refreshToken, accessToken)
  → Sets 3 cookies: session_id (7d), refresh_token (7d), access_token (15m)

Hard redirect to /dashboard:
  → Browser sends all 3 cookies
  → getServerUserContext() reads session_id + access_token ✅
  → Dashboard renders ✅

After 15 minutes (access token expired):
  → SSR page load → getServerUserContext() → JWT verify fails → returns null
  → Redirects to /login
  → AuthProvider.checkAuth() → refreshToken mutation (uses session_id + refresh_token cookies)
  → rotateTokensAndSession() → setAuthCookies() sets NEW access_token cookie (15m)
  → isAuthenticated=true → redirect to /dashboard
  → This time SSR succeeds ✅

Logout:
  → Deletes session_id, refresh_token, access_token cookies
  → Redirects to /login ✅
```

## Why This Approach (Not Alternatives)

### Rejected: Remove `access_token` cookie requirement from `getServerUserContext()`
- Would weaken security: the access token JWT proves the user possesses a freshly-issued credential
- Session-only auth (just `session_id` + DB lookup) doesn't verify the client holds a valid JWT
- The dual check (session + JWT) ensures both the session exists AND the client has a valid signed token

### Rejected: Read `Authorization` header in `getServerUserContext()`
- Server Components don't receive custom headers from the browser navigation — only cookies and standard headers
- The `Authorization` header is added by Apollo Link for XHR/fetch requests, not for page navigations

### Selected: Set `access_token` as httpOnly cookie
- Consistent with existing pattern (session_id and refresh_token are already httpOnly cookies)
- Server Components can read it via `cookies()` API
- Short 15-minute maxAge limits exposure — matches JWT expiry
- Refreshed automatically when `refreshToken` mutation runs (client-side AuthProvider.checkAuth())
