import { db } from "@/backend/db/drizzleDb";
import { permissions } from "@/backend/db/schema";
import type { AppPermission } from "@/shared/lib/enum";

export type UserPermissionContext = {
  permissions: AppPermission[];
  permissionGroups: string[];
  isSuperAdmin: boolean;
};

export async function resolveUserPermissions(userId: string): Promise<UserPermissionContext> {
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
    return { permissions: [], permissionGroups: [], isSuperAdmin: false };
  }

  if (user.isSuperAdmin) {
    const allPermissions = await db.select({ key: permissions.key }).from(permissions);
    return {
      permissions: allPermissions.map(p => p.key),
      permissionGroups: user.permissionGroups.map(g => g.slug),
      isSuperAdmin: true,
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

  return {
    permissions: [...permissionSet],
    permissionGroups: groupSlugs,
    isSuperAdmin: false,
  };
}
