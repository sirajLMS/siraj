import { db } from "@/backend/db/drizzleDb";
import { permissions } from "@/backend/db/schema";
import { logger } from "@/backend/lib/logger";
import type { AppPermission } from "@/shared/lib/enum";

export type UserPermissionContext = {
  permissions: AppPermission[];
  permissionGroups: string[];
  isSuperAdmin: boolean;
  role: string;
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
        return { permissions: [], permissionGroups: [], isSuperAdmin: false, role: "Guest" };
      }

      if (user.isSuperAdmin) {
        const allPermissions = await db.select({ key: permissions.key }).from(permissions);
        return {
          permissions: allPermissions.map(p => p.key),
          permissionGroups: user.permissionGroups.map(g => g.slug),
          isSuperAdmin: true,
          role: "Academy Admin",
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
      let role = "User";
      if (groupSlugs.includes("teacher")) role = "Teacher";
      if (groupSlugs.includes("parent")) role = "Parent";

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
    try {
      const context = await PermissionsService.getUserContext(userId);
      return context.isSuperAdmin || (context.permissions as string[]).includes(permissionKey);
    } catch (error) {
      logger.error("Failed to check permission", { userId, permissionKey, error });
      return false;
    }
  }
}
