# Vercel Logs Performance Fix — Trackable Tasks

## Document Information

- **Feature Name**: vercel-logs-performance-fix
- **Target Directory**: `.ai/plans/vercel-logs-performance-fix`
- **Outcome Directory**: `.ai/plans/vercel-logs-performance-fix/outcome`
- **Version**: 1.0
- **Date**: 2026-08-18
- **Related Documents**: [Requirements](specs.md) | [Design](design.md) | [Initial Analysis](../../todo/logs-analysis-and-fix-plan.md)

## Applicable AGENTS.md & Instruction Files

**Root AGENTS.md**: Always applicable (see `/AGENTS.md`)

| Task | Layer | Applicable AGENTS.md | Applicable Instructions |
|------|-------|---------------------|------------------------|
| Phase A (Permission Context) | Backend services | `backend/services/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| Phase A (GraphQL Resolver) | Backend GraphQL | `backend/graphql/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| Phase A2 (scopeAuth) | Backend GraphQL | `backend/graphql/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| Phase A3 (Query.me) | Backend GraphQL | `backend/graphql/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| Phase B (env-config Cache) | Backend services | `backend/services/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| Phase C (refreshToken) | Backend GraphQL | `backend/graphql/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| Phase C2 (validateSession) | Backend services | `backend/services/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| Phase D (me Poll) | Frontend | `frontend/AGENTS.md`, `frontend/views/AGENTS.md` | `frontend.instructions.md` |
| Phase E (Log Noise) | Frontend | `frontend/AGENTS.md` | `frontend.instructions.md` |
| Phase E (Client Logger) | Frontend | `frontend/AGENTS.md` | `frontend.instructions.md` |
| Phase E2 (HTTP Batching - Server) | App Router / Backend | `app/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| Phase E2 (HTTP Batching - Client) | Frontend | `frontend/AGENTS.md` | `frontend.instructions.md` |
| Phase E3 (Session Dedup) | Backend GraphQL | `backend/graphql/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| Phase F (Cold-Start Verify) | Backend services | `backend/services/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| Phase G (url.parse Investigation) | Investigation | — | — |
| Phase H (Knowledge Propagation) | Documentation | `AGENTS.md` (root), `backend/services/AGENTS.md`, `backend/graphql/AGENTS.md`, `frontend/AGENTS.md` | `backend.instructions.md`, `frontend.instructions.md` |

---

## Task Summary

| Phase | Title | Priority | Files Modified | Requirements |
|-------|-------|----------|----------------|--------------|
| A | Eliminate Redundant Permission Context Queries | CRITICAL | 3-4 files | REQ 1 |
| A2 | Eliminate scopeAuth Redundant getUserContext (NEW R2/R3) | HIGH | 1 file | REQ 1.5 |
| A3 | Eliminate Query.me Redundant User Fetch (NEW R3-8) | MEDIUM | 1 file | REQ 1.6 |
| B | Pre-Warm env-config Cache | MEDIUM | 1 file | REQ 2 |
| C | Eliminate Redundant User Fetch in refreshToken | HIGH | 1 file | REQ 3 |
| C2 | Eliminate validateSession Redundant findSafeById (NEW R3-6) | MEDIUM | 1 file | REQ 3 |
| D | Increase me Poll Interval + Idle Pause | LOW | 1 file | REQ 4 |
| E | Suppress Log Noise + Batch Client Logs | MEDIUM | 2 files | REQ 5, 6 |
| E2 | Enable HTTP Batching (NEW R3-1) | MEDIUM | 2 files | REQ 3.5 |
| E3 | Deduplicate Session Lookups (NEW R2/R3-3) | MEDIUM | 1 file | REQ 3.6 |
| F | Verify Cold-Start Singleton Persistence (R3-5: downgraded to audit) | MEDIUM | 0 files | REQ 8 |
| G | Investigate url.parse() Deprecation | LOW | 0 files (investigation) | REQ 7 |
| H | Knowledge Propagation | — | docs + AGENTS.md | — |

## Execution Order

```
Phase A (CRITICAL — redundant queries) → Phase A2 (HIGH — scopeAuth) →
Phase A3 (MEDIUM — Query.me) → Phase C (HIGH — refreshToken) →
Phase C2 (MEDIUM — validateSession) → Phase B (MEDIUM — env-config) →
Phase E (MEDIUM — log client side) → Phase E2 (MEDIUM — HTTP batching) →
Phase E3 (MEDIUM — session dedup) → Phase F (MEDIUM — verify singletons) →
Phase D (LOW — poll interval) → Phase G (LOW — investigation) →
Phase H (knowledge propagation)
```

---

## Phase A: Eliminate Redundant Permission Context Queries ⚠️ CRITICAL

### Task A1: Add `UserPermissionContext` Overloads to PermissionsService

- [ ] A1.1 Verify `UserPermissionContext` type shape
  - Read `backend/types/` for existing `UserPermissionContext` type definition
  - Verify it matches `BaseContext` permission fields: `permissions: AppPermission[]`, `permissionGroups: string[]`, `isSuperAdmin: boolean`, `role: UserRole`
  - If type doesn't exist, create in `backend/types/permission.types.ts` (follow `backend/types/AGENTS.md` rules)
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`) + Semantic Review
  - _Requirements: REQ 1_

- [ ] A1.2 Add `hasPermission` overload accepting `UserPermissionContext`
  - File: `backend/services/auth/permissions.service.ts`
  - Add method overload: `hasPermission(context: UserPermissionContext, permissionKey: AppPermission): boolean`
  - Logic: `if (context.isSuperAdmin) return true; return context.permissions.includes(permissionKey)`
  - Preserve existing `hasPermission(userId: string, permissionKey: AppPermission): boolean` — no changes
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`) + Semantic Review
  - _Requirements: REQ 1_

- [ ] A1.3 Add `hasAnyPermission` overload accepting `UserPermissionContext`
  - File: `backend/services/auth/permissions.service.ts`
  - Add method overload: `hasAnyPermission(context: UserPermissionContext, permissionKeys: AppPermission[]): boolean`
  - Logic: `if (context.isSuperAdmin) return true; return permissionKeys.some((p) => context.permissions.includes(p))`
  - Preserve existing `hasAnyPermission(userId: string, permissionKeys: AppPermission[]): boolean` — no changes
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`) + Semantic Review
  - _Requirements: REQ 1_

- [ ] A1.4 Write paired unit test for new overloads
  - Test file: `backend/services/auth/test/permissions.service.test.ts` (or existing test file location)
  - Cover: superadmin fast-path, permission present in array, permission absent, empty permissions array, multiple permissions check
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 1_

- [ ] A1.5 Run test suite and verify all pass
  - Run: `bun run scripts/run-test/run-test.ts <test-path>`
  - _Requirements: REQ 1_

### Task A2: Add Context-Aware Methods to NotificationAlertsService

- [ ] A2.1 Add `getAlerts` overload accepting `UserPermissionContext`
  - File: `backend/services/notification/notification-alerts.service.ts`
  - Existing signature: `getAlerts(userId: string, locale: string)` — preserved unchanged
  - New overload: `getAlerts(userId: string, context: UserPermissionContext, locale: string): Promise<NotificationAlert[]>`
  - Import `UserPermissionContext` from `@/backend/types/permissions/permission.types.ts`
  - Replace `PermissionsService.hasPermission(userId, NOTIFICATION_VIEW_ALERTS)` (line 210) with `context.isSuperAdmin || context.permissions.includes(NOTIFICATION_VIEW_ALERTS)`
  - Replace `PermissionsService.hasPermission(userId, COMPLAINTS_LIST)` (line 217) with `context.isSuperAdmin || context.permissions.includes(COMPLAINTS_LIST)`
  - The `locale` parameter is preserved for i18n error messages per `backend/services/AGENTS.md`
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`) + Semantic Review
  - _Requirements: REQ 1_

- [ ] A2.2 Add `markAlertsRead` overload accepting `UserPermissionContext`
  - File: `backend/services/notification/notification-alerts.service.ts`
  - Existing signature preserved — new overload adds `context: UserPermissionContext` parameter
  - Replace `PermissionsService.hasPermission(userId, NOTIFICATION_VIEW_ALERTS)` (line 258) with context check
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`) + Semantic Review
  - _Requirements: REQ 1_

- [ ] A2.3 Add `markOneAlertRead` overload accepting `UserPermissionContext`
  - File: `backend/services/notification/notification-alerts.service.ts`
  - Existing signature preserved — new overload adds `context: UserPermissionContext` parameter
  - Replace `PermissionsService.hasPermission(userId, NOTIFICATION_VIEW_ALERTS)` (line 298) with context check
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`) + Semantic Review
  - _Requirements: REQ 1_

- [ ] A2.4 Write paired unit test for context-aware `getAlerts`
  - Test file: `backend/services/notification/test/notification-alerts.service.test.ts` (or existing test file)
  - Cover: context with NOTIFICATION_VIEW_ALERTS permission, context without permission, context with isSuperAdmin, context with COMPLAINTS_LIST permission affecting filter
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 1_

- [ ] A2.5 Run test suite and verify all pass
  - Run: `bun run scripts/run-test/run-test.ts <test-path>`
  - _Requirements: REQ 1_

### Task A3: Wire Permission Context in GraphQL Resolver

- [ ] A3.1 Verify the `notificationAlerts` resolver file
  - File: `backend/graphql/query/notifications/notification-alerts.query.ts` (confirmed — line 7 defines the resolver)
  - Current call: `NotificationAlertsService.getAlerts(ctx.user.id, ctx.locale)` (line 15)
  - _Requirements: REQ 1_

- [ ] A3.2 Update resolver to pass `UserPermissionContext` from `ctx`
  - Construct `UserPermissionContext` from `ctx` fields: `{ permissions: ctx.permissions, permissionGroups: ctx.permissionGroups, isSuperAdmin: ctx.isSuperAdmin, role: ctx.role }`
  - Call `NotificationAlertsService.getAlerts(ctx.user.id, userPermissionContext, ctx.locale)` — note: `ctx.locale` is the existing second parameter, preserved as third param in the new overload
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`) + Semantic Review
  - _Requirements: REQ 1_

- [ ] A3.3 Write GraphQL integration test for `notificationAlerts` with context
  - Test file: `frontend/common/graphql/test/notification-alerts.test.ts` (or existing location)
  - Use `testClient` — verify only 1 DB query for notification rows
  - Mock/verify `PermissionsService.getUserContext` is NOT called by NotificationAlertsService
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 1_

- [ ] A3.4 Run GraphQL integration test and verify pass
  - Run: `bun run scripts/run-test/run-test.ts <test-path>`
  - _Requirements: REQ 1_

- [ ] A3.5 Write outcome file for Phase A
  - File: `.ai/plans/vercel-logs-performance-fix/outcome/phase-a-outcome.md`
  - Document: files modified, approach taken, test results, any cross-file dependencies discovered
  - _Requirements: REQ 0_

---

## Phase A2: Eliminate scopeAuth Redundant getUserContext (NEW — R2/R3) ⚠️ HIGH

> **R3-9 correction:** Affected resolvers are `Query.permissions`, `Query.permissionGroups`, `Query.users` (STAFF_LIST), `Mutation.createPermissionGroup`. NOT affected: resolvers using `loggedIn: true` (me, notificationAlerts, impersonationStatus, etc.). R3-7: `notificationAlerts` uses `loggedIn: true` — NOT a scopeAuth issue.

### Task A2.1: Short-Circuit scopeAuth getUserContext When ctx Already Has Permission Data

- [ ] A2.1.1 Add early return in scopeAuth evaluator
  - File: `backend/graphql/gqlSchemaBuilder.ts`
  - In the `scopeAuth` evaluator (around line 104-118), add an early return: if `ctx.permissions` and `ctx.isSuperAdmin` are already populated (non-undefined), skip the `getUserContext` call and use the existing `ctx` values
  - **R3-2 dead-code note:** The `else if (ctx.actorUserId)` branch at lines 116-118 is unreachable — `realUserId` is already backfilled from `actorUserId` at line 111. Clean up this dead code while editing.
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`) + Semantic Review
  - _Requirements: REQ 1.5_

- [ ] A2.1.2 Write unit test for scopeAuth early return
  - Test file: `backend/graphql/test/gqlSchemaBuilder.scopeAuth.test.ts` (or existing location)
  - Cover: permission scope with ctx already populated (no getUserContext call), permission scope with ctx NOT populated (falls back to getUserContext), loggedIn scope (no getUserContext call regardless)
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 1.5_

- [ ] A2.1.3 Write outcome file for Phase A2
  - File: `.ai/plans/vercel-logs-performance-fix/outcome/phase-a2-outcome.md`
  - _Requirements: REQ 0_

---

## Phase A3: Eliminate Query.me Redundant User Fetch (NEW — R3-8) ⚠️ MEDIUM

> **R3-8 finding:** `auth.query.ts` line 17 calls `UserService.findById(ctx.user.id)` to re-fetch a user already loaded by `createContext` (`gqlContext.ts:80`). Fires 16×/hour (60s poll). `me` uses `loggedIn: true` scope — NOT a scopeAuth issue. Type caveat: `ctx.user` is safe-user shape; verify `AuthUtils.toUserReturnType` accepts it.

### Task A3.1: Return ctx.user Directly in Query.me Resolver

- [ ] A3.1.1 Replace UserService.findById with ctx.user
  - File: `backend/graphql/query/auth/auth.query.ts`
  - Line 17: Replace `const user = await UserService.findById(ctx.user.id)` with `const user = AuthUtils.toUserReturnType(ctx.user)`
  - **Type caveat (R3-8)**: Verify `AuthUtils.toUserReturnType` accepts `SafeUser` shape (from `findSafeById`). If it requires fields not in `SafeUser`, either: (a) cache the full user object in `createContext` (fetch via `findById` once, store alongside `ctx.user` as `SafeUser` — does NOT change `findSafeById` itself, which is excluded per Non-Goals), or (b) keep `findById` with documentation explaining why the fuller shape is needed.
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`) + Semantic Review
  - _Requirements: REQ 1.6_

- [ ] A3.1.2 Write paired unit test
  - Test file: `backend/graphql/query/auth/test/auth.query.test.ts` (or existing location)
  - Cover: `Query.me` returns user from `ctx.user` without calling `UserService.findById`, `AuthUtils.toUserReturnType` transformation works correctly
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 1.6_

- [ ] A3.1.3 Write outcome file for Phase A3
  - File: `.ai/plans/vercel-logs-performance-fix/outcome/phase-a3-outcome.md`
  - _Requirements: REQ 0_

---

### Task B1: Add Cache Pre-Warm Function

- [ ] B1.1 Add `preWarmEnvConfigCache()` function
  - File: `backend/services/system/environment-config.service.ts`
  - After cache Map declaration (line 139), add function that iterates `envConfigKeys` registry
  - For each key with `excludeFromDb: false`, check `process.env[<envVarName>]`
  - If env value exists, populate cache: `cache.set(key, { value: envValue, source: "env", timestamp: Date.now() })`
  - If env value does NOT exist, skip
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`) + Semantic Review
  - Checklist: Verify all `resolveEnvConfig("<KEY>")` calls have matching entry in `env-config-keys.ts`
  - _Requirements: REQ 2_

- [ ] B1.2 Call pre-warm at module load
  - At the bottom of `environment-config.service.ts` (after all functions defined), call `preWarmEnvConfigCache()`
  - Wrap in try/catch — if pre-warm fails, continue (normal `resolveEnvConfig()` path will handle it)
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 2_

- [ ] B1.3 Verify `resetEnvConfigCache()` invalidates pre-warmed entries
  - Read `resetEnvConfigCache()` function — verify it clears the entire cache Map
  - If it only clears specific keys, ensure pre-warmed keys are included
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`) + Semantic Review
  - _Requirements: REQ 2_

- [ ] B1.4 Write paired unit test for pre-warm
  - Test file: `backend/services/system/test/environment-config.service.test.ts` (or existing location)
  - Cover: pre-warm populates cache for env-fallback keys, pre-warm skips keys without env value, `resolveEnvConfig` returns pre-warmed value without DB query, DB override still works after cache invalidation
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 2_

- [ ] B1.5 Run test suite and verify all pass
  - Run: `bun run scripts/run-test/run-test.ts <test-path>`
  - _Requirements: REQ 2_

- [ ] B1.6 Write outcome file for Phase B
  - File: `.ai/plans/vercel-logs-performance-fix/outcome/phase-b-outcome.md`
  - _Requirements: REQ 0_

---

## Phase C: Eliminate Redundant User Fetch in refreshToken ⚠️ HIGH

### Task C1: Reuse User Object in `rotateTokensAndSession`

- [ ] C1.1 Replace redundant `UserService.findById` call
  - File: `backend/graphql/mutation/auth/auth.mutation.ts`
  - Line 172: Replace `const effectiveUser = await UserService.findById(effectiveUserId)` with:
    ```typescript
    const effectiveUser = effectiveUserId === user.id
      ? user
      : await UserService.findById(effectiveUserId);
    ```
  - This reuses the loaded `user` when `effectiveUserId === user.id` (non-impersonation case)
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`) + Semantic Review
  - Checklist: Verify `effectiveUserId` is derived from impersonation/simulation context — if not active, it equals `user.id`
  - _Requirements: REQ 3_

- [ ] C1.2 Write paired unit test for user reuse path
  - Test file: `backend/graphql/mutation/auth/test/auth.mutation.test.ts` (or existing location)
  - Cover: normal refresh (effectiveUserId === user.id) — verify `UserService.findById` called only once (not twice), impersonation refresh (effectiveUserId !== user.id) — verify `UserService.findById` called twice
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 3_

- [ ] C1.3 Run test suite and verify all pass
  - Run: `bun run scripts/run-test/run-test.ts <test-path>`
  - _Requirements: REQ 3_

- [ ] C1.4 Write outcome file for Phase C
  - File: `.ai/plans/vercel-logs-performance-fix/outcome/phase-c-outcome.md`
  - _Requirements: REQ 0_

---

## Phase C2: Eliminate validateSession Redundant findSafeById (NEW — R3-6) ⚠️ MEDIUM

> **R3-6 finding:** `session.service.ts` line 68 calls `findSafeById` to re-fetch a user already loaded by `createContext` (`gqlContext.ts:80`). This adds 1 uncached DB query per `refreshToken` call. The validateSession path should return session data without re-fetching the user.

### Task C2.1: Remove Redundant findSafeById in validateSession

- [ ] C2.1.1 Remove or skip findSafeById call in validateSession
  - File: `backend/services/session/session.service.ts`
  - Line 68: Remove or skip the `findSafeById` call — `createContext` already provides the user object
  - Adjust the return shape to not include the user (or accept the user as a parameter from the caller)
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`) + Semantic Review
  - _Requirements: REQ 3_

- [ ] C2.1.2 Write paired unit test
  - Test file: `backend/services/session/test/session.service.test.ts` (or existing location)
  - Cover: `validateSession` returns session data without calling `findSafeById`, downstream callers still receive user via `createContext`
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 3_

- [ ] C2.1.3 Write outcome file for Phase C2
  - File: `.ai/plans/vercel-logs-performance-fix/outcome/phase-c2-outcome.md`
  - _Requirements: REQ 0_

---

### Task D1: Update DashboardClientBridge Poll Configuration

- [ ] D1.1 Increase poll interval to 120s
  - File: `frontend/common/views/dashboard/components/DashboardClientBridge.tsx`
  - Line 33: Change `NOTIFICATION_COUNT_POLL_INTERVAL_MS = 60_000` to `NOTIFICATION_COUNT_POLL_INTERVAL_MS = 120_000`
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`) + Semantic Review
  - _Requirements: REQ 4_

- [ ] D1.2 Add idle detection hook
  - File: `frontend/common/views/dashboard/components/DashboardClientBridge.tsx` (or new utility file)
  - Add `useIdleDetection` hook: track mouse/keyboard/visibility events
  - After 5 minutes (300_000ms) of inactivity, set `isIdle` to true
  - On any activity, reset `isIdle` to false and trigger immediate refetch
  - Use `pollInterval` dynamically: `isIdle ? 0 : NOTIFICATION_COUNT_POLL_INTERVAL_MS`
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`) + Semantic Review
  - Checklist: No hardcoded colors; use theme callback for any sx props
  - _Requirements: REQ 4_

- [ ] D1.3 Trigger `me` refetch on `markAlertsRead` completion
  - File: `frontend/common/views/dashboard/components/DashboardClientBridge.tsx`
  - In the `markAlertsRead` mutation's `onCompleted` callback, call `refetch()` for the `me` query
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 4_

- [ ] D1.4 Write component test for poll + idle behavior
  - Test file: `test/ui/components/DashboardClientBridge.test.tsx` (or existing location)
  - Cover: poll interval is 120s, idle pause sets poll to 0, activity resumes polling and refetches, markAlertsRead triggers refetch
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 4_

- [ ] D1.5 Run component test suite and verify pass
  - Run: `bun run test:ui:components` (or `bun run scripts/run-test/run-test.ts <test-path>`)
  - _Requirements: REQ 4_

- [ ] D1.6 Write outcome file for Phase D
  - File: `.ai/plans/vercel-logs-performance-fix/outcome/phase-d-outcome.md`
  - _Requirements: REQ 0_

---

## Phase E: Suppress Log Noise + Batch Client Logs ⚠️ MEDIUM

### Task E1: Suppress RequirePermission DEBUG Log

- [ ] E1.1 Remove default DEBUG log from RequirePermission
  - File: `frontend/common/components/auth/RequirePermission.tsx`
  - Line 39: Remove `logger.debug({ caller: "RequirePermission" }, "Access denied for ${String(permissions)}")`
  - Optionally gate behind `NEXT_PUBLIC_DEBUG_PERMISSIONS === "true"` if verbose mode is needed
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`) + Semantic Review
  - _Requirements: REQ 5_

- [ ] E1.2 Write component test verifying no log output on access denied
  - Test file: `test/ui/components/RequirePermission.test.tsx` (or existing location)
  - Cover: access denied → no `logger.debug` call (mock the logger and assert not called)
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 5_

- [ ] E1.3 Run component test suite and verify pass
  - Run: `bun run test:ui:components` (or `bun run scripts/run-test/run-test.ts <test-path>`)
  - _Requirements: REQ 5_

### Task E2: Increase Client Logger Batch Interval

- [ ] E2.1 Increase batchInterval from 2s to 30s
  - File: `frontend/common/lib/logger/index.ts`
  - Line 39: Change `batchInterval: 2000` to `batchInterval: 30000`
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`) + Semantic Review
  - _Requirements: REQ 6_

- [ ] E2.2 Add `beforeunload` flush listener
  - File: `frontend/common/lib/logger/index.ts`
  - In the ClientLogger constructor or init function, add `window.addEventListener("beforeunload", () => this.flushLogs())`
  - Ensure cleanup removes the listener
  - For the `beforeunload` flush: use `fetch(url, { method: "POST", body: JSON.stringify(batch), keepalive: true })` — NOT `navigator.sendBeacon` (defaults to `text/plain` content-type, would break the JSON parser in `/api/logs`)
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`) + Semantic Review
  - _Requirements: REQ 6_

- [ ] E2.3 Add minimum batch size guard (optional)
  - File: `frontend/common/lib/logger/index.ts`
  - In `flushLogs()`: if log queue has fewer than 5 entries AND the batch timer hasn't elapsed, skip the POST
  - Error-level logs (`force: true`) should bypass this guard
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 6_

- [ ] E2.4 Write unit test for batch interval and flush
  - Test file: `frontend/common/lib/logger/test/logger.test.ts` (or existing location)
  - Cover: logs batch at 30s interval, `beforeunload` triggers immediate flush, minimum batch size guard works, error log bypasses guard
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 6_

- [ ] E2.5 Run test suite and verify pass
  - Run: `bun run test:ui:components` (or `bun run scripts/run-test/run-test.ts <test-path>`)
  - _Requirements: REQ 6_

- [ ] E2.6 Write outcome file for Phase E
  - File: `.ai/plans/vercel-logs-performance-fix/outcome/phase-e-outcome.md`
  - _Requirements: REQ 0_

---

## Phase E2: Enable HTTP Batching (NEW — R3-1) ⚠️ MEDIUM

> **R3-1 finding:** The server runtime is Apollo Server 4 (`@apollo/server` v5.5.1), NOT Pothos/Yoga. Apollo Server 4 disables HTTP batching by default — requires `allowBatchedHttpRequests: true` on the `ApolloServer` constructor. The `@as-integrations/next` v4.1.0 integration transparently forwards array bodies.

### Task E2.1: Enable allowBatchedHttpRequests on Apollo Server

- [ ] E2.1.1 Add allowBatchedHttpRequests: true to ApolloServer constructor
  - File: `app/api/graphql/route.ts`
  - Add `allowBatchedHttpRequests: true` to the `ApolloServer` constructor options (around line 44)
  - Verify persisted queries (APQ) continue to work with batching enabled
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`) + Semantic Review
  - _Requirements: REQ 3.5_

- [ ] E2.1.2 Adopt BatchHttpLink on the client side (Option A) OR verify source-level aggregation (Option B)
  - File: `frontend/common/providers/apollo/AppApolloProvider.tsx`
  - **Option A (full batching)**: Replace `HttpLink` (line 58) with `BatchHttpLink` from `@apollo/client/link/batch`. Verify `PersistedQueryLink` chains correctly before `BatchHttpLink`.
  - **Option B (safer, source-level only)**: Keep `HttpLink` but reduce concurrent POSTs by consolidating the 3 permissions-page queries into 1 (8 → 6 POSTs). The `allowBatchedHttpRequests: true` server flag still helps future-proof.
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 3.5_

- [ ] E2.1.3 Write integration test for batched HTTP requests
  - Test file: `frontend/common/graphql/test/batching.test.ts` (or existing location)
  - Cover: server accepts array of operations, returns array of responses, APQ works with batched requests
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 3.5_

- [ ] E2.1.4 Write outcome file for Phase E2
  - File: `.ai/plans/vercel-logs-performance-fix/outcome/phase-e2-outcome.md`
  - _Requirements: REQ 0_

---

## Phase E3: Deduplicate Session Lookups (NEW — R2/R3-3) ⚠️ MEDIUM

> **R3-3 correction:** In production (Redis enabled), `findSessionById` is Redis-first (~1-5ms), NOT a DB query. The deduplication still eliminates redundant Redis reads (4 → 2 per request) and is worthwhile, but the cost model should reflect Redis, not DB.

### Task E3.1: Deduplicate findSessionById in Context Creation

- [ ] E3.1.1 Eliminate duplicate findSessionById in gqlContext
  - File: `backend/graphql/gqlContext.ts`
  - Identify the two `findSessionById` calls in the context creation path
  - Share the result: call `findSessionById` once, pass the result to both consumers
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`) + Semantic Review
  - _Requirements: REQ 3.6_

- [ ] E3.1.2 Deduplicate getSessionGroupSimulation if also redundant
  - File: `backend/db/repo/session.repository.ts`
  - Check if `getSessionGroupSimulation` is also called twice in the context path
  - If so, share the result similarly
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 3.6_

- [ ] E3.1.3 Write paired unit test
  - Test file: `backend/graphql/test/gqlContext.dedup.test.ts` (or existing location)
  - Cover: `findSessionById` called once per request (not twice), session data shared correctly between consumers
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 3.6_

- [ ] E3.1.4 Write outcome file for Phase E3
  - File: `.ai/plans/vercel-logs-performance-fix/outcome/phase-e3-outcome.md`
  - _Requirements: REQ 0_

---

## Phase F: Verify Cold-Start Singleton Persistence (R3-5: Audit Only) ⚠️ MEDIUM

> **R3-5 correction:** `getGlobalSingleton` is already used for env validation (`env.ts:484`), DB client (`drizzleDb.ts:38`), DB pool (`drizzleDb.ts:68`), and cache service (`CacheServiceFactory.ts:16`). This phase is **audit-only** — no code changes expected. The 3-4s cold-start is irreducible without Vercel provisioned concurrency.

### Task F1: Verify Existing Singleton Patterns (Audit Only)

- [ ] F1.1 Audit env validation singleton (ALREADY IN PLACE — verify only)
  - File: `backend/lib/env.ts`
  - Verify `ensureEnvironmentValidated` uses `getGlobalSingleton(ENV_KEY, ...)` at line 484
  - **No code change expected** — document confirmation in outcome file
  - _Requirements: REQ 8_

- [ ] F1.2 Audit DB client singleton (ALREADY IN PLACE — verify only)
  - File: `backend/db/drizzleDb.ts`
  - Verify `db = getGlobalSingleton(DB_KEY, initDatabase)` at line 38
  - Verify DB pool: `getGlobalSingleton(DB_POOL_KEY, () => createPool())` at line 68
  - **No code change expected** — document confirmation in outcome file
  - _Requirements: REQ 8_

- [ ] F1.3 Audit cache service singleton (ALREADY IN PLACE — verify only)
  - File: `backend/services/cache/CacheServiceFactory.ts`
  - Verify `getCacheService()` uses `getGlobalSingleton(CACHE_STATE_KEY, ...)` at line 16
  - **No code change expected** — document confirmation in outcome file
  - _Requirements: REQ 8_

- [ ] F1.4 Verify `configureNeonWebSocket()` idempotency
  - File: `backend/db/drizzleDb.ts` (or wherever `configureNeonWebSocket` lives)
  - Ensure it's only called once per container lifetime (check for existing guard)
  - If guard exists: document it. If not: add a boolean flag (minor fix).
  - _Requirements: REQ 8_

- [ ] F1.5 Write outcome file for Phase F
  - File: `.ai/plans/vercel-logs-performance-fix/outcome/phase-f-outcome.md`
  - Document: singleton audit results (all confirmed in place), irreducible cold-start acknowledgment, any minor idempotency fixes
  - _Requirements: REQ 0, REQ 8_

---

## Phase G: Investigate `url.parse()` Deprecation Warning 🔵 LOW

### Task G1: Identify Source of `url.parse()` Warning

- [ ] G1.1 Run Node.js trace-deprecation to identify source package
  - Run: `node --trace-deprecation -e "require('@neondatabase/serverless')"` or similar
  - Alternatively run: `node --trace-deprecation -e "require('ws')"` 
  - Document the exact package and version producing the warning
  - _Requirements: REQ 7_

- [ ] G1.2 Check if newer versions of the package fix the warning
  - Run: `npm outdated @neondatabase/serverless` (and `ws`, `pg` if involved)
  - Check changelog/release notes for `url.parse()` removal
  - _Requirements: REQ 7_

- [ ] G1.3 Write outcome file with investigation findings
  - File: `.ai/plans/vercel-logs-performance-fix/outcome/phase-g-outcome.md`
  - Document: package name, version, whether upgrade is safe, and recommendation
  - If upgrade is NOT safe: add to `deferred-items.md` with rationale
  - _Requirements: REQ 0, REQ 7_

---

## Phase H: Knowledge Propagation & Documentation

### Task H1: Create Canonical Reference Doc

- [ ] H1.1 Create `docs/backend/serverless-cold-start-optimization.md`
  - Consolidate learnings from Phases A-F
  - Topics: permission context propagation, env-config pre-warm, redundant query elimination, singleton persistence, client traffic reduction
  - Include: pattern examples, rules, anti-patterns, what NOT to do
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 0_

### Task H2: Update Layer AGENTS.md Files

- [ ] H2.1 Update `backend/services/AGENTS.md`
  - Add rule: "Services accepting permission checks MUST accept `UserPermissionContext` parameter from GraphQL context instead of re-querying via `PermissionsService.hasPermission(userId, ...)`"
  - Add one-line reference to new doc
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 0_

- [ ] H2.2 Update `backend/graphql/AGENTS.md`
  - Add rule: "Resolvers calling services with permission checks MUST pass `UserPermissionContext` from `ctx` instead of passing only `ctx.user.id`"
  - Add one-line reference to new doc
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 0_

- [ ] H2.3 Update `frontend/AGENTS.md`
  - Add rule: "Client logger `batchInterval` MUST be at least 30s in production; `beforeunload` flush is required"
  - Add rule: "`RequirePermission` MUST NOT log DEBUG messages by default"
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 0_

### Task H3: Update Root AGENTS.md

- [ ] H3.1 Add reference to new doc
  - File: `AGENTS.md` (root)
  - Add to "Important References" section: `- docs/backend/serverless-cold-start-optimization.md - Serverless cold-start optimization patterns (permission context, env-config pre-warm, singleton persistence)`
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 0_

### Task H4: Update Instructions

- [ ] H4.1 Update `backend.instructions.md`
  - Add rule: "Services that check permissions MUST accept `UserPermissionContext` from GraphQL context"
  - Add one-line reference to new doc
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 0_

- [ ] H4.2 Update `frontend.instructions.md`
  - Add rule: "Client logger batchInterval MUST be >= 30s; beforeunload flush required"
  - Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
  - _Requirements: REQ 0_

### Task H5: Write Final Outcome Synthesis

- [ ] H5.1 Read ALL outcome files in `.ai/plans/vercel-logs-performance-fix/outcome/`
  - Extract recurring patterns, cross-file dependencies, gotchas
  - _Requirements: REQ 0_

- [ ] H5.2 Write final synthesis outcome
  - File: `.ai/plans/vercel-logs-performance-fix/outcome/final-synthesis-outcome.md`
  - Summarize: all changes made, test results, performance improvements observed, carry-over points
  - _Requirements: REQ 0_

---

## Summary

| Phase | Tasks | Estimated Scope | Priority |
|-------|-------|----------------|----------|
| A | A1.1–A1.5, A2.1–A2.5, A3.1–A3.5 | 3–4 hours | CRITICAL |
| A2 (NEW) | A2.1.1–A2.1.3 | 1 hour | HIGH |
| A3 (NEW) | A3.1.1–A3.1.3 | 30 min | MEDIUM |
| B | B1.1–B1.6 | 1 hour | MEDIUM |
| C | C1.1–C1.4 | 30 min | HIGH |
| C2 (NEW) | C2.1.1–C2.1.3 | 30 min | MEDIUM |
| D | D1.1–D1.6 | 1.5 hours | LOW |
| E | E1.1–E1.3, E2.1–E2.6 | 1 hour | MEDIUM |
| E2 (NEW) | E2.1.1–E2.1.4 | 1 hour | MEDIUM |
| E3 (NEW) | E3.1.1–E3.1.4 | 45 min | MEDIUM |
| F | F1.1–F1.5 | 30 min (audit only — R3-5) | MEDIUM |
| G | G1.1–G1.3 | 30 min (investigation) | LOW |
| H | H1.1–H5.2 | 1 hour | — |
| **Total** | **~60 subtasks** | **~12 hours** | |

---

## Notes

- This plan is for **analysis and planning only**. No code should be modified until this plan is approved and execution is explicitly requested.
- Every task includes a quality loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`) as required by the spec-driven-development skill.
- Pothos authScopes are read-only and do not re-query the database for permission checks — they read from `ctx.permissions` which is already populated by the context builder. This means the authScope overhead in the logs is likely from the `notificationAlerts` service-level permission re-query, not from Pothos itself. Verify this during Phase A implementation.
- The `url.parse()` warning (Phase G) is investigation-only — no code fix is planned. The finding will be documented as a deferred item if upgrading the responsible package is not safe.

### R3 Reality-Check Corrections Applied

- **R3-1 (CRITICAL)**: The GraphQL runtime is **Apollo Server 4** (`@apollo/server` v5.5.1), NOT Pothos/Yoga. HTTP batching is OFF by default — Phase E2 adds `allowBatchedHttpRequests: true`. The `@as-integrations/next` integration transparently forwards array bodies.
- **R3-2 (LOW)**: Dead code in `gqlSchemaBuilder.ts` lines 116-118 (`else if (ctx.actorUserId)` branch is unreachable). Clean up during Phase A2.
- **R3-3 (MEDIUM)**: Session lookups are **Redis-first** in production (`cacheProvider !== "postgres"`). Phase E3 deduplication eliminates redundant Redis reads, not DB queries. Cost model corrected.
- **R3-4 (CONFIRMED)**: `getUserContext` / `findSafeById` are uncached — plan was correct.
- **R3-5 (HIGH)**: Cold-start singletons (env, DB, pool, cache) are **already in place** via `getGlobalSingleton`. Phase F downgraded from HIGH to MEDIUM, reframed as audit-only. The 3-4s cold-start is irreducible without provisioned concurrency.
- **R3-6 (MEDIUM)**: `validateSession` has a redundant `findSafeById` at `session.service.ts:68`. Phase C2 added to eliminate it.
- **R3-7 (MEDIUM)**: `notificationAlerts` uses `authScopes: { loggedIn: true }` — NOT a scopeAuth issue. `getAlerts` cost is from internal `hasPermission` calls, fixed by Req 1 (Phase A), NOT Req 1.5 (Phase A2).
- **R3-8 (MEDIUM, NEW)**: `Query.me` re-fetches user via `UserService.findById` — `createContext` already loaded `ctx.user`. Phase A3 added to eliminate this (16 redundant DB queries/hour).
- **R3-9 (LOW, NEW)**: `Query.users` uses `authScopes: { permission: STAFF_LIST }` — DOES trigger scopeAuth redundant `getUserContext` (3 DB). Added to affected-resolvers list in Phase A2.
- **Revised cost model**: Current ~49-50 DB + ~33 Redis per /permissions navigation → Target ~5-6 DB + ~7 Redis (Option A: BatchHttpLink, ~88-89% DB reduction) OR ~25-26 DB + ~26 Redis (Option B: source-aggregation, ~48-49% DB reduction); 79% / 21% Redis reduction respectively.
