# Phase A Outcome — NotificationAlerts Context-Aware Overloads

## Summary

Phase A (A2 + A3) added context-aware method overloads to `NotificationAlertsService` that accept a pre-populated `UserPermissionContext` instead of re-querying the database via `PermissionsService.getUserContext(userId)` (3 DB queries per call). The GraphQL `notificationAlerts` resolver was updated to construct the context from `ctx` fields and pass it to the context-aware overload, eliminating redundant DB queries on the hot notification alerts path.

## Files Modified

| File | Change |
|------|--------|
| `backend/services/notification/notification-alerts.service.ts` | Added context-aware overloads for `getAlerts`, `markAlertsRead`, `markOneAlertRead`. Added module-level helpers: `hasPermissionFromContext`, `isPermissionContext`, `buildAlertsResult`. Legacy paths delegate to context-aware paths via `getUserContext()`. |
| `backend/graphql/query/notifications/notification-alerts.query.ts` | Updated resolver to construct `UserPermissionContext` from `ctx` fields and call context-aware overload. |
| `backend/services/notification/test/notification-alerts.service.test.ts` | New unit test: 14 tests covering context-aware permission gating, superadmin fast-path, and legacy backward compatibility. |
| `frontend/common/graphql/test/notifications/notification-alerts.test.ts` | New GraphQL integration test: 4 tests covering authenticated queries, unauthenticated denial, and role-based behavior. |
| `.ai/plans/vercel-logs-performance-fix/trackable-tasks.md` | Checked boxes for A2.1–A2.5, A3.1–A3.4. |

## Approach

### Overload Pattern (Phase A2)

Each method (`getAlerts`, `markAlertsRead`, `markOneAlertRead`) received:
1. **TypeScript overload signatures** — one accepting `UserPermissionContext`, one preserving the legacy `userId + locale` signature.
2. **Runtime discriminator** — `isPermissionContext()` type guard checks `typeof value === "object" && value !== null && "permissions" in value && "isSuperAdmin" in value`.
3. **Context-aware fast path** — `*WithContext` helper uses `hasPermissionFromContext(context, permissionKey)` which checks `context.isSuperAdmin || context.permissions.includes(key)` — zero DB queries.
4. **Legacy path** — `*Legacy` helper calls `PermissionsService.getUserContext(userId)` (3 DB queries) then delegates to the context-aware path, eliminating duplicated permission-check logic.
5. **Shared execution helpers** — `buildAlertsResult`, `markAlertsReadExecute`, `markOneAlertReadExecute` contain the DB-fetch + transform logic shared by both paths.

### Resolver Wiring (Phase A3)

The GraphQL resolver constructs `UserPermissionContext` from `ctx` fields already populated by `createContext` in `gqlContext.ts`:
```typescript
const userPermissionContext: UserPermissionContext = {
  permissions: ctx.permissions,
  permissionGroups: ctx.permissionGroups,
  isSuperAdmin: ctx.isSuperAdmin,
  role: ctx.role,
};
return NotificationAlertsService.getAlerts(ctx.user.id, userPermissionContext, ctx.locale);
```

### Test Strategy

**Unit tests** (A2.4): Spied on `PermissionsService.getUserContext` to verify:
- Context-aware overloads do NOT call `getUserContext` (the performance guarantee)
- Legacy overloads DO call `getUserContext` (backward compatibility)
- Permission gating: empty context → empty result, `NOTIFICATION_VIEW_ALERTS` → proceeds, `isSuperAdmin` → fast-path
- Error cases: `markAlertsRead` / `markOneAlertRead` throw when context lacks permission

**Integration tests** (A3.3): End-to-end GraphQL query validated:
- Super admin receives alert feed with correct structure
- Teacher role receives alert feed
- Unauthenticated requests are denied
- Parent role receives empty alert feed (lacks `NOTIFICATION_VIEW_ALERTS`)

## Test Results

### Unit Tests (A2.5)
```
backend/services/notification/test/notification-alerts.service.test.ts:
  14 pass
  0 fail
  23 expect() calls
Ran 14 tests across 1 file. [253.00ms]
```

### GraphQL Integration Tests (A3.4)
```
frontend/common/graphql/test/notifications/notification-alerts.test.ts:
  4 pass
  0 fail
  19 expect() calls
Ran 4 tests across 1 file. [2.22s]
```

### Quality Gates
- All files passed `sub-loop.ts --lifecycle codescene` (tsgo → oxlint → biome → lint:type-aware → duplicates → codescene)

## Cross-File Dependencies

- **`PermissionsService.getUserContext`** (from Phase A1): Used by legacy overload paths to fetch `UserPermissionContext` from the database. The context-aware paths bypass this entirely.
- **`UserPermissionContext` type** (from `@/backend/types`): Shared type定义 that flows from `ctx` → resolver → service.
- **`gqlContext.ts`**: Already populates `ctx.permissions`, `ctx.permissionGroups`, `ctx.isSuperAdmin`, `ctx.role` — no changes needed.
- **`AppPermission.NOTIFICATION_VIEW_ALERTS`** and **`AppPermission.COMPLAINTS_LIST`**: Permission constants from `@/backend/enum` used for gating.

## Performance Impact

Before Phase A: `notificationAlerts` query → `getAlerts(userId, locale)` → `PermissionsService.getUserContext(userId)` (3 DB queries) → permission checks.

After Phase A: `notificationAlerts` query → resolver constructs context from `ctx` → `getAlerts(userId, context, locale)` → `hasPermissionFromContext(context, ...)` (0 DB queries) → permission checks.

**Net: 3 DB queries eliminated per `notificationAlerts` GraphQL query.**
