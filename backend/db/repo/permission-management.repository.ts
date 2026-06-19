import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import {
  groupPermissions,
  permissionGroups,
  permissions,
  userPermissionGroups,
  userPermissionOverrides,
  users,
} from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import type {
  CreateGroupInput,
  GroupUserEntity,
  GroupWithPermissionIds,
  PermissionEntity,
  UpdateGroupInput,
  UserOverrideEntity,
  UserOverrideInput,
} from "@/backend/types";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export namespace PermissionManagementRepository {
  type QueryContext = DbTransaction | typeof db;

  /**
   * List all permission catalog entries.
   * NOTE: The is_system field for permissions is protected by a database trigger (trg_protect_system_permissions).
   * Creating any new permission with is_system = true or updating an existing custom permission
   * to be a system permission is strictly prohibited by the database schema.
   */
  export async function listAllPermissions(tx?: QueryContext): Promise<PermissionEntity[]> {
    try {
      const client = tx ?? db;
      return await client
        .select()
        .from(permissions)
        .orderBy(permissions.category, permissions.resource, permissions.action);
    } catch (error) {
      logger.error("Error listing all permissions:", error);
      throw error;
    }
  }

  /**
   * Returns left-joined aggregation of groups and their permissionIds.
   */
  export async function listAllGroups(tx?: QueryContext): Promise<GroupWithPermissionIds[]> {
    try {
      const client = tx ?? db;
      const allGroups = await client.select().from(permissionGroups);
      const gpList = await client.select().from(groupPermissions);

      return allGroups.map(group => {
        const pIds = gpList.filter(gp => gp.groupId === group.id).map(gp => gp.permissionId);
        return {
          id: group.id,
          name: group.name,
          slug: group.slug,
          description: group.description,
          isSystem: group.isSystem,
          createdByUserId: group.createdByUserId,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt,
          permissionIds: pIds,
        };
      });
    } catch (error) {
      logger.error("Error listing all permission groups:", error);
      throw error;
    }
  }

  /**
   * Returns a group by its ID including its permissionIds.
   */
  export async function getGroupById(groupId: string, tx?: QueryContext): Promise<GroupWithPermissionIds | null> {
    try {
      const client = tx ?? db;
      const [group] = await client.select().from(permissionGroups).where(eq(permissionGroups.id, groupId)).limit(1);

      if (!group) return null;

      const gpList = await client.select().from(groupPermissions).where(eq(groupPermissions.groupId, groupId));

      return {
        id: group.id,
        name: group.name,
        slug: group.slug,
        description: group.description,
        isSystem: group.isSystem,
        createdByUserId: group.createdByUserId,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        permissionIds: gpList.map(gp => gp.permissionId),
      };
    } catch (error) {
      logger.error(`Error fetching group by ID ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Atomic transaction inserting group + permissions.
   */
  export async function createGroup(input: CreateGroupInput, tx?: QueryContext): Promise<GroupWithPermissionIds> {
    const run = async (t: DbTransaction): Promise<GroupWithPermissionIds> => {
      const now = new Date();
      const [insertedGroup] = await t
        .insert(permissionGroups)
        .values({
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
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

      return {
        id: insertedGroup.id,
        name: insertedGroup.name,
        slug: insertedGroup.slug,
        description: insertedGroup.description,
        isSystem: insertedGroup.isSystem,
        createdByUserId: insertedGroup.createdByUserId,
        createdAt: insertedGroup.createdAt,
        updatedAt: insertedGroup.updatedAt,
        permissionIds: input.permissionIds,
      };
    };

    try {
      if (tx) {
        return await run(tx as DbTransaction);
      }
      return await db.transaction(run);
    } catch (error) {
      logger.error("Error creating group:", error);
      throw error;
    }
  }

  /**
   * Atomic transaction. Clears and replaces groupPermissions. Throws if isSystem.
   */
  export async function updateGroup(
    input: UpdateGroupInput,
    locale?: string,
    tx?: QueryContext
  ): Promise<GroupWithPermissionIds> {
    const run = async (t: DbTransaction): Promise<GroupWithPermissionIds> => {
      const [existing] = await t.select().from(permissionGroups).where(eq(permissionGroups.id, input.id)).limit(1);

      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });

      if (!existing) {
        throw new Error(tFunc("permissionGroupNotFound", { id: input.id }));
      }

      if (existing.isSystem) {
        throw new Error(tFunc("cannotModifySystemPermissionGroup"));
      }

      const now = new Date();
      const [updatedGroup] = await t
        .update(permissionGroups)
        .set({
          name: input.name ?? existing.name,
          slug: input.slug ?? existing.slug,
          description: input.description === undefined ? existing.description : input.description,
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

      return {
        id: updatedGroup.id,
        name: updatedGroup.name,
        slug: updatedGroup.slug,
        description: updatedGroup.description,
        isSystem: updatedGroup.isSystem,
        createdByUserId: updatedGroup.createdByUserId,
        createdAt: updatedGroup.createdAt,
        updatedAt: updatedGroup.updatedAt,
        permissionIds: gpList.map(gp => gp.permissionId),
      };
    };

    try {
      if (tx) {
        return await run(tx as DbTransaction);
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
  export async function deleteGroup(groupId: string, locale?: string, tx?: QueryContext): Promise<{ id: string }> {
    const run = async (t: DbTransaction): Promise<{ id: string }> => {
      const [existing] = await t.select().from(permissionGroups).where(eq(permissionGroups.id, groupId)).limit(1);

      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });

      if (!existing) {
        throw new Error(tFunc("permissionGroupNotFound", { id: groupId }));
      }

      if (existing.isSystem) {
        throw new Error(tFunc("cannotDeleteSystemPermissionGroup"));
      }

      await t.delete(permissionGroups).where(eq(permissionGroups.id, groupId));
      return { id: groupId };
    };

    try {
      if (tx) {
        return await run(tx as DbTransaction);
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
  export async function listUsersInGroup(groupId: string, tx?: QueryContext): Promise<GroupUserEntity[]> {
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
    tx?: QueryContext
  ): Promise<void> {
    if (userIds.length === 0) return;

    const run = async (t: DbTransaction): Promise<void> => {
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
        await run(tx as DbTransaction);
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
  export async function bulkRevokeUsersFromGroup(userIds: string[], groupId: string, tx?: QueryContext): Promise<void> {
    if (userIds.length === 0) return;

    const run = async (t: DbTransaction): Promise<void> => {
      await t
        .delete(userPermissionGroups)
        .where(and(eq(userPermissionGroups.groupId, groupId), inArray(userPermissionGroups.userId, userIds)));
    };

    try {
      if (tx) {
        await run(tx as DbTransaction);
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
  export async function getUserOverrides(userId: string, tx?: QueryContext): Promise<UserOverrideEntity[]> {
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
    tx?: QueryContext
  ): Promise<void> {
    const run = async (t: DbTransaction): Promise<void> => {
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
        await run(tx as DbTransaction);
      } else {
        await db.transaction(run);
      }
    } catch (error) {
      logger.error(`Error setting overrides for user ${userId}:`, error);
      throw error;
    }
  }
}
