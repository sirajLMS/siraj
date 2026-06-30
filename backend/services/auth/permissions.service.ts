import { db } from "@/backend/db/drizzleDb";
import { permissions } from "@/backend/db/schema";
import { logger } from "@/backend/lib/logger";
import { type AppPermission, UserRole } from "@/shared/lib/enum";

export type UserPermissionContext = {
  permissions: AppPermission[];
  permissionGroups: string[];
  isSuperAdmin: boolean;
  role: UserRole;
};

export namespace PermissionsService {
  export async function getUserContext(userId: string): Promise<UserPermissionContext> {
    try {
      const user = await db.query.users.findFirst({
        columns: {
          id: true,
          isSuperAdmin: true,
        },
        where: {
          id: userId,
        },
        with: {
          permissionGroups: {
            columns: {
              slug: true,
            },
            with: {
              permissions: {
                columns: {
                  key: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        return { permissions: [], permissionGroups: [], isSuperAdmin: false, role: UserRole.GUEST };
      }

      if (user.isSuperAdmin) {
        const allPermissions = await db.select({ key: permissions.key }).from(permissions);
        return {
          permissions: allPermissions.map(p => p.key),
          permissionGroups: user.permissionGroups.map(g => g.slug),
          isSuperAdmin: true,
          role: UserRole.SUPER_ADMIN,
        };
      }

      const permissionSet = new Set<AppPermission>();
      const groupSlugs: string[] = [];

      for (const group of user.permissionGroups) {
        groupSlugs.push(group.slug);
        for (const permission of group.permissions) {
          permissionSet.add(permission.key);
        }
      }

      // Default role mapping
      let role = UserRole.USER as UserRole;
      if (groupSlugs.includes("teacher")) role = UserRole.TEACHER;
      if (groupSlugs.includes("parent")) role = UserRole.PARENT;

      return {
        permissions: [...permissionSet],
        permissionGroups: groupSlugs,
        isSuperAdmin: false,
        role,
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
}
