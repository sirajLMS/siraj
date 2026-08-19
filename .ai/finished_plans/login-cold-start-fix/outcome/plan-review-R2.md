# Plan Review Round 2: Login Cold Start Fix (Deep Refinement)

## Date
2026-08-19

## Methodology
R1 verified AGENTS.md compliance (type imports, i18n, logging, etc.). R2 goes deeper: read actual source files for every operation in the login flow, traced the cache cold-start chain via explore subagent, and verified DB paths (`queryDb()` vs `db.execute()`) for each repository method. Also traced the frontend error flow from Apollo mutation → AuthProvider → useLoginViewModel.

## Findings (7 total — all fixed)

### R2-01: `recordAttempt` and `resetAttempts` use `db.execute()` (pooled) — HIGH cold-start vulnerability
- **Layer**: backend/db/repo + backend/graphql
- **Files**: `backend/db/repo/shared/ratelimit.repository.ts` lines 14, 57; `backend/graphql/mutation/auth/auth.mutation.ts` lines 238, 250, 271
- **Issue**: The plan only identified `checkRateLimit` and `isLocked` as cold-start failure points. But `recordAttempt` (called at lines 238, 250) and `resetAttempts` (line 271) both use `db.execute()` — the **pooled** database, NOT `queryDb()` (Neon HTTP). These are the actual high-risk cold-start operations because they wait for the WebSocket pool to initialize.
- **Action**: Added tasks 2.4 and 2.5 to wrap `recordAttempt` and `resetAttempts` in try/catch with fail-open. Updated design.md Component 2 with a cold-start vulnerability map table. Updated error categories table.
- **Status**: ✅ Fixed

### R2-02: `AuthProvider.login()` discards `extensions.code` — frontend retry cannot detect `SERVICE_UNAVAILABLE`
- **Layer**: frontend/providers + frontend/views
- **Files**: `frontend/common/providers/apollo/AuthProvider.tsx` lines 119-122; `frontend/common/utils/errorUtils.ts` lines 10-21
- **Issue**: The plan (R1 task 4.1) said "investigate error code propagation" but didn't have the answer. R2 traced the full error flow: `AuthProvider.login()` catches the Apollo mutation error, calls `getGraphQLErrorMessage(error, t.signinFailed)` which extracts ONLY the message string (line 121 of errorUtils.ts — `return first.message`), sets `setError(messageString)`, and returns `false`. The `extensions.code` is **completely lost**. The ViewModel receives `boolean` + `string`, no way to check `SERVICE_UNAVAILABLE`.
- **Action**: Updated design.md Component 4 with the full error flow trace and 3 implementation options. Chose Option A — use Apollo `useMutation` directly in `useLoginViewModel` (the file already does this for `demoLoginMutation`). Updated tasks 4.1 and 4.2 with concrete implementation steps including `CombinedGraphQLErrors.is(error)` and `error.errors[0]?.extensions?.code` extraction.
- **Status**: ✅ Fixed

### R2-03: Cache cold-start chain already has pre-warming — less severe than originally assumed
- **Layer**: backend/services/cache
- **Files**: `backend/services/cache/CacheServiceFactory.ts`, `backend/services/system/environment-config.service.ts`
- **Issue**: The original analysis assumed the cache cold-start chain (`getCacheService()` → `getCacheProvider()` → `resolveEnvConfig("CACHE_PROVIDER")` → DB query) was a per-request cold-start issue. The explore subagent found that:
  - `resolveEnvConfig` has a **pre-warming mechanism** (`preWarmEnvConfigCache`) at module load
  - It has a **5-minute TTL in-memory cache** (`Map<string, CacheEntry>`)
  - `getCacheService()` uses a **global singleton** — initialization runs once per process
  - The cache cold start is a **one-time hit**, not per-request
- **Action**: Updated design.md security analysis to note existing cache cold-start mitigation. Softened the language: the primary cold-start risk is the **pooled DB** (`db.execute()` in `recordAttempt`/`resetAttempts` and pool initialization), not the cache service.
- **Status**: ✅ Fixed

### R2-04: `isLocked` already uses `queryDb()` — already on Neon HTTP path
- **Layer**: backend/db/repo
- **File**: `backend/db/repo/shared/ratelimit.repository.ts` line 37
- **Issue**: The plan treated `isLocked` as a cold-start vulnerability, but it already uses `queryDb()` (Neon HTTP). Its cold-start risk is minimal.
- **Action**: Updated design.md Component 2 to note `isLocked` is already HTTP-routed (secondary defense). Updated tasks 2.2 with the same note.
- **Status**: ✅ Fixed

### R2-05: `PostgresCacheAdapter` uses `queryDb()` — cache ops already on Neon HTTP path
- **Layer**: backend/services/cache
- **File**: `backend/services/cache/PostgresCacheAdapter.ts` (all methods delegate to `CacheDbRepository` which uses `queryDb()`)
- **Issue**: The original analysis assumed cache operations had a pooled DB cold-start dependency. They don't — `PostgresCacheAdapter` → `CacheDbRepository` → `queryDb()` (Neon HTTP).
- **Action**: Updated design.md security analysis to note cache get/set/incr already use `queryDb()`.
- **Status**: ✅ Fixed

### R2-06: `specs.md` AC5 references `trackable-tasks.md` — file is `tasks.md`
- **Layer**: plan-docs
- **File**: `.ai/plans/login-cold-start-fix/specs.md` line 53
- **Issue**: Cross-reference to wrong filename
- **Action**: Fixed to `tasks.md`
- **Status**: ✅ Fixed

### R2-07: Design Component 3 body still had old content (already partially fixed in R1)
- **Layer**: design-docs
- **File**: `.ai/plans/login-cold-start-fix/design.md`
- **Issue**: R1 added "ALREADY IMPLEMENTED" header but the Implementation Notes section still described modifying `findByEmail`
- **Action**: R1 already replaced the body with current implementation code. Verified correct in R2.
- **Status**: ✅ Already fixed

## Summary

| Finding | Severity | Layer | Status |
|---------|----------|-------|--------|
| R2-01: `recordAttempt`/`resetAttempts` use pooled `db` | **HIGH** | backend/graphql | ✅ Fixed (tasks 2.4, 2.5) |
| R2-02: AuthProvider discards `extensions.code` | **HIGH** | frontend/views | ✅ Fixed (tasks 4.1, 4.2) |
| R2-03: Cache cold-start less severe than assumed | Medium | backend/cache | ✅ Fixed (design updated) |
| R2-04: `isLocked` already on Neon HTTP | Low | backend/db/repo | ✅ Fixed (design updated) |
| R2-05: Cache adapter already on Neon HTTP | Low | backend/cache | ✅ Fixed (design updated) |
| R2-06: Wrong filename in specs.md | Low | plan-docs | ✅ Fixed |
| R2-07: Design Component 3 stale content | Low | design-docs | ✅ Already fixed |

## Impact on Task Count

- Phase 2: 4 tasks → 6 tasks (added 2.4 recordAttempt, 2.5 resetAttempts)
- Phase 4: 5 tasks → 5 tasks (replaced investigation task with concrete implementation)
- Phase 3: 2 tasks → 2 tasks (verification-only, already done)

Total: 21 tasks → 23 tasks

## Conclusion
Plan now has complete source-level understanding of every operation in the login flow, the actual DB paths (queryDb vs db.execute), the frontend error propagation chain, and the existing cache cold-start mitigations. Ready for implementation.
