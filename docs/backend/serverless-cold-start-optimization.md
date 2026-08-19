# Serverless Cold-Start Optimization Patterns

Canonical reference for reducing DB queries, redundant fetches, and function invocations on Vercel serverless deployments. Consolidated from Phases A through G of the Vercel Logs Performance Fix plan.

> **See also:** [Login Cold-Start Resilience](./login-cold-start-resilience.md) — fail-open + retryTransient pattern for handling transient connection errors during Neon cold starts in the login flow.

---

## 1. Permission Context Propagation (Phase A1)

### Problem

Services calling `PermissionsService.hasPermission(userId, key)` re-query the database via `getUserContext(userId)` even though the GraphQL context already has all permission data.

### Pattern

Pass `UserPermissionContext` from GraphQL context to services instead of re-querying.

**Type definition** (`@/backend/types/permissions/permission.types.ts`):

```typescript
export type UserPermissionContext = {
  readonly permissions: AppPermission[];
  readonly permissionGroups: string[];
  readonly isSuperAdmin: boolean;
  readonly role: UserRole;
};
```

**Overload pattern** (`@/backend/services/auth/permissions.service.ts`):

```typescript
export async function hasPermission(
  context: UserPermissionContext,
  permissionKey: AppPermission,
): Promise<boolean>;
export async function hasPermission(userId: string, permissionKey: AppPermission): Promise<boolean>;
export async function hasPermission(
  userIdOrContext: string | UserPermissionContext,
  permissionKey: AppPermission,
): Promise<boolean> {
  if (typeof userIdOrContext !== "string") {
    if (userIdOrContext.isSuperAdmin) return true;
    return userIdOrContext.permissions.includes(permissionKey);
  }
  const context = await PermissionsService.getUserContext(userIdOrContext);
  return context.isSuperAdmin || context.permissions.includes(permissionKey);
}
```

### Rules

- The `typeof userIdOrContext !== "string"` discriminator cleanly separates the two paths at runtime
- The `UserPermissionContext` overload does NOT call `getUserContext()` — it checks `context.isSuperAdmin` and `context.permissions` directly, eliminating 3 DB queries per call
- TypeScript function overloads maintain backward compatibility — existing `(userId, permissionKey)` callers continue working unchanged
- `hasAnyPermission` follows the same overload pattern

### Anti-Patterns

- **Re-querying `getUserContext(userId)` in services** when the context already has the data — this is the exact pattern this optimization eliminates
- Using separate function names instead of overloads — breaks API surface compatibility

---

## 2. scopeAuth Lazy Evaluation (Phase A2)

### Problem

Pothos `authScopes` eagerly evaluated `getUserContext(realUserId)` for the `superAdmin` scope on every request, even when no field required that scope.

### Pattern

Convert eager authScope evaluation to lazy scope-loader functions.

**Extracted `buildAuthScopes()` function** (`@/backend/graphql/gqlSchemaBuilder.ts`):

```typescript
export function buildAuthScopes(
  ctx: BaseContext,
  getUserContext: (userId: string) => Promise<{ isSuperAdmin: boolean }> = PermissionsService.getUserContext,
) {
  return {
    loggedIn: !!ctx.user,
    permission: (key: AppPermission) => ctx.isSuperAdmin || ctx.permissions.includes(key),
    superAdmin: async () => {
      const actorUserId = ctx.realUserId ?? ctx.actorUserId ?? ctx.user?.id;
      if (!actorUserId || actorUserId === ctx.user?.id) {
        return ctx.isSuperAdmin;
      }
      const actorContext = await getUserContext(actorUserId);
      return actorContext.isSuperAdmin;
    },
    notImpersonating: !ctx.isImpersonating,
    notSimulatingGroup: !ctx.isSimulatingGroup,
  };
}

// In SchemaBuilder config:
authScopes: async (ctx) => buildAuthScopes(ctx),
```

### Rules

- **Pothos scope caching**: The `authScopes` callback is evaluated once per request and cached via `RequestCache.getScopes()`. Scope-loader functions (values that are functions) are evaluated lazily per-argument and also cached.
- **`superAdmin` lazy loader**: Only evaluates when a field with `authScopes: { superAdmin: true }` is actually queried. When not impersonating (`actorUserId === ctx.user?.id`), returns `ctx.isSuperAdmin` directly (0 DB). Only fetches `getUserContext(actor)` when the actor differs (impersonation).
- **`permission` scope**: Uses `ctx.isSuperAdmin` and `ctx.permissions` directly — no `getUserContext` call needed since `createContext` already populates these fields.
- **Dependency injection**: The `getUserContext` parameter defaults to `PermissionsService.getUserContext` but can be overridden in tests.

### Dead Code Removal

The unreachable `else if (ctx.actorUserId)` branch was removed. The assignment `const realUserId = ctx.realUserId ?? ctx.actorUserId ?? ctx.user?.id` already covers `ctx.actorUserId` via nullish coalescing, making the separate `else if` branch dead code.

### Anti-Patterns

- **Eagerly calling `getUserContext` in `authScopes`** — this defeats Pothos's lazy scope evaluation
- **Using boolean for `superAdmin` scope** instead of a lazy function — forces evaluation on every request

---

## 3. safeUser on BaseContext (Phase A3)

### Problem

`Query.me` resolver called `UserService.findById(ctx.user.id)` to fetch user data that `createContext` had already fetched and discarded.

### Pattern

Store `SanitizedSafeUser` on `BaseContext` to avoid redundant `UserService.findById` calls.

**Sanitized type** (`@/backend/graphql/gqlContext.ts`):

```typescript
type SanitizedSafeUser = UserSelectType & Partial<Pick<UserSelectType, "password" | "rememberTokenHash">>;
```

**Context population**:

```typescript
const safeUserForContext = safeUser
  ? { ...safeUser, password: undefined, rememberTokenHash: undefined }
  : null;
```

**Query.me resolver** (`@/backend/graphql/query/auth/auth.query.ts`):

```typescript
if (!ctx.safeUser) return null;
return AuthUtils.toUserReturnType(ctx.safeUser, { role: ctx.role });
```

### Rules

- `safeUserForContext` strips `password` and `rememberTokenHash` to `undefined` before storing on context (security: `SAFE_USER_SELECT` includes these fields)
- `UserReturnTypeInput` type in `@/backend/utils/auth.utils.ts` accepts both sanitized and full `UserSelectType` — necessary because `SanitizedSafeUser` (with `password: undefined`) does not satisfy `UserSelectType` where `password` is `string`
- `UserPothosObject` does not expose `password` or `rememberTokenHash` — no GraphQL leak risk
- `ctx.role` is already available on `BaseContext` (populated from `permissionContext.role`)

### Performance Impact

- **Before**: 1 DB query per `Query.me` call
- **After**: 0 DB queries — reuses `safeUser` already fetched by `createContext`
- **Net**: 16 DB queries/hour eliminated (at 60s poll, now 120s poll from Phase D)

---

## 4. Env Config Pre-Warm (Phase B)

### Problem

The env-config cache (in-memory `Map`) was empty on cold start. Each `resolveEnvConfig()` call hit the database for keys whose `process.env` fallback value was sufficient.

### Pattern

Pre-populate the cache with `process.env` values at module load.

**`preWarmEnvConfigCache()` function** (`@/backend/services/system/environment-config.service.ts`):

```typescript
function preWarmEnvConfigCache(): void {
  for (const descriptor of ENV_CONFIG_KEYS) {
    if (descriptor.excludeFromDb) continue;
    const envValue = readFromProcessEnv(descriptor.key);
    if (envValue !== undefined) {
      cache.set(descriptor.key, {
        value: envValue,
        expiresAt: Date.now() + getCacheTtlMs(),
      });
    }
  }
}
```

**Module-load call**:

```typescript
try {
  preWarmEnvConfigCache();
} catch (error) {
  logger.warn("Failed to pre-warm env-config cache", { error });
}
```

### Rules

- Cache entry shape: `{ value: string | undefined; expiresAt: number }` — NOT `{ value, source, timestamp }`
- Uses the same TTL (`getCacheTtlMs()`) and `readFromProcessEnv` helper as `resolveEnvConfig()`, ensuring `invalidateEnvConfigCache(key)` evicts pre-warmed entries identically
- Skips descriptors with `excludeFromDb: true` — env-only keys bypass both DB and cache
- Module-load `try/catch` — failures are non-fatal (cache will populate on first access via `resolveEnvConfig()`)
- `invalidateEnvConfigCache()` correctly invalidates pre-warmed entries: `cache.clear()` clears all, `cache.delete(key)` removes individual

### Known Tradeoff

DB overrides mask pre-warmed env values until TTL expiry (5 min). When a DB override is set via the service API, it calls `invalidateEnvConfigCache(key)` first, then the next `resolveEnvConfig()` reads the DB value. Pre-warmed entries are correctly evicted by this flow.

---

## 5. Session Validation Skip User Check (Phase C2)

### Problem

`validateSession` called `UserRepository.findSafeById(session.userId)` to check for orphan sessions, but the `refreshToken` path immediately fetches the user via `UserService.findById` afterward — fetching the same user twice.

### Pattern

Add `skipUserCheck` option to `validateSession`:

```typescript
export async function validateSession(
  rawSessionId: string,
  options?: { skipUserCheck?: boolean },
): Promise<SessionSelectType | null> {
  // ... session lookup ...
  if (!options?.skipUserCheck) {
    const safeUser = await UserRepository.findSafeById(session.userId);
    if (!safeUser) {
      // purge orphan session
      return null;
    }
  }
  return session;
}
```

### Rules

- **Security**: `resolveUserFromSession` calls `UserService.findById(session.userId)` immediately after — if the user was deleted, it returns `null`, and auth fails correctly
- **Backward compatible**: 5 other callers keep default behavior (`skipUserCheck: false`) — only the `refreshToken` path passes `{ skipUserCheck: true }`
- **Orphan session purge skipped**: Sessions expire via TTL — skipping the purge on `skipUserCheck` is safe because the subsequent `UserService.findById` returns `null` for deleted users
- Other callers (storage routes, logout, server-auth) keep the default — they need the orphan check for security

---

## 6. refreshToken User Reuse (Phase C)

### Pattern

Reuse the already-loaded `user` from `createContext` when not impersonating:

```typescript
const effectiveUserId = ctx.isImpersonating && ctx.user ? ctx.user.id : user.id;
const effectiveUser = effectiveUserId === user.id
  ? user
  : ((await UserService.findById(effectiveUserId)) ?? user);
```

### Rules

- When `effectiveUserId === user.id` (common non-impersonation case): reuses `user` object — 0 DB
- When impersonating (`effectiveUserId !== user.id`): fetches from DB as before
- The `user` parameter is already passed by the caller (from `createContext`)

---

## 7. Session Deduplication (Phase E3)

### Problem

Both `resolveAuthIdentityFromToken` and `resolveGroupSimulationFromToken` independently called `SessionRepository.findSessionById(rawSessionId)` with the same session ID.

### Pattern

`preloadSession` helper in `gqlContextFactory.ts` — fetches session once, passes to both resolvers:

```typescript
const preloadedSession = await preloadSession(sessionId);
const authIdentity = await resolveAuthIdentityFromToken(token, rawSessionId, preloadedSession);
const groupSimulation = await resolveGroupSimulationFromToken(token, rawSessionId, preloadedSession);
```

**Guard semantics** (`preloadedSession !== undefined`):

- `undefined` = caller didn't preload → fallback to `findSessionById`
- `null` = session preloaded but not found → use directly, skip `findSessionById`
- `SessionSelectType` object = session preloaded successfully → use directly

### Rules

- The `preloadedSession` parameter is optional (`?: SessionSelectType | null`) — backward compatible
- In production (Redis enabled), eliminates a redundant Redis read (2→1), not a DB query
- In development (no Redis), eliminates a DB query (2→1)
- Early-exit paths in `resolveGroupSimulationFromToken` mean the saving is an upper bound — both calls fire only for the common authenticated case (no impersonation flag, session cookie present)

---

## 8. Client Log Batching (Phase E)

### Problem

Client logger batched logs every 2s, causing excessive `POST /api/logs` requests. No flush on page unload. No minimum batch size guard.

### Pattern

**`batchInterval` minimum 30s in production** (`@/frontend/common/lib/logger/index.ts`):

```typescript
private batchInterval: number = 30000; // 30s — was 2000
```

**`beforeunload` flush using `fetch` with `keepalive: true`**:

```typescript
private beforeunloadHandler = () => this.flushLogs(true, true);

// In constructor:
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", this.beforeunloadHandler);
}

// flushLogs signature:
private flushLogs(keepalive = false, force = false): void { ... }
```

**Minimum batch size guard with priority bypass**:

```typescript
private static readonly MIN_BATCH_SIZE = 5;
private hasPriorityLog = false;

// In flushLogs: if queue < MIN_BATCH_SIZE AND not forced AND no priority log → re-schedule timer
```

### Rules

- **`batchInterval` MUST be at least 30s** in production (was 2s)
- **`beforeunload` flush uses `fetch` with `keepalive: true`** — NOT `navigator.sendBeacon` (defaults to `text/plain` content-type, breaks JSON parser)
- **Min batch size guard** (5 entries): error/warn logs AND `force: true` bypass the guard via `hasPriorityLog` flag
- `hasPriorityLog` is set to `true` for `error`/`warn` level OR `force: true` — ensures critical logs flush regardless of queue size
- `destroy()` method removes `beforeunload` listener and clears pending timer
- `typeof window !== "undefined"` guard for SSR safety
- `ClientLogger` class exported for testability

### Anti-Patterns

- **Using `navigator.sendBeacon`** — defaults to `text/plain`, breaks JSON parsing in `/api/logs`
- **No `beforeunload` flush** — pending logs lost on page navigation
- **No priority bypass** — error/warn logs deferred indefinitely under low traffic

---

## 9. HTTP Batching (Phase E2)

### Problem

Each GraphQL operation was sent as an individual `POST /api/graphql` request. A permissions page load could trigger 8 individual requests = 8 Vercel function invocations.

### Pattern

**Server**: Apollo Server 4 — `allowBatchedHttpRequests: true` on constructor (OFF by default):

```typescript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  allowBatchedHttpRequests: true, // ← enables array body POST
  // ...
});
```

**Client**: `BatchHttpLink` from `@apollo/client/link/batch-http`:

```typescript
import { BatchHttpLink } from "@apollo/client/link/batch-http";

const httpLink = new BatchHttpLink({
  uri: "/api/graphql",
  credentials: "include",
});
```

**Link chain order** (CRITICAL):

```
errorLink → connectivityLink → authLink → PersistedQueryLink → BatchHttpLink
```

### Rules

- `BatchHttpLink` is imported from `@apollo/client/link/batch-http` — NOT from root `@apollo/client` (not exported there), NOT from `@apollo/client/link/batch` (that exports `BatchLink`, the non-HTTP variant)
- `PersistedQueryLink` MUST chain BEFORE `BatchHttpLink` — APQ hashes resolve before batch assembly. If `BatchHttpLink` came first, each batch entry would carry full query text (defeating APQ)
- APQ + batching are fully compatible — each batch entry is resolved independently by Apollo Server
- No changes to APQ settings (`persistedQueries.cache`, `ttl: null`) needed
- `BatchHttpLink` accepts the same `HttpOptions` as `HttpLink` plus optional `batchInterval`, `batchMax`, `batchKey`

### Anti-Patterns

- **Importing `BatchHttpLink` from `@apollo/client`** — TypeScript error: `TS2305: Module '"@apollo/client"' has no exported member 'BatchHttpLink'`
- **Putting `BatchHttpLink` before `PersistedQueryLink`** in the chain — batch assembles before APQ transforms, each entry carries full query text

---

## 10. Poll Interval + Idle Detection (Phase D)

### Problem

`me` query polled every 60s even when the user was idle or the tab was hidden.

### Pattern

**Poll interval 120s** (`@/frontend/common/views/dashboard/components/DashboardClientBridge.tsx`):

```typescript
export const NOTIFICATION_COUNT_POLL_INTERVAL_MS = 120_000; // was 60_000
```

**`useIdleDetection` hook** — 5 min idle pauses polling:

```typescript
const isIdle = useIdleDetection();
const pollInterval = isIdle ? 0 : NOTIFICATION_COUNT_POLL_INTERVAL_MS;
```

**`visibilitychange` handler** — pause when tab hidden:

```typescript
const handleVisibility = () => {
  if (document.hidden) {
    setIsIdle(true);
    return; // don't reset timer when hidden
  }
  // ... reset activity ...
};
```

**Resume + refetch on activity**:

```typescript
const wasIdleRef = useRef(false);
// On activity return: wasIdleRef triggers immediate refetch()
```

### Rules

- `NOTIFICATION_COUNT_POLL_INTERVAL_MS` is 120s (from 60s)
- 5 min idle (`IDLE_TIMEOUT_MS = 300_000`) → `pollInterval: 0` (paused)
- `visibilitychange` checks `document.hidden` — pause immediately when hidden, don't reset timer
- `wasIdleRef` triggers immediate `refetch()` when transitioning from idle to active
- All event listeners use `{ passive: true }` and are cleaned up in `useEffect` return
- `markAlertsRead` refetch handled by existing `REFETCH_QUERIES` pattern in `useNotificationsDrawerViewModel.ts`

### Anti-Patterns

- **Resetting idle timer on `visibilitychange` when hidden** — keeps polling active in background tabs
- **Not refetching on resume** — stale data after long idle periods

---

## 11. Singleton Persistence (Phase F)

### Pattern

`getGlobalSingleton` pattern confirmed for critical cold-start resources:

```typescript
// Env validation (backend/lib/env.ts)
const ENV_KEY = Symbol.for("siraj.env");
return getGlobalSingleton(ENV_KEY, () => validateEnvironment());

// DB client (backend/db/drizzleDb.ts)
const DB_KEY = Symbol.for("siraj.db");
export const db = getGlobalSingleton(DB_KEY, initDatabase);

// DB pool (backend/db/drizzleDb.ts)
const DB_POOL_KEY = Symbol.for("siraj.dbPool");
return getGlobalSingleton(DB_POOL_KEY, () => createPool());

// Cache service (backend/services/cache/CacheServiceFactory.ts)
const CACHE_STATE_KEY = Symbol.for("siraj.cacheState");
return getGlobalSingleton(CACHE_STATE_KEY, () => ({ instance: null, initializationPromise: null }));
```

### Rules

- All four singletons persist across warm invocations via `Symbol.for("siraj.*")` keys in `globalThis`
- On warm invocation, `getGlobalSingleton` short-circuits on `store.has(key)` — no re-evaluation
- `neonWsConfigured` boolean guard added to `configureNeonWebSocket()` for idempotency:

```typescript
let neonWsConfigured = false;
function configureNeonWebSocket(): void {
  if (neonWsConfigured) return;
  neonConfig.webSocketConstructor = ws;
  neonWsConfigured = true;
}
```

- Cache service uses promise-based initialization guard (`initializationPromise ??= ...`) so concurrent warm invocations await the same init promise
- **3-4s cold-start is irreducible** without Vercel provisioned concurrency — it is the actual one-time initialization work (env validation, DB pool, DB client, cache service)

---

## 12. Deferred: url.parse Deprecation (Phase G)

### Finding

`@as-integrations/next@4.1.0` uses deprecated `url.parse()` at `startServerAndCreateNextHandler.js:95`. This is the latest version — no fix available. Upstream issue [#320](https://github.com/apollo-server-integrations/apollo-server-integration-next/issues/320) is open.

### Impact

LOW — cosmetic deprecation warning only (Node.js DEP0169). Fires once per cold container on first GraphQL request. No functional or security impact.

### Resolution

Accept as known upstream issue. Monitor for fix. If `url.parse` is removed in a future Node.js LTS, apply one-line patch via `patch-package`:

```javascript
// Replace: (0, url_1.parse)(req.url).search
// With:    new URL(req.url, "http://localhost").search
```

---

## Summary: Performance Impact

| Phase | Optimization | Before | After | Saving |
|-------|--------------|--------|-------|--------|
| A1 | Permission context overload | 3 DB queries per `hasPermission` | 0 DB queries | 3 queries/call |
| A2 | Lazy scopeAuth `superAdmin` | 3 DB queries per request (eager) | 0 DB queries (lazy, 0 when not impersonating) | 3 queries/request |
| A3 | `safeUser` on BaseContext | 1 DB query per `Query.me` | 0 DB queries | 16 queries/hour |
| B | Env-config pre-warm | 1 DB query per env-config key on cold start | 0 DB queries (from `process.env`) | N queries/cold start |
| C | refreshToken user reuse | 1 DB query per `refreshToken` | 0 DB queries (non-impersonating) | 1 query/call |
| C2 | `skipUserCheck` in `validateSession` | 1 DB query per `refreshToken` | 0 DB queries | 1 query/call |
| D | Poll interval 120s + idle pause | 60s poll, always active | 120s poll, paused when idle | 50%+ reduction |
| E | Client log batching 30s | 2s batch, no unload flush | 30s batch, `keepalive` flush | 15x fewer POSTs |
| E2 | HTTP batching | 8 individual POSTs per page | 1 batched POST | 8→1 invocations |
| E3 | Session dedup | 2 `findSessionById` per request | 1 per request | 1 Redis read/request |
| F | Singleton persistence | Verified existing | `neonWsConfigured` guard | Irreducible 3-4s cold-start |

---

## Test Results

87 tests passing across all phases:

| Phase | Tests | File |
|-------|-------|------|
| A1 | 12 | `backend/services/auth/test/permissions.service.test.ts` |
| A2 | 16 | `backend/graphql/test/gqlSchemaBuilder.scopeAuth.test.ts` |
| A3 | 11 | `backend/graphql/query/auth/test/auth.query.test.ts` |
| B | 4 | `backend/services/system/test/environment-config.service.test.ts` |
| C | 2 | `backend/graphql/mutation/auth/test/auth.mutation.test.ts` |
| C2 | 3 (+4 existing) | `backend/services/auth/test/session.service.test.ts` |
| D | 3 | `test/ui/components/DashboardClientBridge.test.tsx` |
| E | 6 + 14 | `test/ui/components/RequirePermission.test.tsx` + `frontend/common/lib/logger/test/logger.test.ts` |
| E2 | 9 | `frontend/common/graphql/test/batching.test.ts` |
| E3 | 12 | `backend/graphql/test/gqlContext.dedup.test.ts` |

Post-implementation review: 0 critical/high findings, 1 medium + 1 low (both fixed).
