import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { groupPermissions, permissionGroups, permissions, userPermissionGroups, users } from "@/backend/db/schema";
import { type AppPermission, filterKnownAppPermissions } from "@/backend/enum";
export type UserPermissionContext = {
  permissions: AppPermission[];
  permissionGroups: string[];
  isSuperAdmin: boolean;
};

export async function resolveUserPermissions(userId: string): Promise<UserPermissionContext> {
  const [user] = await db
    .select({ id: users.id, isSuperAdmin: users.isSuperAdmin })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { permissions: [], permissionGroups: [], isSuperAdmin: false };
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
  };
}
