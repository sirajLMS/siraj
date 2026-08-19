# Phase A3 Outcome — Eliminate Query.me Redundant User Fetch (R3-8)

## Approach

**Option (a) — Store `safeUser` on `BaseContext` (0 DB queries)**

The `createContext` function in `gqlContext.ts` already calls `UserService.findSafeById(userId)` at line ~97 to populate `user.displayCurrency`. The result was discarded — only `{ id, displayCurrency }` was stored on the context. This change stores the full `safeUser` object on the context (stripped of sensitive fields), so the `Query.me` resolver can reuse it without any additional DB call.

## Files Modified

### 1. `backend/graphql/gqlContext.ts`
- Added `SanitizedSafeUser` type — `UserSelectType` with `password` and `rememberTokenHash` made optional (set to `undefined` at runtime)
- Added `safeUser: SanitizedSafeUser | null | undefined` field to `BaseContext` type
- Populated `safeUser` in both auth/unauth branches of `createContext`:
  - **Unauthenticated branch** (no `userId`): `safeUser: undefined`
  - **Authenticated branch**: `safeUser: safeUserForContext` where `safeUserForContext` is the `safeUser` result from `findSafeById` with `password` and `rememberTokenHash` set to `undefined` (R4-34)

### 2. `backend/graphql/query/auth/auth.query.ts`
- Replaced `const user = await UserService.findById(ctx.user.id)` with:
  ```typescript
  if (!ctx.safeUser) return null;
  return AuthUtils.toUserReturnType(ctx.safeUser, { role: ctx.role });
  ```
- Eliminates 1 DB query per `Query.me` call (16×/hour at 60s poll)
- `ctx.role` was already available on `BaseContext` (populated from `permissionContext.role`)

### 3. `backend/utils/auth.utils.ts`
- Added `UserReturnTypeInput` type — accepts `UserSelectType` OR the sanitized variant (where `password`/`rememberTokenHash` are optional)
- Widened `toUserReturnType` parameter from `UserSelectType` to `UserReturnTypeInput`
- Widened `toSafeUser` parameter from `UserReturnType` to `UserReturnType | UserReturnTypeInput`
- This was necessary because the sanitized `safeUser` (with `password: undefined`) does not satisfy `UserSelectType` where `password` is `string` (notNull)

## R4-34 Compliance

`SAFE_USER_SELECT` includes `password` and `rememberTokenHash`. Both are stripped before storing on the context:

```typescript
const safeUserForContext = safeUser
  ? { ...safeUser, password: undefined, rememberTokenHash: undefined }
  : null;
```

Runtime: both fields are `undefined` on the context object and on the returned `UserReturnType` (spread via `{ ...user }`).
Type level: `SanitizedSafeUser` makes both fields optional (`Partial<Pick<...>>`), so TypeScript correctly tracks them as `undefined`.

## R4-31 Compliance

`ctx.user` is typed as `{ id: string; displayCurrency: CurrencyCode | null }` — a 2-field minimal object, NOT `UserSelectType`. The `Query.me` resolver uses `ctx.safeUser` (the full `UserSelectType`-compatible object), NOT `ctx.user`, for `AuthUtils.toUserReturnType()`. This passes type-checking correctly.

## Test Results

**Test file:** `backend/graphql/query/auth/test/auth.query.test.ts` (11 tests)

```
11 pass
0 fail
20 expect() calls
Ran 11 tests across 1 file. [831ms]
```

### Test Coverage:
1. **R3-8 — No redundant fetch:** `UserService.findById` spy is NOT called when resolving `Query.me`
2. **toUserReturnType on sanitized type:** Correctly transforms `ctx.safeUser` with all fields (id, name, email, role)
3. **Role propagation:** `ctx.role` is passed through to `UserReturnType.role`
4. **null safeUser:** Returns `null` when `ctx.safeUser === null` (user not found in DB)
5. **undefined safeUser:** Returns `null` when `ctx.safeUser === undefined` (no userId provided)
6. **undefined user:** Returns `null` when `ctx.user === undefined`
7. **R4-34 — password stripped from context:** `ctx.safeUser.password` is `undefined`
8. **R4-34 — rememberTokenHash stripped from context:** `ctx.safeUser.rememberTokenHash` is `undefined`
9. **R4-34 — password stripped from return:** `UserReturnType.password` is `undefined`
10. **R4-34 — rememberTokenHash stripped from return:** `UserReturnType.rememberTokenHash` is `undefined`
11. **deletedAt excluded:** `UserReturnType` does not have `deletedAt` property

## Quality Loop Results

All 4 modified/created files passed the full quality loop (tsgo → oxlint → biome → lint:type-aware → duplicates → codescene):

| File | tsgo | oxlint | biome | lint | dupes | codescene |
|------|------|--------|-------|------|-------|-----------|
| `backend/graphql/gqlContext.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `backend/graphql/query/auth/auth.query.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `backend/utils/auth.utils.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `backend/graphql/query/auth/test/auth.query.test.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Cross-File Dependencies

- **`gqlContextFactory.ts`**: Spreads the `createContext` return value — `safeUser` automatically propagates without code changes.
- **`auth.utils.ts`**: Required widening `toUserReturnType` input type to accept the sanitized variant (`UserReturnTypeInput`). Without this, the code would not type-check because `SanitizedSafeUser` (with `password: undefined`) does not satisfy `UserSelectType` (where `password` is `string`).
- **No other resolvers affected**: `safeUser` is a new optional field on `BaseContext`; existing resolvers that don't reference it are unaffected.

## Performance Impact

- **Before:** 1 DB query per `Query.me` call (`UserService.findById`) × 16 calls/hour = 16 DB queries/hour
- **After:** 0 DB queries per `Query.me` call — reuses `safeUser` already fetched by `createContext`
- **Net reduction:** 16 DB queries/hour eliminated
