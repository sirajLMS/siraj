import { eq } from "drizzle-orm";
import { db } from "@/backend/db";
import {
  collectGroupsWithPermissions,
  collectGroupUsersMap,
  collectUniqueUserIds,
  localizedOrderExpr,
  permissionGroupWithPermissionSelect,
  runInTransaction,
  toGroupReturn,
  toPermissionReturn,
} from "@/backend/db/repo/permissions/permission-management.repository.helpers";
import {
  createGroupRecord,
  deleteBulkUsersFromGroup,
  deleteGroupRecord,
  insertBulkUsersToGroup,
  replaceUserOverrides,
  updateGroupRecord,
} from "@/backend/db/repo/permissions/permission-management.repository.operations";
import {
  groupPermissions,
  permissionGroups,
  permissions,
  userPermissionGroups,
  userPermissionOverrides,
  users,
} from "@/backend/db/schema";
import type { AppPermission } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import type {
  CreateGroupInput,
  DBTransaction,
  GroupUserEntity,
  GroupWithPermissionIds,
  PermissionReturnType,
  UpdateGroupInput,
  UserOverrideInput,
  UserPermissionOverrideSelectType,
} from "@/backend/types";

async function runInTxWithLogging<T>(
  tx: DBTransaction | undefined,
  run: (t: DBTransaction) => Promise<T>,
  buildLogMessage: () => string
): Promise<T> {
  try {
    return await runInTransaction(tx, run);
  } catch (error) {
    logger.error(buildLogMessage(), error);
    throw error;
  }
}

export namespace PermissionManagementRepository {
  export async function getPermissionIdByKey(key: AppPermission, tx?: DBTransaction): Promise<string | null> {
    const client = tx ?? db;
    const [row] = await client
      .select({ id: permissions.id })
      .from(permissions)
      .where(eq(permissions.key, key))
      .limit(1);
    return row?.id ?? null;
  }

  export async function upsertUserPermissionOverride(
    input: {
      userId: string;
      permissionId: string;
      state: UserOverrideInput["state"];
      assignedByUserId: string | null;
    },
    tx?: DBTransaction
  ): Promise<UserPermissionOverrideSelectType> {
    const client = tx ?? db;
    const now = new Date();
    const [row] = await client
      .insert(userPermissionOverrides)
      .values({
        userId: input.userId,
        permissionId: input.permissionId,
        state: input.state,
        assignedByUserId: input.assignedByUserId,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: [userPermissionOverrides.userId, userPermissionOverrides.permissionId],
        set: { state: input.state },
      })
      .returning();
    return row;
  }

  /**
   * List all permission catalog entries.
   * NOTE: The is_system field for permissions is protected by a database trigger (trg_protect_system_permissions).
   * Creating any new permission with is_system = true or updating an existing custom permission
   * to be a system permission is strictly prohibited by the database schema.
   * @returns PermissionReturnType[] with description/category resolved for locale
   */
  export async function listAllPermissions(locale?: string, tx?: DBTransaction): Promise<PermissionReturnType[]> {
    try {
      const client = tx ?? db;
      const rows = await client
        .select()
        .from(permissions)
        .orderBy(localizedOrderExpr(permissions.category, locale), permissions.resource, permissions.action);
      return rows.map(row => toPermissionReturn(row, locale));
    } catch (error) {
      logger.error("Error listing all permissions:", error);
      throw error;
    }
  }

  /**
   * Returns left-joined aggregation of groups and their permissionIds.
   */
  export async function listAllGroups(locale?: string, tx?: DBTransaction): Promise<GroupWithPermissionIds[]> {
    try {
      const client = tx ?? db;
      const rows = await client
        .select(permissionGroupWithPermissionSelect)
        .from(permissionGroups)
        .leftJoin(groupPermissions, eq(groupPermissions.groupId, permissionGroups.id))
        .orderBy(localizedOrderExpr(permissionGroups.name, locale));
      return collectGroupsWithPermissions(rows, locale);
    } catch (error) {
      logger.error("Error listing all permission groups:", error);
      throw error;
    }
  }

  /**
   * Returns a group by its ID including its permissionIds.
   */
  export async function getGroupById(
    groupId: string,
    locale?: string,
    tx?: DBTransaction
  ): Promise<GroupWithPermissionIds | null> {
    try {
      const client = tx ?? db;
      const [group] = await client.select().from(permissionGroups).where(eq(permissionGroups.id, groupId)).limit(1);

      if (!group) return null;

      const gpList = await client.select().from(groupPermissions).where(eq(groupPermissions.groupId, groupId));

      return toGroupReturn(
        group,
        gpList.map(gp => gp.permissionId),
        locale
      );
    } catch (error) {
      logger.error(`Error fetching group by ID ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Returns a permission group row by its slug (read by system-automated callers
   * and seeds; no permissions list).
   */
  export async function findGroupBySlug(
    slug: string,
    tx?: DBTransaction
  ): Promise<{ id: string; slug: string; isSystem: boolean } | null> {
    const client = tx ?? db;
    const [row] = await client
      .select({ id: permissionGroups.id, slug: permissionGroups.slug, isSystem: permissionGroups.isSystem })
      .from(permissionGroups)
      .where(eq(permissionGroups.slug, slug))
      .limit(1);
    return row ?? null;
  }

  /**
   * Atomic transaction inserting group + permissions.
   * Persists the full `LocalizedString` map received from the caller; empty
   * entries are stripped before writing so the column never holds whitespace.
   */
  export async function createGroup(
    input: CreateGroupInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<GroupWithPermissionIds> {
    return runInTxWithLogging(
      tx,
      t => createGroupRecord(t, input, locale),
      () => "Error creating group:"
    );
  }

  /**
   * Atomic transaction. Clears and replaces groupPermissions.
   * Replaces the name/description JSONB maps with the incoming `LocalizedString`
   * maps (empty entries stripped); pass `undefined` to leave a column untouched
   * or `null` to clear the description.
   *
   * Business rules (system-group immutability, existence checks) are enforced
   * by the service layer, not here.
   */
  export async function updateGroup(
    input: UpdateGroupInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<GroupWithPermissionIds> {
    const logMessage = `Error updating group with ID ${input.id}:`;
    return runInTxWithLogging(
      tx,
      t => updateGroupRecord(t, input, locale),
      () => logMessage
    );
  }

  /**
   * Deletes a permission group by ID.
   *
   * Business rules (system-group deletion guard, existence checks) are enforced
   * by the service layer, not here.
   */
  export async function deleteGroup(groupId: string, _locale?: string, tx?: DBTransaction): Promise<{ id: string }> {
    return runInTxWithLogging(
      tx,
      t => deleteGroupRecord(t, groupId),
      () => `Error deleting group with ID ${groupId}:`
    );
  }

  /**
   * Returns users currently holding a specific groupId.
   */
  export async function listUsersInGroup(groupId: string, tx?: DBTransaction): Promise<GroupUserEntity[]> {
    try {
      const client = tx ?? db;
      return await client
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .innerJoin(userPermissionGroups, eq(users.id, userPermissionGroups.userId))
        .where(eq(userPermissionGroups.groupId, groupId));
    } catch (error) {
      logger.error(`Error listing users in group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Bulk assigns users to a group. Uses tx.insert().onConflictDoNothing().
   */
  export async function bulkAssignUsersToGroup(
    userIds: string[],
    groupId: string,
    assignedByUserId?: string | null,
    tx?: DBTransaction
  ): Promise<void> {
    if (userIds.length === 0) return;

    const assignedAt = new Date();
    await runInTxWithLogging(
      tx,
      t => insertBulkUsersToGroup(t, userIds, groupId, assignedByUserId ?? null, assignedAt),
      () => `Error in bulkAssignUsersToGroup for group ${groupId}:`
    );
  }

  /**
   * Bulk revokes users from a group. Uses tx.delete().where(inArray()).
   */
  export async function bulkRevokeUsersFromGroup(
    userIds: string[],
    groupId: string,
    tx?: DBTransaction
  ): Promise<void> {
    if (userIds.length === 0) return;

    await runInTxWithLogging(
      tx,
      t => deleteBulkUsersFromGroup(t, userIds, groupId),
      () => `Error in bulkRevokeUsersFromGroup for group ${groupId}:`
    );
  }

  /**
   * Returns all explicit GRANTS and DENIES for a single user.
   */
  export async function getUserOverrides(
    userId: string,
    tx?: DBTransaction
  ): Promise<UserPermissionOverrideSelectType[]> {
    try {
      const client = tx ?? db;
      return await client.select().from(userPermissionOverrides).where(eq(userPermissionOverrides.userId, userId));
    } catch (error) {
      logger.error(`Error getting overrides for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Atomic transaction that clears existing overrides for the user and inserts new ones.
   */
  export async function setUserOverrides(
    userId: string,
    overrides: UserOverrideInput[],
    assignedByUserId?: string | null,
    tx?: DBTransaction
  ): Promise<void> {
    await runInTxWithLogging(
      tx,
      t => replaceUserOverrides(t, userId, overrides, assignedByUserId ?? null),
      () => `Error setting overrides for user ${userId}:`
    );
  }

  export async function listAllGroupUsers(tx?: DBTransaction): Promise<Map<string, GroupUserEntity[]>> {
    try {
      const client = tx ?? db;
      const rows = await client
        .select({
          groupId: userPermissionGroups.groupId,
          userId: users.id,
          userName: users.name,
          userEmail: users.email,
        })
        .from(userPermissionGroups)
        .innerJoin(users, eq(users.id, userPermissionGroups.userId));
      return collectGroupUsersMap(rows);
    } catch (error) {
      logger.error("Error listing all group users:", error);
      throw error;
    }
  }

  /**
   * Resolve user ids that hold `permissionKey` via group membership
   * (group_permissions → user_permission_groups). Does not hardcode group
   * slugs. Returns unique user ids; empty array on error is the caller's
   * responsibility (this method throws — callers that prefer soft-fail
   * should catch).
   */
  export async function listUserIdsWithPermission(permissionKey: AppPermission, tx?: DBTransaction): Promise<string[]> {
    try {
      const client = tx ?? db;
      const rows = await client
        .select({ userId: userPermissionGroups.userId })
        .from(userPermissionGroups)
        .innerJoin(groupPermissions, eq(groupPermissions.groupId, userPermissionGroups.groupId))
        .innerJoin(permissions, eq(permissions.id, groupPermissions.permissionId))
        .where(eq(permissions.key, permissionKey));
      return collectUniqueUserIds(rows);
    } catch (error) {
      logger.error(`Error listing user ids with permission ${permissionKey}:`, error);
      throw error;
    }
  }
}
