# Vercel Logs Performance Fix — Requirements

## Document Information

- **Feature Name**: vercel-logs-performance-fix
- **Target Directory**: `.ai/plans/vercel-logs-performance-fix`
- **Outcome Directory**: `.ai/plans/vercel-logs-performance-fix/outcome`
- **Version**: 1.0
- **Date**: 2026-08-18
- **Author**: AI Agent (spec-driven-development)
- **Stakeholders**: Backend team, frontend team, DevOps
- **Source**: `.ai/todo/logs_to_fix.md` (Vercel production logs, 2026-08-12 15:01–15:07 UTC, host: `mishkah-eight.vercel.app`)

## Introduction

Vercel production logs from 2026-08-12 reveal eight distinct performance and log-noise issues that degrade the user experience and inflate serverless invocation costs. The dashboard's initial page load suffers ~8-second GraphQL resolver times on cold starts, redundant `refreshToken` mutations consume ~2.3 seconds on every navigation, and repeated DB queries for permission context—already computed by the GraphQL context builder—are re-executed inside downstream services. Additionally, client-side log POSTs, 60-second polling, and `RequirePermission` DEBUG logging generate excessive serverless invocations and log volume.

This plan addresses all eight issues through targeted backend service refactoring, client-side polling/log optimization, and environment-config cache pre-warming. No new features are added; the plan optimizes existing code paths.

### Feature Summary

Eliminate redundant DB queries, reduce cold-start overhead, suppress excessive client→server log traffic, and optimize the `refreshToken` mutation to improve dashboard load times from ~8s to <2s on cold starts and from ~2.3s to <500ms on warm navigation.

### Business Value

- Faster dashboard load → improved user retention and satisfaction
- Fewer serverless invocations → reduced Vercel compute costs
- Reduced log volume → easier log triage and lower observability noise
- Eliminated redundant DB queries → lower database load on Neon

### Scope

**In Scope:**
- Issue 1: Cold-start full re-init of DB/cache/Redis (mitigation, not elimination — serverless nature; R3-5: singletons already in place, verify only)
- Issue 2: env-config DB cache miss on every cold start for env-fallback keys
- Issue 3: Redundant `PermissionsService.getUserContext()` calls (3× per request)
- Issue 3.5: No HTTP batching — 8 concurrent POSTs per navigation (NEW, R2/R3)
- Issue 3.6: Duplicate session lookups in context creation (NEW, R2/R3 — Redis-first in prod)
- Issue 4: `refreshToken` mutation redundant `UserService.findById()` + always-rotate
- Issue 5: `Query.me` 60s poll interval
- Issue 1.5: scopeAuth redundant `getUserContext()` for permission-scoped resolvers (NEW, R2/R3)
- Issue 1.6: `Query.me` redundant `UserService.findById()` in resolver body (NEW, R3-8)

**Out of Scope:**
- Migrating away from Vercel serverless (architectural decision, not a code fix)
- Replacing Neon serverless driver (requires infrastructure evaluation)
- Rewriting the entire auth/session system
- Adding Redis-based session caching (separate infrastructure project)
- Frontend Apollo cache strategy overhaul

## Requirements

### Requirement 0: Pre-Implementation Baseline & Execution Protocol

**User Story:** As an AI agent or developer, I want to establish an error baseline before implementation and track outcomes persistently, so that I can distinguish new issues from pre-existing ones and avoid repeating past research.

#### Acceptance Criteria

1. WHEN feature implementation begins THEN system SHALL record baseline error counts (`bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts --json --id baseline`) to distinguish new from pre-existing issues.
2. WHEN feature implementation begins THEN system SHALL create deferred-items ledger at `.ai/plans/vercel-logs-performance-fix/deferred-items.md`.
3. WHEN an executing agent starts any task THEN system SHALL read ALL existing outcome files in `.ai/plans/vercel-logs-performance-fix/outcome/`.
4. WHEN an executing agent completes any task THEN system SHALL write `.ai/plans/vercel-logs-performance-fix/outcome/<task-id>-outcome.md`.
5. WHEN an executing agent completes any subtask THEN system SHALL update the corresponding task checkbox `[ ]` -> `[x]` in `trackable-tasks.md`.
6. WHEN any file is modified THEN system SHALL execute `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on that file.
7. WHEN any subtask is marked complete THEN system SHALL complete the semantic review checklist (race conditions, env-config, deferred items, cross-layer, enums).

### Requirement 0.5: Translation System & Enum Import Compliance

**User Story:** As a developer implementing user-facing features, I want compile-time type-safe translations and correct enum imports, so that I catch i18n and type errors at build time instead of runtime.

#### Acceptance Criteria

1. WHEN client component renders user-facing text THEN system SHALL use `useAppTranslation(Translation.<Namespace>)` with Translation enum.
2. WHEN GraphQL resolver returns user-facing text THEN system SHALL use `ctx.t("namespace")`.
3. WHEN enum is used in runtime expression THEN system SHALL import as value (not `import type`).
4. WHEN enum is used in conditional/cast/object literal THEN system SHALL import as value.

### Requirement 1: Eliminate Redundant `PermissionsService.getUserContext()` Calls ⚠️ CRITICAL

**User Story:** As a dashboard user, I want the `notificationAlerts` and `permissions` queries to complete in under 2 seconds on cold starts and under 500ms on warm invocations, so that the dashboard loads quickly without redundant database queries.

#### Acceptance Criteria

1. WHEN `NotificationAlertsService.getAlerts()` is called THEN system SHALL accept a `UserPermissionContext` parameter instead of `userId` and SHALL NOT call `PermissionsService.getUserContext()` internally.
2. WHEN `NotificationAlertsService.getAlerts()` needs to check permissions THEN system SHALL use the passed-in `UserPermissionContext.permissions` array and `UserPermissionContext.isSuperAdmin` flag.
3. WHEN `NotificationAlertsService.markAlertsRead()` is called THEN system SHALL accept a `UserPermissionContext` parameter and SHALL NOT call `PermissionsService.hasPermission()` internally.
4. WHEN `NotificationAlertsService.markOneAlertRead()` is called THEN system SHALL accept a `UserPermissionContext` parameter and SHALL NOT call `PermissionsService.hasPermission()` internally.
5. WHEN the GraphQL context already contains `permissions`, `permissionGroups`, `isSuperAdmin`, and `role` THEN downstream services SHALL receive these values via parameter instead of re-querying the database.
6. WHEN `PermissionsService.hasPermission()` is called with a `UserPermissionContext` already available THEN system SHALL provide an overload that accepts `UserPermissionContext` directly without calling `getUserContext()`.
7. WHEN the `notificationAlerts` resolver executes THEN system SHALL pass `ctx` permissions data to the service, resulting in at most 5 DB queries (4 context + 1 notification rows) instead of 10 DB queries (4 context + 6 from `hasPermission` × 2 × 3).
8. IF performance is measured THEN system SHALL complete `Query.notificationAlerts` in under 2000ms on cold starts and under 500ms on warm invocations.

#### Additional Details
- **Priority**: CRITICAL
- **Complexity**: Medium
- **Dependencies**: None (foundational fix)
- **Assumptions**: The GraphQL context (`BaseContext`) already stores `permissions`, `permissionGroups`, `isSuperAdmin`, and `role` — confirmed in `gqlContext.ts` lines 82-93.

### Requirement 1.5: Eliminate `scopeAuth` Redundant `getUserContext()` ⚠️ CRITICAL

**User Story:** As a dashboard user navigating the /permissions page, I want the scopeAuth evaluator to short-circuit when no impersonation/simulation is active, so that 9 redundant DB queries per navigation are eliminated.

> **R3-9 correction:** `Query.users` (`STAFF_LIST` scope) is also affected — was missing from R2. R3-7 note: `notificationAlerts` uses `loggedIn: true`, NOT `permission` scope, so this requirement does NOT help `notificationAlerts`.

#### Acceptance Criteria

1. WHEN the Pothos `scopeAuth.authScopes` evaluator runs for a `permission`-scoped resolver AND `ctx.realUserId` is absent or equals `ctx.user?.id` THEN system SHALL short-circuit the `superAdmin` scope to `ctx.isSuperAdmin` without calling `PermissionsService.getUserContext()`.
2. WHEN impersonation or simulation is active (`ctx.realUserId && ctx.realUserId !== ctx.user?.id`) THEN system SHALL call `getUserContext(realUserId)` to check the actor's superAdmin status (existing behavior preserved).
3. WHEN the evaluator runs for resolvers using `authScopes: { loggedIn: true }` (e.g., `me`, `notificationAlerts`, `impersonationStatus`) THEN system SHALL NOT invoke `getUserContext` (already not triggered).
4. WHEN `getUserContext` is skipped by the short-circuit THEN system SHALL NOT emit any error or warning — this is the expected common path.
5. WHEN the fix is applied THEN the affected resolvers (`Query.permissions`, `Query.permissionGroups`, `Query.users`, `Mutation.createPermissionGroup`) SHALL reduce from 7 DB + 4 Redis reads per request to 4 DB + 4 Redis reads (R3-3 correction: `findSessionById` is Redis-first, not DB — so the per-request DB drops by 3, not 9).

#### Additional Details
- **Priority**: CRITICAL
- **Complexity**: Low (single-file edit in `gqlSchemaBuilder.ts`)
- **Dependencies**: None
- **Dead code (R3-2):** `gqlSchemaBuilder.ts` lines 116–118 (`else if (ctx.actorUserId)` branch) are unreachable; the implementer should delete or document them.

### Requirement 1.6: Eliminate `Query.me` Redundant `UserService.findById()` ⚠️ MEDIUM

**User Story:** As a dashboard user, I want the `me` query to not re-fetch user data already loaded in the GraphQL context, so that 16 redundant DB queries per hour are eliminated.

> **R3-8 new finding** — the plan missed this entirely. `auth.query.ts` line 17 calls `UserService.findById(ctx.user.id)` to re-fetch the user that `createContext` already loaded via `findSafeById` at `gqlContext.ts` line 80. **R4-31 correction:** `ctx.user` is NOT the full user object — it's a 2-field `{ id, displayCurrency }` shape. The full `safeUser` is fetched at line 80 but NOT stored on the context. See AC#2 for the corrected fix direction.

#### Acceptance Criteria

1. WHEN `Query.me` executes THEN system SHALL NOT call `UserService.findById(ctx.user.id)` at line 17.
2. WHEN `Query.me` executes THEN system SHALL obtain the user data from the GraphQL context. **R4-31 correction:** `ctx.user` is typed as `{ id: string; displayCurrency: CurrencyCode | null }` — a 2-field minimal object (gqlContext.ts lines 8–13) that lacks `name`, `email`, `role`, `status`, `timezone`, etc. The fix MUST either: (a) add `safeUser: UserSelectType | null` to `BaseContext` and populate it in `createContext` (line 80 already calls `findSafeById` — just store the result, at zero extra DB cost), then use `AuthUtils.toUserReturnType(ctx.safeUser, { role: ctx.role })` in the resolver; OR (b) replace `findById` with `findSafeById` in the resolver (same DB cost, narrower column subset). **R4-28:** "SafeUser" is NOT a named TypeScript type — both `findById` and `findSafeById` return `UserSelectType`. **R4-34:** If option (a) is chosen, strip `password` and `rememberTokenHash` from the stored object (both are included in `SAFE_USER_SELECT`).
3. WHEN `Query.me` executes on a warm invocation THEN system SHALL issue 0 DB queries for the user lookup (option (a) only — option (b) still costs 1 DB but uses the narrower `findSafeById`).

#### Additional Details
- **Priority**: Medium
- **Complexity**: Low
- **Dependencies**: None
- **Type caveat (R4-31)**: `ctx.user` is `{ id: string; displayCurrency: CurrencyCode | null }` — NOT `UserSelectType`. Calling `AuthUtils.toUserReturnType(ctx.user)` would fail type-checking. The fix must store the full `safeUser` on the context (option a) or replace `findById` with `findSafeById` in the resolver (option b). **R4-28:** "SafeUser" is NOT a named type — `findSafeById` returns `UserSelectType`.

### Requirement 2: Pre-Warm `env-config` Cache for Env-Fallback Keys ⚠️ MEDIUM

**User Story:** As a serverless function, I want the env-config cache to be pre-warmed with env-fallback values on module load, so that every cold start does not waste DB queries on keys that always resolve to `process.env`.

#### Acceptance Criteria

1. WHEN the `environment-config.service.ts` module is loaded THEN system SHALL pre-populate the in-memory `Map` cache with `process.env` values for all DB-eligible keys that have no DB override, preventing a DB round-trip on first access.
2. WHEN `resolveEnvConfig()` is called for a key on a cold start THEN system SHALL check the pre-warmed cache first, avoiding a DB query if the key will resolve to `process.env`.
3. WHEN a DB override IS set for a key THEN system SHALL still query the DB (the pre-warm only populates env-fallback values; DB overrides take precedence on first real query).
4. WHEN the `CACHE_PROVIDER`, `REDIS_PROVIDER`, `UPSTASH_REDIS_REST_URL`, or `UPSTASH_REDIS_REST_TOKEN` keys are resolved on a cold start THEN system SHALL NOT issue a DB query for these keys (they have no DB override in this deployment).
5. IF a DB override is added later (via Settings UI) THEN system SHALL invalidate the pre-warmed cache entry and re-query the DB.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Medium
- **Dependencies**: None
- **Assumptions**: Keys without DB overrides always resolve to `process.env`. The `excludeFromDb` keys already bypass the DB; this fix targets DB-eligible keys whose DB row doesn't exist.

### Requirement 3: Eliminate Redundant `UserService.findById()` in `refreshToken` ⚠️ HIGH

**User Story:** As a navigating user, I want the `refreshToken` mutation to complete in under 500ms, so that page loads are not blocked by a 2.3-second token refresh cycle.

#### Acceptance Criteria

1. WHEN `rotateTokensAndSession()` executes THEN system SHALL reuse the `user` object passed as parameter instead of calling `UserService.findById()` a second time at line 172.
2. WHEN `ctx.isImpersonating` is true AND `ctx.user` exists THEN system SHALL use `ctx.user.id` to look up the effective user, but SHALL skip this lookup if the effective user ID equals the passed user ID.
3. WHEN `SessionService.validateSession()` executes (the first step of `refreshToken`) THEN system SHALL NOT call `UserService.findSafeById()` at line 68 if the user object is already available from `createContext` (R3-6: redundant with `gqlContext.ts` line 80). The system SHALL coalesce or cache the user lookup shared between `validateSession` and `createContext`.
4. WHEN the access token is still valid (not expired) THEN system SHALL skip token rotation entirely and return the current valid token (opt-in via configuration or JWT exp check).
5. WHEN `refreshToken` is called on warm navigation THEN system SHALL complete in under 500ms.
6. WHEN `refreshToken` is called on cold start THEN system SHALL complete in under 2000ms.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: None
- **Assumptions**: The `user` parameter in `rotateTokensAndSession()` is the same user already loaded by `resolveUserFromSession()` or `resolveUserFromRefreshToken()`.

### Requirement 3.5: Batch Concurrent GraphQL POSTs ⚠️ HIGH

**User Story:** As a navigating user, I want the 8 concurrent GraphQL POSTs on /permissions to be reduced so that context-creation cost is paid fewer times (ideally once via `BatchHttpLink`, or 6 times via source-aggregation that merges the 3 permissions-page queries into 1).

> **R3-1 framework correction:** The server is Apollo Server 4 (`@apollo/server` v5.5.1), NOT Pothos/Yoga. Apollo Server 4 disables HTTP batching by default.

#### Acceptance Criteria

1. WHEN the /permissions page mounts multiple `useQuery` hooks concurrently THEN system SHALL reduce the 8 concurrent HTTP POSTs. IF `BatchHttpLink` is adopted THEN system SHALL collapse 8 POSTs to 1. IF source-aggregation (Option B) is chosen THEN system SHALL merge the 3 permissions-page queries (`permissions` + `permissionGroups` + `users`) into a single `permissionsPageData` query, reducing 8 POSTs to 6 (the remaining 5 are from other components: `me`, `notificationAlerts`, `impersonationStatus`, `permissionGroupSimulationStatus`, `refreshToken`).
2. WHEN `BatchHttpLink` is adopted THEN system SHALL add `allowBatchedHttpRequests: true` to the `ApolloServer` constructor in `app/api/graphql/route.ts` (R3-1: Apollo Server 4 disables batching by default; `@as-integrations/next` v4.1.0 forwards array bodies transparently).
3. WHEN `BatchHttpLink` is adopted THEN system SHALL verify `PersistedQueryLink` does not un-batch the APQ hash probes (plan-review-R2: APQ + batch can interact — the hash probe is per-operation, not per-batch), or SHALL disable APQ if the composition is incompatible.
4. WHEN source-aggregation (Option B) is chosen THEN system SHALL merge `permissions` + `permissionGroups` + `users` into a single `permissionsPageData` query — this requires no server-side change and is the safer primary path (R3-1 recommendation).

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: None
- **Assumptions**: The 8 concurrent POSTs match the log evidence (8 POST /api/graphql with identical timestamps per navigation). Apollo Server 4 `allowBatchedHttpRequests` defaults to `false` — verified in official docs.

### Requirement 3.6: Deduplicate `SessionRepository.findSessionById` in Context Creation ⚠️ HIGH

**User Story:** As a navigating user, I want the session to be fetched once per request, not twice (once by `resolveAuthIdentityFromToken` and again by `resolveGroupSimulationFromToken`), so that redundant session lookups are eliminated.

> **R3-3 correction:** In production, session lookups are **Redis-first** (not DB). The saving is ~16 Redis reads/nav → ~8 (plus DB reads only on cache miss).

#### Acceptance Criteria

1. WHEN `resolveAuthFromRequest` executes THEN system SHALL fetch the session row once and pass the `session` object (or cache it on the request scope) to both `ImpersonationService.resolveAuthIdentityFromToken` and `PermissionGroupSimulationService.resolveGroupSimulationFromToken`.
2. WHEN both resolver methods receive the preloaded `SessionSelectType` THEN system SHALL NOT call `SessionRepository.findSessionById(rawSessionId)` a second time for the same `rawSessionId`.
3. WHEN the session is not found in the first lookup THEN system SHALL short-circuit both resolvers (no redundant second lookup).

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: None
- **Assumptions**: The session store is Redis-first in production (`redisSessionsEnabled()` returns `true` when `cacheProvider !== "postgres"`). The `findSessionById` method checks Redis first; DB is only hit on miss.

### Requirement 4: Increase `Query.me` Poll Interval ⚠️ LOW

**User Story:** As an idle dashboard user, I want the `me` query to poll less frequently, so that serverless invocations and log volume are reduced while keeping the notification badge reasonably fresh.

#### Acceptance Criteria

1. WHEN the `DashboardClientBridge` component mounts THEN system SHALL poll `me` at an interval of at least 120 seconds (increased from 60s).
2. WHEN the user is idle (no mouse/keyboard activity for 5 minutes) THEN system SHALL pause the `me` poll interval entirely.
3. WHEN the user returns from idle THEN system SHALL immediately refetch `me` and resume the poll interval.
4. WHEN a `markAlertsRead` mutation completes THEN system SHALL trigger an immediate `me` refetch (instead of waiting for the next poll).

#### Additional Details
- **Priority**: Low
- **Complexity**: Low
- **Dependencies**: None
- **Assumptions**: The 60s poll was configured for the notification badge count. 120s + idle pause preserves UX while halving invocations.

### Requirement 5: Suppress `RequirePermission` DEBUG Log Noise ⚠️ MEDIUM

**User Story:** As a developer triaging production logs, I want `RequirePermission` to not log DEBUG-level "Access denied" messages on every render, so that log volume is reduced and real issues are easier to find.

#### Acceptance Criteria

1. WHEN `RequirePermission` denies access THEN system SHALL NOT emit a DEBUG-level log by default.
2. WHEN `RequirePermission` denies access THEN system SHALL only log when a verbose/debug flag is explicitly enabled (e.g., `NEXT_PUBLIC_DEBUG_PERMISSIONS=true`).
3. WHEN the flag is not set THEN system SHALL render the fallback silently without any log output.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Low
- **Dependencies**: None
- **Assumptions**: The "Access denied" log is expected behavior (component hides gracefully) but the log is noise.

### Requirement 6: Batch/Debounce Client Log POSTs ⚠️ MEDIUM

**User Story:** As a Vercel operator, I want the `/api/logs` endpoint to receive fewer requests, so that serverless invocations and log volume are reduced.

#### Acceptance Criteria

1. WHEN the client logger flushes logs THEN system SHALL batch logs and send them at most once every 30 seconds (increased from 2 seconds).
2. WHEN the page is about to unload (`beforeunload` event) THEN system SHALL flush remaining logs immediately.
3. WHEN `NEXT_PUBLIC_ENABLE_LOGGING` is not `"true"` AND `NODE_ENV` is not `"development"` THEN system SHALL NOT queue or send any logs to `/api/logs`.
4. WHEN the log queue contains fewer than 5 entries AND the batch timer has not elapsed THEN system SHALL defer the POST until either 5 entries accumulate or the timer elapses.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Low
- **Dependencies**: None
- **Assumptions**: The current 2-second `batchInterval` produces a POST on every navigation. Increasing to 30s + `beforeunload` flush reduces invocations by ~15×.

### Requirement 7: Investigate `url.parse()` Deprecation Warning 🔵 LOW

**User Story:** As a developer, I want to identify which dependency calls `url.parse()` and document whether it can be upgraded, so that the deprecation warning is resolved or formally deferred.

#### Acceptance Criteria

1. WHEN investigating the `[DEP0169]` warning THEN system SHALL identify the exact npm package(s) calling `url.parse()` via `node --trace-deprecation` or dependency tree analysis.
2. WHEN the responsible package is identified THEN system SHALL document the finding in an outcome file (package name, version, whether a newer version fixes it, and whether upgrading is safe).
3. IF upgrading the package is NOT safe or NOT available THEN system SHALL document this as a deferred item with rationale.

#### Additional Details
- **Priority**: Low
- **Complexity**: Low
- **Dependencies**: None
- **Assumptions**: The warning originates from a transitive dependency (`@neondatabase/serverless`, `ws`, or `pg`), not from project code.

### Requirement 8: Verify Cold-Start Singleton Persistence ⚠️ MEDIUM

**User Story:** As a serverless function, I want to verify that cold-start singletons are already in place, so that no redundant initialization runs on warm invocations — while acknowledging the 3-4s cold-start base cost is irreducible without provisioned concurrency.

> **R3-5 correction:** `getGlobalSingleton` is **already used** for env validation (`env.ts` line 484), DB client (`drizzleDb.ts` line 38), DB pool (`drizzleDb.ts` line 68), and cache service (`CacheServiceFactory.ts` line 16). This requirement is downgraded from "implement" to "verify existing usage." The 3-4s cold-start is **irreducible** serverless init work without Vercel provisioned concurrency.

#### Acceptance Criteria

1. WHEN implementation begins THEN the implementer SHALL verify that `validateEnvironment()` uses `getGlobalSingleton` (`env.ts` line 484) and does NOT re-validate on warm invocations.
2. WHEN implementation begins THEN the implementer SHALL verify that `createDatabase()` uses `getGlobalSingleton` (`drizzleDb.ts` line 38) and the DB pool uses `getGlobalSingleton` (`drizzleDb.ts` line 68).
3. WHEN implementation begins THEN the implementer SHALL verify that `getCacheService()` uses `getGlobalSingleton` (`CacheServiceFactory.ts` line 16) and the cache adapter is NOT re-initialized on warm invocations.
4. WHEN `configureNeonWebSocket()` is called THEN system SHALL ensure it is only called once per container lifetime (idempotent check — verify existing guard).
5. WHEN the cold-start sequence runs THEN system SHALL ensure `resolveEnvConfig()` calls during init are minimized (Requirement 2 handles env-config pre-warm).
6. WHEN the audit is complete THEN the implementer SHALL document the 3-4s cold-start as irreducible without provisioned concurrency (no further code optimization possible).

#### Additional Details
- **Priority**: Medium (downgraded from HIGH — R3-5: singletons already in place)
- **Complexity**: Low (audit + verification, not implementation)
- **Dependencies**: Requirement 2 (env-config cache pre-warm)
- **Assumptions**: Vercel serverless functions MAY reuse warm containers. The `getGlobalSingleton` pattern using `Symbol.for()` survives across invocations in the same container. The 3-4s cold-start is irreducible serverless init work without Vercel provisioned concurrency — this requirement verifies existing singletons, not creates new ones.

## UX/Navigation Requirements

This plan modifies existing backend services and client-side behavior. No new routes, sidebar items, or pages are added.

### Existing Routes & Role-Based Access (Unchanged)

| Route | Purpose | Permission | Roles with Access |
|-------|---------|------------|-------------------|
| `/dashboard` | Dashboard home | `loggedIn` | All authenticated users |
| `/dashboard/permissions` | Permission management | `PERMISSION_GROUPS_MANAGE` | SUPER_ADMIN |
| All other dashboard routes | Various | Various | Various |

### Per-Audience Rendering (Unchanged)

No rendering changes. This plan optimizes backend performance and client-side behavior without altering any UI components.

### Mobile vs Desktop

No mobile/desktop changes. All optimizations are in shared backend services and shared client components.

## Non-Functional Requirements

### Performance Requirements

- WHEN `Query.notificationAlerts` executes on a cold start THEN system SHALL complete in under 2000ms (from ~8000ms observed).
- WHEN `Query.notificationAlerts` executes on a warm invocation THEN system SHALL complete in under 500ms.
- WHEN `Mutation.refreshToken` executes on a warm invocation THEN system SHALL complete in under 500ms (from ~2300ms observed).
- WHEN `Mutation.refreshToken` executes on a cold start THEN system SHALL complete in under 2000ms.
- WHEN the dashboard polls `Query.me` THEN system SHALL poll at most every 120 seconds (from 60s).
- WHEN the client logger flushes logs THEN system SHALL POST at most once every 30 seconds (from 2s).

### Security Requirements

- WHEN `refreshToken` skips rotation (access token still valid) THEN system SHALL verify the JWT `exp` claim before skipping, preventing use of expired tokens.
- WHEN `NotificationAlertsService` receives a `UserPermissionContext` parameter THEN system SHALL trust the context (it was built by the authenticated GraphQL context builder) and SHALL NOT re-verify permissions from the database.
- WHEN client logs are gated THEN system SHALL NOT disable error-level logging (`force: true` logs bypass the gate).

### Reliability Requirements

- WHEN `resolveEnvConfig()` pre-warm fails (e.g., `process.env` not yet populated) THEN system SHALL fall back to the normal DB query path without throwing.
- WHEN the `me` poll is paused due to idle THEN system SHALL resume polling when activity resumes without missing any notification count updates.

## Constraints and Assumptions

### Technical Constraints

- Vercel serverless functions are stateless across cold starts — module-scoped singletons survive only within warm containers.
- The Neon serverless driver uses WebSocket connections that must be configured per container.
- The `getGlobalSingleton` pattern using `Symbol.for()` is the established mechanism for cross-invocation singleton persistence.
- The GraphQL context builder (`gqlContext.ts`) already stores `permissions`, `permissionGroups`, `isSuperAdmin`, and `role` on `BaseContext`.

### Business Constraints

- No downtime during deployment — changes are backward-compatible.
- No database schema migrations required.
- No new environment variables required (existing `NEXT_PUBLIC_ENABLE_LOGGING` and `ENABLE_LOGGING` gates are reused).

### Assumptions

- The `UserPermissionContext` type in `backend/types` already defines `permissions`, `permissionGroups`, `isSuperAdmin`, and `role`.
- The `BaseContext` type in `gqlContext.ts` is compatible with `UserPermissionContext` (same shape for permission fields).
- The `PermissionsService.hasPermission()` method is called from multiple services — an overload accepting `UserPermissionContext` must not break existing callers.

## Success Criteria

### Definition of Done

- [ ] All acceptance criteria are met
- [ ] `Query.notificationAlerts` cold-start time reduced from ~8s to <2s
- [ ] `Mutation.refreshToken` warm time reduced from ~2.3s to <500ms
- [ ] `me` poll interval increased to 120s with idle pause
- [ ] `RequirePermission` DEBUG log suppressed by default
- [ ] Client log POST batch interval increased to 30s
- [ ] env-config cold-start DB queries eliminated for env-fallback keys
- [ ] Redundant `getUserContext()` calls eliminated in `NotificationAlertsService`
- [ ] scopeAuth redundant `getUserContext()` eliminated (Req 1.5)
- [ ] `Query.me` redundant `UserService.findById()` eliminated (Req 1.6)
- [ ] Concurrent POSTs batched or source-aggregated (Req 3.5)
- [ ] Duplicate `findSessionById` deduplicated (Req 3.6)
- [ ] `validateSession` `findSafeById` redundancy eliminated (Req 3 AC#3)
- [ ] Cold-start singletons verified (Req 8 — already in place)

### Acceptance Metrics

- `Query.notificationAlerts` resolver time: < 2000ms cold, < 500ms warm
- `Mutation.refreshToken` resolver time: < 500ms warm, < 2000ms cold
- `me` poll frequency: ≤ 1 per 120s (idle-paused)
- `/api/logs` POST frequency: ≤ 1 per 30s
- `RequirePermission` DEBUG logs: 0 (unless verbose flag enabled)
- Redundant `getUserContext()` calls per GraphQL request: 0 (was 3+)
- DB queries per /permissions navigation: ~5-6 with BatchHttpLink / ~25-26 with source-aggregation (was ~49-50; R3 revised + refinement-corrected — refreshToken body reads reduced to 0-1 after Req 3 AC#1/AC#3/AC#4)
- Redis reads per /permissions navigation: ~7 with BatchHttpLink / ~26 with source-aggregation (was ~33; R3 revised)
- Concurrent HTTP POSTs per /permissions navigation: 1 (BatchHttpLink) or 6 (source-aggregation) (was 8)

## Glossary

| Term | Definition |
|------|------------|
| Cold start | First invocation of a serverless function after container spin-up, where all module-scoped state is empty |
| Warm invocation | Subsequent invocation in an already-initialized serverless container |
| `UserPermissionContext` | Type containing `permissions`, `permissionGroups`, `isSuperAdmin`, and `role` for a user |
| `BaseContext` | GraphQL context type in `gqlContext.ts` that already stores permission data |
| `getGlobalSingleton` | Pattern using `Symbol.for()` to persist singletons across warm serverless invocations |
| env-config | The environment configuration system that resolves keys DB-first, env-fallback |
| `resolveEnvConfig` | Function that resolves a single env-config key from DB override or `process.env` |
| `NOTIFICATION_COUNT_POLL_INTERVAL_MS` | Client-side poll interval for `Query.me` (currently 60000ms) |
