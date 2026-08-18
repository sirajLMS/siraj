# Plan Review — Round 1

**Date**: 2026-08-12
**Reviewer**: Copilot CLI (plan-review skill)
**Plan**: `.ai/plans/vercel-logs-performance-fix/`
**Result**: PASS (after 5 violations fixed)

## Affected Layers

| Layer | AGENTS.md Read |
|---|---|
| `backend/services/` | `backend/services/AGENTS.md` ✓ |
| `backend/graphql/` | `backend/graphql/AGENTS.md` ✓ |
| `backend/types/` | `backend/types/AGENTS.md` ✓ |
| `frontend/` | `frontend/AGENTS.md` ✓ |

## Violations Found and Fixed

### 1. `getAlerts` existing signature mismatch

**[BACKEND GRAPHQL]** `backend/graphql/query/notifications/notification-alerts.query.ts` line 15:
- **Expected**: The resolver calls `NotificationAlertsService.getAlerts(ctx.user.id, ctx.locale)` — the existing second parameter is `locale`, not `context`.
- **Plan had**: Design Component 2 described input as `UserPermissionContext (new) or userId (existing)` — missing the `locale` parameter entirely.
- **Fix applied**: Updated `design.md` Component 2 Interfaces and `trackable-tasks.md` A2.1 to specify the existing signature as `getAlerts(userId: string, locale: string)` and the new overload as `getAlerts(userId: string, context: UserPermissionContext, locale: string)`. Updated A3.2 to include `ctx.locale` as the third argument.

### 2. Resolver file path was vague

**[BACKEND GRAPHQL]** Component 3 Implementation Notes:
- **Expected**: Exact file path `backend/graphql/query/notifications/notification-alerts.query.ts` (confirmed line 7).
- **Plan had**: "`backend/graphql/query/notification/notification.query.ts` (or wherever the `notificationAlerts` resolver is defined)" — vague, instructed a search.
- **Fix applied**: Updated `design.md` Component 3 and `trackable-tasks.md` A3.1 to cite the confirmed file path and line numbers. A3.1 changed from "search for the resolver" to "verify the resolver file".

### 3. `navigator.sendBeacon` content-type incompatibility

**[FRONTEND]** Design failure mode table and task E2.2:
- **Expected**: `navigator.sendBeacon` defaults to `Content-Type: text/plain`, but `/api/logs` expects JSON. Using it would break the server-side JSON parser.
- **Plan had**: "Use `navigator.sendBeacon` as fallback if `fetch` fails during unload".
- **Fix applied**: Replaced with `fetch(url, { method: "POST", body: JSON.stringify(batch), keepalive: true })` — which supports JSON content-type and survives page unload. Updated `design.md` Component 8 Implementation Notes, failure mode table, and `trackable-tasks.md` E2.2.

### 4. `UserPermissionContext` type shape comment was unverified

**[BACKEND TYPES]** Design Data Models section:
- **Expected**: The type is confirmed at `backend/types/permissions/permission.types.ts` lines 5-10.
- **Plan had**: "Already defined in backend/types/ — verify exact shape" with an unverified interface definition.
- **Fix applied**: Updated `design.md` Data Models to show the confirmed type definition with `readonly` properties and the exact file/line reference.

### 5. `findSafeById` redundancy not addressed as out-of-scope

**[BACKEND SERVICES]** `gqlContext.ts` line 80 calls `UserService.findSafeById(userId)`:
- **Expected**: Either included as a fix target or explicitly noted as out-of-scope.
- **Plan had**: Mentioned in investigation notes but no design decision documented.
- **Fix applied**: Added "Non-Goals (Out of Scope)" section to `design.md` explaining that `findSafeById` is a security-filtered fetch (strips sensitive fields), NOT a duplicate of `findById`, and changing it risks exposing sensitive fields in `ctx.user`.

## Rules Verified (Passes)

| Rule | Status |
|---|---|
| Type imports from `@/backend/types/` | ✓ `UserPermissionContext` already exists there |
| No local type definitions in services | ✓ Plan imports from `@/backend/types` |
| Service-layer `.types.ts` prohibition | ✓ No `.types.ts` files created |
| Resolvers delegate to services | ✓ Pattern preserved |
| MUI v9 `sx` prop pattern | ✓ No MUI components introduced |
| i18n compile-time system | ✓ `locale` parameter preserved for error messages |
| Logging via `logger` (no `console.*`) | ✓ Plan uses existing logger imports |
| GraphQL documents include `id` field | ✓ Existing document unchanged |
| Test conventions (runInRollback, tx, no rejects.toThrow) | ✓ Tasks specify run-test script |
| `export *` barrel conventions | ✓ No barrel changes in plan |
| Backward compatibility via overloads | ✓ All existing signatures preserved |

## Conclusion

All 5 violations fixed. Plan now passes all AGENTS.md rules for affected layers. Ready for implementation (when user authorizes).
