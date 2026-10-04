import { sql } from "drizzle-orm";
import { db } from "@/backend/db";
import { groupPermissions, permissionGroups, type permissions } from "@/backend/db/schema";
import type {
  DBTransaction,
  GroupUserEntity,
  GroupWithPermissionIds,
  PermissionGroupReturnType,
  PermissionReturnType,
  PermissionSelectType,
  UserOverrideInput,
} from "@/backend/types";
import { localeJsonKey, resolveLocalizedString } from "@/shared/lib/localized-string";
import { DEFAULT_CONTENT_LOCALE, type LocalizedString } from "@/shared/types";

export function toPermissionReturn(row: PermissionSelectType, locale?: string): PermissionReturnType {
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

export function toGroupReturn(
  group: PermissionGroupReturnType,
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

export function localizedOrderExpr(
  column: typeof permissions.category | typeof permissionGroups.name,
  locale?: string
) {
  const key = localeJsonKey(locale);
  return sql`coalesce(${column}->>${key}, ${column}->>${DEFAULT_CONTENT_LOCALE})`;
}

export const permissionGroupWithPermissionSelect = {
  id: permissionGroups.id,
  name: permissionGroups.name,
  slug: permissionGroups.slug,
  description: permissionGroups.description,
  isSystem: permissionGroups.isSystem,
  createdByUserId: permissionGroups.createdByUserId,
  createdAt: permissionGroups.createdAt,
  updatedAt: permissionGroups.updatedAt,
  permissionId: groupPermissions.permissionId,
};

type GroupPermissionRow = {
  id: string;
  name: LocalizedString;
  slug: string;
  description: LocalizedString | null;
  isSystem: boolean;
  createdByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  permissionId: string | null;
};

export function collectGroupsWithPermissions(rows: GroupPermissionRow[], locale?: string): GroupWithPermissionIds[] {
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
}

type GroupUserRow = {
  groupId: string;
  userId: string;
  userName: string;
  userEmail: string;
};

export function collectGroupUsersMap(rows: GroupUserRow[]): Map<string, GroupUserEntity[]> {
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
}

export function collectUniqueUserIds(rows: Array<{ userId: string }>): string[] {
  const unique = new Set<string>();
  for (const row of rows) unique.add(row.userId);
  return [...unique];
}

export function buildGroupPermissionRows(groupId: string, permissionIds: string[]) {
  return permissionIds.map(permissionId => ({ groupId, permissionId }));
}

export function buildGroupAssignmentRows(
  userIds: string[],
  groupId: string,
  assignedByUserId: string | null,
  assignedAt: Date
) {
  return userIds.map(userId => ({ userId, groupId, assignedAt, assignedByUserId }));
}

export function buildUserOverrideRows(userId: string, overrides: UserOverrideInput[], assignedByUserId: string | null) {
  return overrides.map(override => ({
    userId,
    permissionId: override.permissionId,
    state: override.state,
    assignedByUserId,
  }));
}

export async function runInTransaction<T>(
  tx: DBTransaction | undefined,
  run: (t: DBTransaction) => Promise<T>
): Promise<T> {
  return tx ? await run(tx) : await db.transaction((t: DBTransaction) => run(t));
}
