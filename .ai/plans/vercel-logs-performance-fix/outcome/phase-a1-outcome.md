# Phase A1 — Add UserPermissionContext Overloads to PermissionsService

**Completed:** 2026-08-18T23:55:00+03:00  
**Plan:** `.ai/plans/vercel-logs-performance-fix/`  
**Requirements:** REQ 1  
**Design Component:** Component 1

---

## Tasks Completed

| Task | Status | Notes |
|------|--------|-------|
| A1.1 | ✅ | Type already exists — no creation needed |
| A1.2 | ✅ | `hasPermission` overload added with TypeScript overloads |
| A1.3 | ✅ | `hasAnyPermission` overload added with TypeScript overloads |
| A1.4 | ✅ | 12 test cases covering all edge cases |
| A1.5 | ✅ | All 12 tests pass |

---

## Files Modified

### `backend/services/auth/permissions.service.ts`

**Changes:** Added TypeScript function overloads to `hasPermission` and `hasAnyPermission` inside the `PermissionsService` namespace.

**`hasPermission` — Before (single signature):**
```typescript
export async function hasPermission(userId: string, permissionKey: AppPermission): Promise<boolean> {
  const context = await PermissionsService.getUserContext(userId);
  return context.isSuperAdmin || context.permissions.includes(permissionKey);
}
```

**`hasPermission` — After (2 overload signatures + unified implementation):**
```typescript
export async function hasPermission(
  context: UserPermissionContext,
  permissionKey: AppPermission,
): Promise<boolean>;
export async function hasPermission(userId: string, permissionKey: AppPermission): Promise<boolean>;
export async function hasPermission(
  userIdOrContext: string | UserPermissionContext,
  permissionKey: AppPermission,
): Promise<boolean> {
  if (typeof userIdOrContext !== "string") {
    if (userIdOrContext.isSuperAdmin) return true;
    return userIdOrContext.permissions.includes(permissionKey);
  }
  const context = await PermissionsService.getUserContext(userIdOrContext);
  return context.isSuperAdmin || context.permissions.includes(permissionKey);
}
```

**`hasAnyPermission` — Same pattern:** Two overload signatures + unified implementation. Superadmin fast-path, then `permissionKeys.some()` against `context.permissions`. Empty `permissionKeys` array returns `false` before any context check.

**Key design decisions:**
- Used TypeScript function overloads (not separate function names) to maintain API surface compatibility — existing callers using `(userId, permissionKey)` continue working unchanged.
- The `UserPermissionContext` overload does NOT call `getUserContext()` — it checks `context.isSuperAdmin` and `context.permissions` directly, eliminating the redundant DB queries (3 queries per `getUserContext` call).
- The `typeof userIdOrContext !== "string"` discriminator cleanly separates the two paths at runtime.

---

## Files Created

### `backend/services/auth/test/permissions.service.test.ts`

**12 test cases** organized in 2 `describe` blocks:

**`hasPermission` (5 tests):**
1. Superadmin fast-path returns true without checking permissions array
2. Superadmin returns true even when permissions array is empty
3. Returns true when permission is present in context.permissions
4. Returns false when permission is absent from context.permissions
5. Returns false when permissions array is empty and not superadmin

**`hasAnyPermission` (7 tests):**
1. Superadmin fast-path returns true without checking permissions array
2. Superadmin returns true even when permissions array is empty
3. Returns true when at least one permission is present in context.permissions
4. Returns false when none of the requested permissions are present
5. Returns false when permissions array is empty and not superadmin
6. Returns false when permissionKeys array is empty (edge case guard)
7. Returns true when all requested permissions are present

**Test approach:**
- Pure unit tests — no DB calls, no mocking needed, since the `UserPermissionContext` overload doesn't touch the database
- Helper `makeContext()` builds `UserPermissionContext` objects with selective overrides
- Uses `AppPermission.DASHBOARD_VIEW`, `AppPermission.DASHBOARD_VIEW_METRICS`, `AppPermission.SCHEDULE_VIEW_ALL` as test permissions
- Assertion pattern: `const result = await PermissionsService.hasPermission(context, ...); expect(result).toBe(...)` — avoids `await expect().resolves` which triggers oxlint `await-thenable` false positive

---

## A1.1: UserPermissionContext Type Verification

The type **already exists** in `backend/types/permissions/permission.types.ts` (lines 5-10):

```typescript
export type UserPermissionContext = {
  readonly permissions: AppPermission[];
  readonly permissionGroups: string[];
  readonly isSuperAdmin: boolean;
  readonly role: UserRole;
};
```

Exported via barrel chain:
- `backend/types/permissions/index.ts` → `export * from "./permission.types"`
- `backend/types/index.ts` → `export * from "./permissions"`

Import in `permissions.service.ts` uses `@/backend/types` (shortest barrel path) — no changes needed.

The type matches the `BaseContext` permission fields confirmed in `gqlContext.ts` lines 82-93: `permissions`, `permissionGroups`, `isSuperAdmin`, `role`.

---

## Quality Loop Results

### `backend/services/auth/permissions.service.ts`
- ✅ tsgo — passed (0 errors)
- ✅ oxlint — passed
- ✅ biome:check — passed
- ✅ lint:type-aware — passed
- ✅ check:duplicates — passed
- ✅ codescene — passed

### `backend/services/auth/test/permissions.service.test.ts`
- ✅ tsgo — passed (0 errors)
- ✅ oxlint — passed
- ✅ biome:check — passed
- ✅ lint:type-aware — passed
- ✅ check:duplicates — passed
- ✅ codescene — passed

---

## Test Results

```
bun test backend/services/auth/test/permissions.service.test.ts

12 pass
0 fail
12 expect() calls
Ran 12 tests across 1 file. [216.00ms]
```

---

## Cross-File Dependencies Discovered

None. All changes were self-contained in the two files modified/created.

---

## Carry-Forward Knowledge for Phase A2 and A3

### For Phase A2 (scopeAuth — `gqlSchemaBuilder.ts`)
- The `UserPermissionContext` overload is now available on `PermissionsService.hasPermission()` and `PermissionsService.hasAnyPermission()`.
- The scopeAuth evaluator in `gqlSchemaBuilder.ts` can pass `ctx` fields directly as a `UserPermissionContext` object instead of calling `PermissionsService.getUserContext(userId)` — eliminating 3 DB queries per scopeAuth evaluation.
- **Construction pattern:** `{ permissions: ctx.permissions, permissionGroups: ctx.permissionGroups, isSuperAdmin: ctx.isSuperAdmin, role: ctx.role }` — all 4 fields are already on `BaseContext`.
- **Dead code (R3-2):** `gqlSchemaBuilder.ts` lines 116-118 (`else if (ctx.actorUserId)` branch) are unreachable and should be deleted during A2.

### For Phase A3 (Query.me — `auth.query.ts`)
- Phase A3 is about `UserService.findById()` redundancy, NOT permission overloads — but the `UserPermissionContext` type is confirmed available for any permission checks needed during `Query.me` resolution.
- **R4-31 correction applies:** `ctx.user` is typed as `{ id: string; displayCurrency: CurrencyCode | null }` — NOT `UserSelectType`. Do not attempt `AuthUtils.toUserReturnType(ctx.user)`.

### For Component 2 (NotificationAlertsService)
- The overload pattern established here (TypeScript function overloads with `string | UserPermissionContext` discriminator) can be applied to `NotificationAlertsService.getAlerts()`, `markAlertsRead()`, `markOneAlertRead()` in the next phase.
- **Important:** `NotificationAlertsService.getAlerts()` existing signature is `getAlerts(userId: string, locale: string)` — the new overload adds `context: UserPermissionContext` as a second parameter: `getAlerts(userId: string, context: UserPermissionContext, locale: string)`. This is NOT a TypeScript overload — it's a 3-arg vs 2-arg distinction (different arity, not different types for the same position).

### Assertion Pattern for Future Tests
- Use `const result = await fn(); expect(result).toBe(...)` — NOT `await expect(fn()).resolves.toBe(...)` — to avoid oxlint `await-thenable` and sonarjs `async-test-assertions` false positives on Bun's `expect()` return type.
