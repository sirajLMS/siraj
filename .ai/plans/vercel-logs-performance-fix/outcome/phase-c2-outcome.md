# Phase C2 — Eliminate validateSession Redundant findSafeById

**Completed:** 2026-08-19T00:07:00+03:00  
**Plan:** `.ai/plans/vercel-logs-performance-fix/`  
**Requirements:** REQ 3  
**Design Component:** Component 4

---

## Tasks Completed

| Task | Status | Notes |
|------|--------|-------|
| C2.1.1 | ✅ | Added `skipUserCheck` option to `validateSession`; updated `resolveUserFromSession` caller |
| C2.1.2 | ✅ | 2 paired unit tests covering `skipUserCheck: true` and default behavior |
| C2.1.3 | ✅ | This outcome file |

---

## Files Modified

### `backend/services/auth/session.service.ts`

**Changes:** Added optional `options?: { skipUserCheck?: boolean }` parameter to `validateSession`. When `skipUserCheck` is `true`, the `UserRepository.findSafeById` call (orphan session check) is skipped.

**Before (line 32, simplified):**
```typescript
export async function validateSession(rawSessionId: string): Promise<SessionSelectType | null> {
  // ... session lookup ...
  const safeUser = await UserRepository.findSafeById(session.userId);
  if (!safeUser) {
    // purge orphan session
    return null;
  }
  return session;
}
```

**After (lines 32-85, simplified):**
```typescript
export async function validateSession(
  rawSessionId: string,
  options?: { skipUserCheck?: boolean }
): Promise<SessionSelectType | null> {
  // ... session lookup ...
  if (!options?.skipUserCheck) {
    const safeUser = await UserRepository.findSafeById(session.userId);
    if (!safeUser) { /* purge */ return null; }
  }
  return session;
}
```

**Rationale:** The `refreshToken` path already fetches the user via `UserService.findById` immediately after `validateSession` (in `resolveUserFromSession`). The `findSafeById` call inside `validateSession` was therefore redundant — it fetched the same user twice. The `skipUserCheck` option allows callers that already load the user to skip this redundant query. Default behavior (`skipUserCheck: false`) is preserved for backward compatibility.

### `backend/graphql/mutation/auth/auth.mutation.ts`

**Changes:** Updated `resolveUserFromSession` (line 42) to pass `{ skipUserCheck: true }`:

```typescript
const session = await SessionService.validateSession(sessionId, { skipUserCheck: true });
```

The caller immediately fetches the user via `UserService.findById(session.userId)` on the next line, making the `findSafeById` inside `validateSession` redundant.

### `backend/services/auth/test/session.service.test.ts`

**Changes:** Added 2 new test cases to the existing `validateSession` describe block:

1. **"skips findSafeById when skipUserCheck is true"** — verifies `UserRepository.findSafeById` is NOT called and the session is returned
2. **"calls findSafeById and returns session when skipUserCheck is false (default)"** — verifies `UserRepository.findSafeById` IS called and the session is returned

Also extracted `setupValidSessionMocks()` helper to eliminate CodeScene code-duplication warnings across the 3 test cases in the describe block.

---

## Caller Analysis

All 6 callers of `validateSession` were checked:

| Caller | Modified? | Reason |
|--------|-----------|--------|
| `auth.mutation.ts:resolveUserFromSession` | ✅ `{ skipUserCheck: true }` | Immediately fetches user via `UserService.findById` |
| `server-auth.ts:getServerUserContext` | ❌ (keeps default) | `buildSessionOnlyContext` re-checks user existence for GUEST role safety |
| `session.service.ts:logoutUser` | ❌ (keeps default) | Needs orphan session check for security |
| `app/api/storage/vercel-upload/route.ts` | ❌ (keeps default) | Only uses `session.userId` — user check adds safety |
| `app/api/storage/files/[[...path]]/route.ts` | ❌ (keeps default) | Only uses `session.userId` — user check adds safety |
| `app/api/storage/cleanup/route.ts` | ❌ (keeps default) | Only uses `session.userId` — user check adds safety |

---

## Verification

### Test Results
```
backend/services/auth/test/session.service.test.ts:
(pass) SessionService.validateSession orphan session handling > purges and returns null when session references non-existent user [0.50ms]
(pass) SessionService.validateSession orphan session handling > skips findSafeById when skipUserCheck is true [4.24ms]
(pass) SessionService.validateSession orphan session handling > calls findSafeById and returns session when skipUserCheck is false (default) [0.17ms]

 7 pass (including 4 pre-existing), 0 fail, 12 expect() calls
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

- **Before:** 1 `UserRepository.findSafeById` call per `refreshToken` call (inside `validateSession`) + 1 `UserService.findById` call (in `resolveUserFromSession`) = 2 user DB queries
- **After:** 0 `findSafeById` calls + 1 `UserService.findById` call = 1 user DB query
- **Savings:** 1 uncached DB query eliminated per `refreshToken` call

---

## Cross-File Dependencies

None. The `skipUserCheck` option is opt-in and backward-compatible. All callers that don't pass the option retain the original behavior.
