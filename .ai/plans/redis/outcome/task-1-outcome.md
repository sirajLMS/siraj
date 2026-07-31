# Outcome: Task 1 - PG Adapter & Repository Tightening

## Summary
Tightened `CacheDbRepository` and `PostgresCacheAdapter` for atomic increments, SQL-level expiration filtering, and explicit key routing.

## Details of Changes
1. **Single-statement atomic `incr`**:
   Rewrote `CacheDbRepository.incr` using Drizzle `insert().onConflictDoUpdate()` with `sql`(${table.value}::int + 1)::text`` and `expiresAt: sql`EXCLUDED.expires_at``.
2. **`setExpiry` method**:
   Added `CacheDbRepository.setExpiry(key, expiresAt)` performing an atomic UPDATE returning updated row count. Wired `PostgresCacheAdapter.expire` to this new method.
3. **SQL-level expiry filter in `get`**:
   Updated `CacheDbRepository.get` to filter `gte(table.expiresAt, now)` at the SQL query level and removed the inline `await del(key)` JS cleanup call.
4. **Key routing for `ec:` and `tag:`**:
   Extended `getTable(key)` to explicitly route `ec:` and `tag:` prefixes to `sessionCache`. Added unit test coverage in `backend/db/test/logic/shared/cache_split_routing.test.ts`.

## Verification Results
- `bun tsgo`: Passed with 0 errors
- `bun biome:check`: Passed with 0 errors
- Lint Queue (`phase1`): Passed with 0 errors
- `cache_split_routing.test.ts`: Passed all 5 tests
