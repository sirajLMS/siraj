Permission Management — Plan 2: Backend API (Services & GraphQL)

Section 1: Task B — Service Layer

File: backend/services/auth/permission-management.service.ts

Security Guards:

requireManageAccess(userId): Verifies PERMISSION_GROUPS_MANAGE.

requireAssignAccess(userId): Verifies PERMISSION_GROUPS_ASSIGN.

Core Logic & Edge Cases:

Slug Collision Handling (Implementation Fix):

When generating a slug in createGroup, loop to verify uniqueness.

let slug = baseSlug;
let counter = 1;
while (await db.query.permissionGroups.findFirst({ where: eq(permissionGroups.slug, slug) })) {
  slug = `${baseSlug}_${counter}`;
  counter++;
}


Self-Demotion Guard:

In bulkRevokeUsersFromGroup, filter out any userId that belongs to a SuperAdmin to prevent accidental lockout.

Override Resolution (Effective Permissions):

Add helper getEffectiveUserPermissions(userId) that combines base groups with userPermissionOverrides, overriding group Allows with explicit Denies where applicable.

Section 2: Task C — GraphQL Schema (Pothos)

File: backend/graphql/pothos/permission-management.pothos.ts

Types:

PermissionObject, PermissionGroupObject

UserOverrideObject (permissionId, state, assignedBy)

Queries:

permissions: List catalog.

permissionGroups: List all groups.

permissionGroup(id): Single group details + assigned users.

userOverrides(userId): List overrides for a user.

Mutations (Updated for Bulk):

createPermissionGroup(input)

updatePermissionGroup(input)

deletePermissionGroup(groupId)

bulkAssignUsersToGroup(groupId, userIds[])

bulkRevokeUsersFromGroup(groupId, userIds[])

updateUserOverrides(userId, overrides: [{ permissionId, state }])

Success Criteria:

[x] bun run generate:gqlSchema && bun codegen completes without errors.

[x] Service perfectly isolates SuperAdmins from removal operations.