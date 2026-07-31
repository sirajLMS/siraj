# Outcome: Task 3 - Barrel Export + ICacheService stats Interface

## Summary
Re-exported all public `EntityCacheService` functions from `backend/services/cache/index.ts`, added `stats(): Promise<CacheStats>` to `ICacheServiceBase`, and implemented `stats()` across `PostgresCacheAdapter`, `RedisCacheAdapter`, `BaseRedisAdapter`, `CacheServiceFactory`, and `RedisServiceFactory`.

## Details of Changes
1. **`CacheInterface.ts`**:
   - Defined `interface CacheStats { provider: string; size: number; hitsByPrefix: Record<string, { hits: number; misses: number }>; }`.
   - Extended `ICacheServiceBase` with `stats(): Promise<CacheStats>`.
2. **`PostgresCacheAdapter.ts`**:
   - Implemented `stats()` returning `provider: "postgres"`, row count of `session_cache` as `size`, and `getEntityCacheStats()`.
3. **`RedisCacheAdapter.ts` & `BaseRedisAdapter.ts`**:
   - Implemented `stats()` delegating to underlying client `dbsize()` (if available) and `getEntityCacheStats()`.
4. **`CacheServiceFactory.ts` & `RedisServiceFactory.ts`**:
   - Forwarded `stats()` call in singleton `cacheService` and `redisService` objects to the resolved adapter instance.
5. **`backend/services/cache/index.ts`**:
   - Exported `cachedRead`, `cachedReadSingleFlight`, `invalidateTag`, `invalidateTags`, `invalidateParentWrite`, `invalidateTeacherWrite`, `invalidateClassLifecycle`, `invalidateRoleChange`, `stableStringify`, `getEntityCacheStats`.

## Verification Results
- `bun tsgo`: Passed (0 errors)
- `bun biome:check`: Passed (0 errors)
- Lint Queue (`phase3`): Passed (`success: true`, exit code 0)
