Permission Management — Plan 1: Architecture & Data Layer

Section 0: Story Context & Scope

Story scope:

SuperAdmin manages custom groups (create, edit, delete, bulk assign permissions).

SuperAdmin manages user group assignments (bulk assign/revoke).

SuperAdmin manages user-specific Explicit Overrides (Allow/Deny).

System groups (isSystem = true) and core permissions are immutable.

Required permissions: AppPermission.PERMISSION_GROUPS_MANAGE, AppPermission.PERMISSION_GROUPS_ASSIGN

Section 1: Core Principles

No Monoliths: Business logic in services, DB queries in repositories.

Strict Typing: No any or as unknown. Use Drizzle inferred types.

Zero Incomplete Code: No // TODO or mocked data left in production paths.

Security: All mutations wrapped in db.transaction(). System groups protected at the DB/Repo layer.

Section 2: Data Model Updates (Requires Migration)

To support the new UX (Explicit Allows/Denies per user), we must add a new table to backend/db/schema/permissions.ts.

export const userPermissionOverrides = pgTable("user_permission_overrides", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  permissionId: uuid("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  state: varchar("state", { length: 20 }).notNull(), // 'GRANTED' | 'DENIED'
  assignedByUserId: uuid("assigned_by_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey(t.userId, t.permissionId)
}));


Section 3: Task A — Repository Layer

File: backend/db/repo/permission-management.repository.ts

Requirements:

Group Management:

listAllGroups(): Returns left-joined aggregation of groups and their permissionIds.

getGroupById(groupId)

createGroup(input): Atomic transaction inserting group + permissions.

updateGroup(input): Atomic transaction. Clears and replaces groupPermissions. Throws if isSystem.

deleteGroup(groupId): Throws if isSystem.

Bulk User Management (New):

listUsersInGroup(groupId): Returns users currently holding a specific groupId.

bulkAssignUsersToGroup(userIds[], groupId): Uses tx.insert().onConflictDoNothing().

bulkRevokeUsersFromGroup(userIds[], groupId): Uses tx.delete().where(inArray()).

Overrides Engine (New):

getUserOverrides(userId): Returns all explicit GRANTS and DENIES for a single user.

setUserOverrides(userId, overrides: { permissionId, state }[]): Atomic transaction that clears existing overrides for the user and inserts the new ones.

Success Criteria:

[x] Multi-table writes use db.transaction().

[x] Drizzle inArray used for all bulk operations.

[x] Tests pass for cannotDeleteSystem exceptions.