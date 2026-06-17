import { eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { groupPermissions, permissionGroups, permissions } from "@/backend/db/schema";
import {
  PARENT_DEFAULT_PERMISSION_KEYS,
  PERMISSION_CATALOG,
  STAFF_DEFAULT_PERMISSION_KEYS,
  SYSTEM_PERMISSION_GROUP_SLUGS,
  TEACHER_DEFAULT_PERMISSION_KEYS,
} from "./permission-catalog";

const SYSTEM_GROUPS = [
  {
    name: "Super Admin",
    slug: SYSTEM_PERMISSION_GROUP_SLUGS.SUPER_ADMIN,
    description: "Full system access",
    isSystem: true,
    permissionKeys: PERMISSION_CATALOG.map(p => p.key),
  },
  {
    name: "Teacher Default",
    slug: SYSTEM_PERMISSION_GROUP_SLUGS.TEACHER_DEFAULT,
    description: "Default permissions for teacher accounts",
    isSystem: true,
    permissionKeys: [...TEACHER_DEFAULT_PERMISSION_KEYS],
  },
  {
    name: "Parent Default",
    slug: SYSTEM_PERMISSION_GROUP_SLUGS.PARENT_DEFAULT,
    description: "Default permissions for parent accounts",
    isSystem: true,
    permissionKeys: [...PARENT_DEFAULT_PERMISSION_KEYS],
  },
  {
    name: "Staff Default",
    slug: SYSTEM_PERMISSION_GROUP_SLUGS.STAFF_DEFAULT,
    description: "Default permissions for staff accounts",
    isSystem: true,
    permissionKeys: [...STAFF_DEFAULT_PERMISSION_KEYS],
  },
] as const;

export async function seedOrGet() {
  const now = new Date();

  for (const entry of PERMISSION_CATALOG) {
    await db
      .insert(permissions)
      .values({
        key: entry.key,
        resource: entry.resource,
        action: entry.action,
        description: entry.description,
        category: entry.category,
        isSystem: true,
      })
      .onConflictDoNothing({ target: permissions.key });
  }

  const allPermissions = await db.select().from(permissions);
  const permissionByKey = new Map(allPermissions.map(p => [p.key, p.id]));

  const groups = [];

  for (const group of SYSTEM_GROUPS) {
    const [insertedGroup] = await db
      .insert(permissionGroups)
      .values({
        name: group.name,
        slug: group.slug,
        description: group.description,
        isSystem: group.isSystem,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: permissionGroups.slug,
        set: {
          name: group.name,
          description: group.description,
          isSystem: group.isSystem,
          updatedAt: now,
        },
      })
      .returning();

    const groupId = insertedGroup.id;
    const permissionIds = group.permissionKeys
      .map(key => permissionByKey.get(key))
      .filter((id): id is string => id !== undefined);

    await db.delete(groupPermissions).where(eq(groupPermissions.groupId, groupId));

    if (permissionIds.length > 0) {
      await db.insert(groupPermissions).values(
        permissionIds.map(permissionId => ({
          groupId,
          permissionId,
        }))
      );
    }

    groups.push(insertedGroup);
  }

  return groups;
}

export async function getPermissionIdsByKeys(keys: string[]): Promise<string[]> {
  const rows = await db.select({ id: permissions.id }).from(permissions).where(inArray(permissions.key, keys));

  return rows.map(r => r.id);
}
