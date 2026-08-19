# Plan Review Round 3: Environment-Config Cold-Start Resilience

## Date
2026-08-19

## Trigger
User requested adding `backend/services/system/environment-config.service.ts` to the plan to guarantee reading configs from the correct place when DB is cold starting.

## Investigation

### What was found

`resolveEnvConfig()` in `environment-config.service.ts` already has a DB error try/catch (lines 272-284) with env fallback. However, two cold-start issues were identified:

#### Issue 1: Incorrect `source: "db"` on DB failure (line 292)
When the DB lookup fails (cold start timeout) and we fall back to `process.env`, the cache entry is tagged `source: "db"` (authoritative). This is semantically wrong — the DB didn't confirm anything. Consequences:
- The system won't retry the DB lookup for 5 minutes (TTL)
- A DB override set via Settings UI during the cold-start window won't be picked up until the cache expires
- The `source: "db"` tag violates the documented contract (line 137-141): `"db"` = "resolved via DB lookup (authoritative — correct precedence confirmed)"

#### Issue 2: No transient error detection
The DB error catch (line 277) treats all DB failures identically. A cold-start timeout should use a **shorter TTL** (e.g. 30s) so the DB is re-queried sooner, while a real database error can use the full 5-minute TTL.

### Full chain trace
```
resolveEnvConfig("CACHE_PROVIDER")
  → cache check (source: "env" → non-authoritative, falls through)
  → DB lookup: SystemSettingsRepository.getByKey("env::CACHE_PROVIDER")
  → getByKey uses queryDb() (Neon HTTP) — already on fast path
  → if DB succeeds: cache as source: "db" (authoritative) ✅
  → if DB fails (cold start): catch → fall back to process.env → cache as source: "db" (BUG)
  → if DB misses (no row): cache as source: "db" (authoritative, correct) ✅
```

### Existing mitigation (already in place)
- `preWarmEnvConfigCache()` at module load pre-populates cache with `process.env` values tagged `source: "env"` — so `process.env.CACHE_PROVIDER` is available immediately
- `resolveEnvConfig` already falls back to `process.env` on DB error (line 278-283)
- `getCacheProvider()` falls back to `getEnvironmentConfig().cacheProvider` (env-validated default) when `resolveEnvConfig` returns `undefined`
- `SystemSettingsRepository.getByKey` already uses `queryDb()` (Neon HTTP) — minimal cold-start latency

### What the fix adds
1. Correct `source` tagging: `"env"` on DB failure (non-authoritative), `"db"` on success/miss (authoritative)
2. Short TTL (30s) for transient DB failures to retry DB sooner
3. `isTransientError` import from the retry utility (Phase 1) for cold-start detection

## Changes to Plan

### specs.md
- Added AC5 and AC6 to Requirement 3 covering `resolveEnvConfig` source tagging and TTL behavior
- Updated dependencies to reference the retry utility from Phase 1

### design.md
- Added Component 6: Environment-Config Cold-Start Resilience
- Full resolution chain table showing DB state → cache source, TTL, retry timing
- Cold-start scenario walkthrough for `CACHE_PROVIDER`
- Implementation notes for both single-key and batch paths

### tasks.md
- Added Phase 3.5 with 3 tasks:
  - 3.5.1: Fix cache `source` tag when DB lookup fails
  - 3.5.2: Add short-TTL retry for transient DB failures
  - 3.5.3: Verify `CACHE_PROVIDER` resolution handles cold start correctly
- Updated AGENTS.md reference table to include `backend/services/system/**/*.ts`

### Task count
- Phase 3.5: 3 new tasks
- Total: 23 → 26 tasks

## Conclusion
The environment-config service already handles DB cold starts decently (try/catch + env fallback + pre-warming). The fix makes it **correct** (proper source tagging) and **faster** (30s retry for transient failures instead of 5-minute blind spot). This ensures DB overrides are picked up as soon as the DB becomes available, not 5 minutes later.
