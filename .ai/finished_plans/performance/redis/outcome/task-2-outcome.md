# Outcome: Task 2 - EntityCacheService Core + Unit Tests

## Summary
Created `backend/services/cache/EntityCacheService.ts` providing domain-aware caching with identity+role-scoped key support, tag index tracking (`safeIndexTags`), tag-based pipelined invalidation (`invalidateTag`, `invalidateTags`), named invalidation helpers (`invalidateParentWrite`, `invalidateTeacherWrite`, `invalidateClassLifecycle`, `invalidateRoleChange`), single-flight concurrent miss deduplication (`cachedReadSingleFlight`), canonical JSON serialization (`stableStringify`), hit/miss metrics (`getEntityCacheStats`), and 100% passing unit tests.

## Details of Implementation
1. **`EntityCacheService.ts`**:
   - `cachedRead<T>`: checks `cacheService`, validates `CacheEntry<T>` with `CACHE_VERSION = 1`, self-heals tag index on hit, falls through fail-open to loader on miss or error. Enforces `ttlSeconds <= CACHE_TAG_INDEX_TTL` (86400s).
   - `cachedReadSingleFlight<T>`: uses `insertIfNotExists` on Postgres or `SET NX EX` on Redis to prevent thundering herd writeback on concurrent misses.
   - `safeIndexTags`: appends cache key to `tag:<tag>` array in `cacheService` with 86400s TTL. Never throws.
   - `invalidateTag`: pipeline `del` of tagged keys and tag key in a single adapter call. Resets tag key to `"[]"`. Swallows errors and logs.
   - Named helpers: `invalidateParentWrite`, `invalidateTeacherWrite`, `invalidateClassLifecycle`, `invalidateRoleChange`.
   - `stableStringify`: produces deterministic JSON strings regardless of key insertion order.
2. **`EntityCacheService.test.ts`**:
   - 13 comprehensive unit tests covering hits, misses, version mismatches, malformed JSON, single-flight, tag index deduplication, pipelined invalidation, and TTL guard.

## Verification Results
- `bun tsgo`: Passed (0 errors)
- `bun biome:check`: Passed (0 errors)
- Lint Queue (`phase2`): Passed (`success: true`, exit code 0)
- `bun test backend/services/cache/test/EntityCacheService.test.ts`: Passed all 13 tests (0 failures)
