# Outcome: Task 8 - Cache Tag Invalidation & Provider Integration Tests

## Summary
Created integration test `backend/db/test/logic/shared/cache_tag_invalidation.test.ts` verifying tag index population, targeted tag invalidation (`invalidateTag`), and grouped invalidation (`invalidateParentWrite`). Created live provider smokes under `test/integration/redis/` (`redis_adapter.integration.test.ts` and `redis_factory_fallback.integration.test.ts`).

## Details of Changes
1. **`backend/db/test/logic/shared/cache_tag_invalidation.test.ts`**:
   - Added test suite populating 4 cached items across different tags (`parentDirectory`, `teacherDirectory`, `parent:byUserId:${userId}`, `parent:dash:metrics:${parentId}`).
   - Verified `invalidateTag("parentDirectory")` invalidates parent directory cache while leaving teacher directory intact.
   - Verified `invalidateParentWrite(parentId, userId)` invalidates parent-by-user-id and parent dashboard metrics while leaving teacher directory intact.
2. **`test/integration/redis/redis_adapter.integration.test.ts`**:
   - Provider smoke test for `RedisCacheAdapter` (ping, set, get, del cycle) gated by `process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL`.
3. **`test/integration/redis/redis_factory_fallback.integration.test.ts`**:
   - Provider smoke test for `cacheService` (ping and stats calls).

## Verification Results
- `bun run scripts/run-test/run-test.ts backend/db/test/logic/shared/cache_tag_invalidation.test.ts`: Passed (1 pass, 0 fail, 9 expect calls)
- `bun tsgo`: Passed (0 errors)
- `bun biome:check`: Passed (0 errors)
- Lint Queue (`phase8`): Passed (`success: true`, exit code 0)
