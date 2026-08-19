# Phase F — Cold-Start Singleton Persistence Audit

**Phase:** F (R3-5: Audit Only)  
**Date:** 2026-08-18T23:51:35+03:00  
**Requirement:** Req 8 — Verify Cold-Start Singleton Persistence  
**Outcome:** Audit complete; one minor idempotency guard added to `configureNeonWebSocket`.

---

## F1.1 — Env Validation Singleton ✅ CONFIRMED

**File:** `backend/lib/env.ts`  
**Line:** 484

```ts
const ENV_KEY = Symbol.for("siraj.env"); // line 455

export function ensureEnvironmentValidated(): EnvironmentConfig {
  return getGlobalSingleton(ENV_KEY, () => {
    cachedConfig = validateEnvironment();
    warnIfVercelDatabaseUrlNotPooled(cachedConfig.databaseUrl);
    return cachedConfig;
  });
}
```

- `getGlobalSingleton(ENV_KEY, …)` guards the `validateEnvironment()` call so it runs once per container lifetime.
- `getEnvironmentConfig()` returns `cachedConfig ?? ensureEnvironmentValidated()` — warm path reads the module-level cache without touching the global store.
- **No code change needed.**

---

## F1.2 — DB Client & Pool Singletons ✅ CONFIRMED

**File:** `backend/db/drizzleDb.ts`

### DB Client (line 38)

```ts
const DB_KEY = Symbol.for("siraj.db");

export const db = getGlobalSingleton(DB_KEY, initDatabase);
```

- `initDatabase()` runs `ensureEnvironmentValidated()` + `resolveConnectionStrategy()` + `createDatabase()` exactly once per container. Subsequent `db` reads short-circuit on the global store.
- The HTTP stateless DB handle (`getStatelessHttpDb`) is also singleton-guarded via `HTTP_DB_KEY` at line 41.

### DB Pool (line 68)

```ts
const DB_POOL_KEY = Symbol.for("siraj.dbPool");

export function getDrizzleDbPool(): ReturnType<typeof createPool> | null {
  try {
    return getGlobalSingleton(DB_POOL_KEY, () => createPool());
  } catch {
    return null;
  }
}
```

- `createPool()` runs at most once per container; warm invocations reuse the cached `Pool`.
- `clearDbConnectionSingleton()` is provided for DB CLI workflows, not request paths.
- **No code change needed.**

---

## F1.3 — Cache Service Singleton ✅ CONFIRMED

**File:** `backend/services/cache/CacheServiceFactory.ts`  
**Line:** 16

```ts
const CACHE_STATE_KEY = Symbol.for("siraj.cacheState");

function getCacheState(): CacheState {
  return getGlobalSingleton(CACHE_STATE_KEY, () => ({
    instance: null,
    initializationPromise: null,
  }));
}

export const getCacheService = async (): Promise<ICacheService> => {
  const state = getCacheState();
  if (state.instance) return state.instance;
  state.initializationPromise ??= (async () => { … })();
  return state.initializationPromise;
};
```

- The `CacheState` object is singleton via `getGlobalSingleton(CACHE_STATE_KEY, …)`.
- Within that state, `getCacheService()` uses a promise-based initialization guard (`initializationPromise ??= …`) so concurrent warm invocations await the same init promise instead of re-initializing the adapter.
- `resetCacheService()` clears both the state and the env-config cache entry — used for tests and settings writes, not request paths.
- **No code change needed.**

---

## F1.4 — `configureNeonWebSocket()` Idempotency ✅ GUARD ADDED (minor)

**File:** `backend/db/factory.ts`  
**Line:** 25 (original)

### Before

```ts
function configureNeonWebSocket(): void {
  neonConfig.webSocketConstructor = ws;
}
```

The function was called from `createNeonDb()` (line 43) and `createPool()` (line 97). Each call assigned `neonConfig.webSocketConstructor = ws` unconditionally. Because `createDatabase()` and `createPool()` are each already guarded by their own `getGlobalSingleton` wrappers in `drizzleDb.ts`, the function would normally only execute once per container. However, the function itself had no internal guard — if ever called directly (e.g. from a future caller or a code path outside the singleton wrapper), it would reassign `webSocketConstructor` on every call.

### Change Applied

Added a boolean guard so the assignment runs at most once per container lifetime:

```ts
let neonWsConfigured = false;

function configureNeonWebSocket(): void {
  if (neonWsConfigured) return;
  neonConfig.webSocketConstructor = ws;
  neonWsConfigured = true;
}
```

This is a defensive, low-risk change: the assignment was already idempotent in effect, but the guard makes the intent explicit and avoids redundant writes on any path that might call `configureNeonWebSocket` without going through the singleton wrappers.

### Files Modified

- `backend/db/factory.ts` — added `neonWsConfigured` guard flag (3 lines added)

---

## F1.5 — Irreducible Cold-Start Acknowledgment

The 3–4 second cold-start cost observed in Vercel logs is the **actual initialization work** that happens exactly once per cold container:

1. **Env validation** — `validateEnvironment()` parses and validates ~50+ environment variables. Guarded by `getGlobalSingleton(ENV_KEY)`.
2. **DB pool creation** — `new Pool({ … })` establishes the PostgreSQL/Neon connection pool. Guarded by `getGlobalSingleton(DB_POOL_KEY)`.
3. **DB client init** — `drizzle*({ client: pool, relations })` constructs the ORM client. Guarded by `getGlobalSingleton(DB_KEY)`.
4. **Cache service init** — `createCacheService()` connects to Redis/PostgreSQL cache adapter. Guarded by `getGlobalSingleton(CACHE_STATE_KEY)` + promise-based init guard.

All four singletons persist across warm invocations within the same container via the `Symbol.for("siraj.*")` keys in `globalThis`. On a warm invocation, `getGlobalSingleton` short-circuits on `store.has(key)` and returns the cached value without re-evaluating the factory.

**This cold-start cost is irreducible** without Vercel provisioned concurrency (which keeps containers warm between requests). No further code-level optimization can eliminate the one-time init cost — it is inherent serverless behavior.

---

## Summary

| Task | File | Status | Code Change? |
|------|------|--------|-------------|
| F1.1 — Env validation singleton | `backend/lib/env.ts:484` | ✅ Confirmed | No |
| F1.2 — DB client singleton | `backend/db/drizzleDb.ts:38` | ✅ Confirmed | No |
| F1.2 — DB pool singleton | `backend/db/drizzleDb.ts:68` | ✅ Confirmed | No |
| F1.3 — Cache service singleton | `backend/services/cache/CacheServiceFactory.ts:16` | ✅ Confirmed | No |
| F1.4 — `configureNeonWebSocket` idempotency | `backend/db/factory.ts:25` | ✅ Guard added | Yes (minor — 3 lines) |
| F1.5 — Outcome file | this file | ✅ Written | N/A |

**Acceptance Criteria Status (Req 8):**

| AC | Description | Status |
|----|-------------|--------|
| AC#1 | Env validation uses `getGlobalSingleton` (`env.ts:484`) | ✅ Verified |
| AC#2 | DB client uses `getGlobalSingleton` (`drizzleDb.ts:38`), pool uses `getGlobalSingleton` (`drizzleDb.ts:68`) | ✅ Verified |
| AC#3 | Cache service uses `getGlobalSingleton` (`CacheServiceFactory.ts:16`) | ✅ Verified |
| AC#4 | `configureNeonWebSocket()` idempotent — guard added | ✅ Fixed |
| AC#5 | `resolveEnvConfig()` calls minimized during init | ✅ Handled by Req 2 (env-config pre-warm) — out of scope for Phase F |
| AC#6 | Document 3–4s cold-start as irreducible | ✅ Documented above |

---

*This was primarily a read-only audit phase. The only code change is a defensive boolean guard on `configureNeonWebSocket()` in `backend/db/factory.ts`.*
