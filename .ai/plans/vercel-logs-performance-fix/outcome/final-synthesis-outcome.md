# Final Synthesis Outcome — Vercel Logs Performance Fix

## Overview

This plan addressed Vercel serverless cold-start performance optimization across the Sirad codebase through 8 phases (A–G + Phase 0 baseline), targeting redundant database queries, eager evaluation, and network inefficiencies that inflated function execution time on cold starts.

## Phases Completed

### Phase 0 — Baseline Assessment
- Established baseline metrics and performance profile
- Identified top optimization targets: permission context re-querying, eager scopeAuth evaluation, redundant user lookups, env-config cache misses, session validation overhead, poll frequency, log batch gaps, HTTP request amplification, singleton initialization

### Phase A1 — Permission Context Propagation
- **Files changed**: `backend/types/permissions/permission.types.ts`, `backend/services/permissions/permissions.service.ts`
- **Change**: Added `UserPermissionContext` type. Overloaded `hasPermission(string | UserPermissionContext, key)` with runtime discriminator `typeof userIdOrContext !== "string"`. Services accept context from GraphQL context instead of re-querying via `PermissionsService.hasPermission(userId, ...)`.
- **DB reduction**: Eliminated redundant `getUserContext(userId)` calls in service-layer permission checks (the context already has the data)

### Phase A2 — scopeAuth Lazy Evaluation
- **Files changed**: `backend/graphql/pothos/builder.ts`, `backend/graphql/context.ts`
- **Change**: Extracted `buildAuthScopes()` as standalone dependency-injectable function. Converted `superAdmin` from eager boolean to lazy scope-loader function — uses `ctx.isSuperAdmin` directly when not impersonating (0 DB), fetches `getUserContext(actor)` only when actor differs from user. Removed dead code: unreachable `else if (ctx.actorUserId)` branch.
- **DB reduction**: 0 DB for superAdmin check in common case (no impersonation)

### Phase A3 — safeUser on BaseContext
- **Files changed**: `backend/graphql/context.ts`, `backend/types/users/user.types.ts`
- **Change**: Added `SanitizedSafeUser` type (strips `password`/`rememberTokenHash` via `Partial<Pick<...>>`). Store `SanitizedSafeUser` on `BaseContext` to avoid redundant `UserService.findById` calls. `safeUserForContext` sets password/rememberTokenHash to undefined before storing. `AuthUtils.toUserReturnType(ctx.safeUser, { role: ctx.role })` — 0 DB for `Query.me`.
- **Security**: `UserPothosObject` doesn't expose password/rememberTokenHash, so no GraphQL leak

### Phase B — Env Config Pre-Warm
- **Files changed**: `backend/services/config/env-config.service.ts`
- **Change**: Added `preWarmEnvConfigCache()` at module load — iterates `ENV_CONFIG_KEYS`, skips `excludeFromDb`, populates from `process.env`. Cache entry shape: `{ value, expiresAt }`. Module-load try/catch — failures are non-fatal.
- **Known tradeoff**: DB overrides mask pre-warmed env values until TTL expiry (5 min). Service API writes correctly evict via `invalidateEnvConfigCache(key)`.

### Phase C — Session Validation Refactor
- **Files changed**: `backend/services/auth/session.service.ts`, `backend/graphql/context.ts`
- **Change**: Refactored token refresh to reuse user object when `effectiveUserId === user.id` (avoids redundant findById). Cleanup orphan session purge logic (sessions expire via TTL).

### Phase C2 — Session Validation Skip User Check
- **Files changed**: `backend/services/auth/session.service.ts`
- **Change**: Added `skipUserCheck` option in `validateSession` — skips redundant `findSafeById` when caller already has the user. `resolveUserFromSession` calls `UserService.findById` immediately after — if user deleted, returns null, auth fails correctly. Orphan session purge skipped — sessions expire via TTL.

### Phase D — Poll Interval + Idle Detection
- **Files changed**: `frontend/stores/notifications/...`, `frontend/hooks/useIdleDetection.ts`
- **Change**: `NOTIFICATION_COUNT_POLL_INTERVAL_MS` increased to 120s (from 60s). `useIdleDetection` hook: 5 min idle → pause polling (`pollInterval: isIdle ? 0 : 120_000`). `visibilitychange` handler: pause immediately when tab hidden (`document.hidden` check). Resume + refetch on activity.

### Phase E — Client Log Batching
- **Files changed**: `frontend/utils/logger/...`
- **Change**: `batchInterval` minimum 30s in production. `beforeunload` flush using `fetch` with `keepalive: true` (NOT `sendBeacon` — defaults to text/plain, breaks JSON parser). Min batch size guard with priority bypass: error/warn logs and `force: true` bypass the guard via `hasPriorityLog` flag. `destroy()` method for cleanup.

### Phase E2 — HTTP Batching
- **Files changed**: `backend/graphql/server.ts`, `frontend/common/graphql/links/...`
- **Change**: Apollo Server 4: `allowBatchedHttpRequests: true` on constructor (OFF by default). Client: `BatchHttpLink` from `@apollo/client/link/batch-http` (NOT exported from root `@apollo/client`). Link chain order: `PersistedQueryLink` → `BatchHttpLink` (APQ hashes resolve before batch assembly).

### Phase E3 — Session Deduplication
- **Files changed**: `backend/graphql/gqlContextFactory.ts`
- **Change**: `preloadSession` helper — fetches session once, passes to both `resolveAuthIdentityFromToken` and `resolveGroupSimulationFromToken`. `preloadedSession !== undefined` guard: undefined = not provided (fetch), null = not found (skip), `SessionSelectType` = use directly.

### Phase F — Singleton Persistence
- **Files changed**: `backend/lib/env.ts`, `backend/db/db.ts`
- **Change**: `getGlobalSingleton` pattern confirmed for env validation, DB client, DB pool, cache service. `neonWsConfigured` boolean guard for `configureNeonWebSocket()` idempotency. 3-4s cold-start is irreducible without Vercel provisioned concurrency.

### Phase G — @as-integrations/next Patch
- **Files changed**: (no changes — known upstream issue)
- **Finding**: `@as-integrations/next@4.1.0` uses deprecated `url.parse()` — upstream issue #320. Accepted as known; no local fix needed.

## Test Results

- **Total tests**: 87 passing
  - Database repository tests: 54 passing
  - Backend services tests: 18 passing
  - GraphQL integration tests: 15 passing
- **0 critical/high findings** from post-implementation review
- **1 medium + 1 low** findings — both fixed during implementation
- **No regressions** introduced

## Performance Improvements

| Phase | Mechanism | Impact |
|-------|-----------|--------|
| A1 | Permission context propagation | Eliminated 1 DB query per permission check in service layer |
| A2 | Lazy scopeAuth superAdmin | 0 DB for superAdmin check when not impersonating |
| A3 | safeUser on BaseContext | 0 DB for `Query.me` (was 1 findById) |
| B | Env config pre-warm | Cache populated at module load — 0 DB on first access for env-backed keys |
| C | Session validation refactor | Skips redundant `findSafeById` when caller has user |
| C2 | skipUserCheck option | Eliminates 1 `findSafeById` per authed request when caller has user |
| D | Poll interval + idle detection | 50% reduction in polling frequency; 100% reduction when tab idle/hidden |
| E | Client log batching | Reduces HTTP requests from N→1 per batch interval (≥30s) |
| E2 | HTTP batching | Reduces GraphQL HTTP requests from N→1 per batch window |
| E3 | Session deduplication | Eliminates duplicate session fetch in gqlContextFactory |
| F | Singleton persistence | Idempotent initialization prevents re-initialization on cold starts |

## Carry-Over Points

1. **Provisioned concurrency**: 3-4s cold-start is irreducible without Vercel provisioned concurrency (requires Vercel plan upgrade)
2. **`@as-integrations/next` deprecated `url.parse()`**: Upstream issue #320 — accept as known; no local fix needed
3. **Env config DB override tradeoff**: Pre-warmed env values are masked by DB overrides until TTL expiry (5 min). This is acceptable — DB writes evict the cache entry via `invalidateEnvConfigCache(key)`.
4. **Post-implementation review findings**: 1 medium + 1 low — both fixed
5. **Scope-creep guard**: Future optimizations should focus on Vercel infrastructure (provisioned concurrency, edge functions) rather than application-level query reduction — diminishing returns below 3-4s floor

## Documentation Updates

- Created `docs/backend/serverless-cold-start-optimization.md` — canonical reference covering all optimization patterns
- Updated `backend/services/AGENTS.md` — added permission context propagation rule + doc reference
- Updated `backend/graphql/AGENTS.md` — added resolver rules: permission context, lazy scopeAuth, safeUser, session dedup
- Updated `frontend/AGENTS.md` — added client logger batchInterval rule, RequirePermission DEBUG gating, poll interval
- Updated root `AGENTS.md` — added doc reference to Important References section
- Updated `.agents/instructions/backend.instructions.md` — added permission context rule + doc reference
- Updated `.agents/instructions/frontend.instructions.md` — added client logger batchInterval rule

## Implementation Summary Template

```
Phase: H — Knowledge Propagation & Documentation
Files Created: 2 (canonical doc, final synthesis)
Files Modified: 6 (AGENTS.md files × 3, instructions × 2, root AGENTS.md)
Files Renamed: 0
Files Deleted: 0
Migrations: 0
Tests Added: 0 (documentation-only phase)
Tests Modified: 0
Build Status: N/A (documentation-only)
Lint Status: All files passed quality loop (sub-loop.ts --lifecycle codescene)
```
