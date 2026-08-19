# Phase B Outcome — Pre-Warm env-config Cache

## Summary

Implemented the env-config cache pre-warm feature that populates the module-scoped in-memory cache Map with `process.env` values for all DB-eligible env-config keys at module load. This eliminates cold-start DB queries for keys whose env-fallback value is sufficient.

## Files Modified

| File | Change |
|------|--------|
| `backend/services/system/environment-config.service.ts` | Added `preWarmEnvConfigCache()` function (lines 172–186) and module-load try/catch call (lines 657–675) |
| `backend/services/system/test/environment-config.service.test.ts` | **Created** — paired unit test with 4 test cases |
| `.ai/plans/vercel-logs-performance-fix/trackable-tasks.md` | Updated checkboxes B1.1–B1.6 to `[x]` |

## Approach

### B1.1: `preWarmEnvConfigCache()` function

The function iterates the `ENV_CONFIG_KEYS` registry (imported from `@/backend/lib/env-config-keys`). For each descriptor where `excludeFromDb === false`, it calls `readFromProcessEnv(descriptor.key)` — the same helper used by `resolveEnvConfig()`, which treats empty strings as unset. If the env value is non-undefined, the function populates the cache using the same `CacheEntry` shape (`{ value, expiresAt }`) and the same TTL (`getCacheTtlMs()`) as `resolveEnvConfig()`, ensuring `invalidateEnvConfigCache()` evicts pre-warmed entries identically to lazily-populated ones.

**Adaptation from plan**: The task description specified `cache.set(key, { value: envValue, source: "env", timestamp: Date.now() })`, but the actual `CacheEntry` interface uses `{ value: string | undefined; expiresAt: number }` — there is no `source` or `timestamp` field. The function was adapted to use the real interface with `expiresAt: now + getCacheTtlMs()` (matching `resolveEnvConfig`).

### B1.2: Module-load pre-warm call

At the bottom of `environment-config.service.ts`, a try/catch block calls `preWarmEnvConfigCache()`. On failure, it logs a warning via `logger.warn` and continues — the normal `resolveEnvConfig()` lazy resolution path handles any keys that weren't pre-warmed.

### B1.3: `invalidateEnvConfigCache()` verification

Verified that `invalidateEnvConfigCache(key?)` correctly invalidates pre-warmed entries:
- **No key arg**: `cache.clear()` — clears the entire Map, including all pre-warmed entries.
- **With key**: `cache.delete(key)` — removes the specific entry, including pre-warmed ones.

No code change was needed — pre-warmed entries use the identical `CacheEntry` shape as lazily-populated entries.

### B1.4: Paired unit test

Created `backend/services/system/test/environment-config.service.test.ts` with 4 test cases:

1. **Pre-warm populates cache for env-fallback keys** — Sets `STORAGE_PROVIDER=s3`, calls `preWarmEnvConfigCache()`, spies on `SystemSettingsRepository.getByKey`, verifies `resolveEnvConfig` returns `"s3"` WITHOUT the spy being called (proving cache hit, no DB query).
2. **Pre-warm skips keys without env value** — Unsets `STORAGE_PROVIDER`, calls `preWarmEnvConfigCache()`, mocks `getByKey` to return null, verifies `resolveEnvConfig` returns `undefined` WITH the spy being called (proving cache miss → DB query).
3. **`resolveEnvConfig` returns pre-warmed value without DB query** — Sets `FX_PROVIDER=fixer`, calls `preWarmEnvConfigCache()`, spies on `getByKey`, verifies `resolveEnvConfig` returns `"fixer"` WITHOUT the spy being called.
4. **DB override works after cache invalidation** — Sets `STORAGE_PROVIDER=s3`, calls `preWarmEnvConfigCache()`, then `invalidateEnvConfigCache(TEST_KEY)` to evict the pre-warmed entry, mocks `getByKey` to return a DB override value `"gcs"`, verifies `resolveEnvConfig` returns `"gcs"` WITH the spy being called (proving DB override takes effect after invalidation).

**Test approach**: Tests import the service module (triggering the module-load pre-warm once), then in `beforeEach` call `invalidateEnvConfigCache()` to clear the cache for deterministic testing. `process.env` values are saved in `beforeEach` and restored in `afterEach` via `Reflect.deleteProperty` (to avoid TypeScript `delete` errors on non-optional typed env vars).

## Test Results

```
backend/services/system/test/environment-config.service.test.ts:
(pass) environment-config.service — pre-warm cache > preWarmEnvConfigCache populates cache for env-fallback keys [2.65ms]
(pass) environment-config.service — pre-warm cache > preWarmEnvConfigCache skips keys without env value [0.72ms]
(pass) environment-config.service — pre-warm cache > resolveEnvConfig returns pre-warmed value without DB query [8.49ms]
(pass) environment-config.service — pre-warm cache > DB override works after cache invalidation [0.27ms]

 4 pass
 0 fail
 8 expect() calls
Ran 4 tests across 1 file. [1094.00ms]
```

## Quality Loop Results

| File | tsgo | oxlint | biome | lint:type-aware | duplicates | codescene |
|------|------|--------|-------|-----------------|-----------|----------|
| `environment-config.service.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `environment-config.service.test.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Cross-File Dependencies

None discovered. All modifications were contained to:
- `backend/services/system/environment-config.service.ts` (existing file)
- `backend/services/system/test/environment-config.service.test.ts` (new test file)

## Semantic Review Checklist

- ✅ All `resolveEnvConfig("<KEY>")` calls have matching entries in `env-config-keys.ts` — the pre-warm function iterates the same `ENV_CONFIG_KEYS` registry used by `resolveEnvConfig`, ensuring only registered keys are pre-warmed.
- ✅ `invalidateEnvConfigCache()` invalidates ALL pre-warmed keys — `cache.clear()` clears the entire Map; `cache.delete(key)` removes individual entries. Both paths handle pre-warmed entries identically to lazily-populated ones.
- ✅ `excludeFromDb` keys are never pre-warmed — the function explicitly skips descriptors with `excludeFromDb: true`, maintaining the hard contract that env-only keys bypass both DB and cache.
- ✅ Pre-warmed entries expire at the same TTL as lazily-populated entries — both use `getCacheTtlMs()`, ensuring consistent cache behavior.
