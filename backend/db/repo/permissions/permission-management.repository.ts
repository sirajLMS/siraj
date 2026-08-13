import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/backend/db";
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
  PermissionSelectType,
  UpdateGroupInput,
  UserOverrideEntity,
  UserOverrideInput,
} from "@/backend/types";
import { localeJsonKey, omitEmptyLocalizedString, resolveLocalizedString } from "@/shared/lib/localized-string";
import { getServerTranslations } from "@/shared/locale";
import { DEFAULT_CONTENT_LOCALE, type LocalizedString } from "@/shared/types";

function toPermissionReturn(row: PermissionSelectType, locale?: string): PermissionReturnType {
  return {
    id: row.id,
    key: row.key,
    resource: row.resource,
    action: row.action,
    description: resolveLocalizedString(row.description, locale),
    category: resolveLocalizedString(row.category, locale),
    isSystem: row.isSystem,
  };
}

function toGroupReturn(
  group: {
    id: string;
    name: LocalizedString;
    slug: string;
    description: LocalizedString | null;
    isSystem: boolean;
    createdByUserId: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
  permissionIds: string[],
  _locale?: string
): GroupWithPermissionIds {
  return {
    id: group.id,
    name: group.name,
    slug: group.slug,
    description: group.description,
    isSystem: group.isSystem,
    createdByUserId: group.createdByUserId,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    permissionIds,
    assignedUsers: [],
  };
}

function localizedOrderExpr(column: typeof permissions.category | typeof permissionGroups.name, locale?: string) {
  const key = localeJsonKey(locale);
  return sql`coalesce(${column}->>${key}, ${column}->>${DEFAULT_CONTENT_LOCALE})`;
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
  ): Promise<UserOverrideEntity> {
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
        .select({
          id: permissionGroups.id,
          name: permissionGroups.name,
          slug: permissionGroups.slug,
          description: permissionGroups.description,
          isSystem: permissionGroups.isSystem,
          createdByUserId: permissionGroups.createdByUserId,
          createdAt: permissionGroups.createdAt,
          updatedAt: permissionGroups.updatedAt,
          permissionId: groupPermissions.permissionId,
        })
        .from(permissionGroups)
        .leftJoin(groupPermissions, eq(groupPermissions.groupId, permissionGroups.id))
        .orderBy(localizedOrderExpr(permissionGroups.name, locale));

      const groupMap = new Map<string, GroupWithPermissionIds>();
      for (const row of rows) {
        if (!groupMap.has(row.id)) {
          groupMap.set(
            row.id,
            toGroupReturn(
              {
                id: row.id,
                name: row.name,
                slug: row.slug,
                description: row.description,
                isSystem: row.isSystem,
                createdByUserId: row.createdByUserId,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
              },
              [],
              locale
            )
          );
        }
        if (row.permissionId) {
          groupMap.get(row.id)?.permissionIds.push(row.permissionId);
        }
      }
      return [...groupMap.values()];
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
   * Idempotent upsert of a system permission group by slug. Used by seeders and
   * system bootstrap to create the fixed system-ready groups (e.g.
   * `supervisor_default`, `student_default`) that the migrations may not have
   * inserted on older databases. Safe to call repeatedly.
   */
  export async function upsertSystemGroup(
    input: { slug: string; name: LocalizedString; description: LocalizedString | null },
    tx?: DBTransaction
  ): Promise<{ id: string; slug: string; isSystem: boolean }> {
    const client = tx ?? db;
    const now = new Date();
    const nameMap = omitEmptyLocalizedString(input.name);
    const descriptionMap = input.description === null ? null : omitEmptyLocalizedString(input.description ?? {});

    const [row] = await client
      .insert(permissionGroups)
      .values({
        name: nameMap,
        slug: input.slug,
        description: descriptionMap,
        isSystem: true,
        createdByUserId: null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: permissionGroups.slug,
        set: {
          name: nameMap,
          description: descriptionMap,
          isSystem: true,
          updatedAt: now,
        },
      })
      .returning({
        id: permissionGroups.id,
        slug: permissionGroups.slug,
        isSystem: permissionGroups.isSystem,
      });

    if (!row) {
      throw new Error(`Failed to upsert system permission group: ${input.slug}`);
    }
    return row;
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
    const run = async (t: DBTransaction): Promise<GroupWithPermissionIds> => {
      const now = new Date();
      const nameMap = omitEmptyLocalizedString(input.name);
      const descriptionMap =
        input.description === undefined || input.description === null
          ? null
          : omitEmptyLocalizedString(input.description);

      const [insertedGroup] = await t
        .insert(permissionGroups)
        .values({
          name: nameMap,
          slug: input.slug,
          description: descriptionMap,
          isSystem: input.isSystem ?? false,
          createdByUserId: input.createdByUserId ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      if (input.permissionIds.length > 0) {
        await t.insert(groupPermissions).values(
          input.permissionIds.map(permissionId => ({
            groupId: insertedGroup.id,
            permissionId,
          }))
        );
      }

      return toGroupReturn(insertedGroup, input.permissionIds, locale);
    };

    try {
      if (tx) {
        return await run(tx);
      }
      return await db.transaction(run);
    } catch (error) {
      logger.error("Error creating group:", error);
      throw error;
    }
  }

  /**
   * Atomic transaction. Clears and replaces groupPermissions. Throws if isSystem.
   * Replaces the name/description JSONB maps with the incoming `LocalizedString`
   * maps (empty entries stripped); pass `undefined` to leave a column untouched
   * or `null` to clear the description.
   */
  export async function updateGroup(
    input: UpdateGroupInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<GroupWithPermissionIds> {
    const run = async (t: DBTransaction): Promise<GroupWithPermissionIds> => {
      const [existing] = await t.select().from(permissionGroups).where(eq(permissionGroups.id, input.id)).limit(1);

      const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;

      if (!existing) {
        throw new Error(errorsTranslations.permissionManagement.permissionGroupNotFound(input.id));
      }

      if (existing.isSystem) {
        throw new Error(errorsTranslations.permissionManagement.cannotModifySystemPermissionGroup);
      }

      const now = new Date();
      const nextName = input.name === undefined ? existing.name : omitEmptyLocalizedString(input.name);
      let nextDescription: typeof existing.description;
      if (input.description === undefined) {
        nextDescription = existing.description;
      } else if (input.description === null) {
        nextDescription = null;
      } else {
        nextDescription = omitEmptyLocalizedString(input.description);
      }

      const [updatedGroup] = await t
        .update(permissionGroups)
        .set({
          name: nextName,
          slug: input.slug ?? existing.slug,
          description: nextDescription,
          isSystem: input.isSystem ?? existing.isSystem,
          updatedAt: now,
        })
        .where(eq(permissionGroups.id, input.id))
        .returning();

      if (input.permissionIds !== undefined) {
        await t.delete(groupPermissions).where(eq(groupPermissions.groupId, input.id));

        if (input.permissionIds.length > 0) {
          await t.insert(groupPermissions).values(
            input.permissionIds.map(permissionId => ({
              groupId: input.id,
              permissionId,
            }))
          );
        }
      }

      const gpList = await t.select().from(groupPermissions).where(eq(groupPermissions.groupId, input.id));

      return toGroupReturn(
        updatedGroup,
        gpList.map(gp => gp.permissionId),
        locale
      );
    };

    try {
      if (tx) {
        return await run(tx);
      }
      return await db.transaction(run);
    } catch (error) {
      logger.error(`Error updating group with ID ${input.id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a permission group. Throws if isSystem.
   */
  export async function deleteGroup(groupId: string, locale?: string, tx?: DBTransaction): Promise<{ id: string }> {
    const run = async (t: DBTransaction): Promise<{ id: string }> => {
      const [existing] = await t.select().from(permissionGroups).where(eq(permissionGroups.id, groupId)).limit(1);

      const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;

      if (!existing) {
        throw new Error(errorsTranslations.permissionManagement.permissionGroupNotFound(groupId));
      }

      if (existing.isSystem) {
        throw new Error(errorsTranslations.permissionManagement.cannotDeleteSystemPermissionGroup);
      }

      await t.delete(permissionGroups).where(eq(permissionGroups.id, groupId));
      return { id: groupId };
    };

    try {
      if (tx) {
        return await run(tx);
      }
      return await db.transaction(run);
    } catch (error) {
      logger.error(`Error deleting group with ID ${groupId}:`, error);
      throw error;
    }
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

    const run = async (t: DBTransaction): Promise<void> => {
      const now = new Date();
      await t
        .insert(userPermissionGroups)
        .values(
          userIds.map(userId => ({
            userId,
            groupId,
            assignedAt: now,
            assignedByUserId: assignedByUserId ?? null,
          }))
        )
        .onConflictDoNothing();
    };

    try {
      if (tx) {
        await run(tx);
      } else {
        await db.transaction(run);
      }
    } catch (error) {
      logger.error(`Error in bulkAssignUsersToGroup for group ${groupId}:`, error);
      throw error;
    }
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

    const run = async (t: DBTransaction): Promise<void> => {
      await t
        .delete(userPermissionGroups)
        .where(and(eq(userPermissionGroups.groupId, groupId), inArray(userPermissionGroups.userId, userIds)));
    };

    try {
      if (tx) {
        await run(tx);
      } else {
        await db.transaction(run);
      }
    } catch (error) {
      logger.error(`Error in bulkRevokeUsersFromGroup for group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Returns all explicit GRANTS and DENIES for a single user.
   */
  export async function getUserOverrides(userId: string, tx?: DBTransaction): Promise<UserOverrideEntity[]> {
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
    const run = async (t: DBTransaction): Promise<void> => {
      await t.delete(userPermissionOverrides).where(eq(userPermissionOverrides.userId, userId));

      if (overrides.length > 0) {
        await t.insert(userPermissionOverrides).values(
          overrides.map(override => ({
            userId,
            permissionId: override.permissionId,
            state: override.state,
            assignedByUserId: assignedByUserId ?? null,
          }))
        );
      }
    };

    try {
      if (tx) {
        await run(tx);
      } else {
        await db.transaction(run);
      }
    } catch (error) {
      logger.error(`Error setting overrides for user ${userId}:`, error);
      throw error;
    }
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

      const map = new Map<string, GroupUserEntity[]>();
      for (const row of rows) {
        if (!map.has(row.groupId)) {
          map.set(row.groupId, []);
        }
        map.get(row.groupId)?.push({
          id: row.userId,
          name: row.userName,
          email: row.userEmail,
        });
      }
      return map;
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

      const unique = new Set<string>();
      for (const row of rows) unique.add(row.userId);
      return [...unique];
    } catch (error) {
      logger.error(`Error listing user ids with permission ${permissionKey}:`, error);
      throw error;
    }
  }
}
