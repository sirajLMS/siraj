import { eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { PermissionManagementRepository } from "@/backend/db/repo/permissions/permission-management.repository";
import { groupPermissions, permissionGroups, permissions, userPermissionGroups, users } from "@/backend/db/schema";
import { type AppPermission, filterKnownAppPermissions, SystemPermissionGroupSlug, UserRole } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import type { UserPermissionContext } from "@/backend/types";

export namespace PermissionsService {
  export async function getUserContext(userId: string): Promise<UserPermissionContext> {
    try {
      const [user] = await db
        .select({ id: users.id, isSuperAdmin: users.isSuperAdmin })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return { permissions: [], permissionGroups: [], isSuperAdmin: false, role: UserRole.GUEST };
      }

      const groupRows = await db
        .select({ slug: permissionGroups.slug })
        .from(userPermissionGroups)
        .innerJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
        .where(eq(userPermissionGroups.userId, userId));

      const groupSlugs = groupRows.map(row => row.slug);

      if (user.isSuperAdmin) {
        const allPermissions = await db.select({ key: permissions.key }).from(permissions);
        return {
          permissions: filterKnownAppPermissions(allPermissions.map(p => p.key)),
          permissionGroups: groupSlugs,
          isSuperAdmin: true,
          role: UserRole.SUPER_ADMIN,
        };
      }

      const permissionRows = await db
        .select({ key: permissions.key })
        .from(userPermissionGroups)
        .innerJoin(groupPermissions, eq(groupPermissions.groupId, userPermissionGroups.groupId))
        .innerJoin(permissions, eq(groupPermissions.permissionId, permissions.id))
        .where(eq(userPermissionGroups.userId, userId));

      return {
        permissions: filterKnownAppPermissions(permissionRows.map(row => row.key)),
        permissionGroups: groupSlugs,
        isSuperAdmin: false,
        role: resolveRoleFromGroupSlugs(groupSlugs),
      };
    } catch (error) {
      logger.error("Failed to get user context", { userId, error });
      throw error;
    }
  }

  export async function hasPermission(userId: string, permissionKey: AppPermission): Promise<boolean> {
    const context = await PermissionsService.getUserContext(userId);
    return context.isSuperAdmin || context.permissions.includes(permissionKey);
  }

  export async function hasAnyPermission(userId: string, permissionKeys: AppPermission[]): Promise<boolean> {
    if (permissionKeys.length === 0) return false;
    const context = await PermissionsService.getUserContext(userId);
    if (context.isSuperAdmin) return true;
    return permissionKeys.some(key => context.permissions.includes(key));
  }

  function resolveRoleFromGroupSlugs(groupSlugs: string[]): UserRole {
    if (groupSlugs.includes(SystemPermissionGroupSlug.SUPER_ADMIN)) return UserRole.SUPER_ADMIN;
    if (groupSlugs.includes(SystemPermissionGroupSlug.ACADEMY_ADMIN)) return UserRole.ACADEMY_ADMIN;
    if (groupSlugs.some(slug => slug === "teacher_default" || slug === "teacher")) {
      return UserRole.TEACHER;
    }
    if (groupSlugs.some(slug => slug === "parent_default" || slug === "parent")) {
      return UserRole.PARENT;
    }
    if (groupSlugs.includes(SystemPermissionGroupSlug.SUPERVISOR_DEFAULT)) return UserRole.SUPERVISOR;
    if (groupSlugs.includes(SystemPermissionGroupSlug.STUDENT_DEFAULT)) return UserRole.STUDENT;
    if (groupSlugs.includes(SystemPermissionGroupSlug.STAFF_DEFAULT)) return UserRole.STAFF;
    return UserRole.USER;
  }

  export async function getPermissionGroupContext(groupSlug: string): Promise<UserPermissionContext> {
    try {
      const normalizedSlug = groupSlug.trim();
      const [group] = await db
        .select({ id: permissionGroups.id, slug: permissionGroups.slug })
        .from(permissionGroups)
        .where(eq(permissionGroups.slug, normalizedSlug))
        .limit(1);

      if (!group) {
        throw new Error("Permission group not found");
      }

      const groupPermissionRows = await db
        .select({ permissionId: groupPermissions.permissionId })
        .from(groupPermissions)
        .where(eq(groupPermissions.groupId, group.id));

      const permissionIds = groupPermissionRows.map(row => row.permissionId);
      const permissionRows =
        permissionIds.length === 0
          ? []
          : await db.select({ key: permissions.key }).from(permissions).where(inArray(permissions.id, permissionIds));

      return {
        permissions: filterKnownAppPermissions(permissionRows.map(row => row.key)),
        permissionGroups: [group.slug],
        isSuperAdmin: false,
        role: resolveRoleFromGroupSlugs([group.slug]),
      };
    } catch (error) {
      if (error instanceof Error && error.message) {
        throw error;
      }
      logger.error("Failed to get permission group context", { groupSlug, error });
      throw error;
    }
  }

  /**
   * Resolve user ids that currently hold `permissionKey` via permission-group
   * membership (not by hardcoding group slugs). Soft-fails to `[]` on lookup
   * errors so notification producers can early-return without aborting the
   * domain mutation.
   */
  function groupByUserId<T extends { userId: string }>(rows: T[]): Map<string, T[]> {
    const map = new Map<string, T[]>();
    for (const row of rows) {
      const items = map.get(row.userId);
      if (items) {
        items.push(row);
      } else {
        map.set(row.userId, [row]);
      }
    }
    return map;
  }

  async function fetchAllPermissionsIfNeeded(
    userRows: { id: string; isSuperAdmin: boolean }[]
  ): Promise<AppPermission[]> {
    if (userRows.some(u => u.isSuperAdmin)) {
      const allRows = await db.select({ key: permissions.key }).from(permissions);
      return filterKnownAppPermissions(allRows.map(p => p.key));
    }
    return [];
  }

  async function fetchPermissionKeysForUsers(userIds: string[]): Promise<Map<string, string[]>> {
    const permissionRows = await db
      .select({ userId: userPermissionGroups.userId, key: permissions.key })
      .from(userPermissionGroups)
      .innerJoin(groupPermissions, eq(groupPermissions.groupId, userPermissionGroups.groupId))
      .innerJoin(permissions, eq(groupPermissions.permissionId, permissions.id))
      .where(inArray(userPermissionGroups.userId, userIds));

    const map = new Map<string, string[]>();
    for (const row of permissionRows) {
      const keys = map.get(row.userId);
      if (keys) {
        keys.push(row.key);
      } else {
        map.set(row.userId, [row.key]);
      }
    }
    return map;
  }

  export async function getUserContexts(userIds: string[]): Promise<Map<string, UserPermissionContext>> {
    const result = new Map<string, UserPermissionContext>();

    if (userIds.length === 0) {
      return result;
    }

    try {
      const userRows = await db
        .select({ id: users.id, isSuperAdmin: users.isSuperAdmin })
        .from(users)
        .where(inArray(users.id, userIds));

      const memberRows = await db
        .select({ userId: userPermissionGroups.userId, slug: permissionGroups.slug })
        .from(userPermissionGroups)
        .innerJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
        .where(inArray(userPermissionGroups.userId, userIds));

      const membersByUser = groupByUserId(memberRows);
      const membersByUserId = new Map<string, string[]>();
      for (const [userId, rows] of membersByUser) {
        membersByUserId.set(
          userId,
          rows.map(r => r.slug)
        );
      }

      const allPermissions = await fetchAllPermissionsIfNeeded(userRows);

      const nonSuperAdminIds = userRows.filter(u => !u.isSuperAdmin).map(u => u.id);
      const permissionKeysByUser =
        nonSuperAdminIds.length > 0 ? await fetchPermissionKeysForUsers(nonSuperAdminIds) : new Map<string, string[]>();

      for (const userRow of userRows) {
        const groupSlugs = membersByUserId.get(userRow.id) ?? [];
        if (userRow.isSuperAdmin) {
          result.set(userRow.id, {
            permissions: allPermissions,
            permissionGroups: groupSlugs,
            isSuperAdmin: true,
            role: UserRole.SUPER_ADMIN,
          });
        } else {
          const userKeys = permissionKeysByUser.get(userRow.id) ?? [];
          result.set(userRow.id, {
            permissions: filterKnownAppPermissions(userKeys),
            permissionGroups: groupSlugs,
            isSuperAdmin: false,
            role: resolveRoleFromGroupSlugs(groupSlugs),
          });
        }
      }

      for (const userId of userIds) {
        if (!result.has(userId)) {
          result.set(userId, { permissions: [], permissionGroups: [], isSuperAdmin: false, role: UserRole.GUEST });
        }
      }

      return result;
    } catch (error) {
      logger.error("Failed to get user contexts", { userIds, error });
      throw error;
    }
  }

  export async function getUserIdsWithPermission(permissionKey: AppPermission): Promise<string[]> {
    try {
      return await PermissionManagementRepository.listUserIdsWithPermission(permissionKey);
    } catch (error) {
      logger.error("getUserIdsWithPermission: lookup failed", { permissionKey, error });
      return [];
    }
  }
}
