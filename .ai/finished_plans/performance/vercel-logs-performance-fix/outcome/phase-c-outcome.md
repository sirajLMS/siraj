# Phase C — Eliminate Redundant User Fetch in refreshToken

**Completed:** 2026-08-19T00:07:00+03:00  
**Plan:** `.ai/plans/vercel-logs-performance-fix/`  
**Requirements:** REQ 3  
**Design Component:** Component 4

---

## Tasks Completed

| Task | Status | Notes |
|------|--------|-------|
| C1.1 | ✅ | Replaced `UserService.findById` with conditional reuse of already-loaded `user` |
| C1.2 | ✅ | 2 paired unit tests covering non-impersonation (reuse) and impersonation (fetch) paths |
| C1.3 | ✅ | All tests pass via `run-test.ts` |
| C1.4 | ✅ | This outcome file |

---

## Files Modified

### `backend/graphql/mutation/auth/auth.mutation.ts`

**Changes:**
1. Exported `rotateTokensAndSession` for unit testing (was module-private)
2. Replaced redundant `UserService.findById(effectiveUserId)` with conditional user reuse

**Before (line 172):**
```typescript
const effectiveUser = (await UserService.findById(effectiveUserId)) ?? user;
```

**After (lines 173-176):**
```typescript
// Reuse the already-loaded `user` when not impersonating (effectiveUserId === user.id).
// Only fetch from DB when impersonating (effectiveUserId !== user.id).
const effectiveUserId = ctx.isImpersonating && ctx.user ? ctx.user.id : user.id;
const effectiveUser = effectiveUserId === user.id ? user : ((await UserService.findById(effectiveUserId)) ?? user);
```

**Rationale:** When `effectiveUserId === user.id` (the common non-impersonation case), the already-loaded `user` object from `createContext` is reused, eliminating 1 uncached DB query per `refreshToken` call. When impersonating (`effectiveUserId !== user.id`), the impersonated user is fetched from the DB as before.

### `backend/graphql/mutation/auth/test/auth.mutation.test.ts` (NEW)

**Changes:** Created new test file with 2 test cases:

1. **"reuses already-loaded user when not impersonating"** — verifies `UserService.findById` is NOT called when `ctx.isImpersonating` is false (effectiveUserId === user.id)
2. **"fetches user via UserService.findById when impersonating"** — verifies `UserService.findById` IS called with the impersonating user's ID when `ctx.isImpersonating` is true

**Mocking approach:** Uses `mock.module()` to stub:
- `@/backend/graphql/gqlSchemaBuilder` — prevents Pothos schema registration side effects
- `@/backend/graphql/pothos` — prevents Pothos input/output object registration
- `@/backend/lib/auth/jwt` — mocks token generation/verification
- `@/backend/lib/auth/cookies`, `createAuthSession`, `password` — prevents DB/next-headers access
- `@/backend/lib/ratelimit`, `@/backend/graphql/shared` — prevents rate limiting dependencies

`spyOn` is used for `UserService.findById`, `SessionService.updateSession`, `ImpersonationService.issueAccessTokenForSession`, and `PermissionGroupSimulationService.issueAccessTokenForSession`.

---

## Verification

### Test Results (C1.3)
```
backend/graphql/mutation/auth/test/auth.mutation.test.ts:
(pass) rotateTokensAndSession user reuse optimization > reuses already-loaded user when not impersonating (no UserService.findById call) [0.79ms]
(pass) rotateTokensAndSession user reuse optimization > fetches user via UserService.findById when impersonating [4.04ms]

 2 pass
 0 fail
 5 expect() calls
```

### Quality Loop Results
- **tsgo:** ✅ passed
- **oxlint:** ✅ passed
- **biome:** ✅ passed
- **lint:type-aware:** ✅ passed
- **duplicates:** ✅ passed
- **codescene:** ✅ passed

---

## Performance Impact

- **Before:** 1 `UserService.findById` call per `refreshToken` mutation (always, even when user is already loaded)
- **After:** 0 `UserService.findById` calls when not impersonating (common case), 1 call when impersonating
- **Savings:** 1 uncached DB query eliminated per `refreshToken` call in the non-impersonation path

---

## Cross-File Dependencies

None. `rotateTokensAndSession` is self-contained — the `user` parameter is already passed by the caller. The export addition enables testing without affecting runtime behavior.
