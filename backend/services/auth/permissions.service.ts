import { eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { groupPermissions, permissionGroups, permissions, userPermissionGroups, users } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { type AppPermission, SystemPermissionGroupSlug, UserRole } from "@/shared/lib/enum";

export type UserPermissionContext = {
  permissions: AppPermission[];
  permissionGroups: string[];
  isSuperAdmin: boolean;
  role: UserRole;
};

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
          permissions: allPermissions.map(p => p.key),
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

      const permissionSet = new Set<AppPermission>();
      for (const permission of permissionRows) {
        permissionSet.add(permission.key);
      }

      return {
        permissions: [...permissionSet],
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
    if (groupSlugs.some(slug => slug === SystemPermissionGroupSlug.TEACHER_DEFAULT || slug === "teacher")) {
      return UserRole.TEACHER;
    }
    if (groupSlugs.some(slug => slug === SystemPermissionGroupSlug.PARENT_DEFAULT || slug === "parent")) {
      return UserRole.PARENT;
    }
    if (groupSlugs.includes(SystemPermissionGroupSlug.STAFF_DEFAULT)) return UserRole.STAFF;
    return UserRole.USER;
  }

  export async function getPermissionGroupContext(groupSlug: string, locale?: string): Promise<UserPermissionContext> {
    try {
      const normalizedSlug = groupSlug.trim();
      const [group] = await db
        .select({ id: permissionGroups.id, slug: permissionGroups.slug })
        .from(permissionGroups)
        .where(eq(permissionGroups.slug, normalizedSlug))
        .limit(1);

      if (!group) {
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("permission.groupNotFound"));
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

      const permissionSet = new Set<AppPermission>();
      for (const permission of permissionRows) {
        permissionSet.add(permission.key);
      }

      return {
        permissions: [...permissionSet],
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
}
