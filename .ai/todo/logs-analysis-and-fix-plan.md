# Vercel Logs — Issue Analysis & Fix Plan

**Source:** `.ai/todo/logs_to_fix.md` (Vercel production logs, 1-hour window: 2026-08-12T15:01–15:07 UTC)  
**Host:** `mishkah-eight.vercel.app`  
**Date:** 2026-08-18

---

## 1. Issues Found

### Issue 1 — Cold-Start / Full Re-Initialization on Every Lambda Invocation ⚠️ HIGH
**Evidence:**
```
15:01:48.79  error  λ POST /api/graphql
15:01:51.212 [DEBUG] Validating environment variables...
15:01:51.221 [LOG] Creating database connection (strategy: neon-serverless, ...)
15:01:51.221 [LOG] Initializing Neon serverless Pool connection
15:01:51.881 [LOG] 🔧 Initializing Cache with provider: redis
...
15:01:52.207 [LOG] 🔧 Initializing Redis with provider: upstash
...
15:01:52.498 [LED] Connecting to Upstash Redis (serverless)
15:01:52.499 [LOG] Initialized Upstash Redis adapter
```
This full boot sequence repeats **at least twice within the same second** (two concurrent
GraphQL POSTs at `15:01:48.79`), each going through the complete env validation → DB pool
create → cache adapter init → Redis adapter init path.

**Root Cause:** Vercel serverless functions are short-lived. Every cold start (TFB) re-runs:
1. `backend/lib/env.ts` → env validation
2. `backend/db/factory.ts` → `createDatabase()` → `createNeonDb()` → Neon WebSocket pool init
3. `backend/services/cache/CacheServiceFactory.ts` → `getCacheService()` → `createRedisCache()`

The singleton-caching is module-scoped, so it survives *warm* invocations but is lost on each
cold container. The logs show the singleton is being recalculated on fresh invocations and
across concurrent requests fighting for init.

**Impact:** Each cold start pays ~3–4 s of setup time before the resolver even begins work.

**Relevant Files:**
- `backend/lib/env.ts` — `getEnvironmentConfig()`, env validation
- `backend/db/factory.ts` — `createDatabase()`, `createNeonDb()`
- `backend/services/cache/CacheServiceFactory.ts` — `getCacheService()`, `createCacheService()`
- `backend/services/system/environment-config.service.ts` — `resolveEnvConfig()` DB lookups

---

### Issue 2 — `env-config` DB Cache Miss on Cold Starts ⚠️ MEDIUM
**Evidence:**
```
15:01:51.496 [DEBUG] env-config: cache miss for key "CACHE_PROVIDER", querying system_settings
15:01:51.881 [DEBUG] env-config: DB miss for key "CACHE_PROVIDER", falling back to process.env
15:01:51.881 [DEBUG] env-config: cache miss for key "REDIS_PROVIDER", querying system_settings
15:01:52.207 [DEBUG] env-config: DB miss for key "REDIS_PROVIDER", falling back to process.env
15:01:52.498 [DEBUG] env-config: DB miss for key "UPSTASH_REDIS_REST_URL", falling back to process.env
15:01:52.498 [DEBUG] env-config: DB miss for key "UPSTASH_REDIS_REST_TOKEN", falling back to process.env
```

Every dependency-free key (QUEUE/KNEE) ends with a miss on a fresh cold start because:

1. The module-scoped `Map` in `environment-config.service.ts` is empty on cold start
2. `CACHE_PROVIDER`, `REDIS_PROVIDER`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
   have no DB overrides in `system_settings` → DB miss → process.env fallback

**Root Cause:** These keys all fall back to `process.env` in the common case, but they all
go through a full DB round-trip before discovering the fallback. The DB has no override
(`env::CACHE_PROVIDER` row doesn't exist in `system_settings`), so every cold start wastes
two DB queries on keys that will always be env-fallback in this deployment.

**Relevant Files:**
- `backend/services/system/environment-config.service.ts` — `resolveEnvConfig()`, `resolveBatchEnvConfig()`

---

### Issue 3 — `Query.notificationAlerts` & `Query.permissions` Both Take 7.5–8 s 🚨 CRITICAL
**Evidence:**
```
15:03:18.536 [LOG] Executed resolver Query.notificationAlerts in 7936.671ms
15:03:18.048 [LOG] Executed resolver Query.permissions in 7542.643ms
```
On the cold-start invocation, these two resolvers took **~8 seconds**. On warm invocations
the same resolvers finish in 450–1950 ms (permissions) and 849–1955 ms (notificationAlerts).

**Root Cause — `Query.permissions`:**
- Resolver: `backend/graphql/pothos/permissions/permission-management.pothos.ts` (line 167)
- Delegates to `PermissionManagementService.listPermissions(...)`
- Gated by `AppPermission.PERMISSION_GROUPS_MANAGE` authScope, which requires
  `PermissionsService.getUserContext()` → 3 sequential DB queries (lines 10–57 of
  `backend/services/auth/permissions.service.ts`):
  1. `SELECT users.id, users.isSuperAdmin WHERE id = $1`
  2. `SELECT permissionGroups.slug INNER JOIN userPermissionGroups WHERE userId = $1`
  3. If superadmin: `SELECT permissions.key FROM permissions`; else
     `SELECT permissions.key ... INNER JOIN groupPermissions INNER JOIN permissions WHERE userId = $1`
- For non-superadmin the cold-start path triggers the full init chain + 3 DB queries.

**Root Cause — `Query.notificationAlerts`:**
- Resolver: `backend/graphql/query/notifications/notification-alerts.query.ts`
- Delegates to `NotificationAlertsService.getAlerts(userId, locale)` (line 15)
- The service calls `PermissionsService.hasPermission(userId, NOTIFICATION_VIEW_ALERTS)`
  (line 210) — which itself calls `PermissionsService.getUserContext(userId)` → the same
  3+ DB queries above — **already computed by the GraphQL context** earlier.
- If permission check passes, it also checks `COMPLAINTS_LIST` permission (line 217) →
  another full `getUserContext()` round-trip.
- Then it fetches recent notification rows and unanswered complaint rows.

**Key Inefficiency:** `PermissionsService.getUserContext(userId)` is called at least **three
times** for the same user within a single GraphQL request:
1. Context builder in `backend/graphql/gqlContext.ts` line 76
2. `authScopes` evaluation for `PERMISSION_GROUPS_MANAGE` (Pothos internals)
3. Inside `NotificationAlertsService.getAlerts()` — line 210 and 217

Each call is 3 sequential DB queries with no caching (no `cachedRead`, no memoization).

**Relevant Files:**
- `backend/services/auth/permissions.service.ts` — `getUserContext()`, `hasPermission()`
- `backend/services/notification/notification-alerts.service.ts` — `getAlerts()`
- `backend/graphql/gqlContext.ts` — context builder
- `backend/graphql/pothos/permissions/permission-management.pothos.ts` — query resolvers

---

### Issue 4 — `Mutation.refreshToken` Takes ~2.3 s on Every Page Load ⚠️ HIGH
**Evidence:**
```
15:03:08.111 [LOG] Executed resolver Mutation.refreshToken in 2319.756ms
15:02:32.288 [LOG] Executed resolver Mutation.refreshToken in 2315.650ms
15:02:18.016 [LOG] Executed resolver Mutation.refreshToken in 2352.217ms
15:01:50.181 [LOG] Executed resolver Mutation.refreshToken in ...     (not shown but similar)
```
The refresh token mutation takes **~2.3 seconds consistently**, and is fired on **every single
page navigation** (seen before every permissions-page load cycle).

**Root Cause:** The `refreshToken` resolver in `backend/graphql/mutation/auth/auth.mutation.ts`
(lines 313–365) does the following sequentially:
1. `resolveUserFromSession(sessionId)` or `resolveUserFromRefreshToken(refreshToken)` →
   `SessionService.validateSession()` + `UserService.findById()` (2 DB queries)
2. `validateRefreshTokenJti()` — `verifyToken()` (JWT decode) + session payload parse
3. If not resolved via session ID: `SessionService.createSession()` (3rd DB write)
4. `rotateTokensAndSession()` —
   - `ImpersonationService.issueAccessTokenForSession()` (conditional, may skip)
   - `PermissionGroupSimulationService.issueAccessTokenForSession()` (conditional, may skip)
   - `generateAccessToken()` → JWT sign
   - `generateRefreshToken()` → JWT sign
   - `verifyToken()` — verify the freshly minted refresh token
   - `SessionService.updateSession()` → DB write
   - `UserService.findById()` → 4th DB query (resolves effective user for response)

That's **at least 4 DB round-trips plus 3 JWT operations** executed sequentially. The GraphQL
context builder runs in parallel → `PermissionsService.getUserContext()` → `findSafeById()` →
adds 3 more queries. Total: ~7 DB queries before the response.

**Impact:** On every page navigation the client fires `refreshToken` + 7–9 other queries
simultaneously. The refresh token mutation alone dominates the authentication round-trip.

**Relevant Files:**
- `backend/graphql/mutation/auth/auth.mutation.ts` — `refreshToken` resolver (lines 313–365),
  `rotateTokensAndSession()` helper (lines 137–175)
- `backend/lib/auth/createAuthSession.ts` — `createAuthSession()`
- `backend/services/auth/session.service.ts` — `validateSession()`, `updateSession()`,
  `createSession()`

---

### Issue 5 — `Query.me` Fires Every ~60 s (Persistent Polling) ⚠️ LOW
**Evidence:**
```
18:07:15 POST /api/graphql  Query.me in 97ms
18:06:12 POST /api/graphql  Query.me in 99ms
18:05:08 POST /api/graphql  Query.me in 97ms
18:04:05 POST /api/graphql  Query.me in 97ms
18:03:04 POST /api/graphql  Query.me in 99ms
```
`Query.me` fires once per minute even when the user is idle on the dashboard.

**Root Cause:** Likely client-side poll interval configured on the `me` query via Apollo
Client `pollInterval: 60_000` on the dashboard layout. While each call is cheap (~97 ms),
it keeps the Lambda warm and produces constant log volume. If the Lambda goes cold, the
first `Query.me` after cold-start pays the full boot time + `getUserContext` DB queries.

**Relevant Files:**
- `frontend/common/graphql/sharedDocuments/auth.documents.ts` (or wherever the `me` query
  hook is configured — need to check `useQuery(..., { pollInterval })`)
- `backend/graphql/query/auth/auth.query.ts` — `me` resolver

---

### Issue 6 — `NOTIFICATION_VIEW_ALERTS` Access Denied on Every `/permissions` Page Load ⚠️ MEDIUM
**Evidence:**
```
15:03:13.170 [DEBUG] [RequirePermission] Access denied for NOTIFICATION_VIEW_ALERTS
15:03:07.548 [DEBUG] [RequirePermission] Access denied for NOTIFICATION_VIEW_ALERTS
15:02:28.142 [DEBUG] [RequirePermission] Access denied for NOTIFICATION_VIEW_ALERTS
15:02:21.259 [DEBUG] [RequirePermission] Access denied for NOTIFICATION_VIEW_ALERTS
15:02:14.952 [DEBUG] [RequirePermission] Access denied for NOTIFICATION_VIEW_ALERTS
15:02:08.702 [DEBUG] [RequirePermission] Access denied for NOTIFICATION_VIEW_ALERTS
```
Every navigation to `/permissions` (and every `/api/logs` POST) logs this access-denied
*line* — even though the user *does* see the permissions page.

**Root Cause:** The notification dropdown / bell icon component calls
`NotificationAlertsService.getAlerts()` or the `RequirePermission` wrapper with
`NOTIFICATION_VIEW_ALERTS` on the dashboard layout. The current user lacks this permission,
so the component logs "Access denied" every render. This is by design (component gracefully
hides), but the **log noise is excessive** — every navigation produces this DEBUG line.

**Relevant Files:**
- `frontend/common/components/auth/RequirePermission.tsx` — client-side guard emitting the log
- `backend/services/notification/notification-alerts.service.ts` — line 210–212 returns empty
- `frontend/common/views/dashboard/components/navbar/NotificationButton.tsx` — caller

---

### Issue 7 — `[DEP0169]` Deprecation Warning: `url.parse()` 🔵 LOW
**Evidence:**
```
(node:4) [DEP0169] DeprecationWarning: `url.parse()` behavior is not standardized and prone to errors that have security implications. Use the WHATWG URL API instead. CVEs are not issued for `url.parse()` vulnerabilities.
```

**Root Cause:** A dependency (likely `@neondatabase/serverless` or `ws` or an older
`pg-related` package) calls the deprecated `node:url.parse()`. This is a transitive dependency
issue. No direct code in the project calls `url.parse()` (grep confirms only log files match).

**Relevant Files:**
- `node_modules/@neondatabase/serverless/` or `node_modules/pg/` (or `ws`)
- `backend/db/factory.ts` — `configureNeonWebSocket()` uses `ws`

---

### Issue 8 — `/api/logs` POST Endpoint Fires on Every Page Load ⚠️ MEDIUM
**Evidence:**
```
18:03:11.16  info  λ POST /api/logs
18:03:05.64  info  λ POST /api/logs
18:02:35.36  info  λ POST /api/logs
18:02:30.17  info  λ POST /api/logs
18:02:21.06  info  λ POST /api/logs
18:02:16.00  info  λ POST /api/logs
18:01:50.79  info  λ POST /api/logs
18:01:47.24  info  λ POST /api/logs
```
Each `/api/logs` invocation also triggers the full cold-start sequence (theme detection, Redis
session fetch, `RequirePermission` check).

**Root Cause:** The frontend ships a client-side log collector that POSTs aggregated logs to
`/api/logs` on every page navigation. Each POST triggers a serverless invocation, which on
cold-start runs the full session + permission check loop.

**Relevant Files:**
- `app/api/logs/route.ts` (or equivalent)
- `frontend/utils/logger.ts` (client logger posting to `/api/logs`)

---

## 2. Summary Table

| # | Issue | Severity | First-Pass Fix Area |
|---|-------|----------|---------------------|
| 1 | Full re-init on every cold start (Env → DB → Cache → Redis) | HIGH | `backend/lib/env.ts`, `backend/db/factory.ts`, `backend/services/cache/CacheServiceFactory.ts` |
| 2 | `env-config` DB miss on every cold start for env-fallback keys | MEDIUM | `backend/services/system/environment-config.service.ts` |
| 3 | `Query.notificationAlerts` (8 s) + `Query.permissions` (7.5 s) — `getUserContext` called 3× per request with no cache | CRITICAL | `backend/services/auth/permissions.service.ts`, `backend/services/notification/notification-alerts.service.ts` |
| 4 | `Mutation.refreshToken` 2.3 s — 4+ sequential DB round-trips + 3 JWT ops | HIGH | `backend/graphql/mutation/auth/auth.mutation.ts`, session service |
| 5 | `Query.me` polled every 60 s on idle dashboard | LOW | Apollo Client `pollInterval` config |
| 6 | `NOTIFICATION_VIEW_ALERTS` "Access denied" logged on every navigation | MEDIUM | `RequirePermission.tsx` log level, `NotificationButton.tsx` |
| 7 | `[DEP0169] url.parse()` deprecation warning | LOW | Transitive dep — `@neondatabase/serverless` or `ws` |
| 8 | `/api/logs` POST fires on every page navigation | MEDIUM | Client logger batching / debounce, `/api/logs` route |

---

## 3. Fix Plan (No Implementation — Design Only)

### Phase A — Eliminate Repeated `getUserContext` Calls (fixes Issue 3, partially 1)

**A1. Memoize `PermissionsService.getUserContext(userId)` within a single GraphQL request.**

- The GraphQL context already calls `getUserContext()` at context-build time (line 76 of
  `gqlContext.ts`) and stores the result on `ctx.permissions`, `ctx.permissionGroups`,
  `ctx.isSuperAdmin`, `ctx.role`.
- `NotificationAlertsService.getAlerts()` (line 210) and `markAlertsRead`/`markOneAlertRead`
  **re-call** `PermissionsService.hasPermission()` which re-invokes `getUserContext()` from
  scratch — duplicating the 3 DB queries already done by the context.
- **Fix:** Pass `ctx` (or the already-resolved `UserPermissionContext`) into
  `NotificationAlertsService.getAlerts()` instead of calling `hasPermission(userId, ...)`.

  ```typescript
  // notification-alerts.service.ts — proposed
  export async function getAlerts(
    userId: string,
    locale: string,
    permissionContext: UserPermissionContext
  ): Promise<NotificationAlertsPaginatedReturnType> {
    const canViewAlerts =
      permissionContext.isSuperAdmin ||
      permissionContext.permissions.includes(AppPermission.NOTIFICATION_VIEW_ALERTS);
    if (!canViewAlerts) return emptyAlertsResult(userId);
    // ... reuse permissionContext for COMPLAINTS_LIST instead of re-querying
    const canListComplaints =
      permissionContext.isSuperAdmin ||
      permissionContext.permissions.includes(AppPermission.COMPLAINTS_LIST);
  ```

  Update the resolver to pass `ctx`:
  ```typescript
  // notification-alerts.query.ts — proposed
  resolve: async (_root, _args, ctx) => {
    if (!ctx.user) { ... }
    return NotificationAlertsService.getAlerts(
      ctx.user.id,
      ctx.locale,
      { permissions: ctx.permissions, permissionGroups: ctx.permissionGroups,
        isSuperAdmin: ctx.isSuperAdmin, role: ctx.role }
    );
  },
  ```

**A2. Apply the same memoization to any other service that calls `hasPermission()` from a
GraphQL resolver path.** Audit all callers of `PermissionsService.hasPermission` /
`hasAnyPermission` and route them through the already-resolved context when available.

**Expected impact:** Eliminates 3–6 redundant DB queries per notificationAlerts call. On cold
start, cuts resolver time from ~8 s toward the warm ~1 s range.

---

### Phase B — Warm-Start Optimization (fixes Issue 1, 2)

**B1. Pre-warm env-config cache at module load time for known env-fallback keys.**

- In `environment-config.service.ts`, at module scope (not lazily), call
  `resolveBatchEnvConfig(["CACHE_PROVIDER", "REDIS_PROVIDER", "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN"])` on first import. The result populates the module-scoped
  `Map`, so subsequent calls hit the cache.
- Consider marking these keys as `excludeFromDb: true` in `ENV_CONFIG_KEYS` if they are
  always env-fallback in production and should never be DB-overridable. This skips the DB
  round-trip entirely.

**B2. Lazy-init the DB pool and cache adapter only on first use, not on every cold-start
re-import.** The current `createDatabase()` is called lazily by `drizzleDb.ts`. Verify the
export uses a singleton that is only constructed once per warm container. If the module scope
is already singleton-safe, the cold-start cost is unavoidable — add a `预热` (prewarm)
mechanism instead:

- Add a lightweight `/api/warmup` route (or hook into `/api/health`) that triggers the
  singletons without executing a full GraphQL request. Vercel Cron can hit this every minute
  to keep containers warm.
- Alternatively, use Vercel's `preloadFunction` or `initFunction` feature (if available on the
  plan) to run the init once per container boot.

**B3. Reduce log verbosity on cold start.** The env-validation + DB-connection +
cache-init logs are emitted at `[DEBUG]` / `[LOG]` level. Consider suppressing them in
production unless `LOG_LEVEL=debug`.

---

### Phase C — `refreshToken` Mutation Optimization (fixes Issue 4)

**C1. Reduce redundant DB round-trips in the refresh-token flow.**

- `resolveUserFromSession()` calls `validateSession()` + `findById()` (2 queries).
  `rotateTokensAndSession()` calls `findById()` **again** (line 172) to resolve the
  effective user. Reuse the `user` object already loaded by `resolveUserFromSession()`.
- Only call `UserService.findById(effectiveUserId)` when `ctx.isImpersonating` is true and
  the effective user differs from `user`.
- Batch the `verifyToken(newRefreshToken)` call — it's only needed to extract the JTI for
  session payload storage. Consider generating the JTI directly (e.g. `randomUUID()`) and
  embedding it at sign time, skipping the verify+extract cycle.

**C2. Only refresh when the access token is actually expired.** The Apollo Client fires
`refreshToken` on every page load. If the access token is still valid (> 5 min remaining),
short-circuit and return the existing token instead of rotating.

- Check `ctx.accessToken` expiry. If `exp - now > threshold`, skip rotation entirely and
  return a minimal response with the current access token.

**C3. Consider reducing the number of concurrent `refreshToken` calls.** If the frontend
fires `refreshToken` + `me` + `permissions` + `permissionGroups` + `notificationAlerts` on
every page load, batch the auth-related ones behind a single "session bootstrap" query.

**Expected impact:** Cuts refresh-token mutation from 2.3 s toward ~200–400 ms on warm starts.

---

### Phase D — Client-Side Polling & Log Noise (fixes Issue 5, 6, 8)

**D1. `Query.me` polling:**
- Audit the Apollo `useQuery` hook for the `me` query. If `pollInterval: 60_000` is set,
  consider removing it or extending the interval to 5 minutes. Alternatively, switch to
  a focus-based refetch (`refetchOnWindowFocus: true`) instead of time-based polling.

**D2. `NOTIFICATION_VIEW_ALERTS` "Access denied" log noise:**
- In `RequirePermission.tsx`, lower the log level from `DEBUG` to `TRACE` or remove the log
  entirely — access-denied is expected behavior, not an error.
- Alternatively, emit it only when `process.env.NODE_ENV === "development"`.

**D3. `/api/logs` POST frequency:**
- Debounce or batch client-side logs before posting. Ship the log buffer at most once per
  30 s or when the buffer reaches N entries, instead of posting on every navigation.
- Consider using `navigator.sendBeacon` on `visibilitychange` / `pagehide` instead of
  synchronous fetch on every page load.

---

### Phase E — Deprecation Warning (fixes Issue 7)

**E1. Identify the source of `url.parse()`.**
- Run `node --trace-deprecation` on a single GraphQL request in a staging environment to
  get the stack trace pointing to the exact call site.
- If it's `@neondatabase/serverless` or `ws`, check for a newer version that uses
  `new URL()` instead. If no fixed version exists, suppress the warning via
  `NODE_OPTIONS=--no-deprecation` (or `--no-warnings=DEP0169`) in `vercel.json` — this is
  a transitive dependency issue and the security note says "CVEs are not issued".

---

## 4. Recommended Order of Execution

1. **Phase A** (highest impact, least risk) — eliminates redundant `getUserContext` DB calls.
2. **Phase C** — most user-visible latency reduction (`refreshToken` on every page load).
3. **Phase B** — reduces cold-start cost for the 2 cold starts per page load.
4. **Phase D** — log noise and polling hygiene.
5. **Phase E** — quick transitive-dep suppression, low priority.

---

## 5. Out of Scope (Noted but Not Addressed)

- **Vercel serverless architecture limitations:** Cold starts are inherent. We can mitigate
  but not eliminate them without moving to a persistent server (Vercel Fluid Compute, a
  dedicated worker, or a rewrite to long-running containers).
- **Database indexing:** The `getUserContext` queries filter by `users.id` (PK, indexed) and
  `userPermissionGroups.userId` (FK). Verify the FK has an index — add one if missing:
  `CREATE INDEX ON user_permission_groups(userId)`. This is a repo/schema fix, not a code fix.
- **GraphQL query deduplication on the client:** The frontend fires 7–9 parallel queries on
  every page load. Consolidating the bootstrap queries into a single `sessionBootstrap` query
  that returns `me`, `permissions`, `permissionGroups`, `permissionGroupSimulationStatus`,
  `impersonationStatus`, and `notificationAlerts` in one round trip would cut cold-start
  amplification significantly. This is a frontend architecture change.
