# Phase A2 — Eliminate scopeAuth Redundant getUserContext

**Completed:** 2026-08-19T00:30:00+03:00  
**Plan:** `.ai/plans/vercel-logs-performance-fix/`  
**Requirements:** REQ 1.5  
**Design Component:** Component 2

---

## Tasks Completed

| Task | Status | Notes |
|------|--------|-------|
| A2.1.1 | ✅ | Early return in scopeAuth + dead code cleanup (R3-2) |
| A2.1.2 | ✅ | 16 unit tests covering all 5 scope types |
| A2.1.3 | ✅ | This outcome file |

---

## Files Modified

### `backend/graphql/gqlSchemaBuilder.ts`

**Changes:**
1. Extracted `buildAuthScopes()` as a standalone exported function (dependency-injectable `getUserContext` parameter for testability)
2. Converted `superAdmin` scope from an eager boolean to a lazy scope-loader function — only evaluates when a field with `authScopes: { superAdmin: true }` is actually queried
3. The `superAdmin` scope loader skips `getUserContext` when `actorUserId === ctx.user?.id` (no impersonation/group-sim), returning `ctx.isSuperAdmin` directly — eliminates 3 redundant DB queries per permission-scoped field per request
4. Removed dead `else if (ctx.actorUserId)` branch (R3-2) — unreachable because `realUserId = ctx.realUserId ?? ctx.actorUserId ?? ctx.user?.id` already covers `ctx.actorUserId`

**Before:**
```typescript
authScopes: async (ctx) => {
  const realUserId = ctx.realUserId ?? ctx.actorUserId ?? ctx.user?.id;
  // ... (eagerly calls getUserContext for superAdmin scope)
  const userContext = await PermissionsService.getUserContext(realUserId);
  return {
    loggedIn: !!ctx.user,
    permission: (key) => userContext.isSuperAdmin || userContext.permissions.includes(key),
    superAdmin: userContext.isSuperAdmin,
    // ...
  };
},
```

**After:**
```typescript
export function buildAuthScopes(
  ctx: BaseContext,
  getUserContext: (userId: string) => Promise<{ isSuperAdmin: boolean }> = PermissionsService.getUserContext
) {
  return {
    loggedIn: !!ctx.user,
    permission: (key: AppPermission) => ctx.isSuperAdmin || ctx.permissions.includes(key),
    superAdmin: async () => {
      const actorUserId = ctx.realUserId ?? ctx.actorUserId ?? ctx.user?.id;
      if (!actorUserId || actorUserId === ctx.user?.id) {
        return ctx.isSuperAdmin;
      }
      const actorContext = await getUserContext(actorUserId);
      return actorContext.isSuperAdmin;
    },
    notImpersonating: !ctx.isImpersonating,
    notSimulatingGroup: !ctx.isSimulatingGroup,
  };
}

// In SchemaBuilder config:
authScopes: async (ctx) => buildAuthScopes(ctx),
```

**Key insight:** The `permission` scope now uses `ctx.isSuperAdmin` and `ctx.permissions` directly (already populated by `createContext`) — no `getUserContext` call needed. The `superAdmin` scope is lazy (Pothos scope-loader function), so it only evaluates when a field actually requires it, and even then skips `getUserContext` when not impersonating.

### `backend/graphql/test/gqlSchemaBuilder.scopeAuth.test.ts` (NEW)

**Changes:** Created 16 unit tests organized by scope type:
- **permission scope** (4 tests): superadmin short-circuit, permission present, permission absent, empty permissions
- **loggedIn scope** (2 tests): user defined, user undefined
- **superAdmin scope** (6 tests): same-user lazy return (true/false), impersonating calls getUserContext, actorUserId fallback, anonymous fallback
- **notImpersonating scope** (2 tests): not impersonating, impersonating
- **notSimulatingGroup scope** (2 tests): not simulating, simulating

Tests use dependency injection via the `getUserContext` parameter to mock the DB call and assert call counts.

---

## Approach Taken

1. **Analysis:** Discovered that Pothos `authScopes` callback is cached per-request via `RequestCache.getScopes()`, and scope-loader functions (values in the scope map that are functions) are evaluated lazily per-argument via `evaluateScopeLoader`. This means:
   - The `authScopes` callback runs once per request (not per-field)
   - Boolean scope values are precomputed eagerly
   - Function scope values are evaluated lazily when a field actually uses that scope

2. **Optimization:** Converted `superAdmin` from an eager boolean to a lazy function. When the actor is the same as the logged-in user (not impersonating/group-simulating), `ctx.isSuperAdmin` already has the correct value (populated by `createContext`), so `getUserContext` is skipped entirely. When impersonating, `realUserId` (the impersonator) differs from `ctx.user.id` (the impersonated user), so `getUserContext(realUserId)` is needed to get the impersonator's super-admin status.

3. **Dead code cleanup (R3-2):** The `else if (ctx.actorUserId)` branch at the old lines 116-118 was unreachable because the `realUserId` assignment (`ctx.realUserId ?? ctx.actorUserId ?? ctx.user?.id`) already backfills from `ctx.actorUserId`. Removed this branch.

---

## Test Results

```
16 pass
0 fail
35 expect() calls
Ran 16 tests across 1 file. [631ms]
```

Quality loop (`--lifecycle codescene`): All 6 checks passed (tsgo, oxlint, biome, lint:type-aware, duplicates, codescene) for both `gqlSchemaBuilder.ts` and the test file.

---

## Dead Code Cleanup (R3-2)

Removed the unreachable `else if (ctx.actorUserId)` branch. The assignment `const realUserId = ctx.realUserId ?? ctx.actorUserId ?? ctx.user?.id` already covers `ctx.actorUserId` via nullish coalescing, making the separate `else if` branch dead code.

---

## Cross-File Dependencies

None. All changes are self-contained in `gqlSchemaBuilder.ts` and its test file. The `buildAuthScopes` function is exported for testability but the internal `authScopes` callback uses it with the default `getUserContext` parameter.

---

## Carry-Forward Knowledge

- **Pothos scope caching:** The `authScopes` callback is evaluated once per request and cached. Scope-loader functions are evaluated lazily per-argument and also cached. This means the `superAdmin` scope-loader function only runs when a field with `{ authScopes: { superAdmin: true } }` is actually queried.
- **`buildAuthScopes` is dependency-injectable:** The second parameter `getUserContext` defaults to `PermissionsService.getUserContext` but can be overridden in tests. This pattern should be used in future phases when extracting side-effectful logic from Pothos configuration.
- **Phase A1 overloads:** The `hasPermission`/`hasAnyPermission` overloads added in Phase A1 are not used in `buildAuthScopes` — the `permission` scope uses `ctx.isSuperAdmin` and `ctx.permissions` directly (no function call). The overloads are available for resolver-level permission checks.
