# Permission & Permission-Group Administration

The `/permissions` dashboard page lets privileged admins manage the catalog of seeded system permissions, custom permission groups, group-to-user assignments, and per-user GRANTED/DENIED overrides. Entry is gated twice: `withPageAuth` on `app/(dashboard)/permissions/page.tsx` requires `PERMISSION_GROUPS_MANAGE`, and every Pothos field in `permission-management.pothos.ts` declares `authScopes: { permission: ..., notImpersonating: true }` while `PermissionManagementService` re-checks the actor via `requireManageAccess` / `requireAssignAccess` before touching data. Group CRUD flows through `PermissionManagementRepository` into the `permissions`, `permission_groups`, and `group_permissions` tables, names are validated, slugified, and deduplicated with a suffix counter, while system groups are immutable except for their `permissionIds` and cannot be deleted. Assignments and overrides write to `user_permission_groups` / `user_permission_overrides` under guards that forbid modifying yourself, modifying super admins (for revoke/override paths), or acting on missing users, and each successful write calls `invalidateRoleChangeFailOpen` so cached contexts are evicted without failing the request. At request time, `createContext` calls `PermissionsService.getUserContext(userId)`, which joins `users → user_permission_groups → permission_groups / group_permissions → permissions`, grants super admins the full catalog, and derives `UserRole` from group slugs, Pothos `authScopes` then evaluates `ctx.isSuperAdmin || ctx.permissions.includes(key)` per field. `getEffectiveUserPermissions` additionally layers GRANTED/DENIED user overrides over the group-derived set when an admin inspects a user's effective permissions.

## Key sources

- `app/(dashboard)/permissions/page.tsx` — page entry, `withPageAuth([PERMISSION_GROUPS_MANAGE])` guard
- `backend/graphql/pothos/permissions/permission-management.pothos.ts` — Pothos query/mutation fields with `authScopes` (manager + assign permissions, `notImpersonating`)
- `backend/graphql/gqlSchemaBuilder.ts` — `buildAuthScopes` permission scope (`ctx.isSuperAdmin || ctx.permissions.includes(key)`), `authScopes: async ctx => buildAuthScopes(ctx)`
- `backend/services/auth/permission-management.service.ts` — admin CRUD, assignment, override, and effective-permission lifecycle with actor guards
- `backend/services/auth/permissions.service.ts` — `getUserContext` resolution (super-admin catalog, group join, `resolveRoleFromGroupSlugs`, batched `getUserContexts`)
- `backend/services/cache/EntityCacheService.ts` — `invalidateRoleChange` used by the fail-open invalidation helper
- Tables touched: `permissions`, `permission_groups`, `group_permissions`, `user_permission_groups`, `user_permission_overrides`, `users`

```mermaid
%% Permission & Permission-Group Administration: admin CRUD lifecycle for permission groups plus request-time effective permission resolution (authScope pattern)
sequenceDiagram
    actor Admin
    participant Page as app/(dashboard)/permissions/page.tsx
    participant GQL as Pothos permission-management fields
    participant PMS as PermissionManagementService
    participant PS as PermissionsService
    participant Repo as PermissionManagementRepository
    participant DB as PostgreSQL
    participant Cache as EntityCacheService

    Note over Page: withPageAuth requires AppPermission.PERMISSION_GROUPS_MANAGE

    Admin->>Page: open /permissions dashboard page
    Page->>GQL: permissions, permissionGroups queries via Apollo
    GQL->>PMS: listPermissions / listGroups lists actor-scoped catalog
    PMS->>PS: requireManageAccess uses getUserContext actorUserId
    PS->>DB: users, user_permission_groups, group_permissions, permissions
    PS-->>PMS: UserPermissionContext with isSuperAdmin, permissions, role
    alt lacks PERMISSION_GROUPS_MANAGE and not super admin
        PMS-->>GQL: throw insufficientPermissions
    else allowed
        PMS->>Repo: listAllPermissions, listAllGroups, listAllGroupUsers
        Repo->>DB: permissions, permission_groups, user_permission_groups
        PMS-->>GQL: permission catalog and groups with assignedUsers
    end

    Admin->>GQL: createPermissionGroup / updatePermissionGroup / deletePermissionGroup
    GQL->>PMS: createGroup / updateGroup / deleteGroup
    PMS->>PS: requireManageAccess
    PMS->>PMS: validateGroupName then generateSlug with unique-suffix loop
    alt system group isSystem true
        PMS->>Repo: updateGroup with only permissionIds editable
        Note over PMS: name, slug, description immutable, delete rejected with cannotDeleteSystemPermissionGroup
    else custom group
        PMS->>Repo: createGroup / updateGroup / deleteGroup
        Repo->>DB: permission_groups, group_permissions
    end

    Admin->>GQL: assign / revoke group or updateUserOverrides single or bulk
    GQL->>PMS: assignGroupToUser, revokeGroupFromUser, bulk variants, updateUserOverrides
    PMS->>PS: requireAssignAccess or requireManageAccess
    PMS->>DB: requireUserSetup guards no self-modify, user exists, non-super-admin for revoke/overrides
    PMS->>Repo: bulkAssignUsersToGroup, bulkRevokeUsersFromGroup, setUserOverrides
    Repo->>DB: user_permission_groups, user_permission_overrides
    PMS->>Cache: invalidateRoleChange per user, fail-open on cache errors

    Note over Admin,DB: Request-time effective permission resolution (authScope pattern)
    Admin->>GQL: any protected query or mutation
    GQL->>PS: createContext resolves getUserContext userId
    PS->>DB: users join user_permission_groups, permission_groups, group_permissions, permissions
    PS-->>GQL: ctx.isSuperAdmin, ctx.permissions, role from group slugs
    GQL->>GQL: authScopes permission scope checks ctx.isSuperAdmin or ctx.permissions includes key plus notImpersonating
    alt scope passes
        GQL-->>Admin: resolver result
    else scope fails
        GQL-->>Admin: auth error
    end
    Note over PMS: getEffectiveUserPermissions layers GRANTED and DENIED user overrides over group permissions
```

Machine-checkable copy: [permission-management.mmd](./permission-management.mmd)
