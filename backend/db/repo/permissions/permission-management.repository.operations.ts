import { and, eq, inArray } from "drizzle-orm";
import {
  buildGroupAssignmentRows,
  buildGroupPermissionRows,
  buildUserOverrideRows,
  toGroupReturn,
} from "@/backend/db/repo/permissions/permission-management.repository.helpers";
import { groupPermissions, permissionGroups, userPermissionGroups, userPermissionOverrides } from "@/backend/db/schema";
import type {
  CreateGroupInput,
  DBTransaction,
  GroupWithPermissionIds,
  PermissionGroupReturnType,
  UpdateGroupInput,
  UserOverrideInput,
} from "@/backend/types";
import { omitEmptyLocalizedString } from "@/shared/lib/localized-string";

export async function createGroupRecord(
  t: DBTransaction,
  input: CreateGroupInput,
  locale?: string
): Promise<GroupWithPermissionIds> {
  const now = new Date();
  const nameMap = omitEmptyLocalizedString(input.name);
  const descriptionMap = input.description == null ? null : omitEmptyLocalizedString(input.description);

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
    await t.insert(groupPermissions).values(buildGroupPermissionRows(insertedGroup.id, input.permissionIds));
  }

  return toGroupReturn(insertedGroup, input.permissionIds, locale);
}

async function replaceGroupPermissionsAndReturn(
  t: DBTransaction,
  groupId: string,
  group: PermissionGroupReturnType,
  permissionIds: string[] | undefined,
  locale?: string
): Promise<GroupWithPermissionIds> {
  if (permissionIds !== undefined) {
    await t.delete(groupPermissions).where(eq(groupPermissions.groupId, groupId));

    if (permissionIds.length > 0) {
      await t.insert(groupPermissions).values(buildGroupPermissionRows(groupId, permissionIds));
    }
  }

  const gpList = await t.select().from(groupPermissions).where(eq(groupPermissions.groupId, groupId));
  return toGroupReturn(
    group,
    gpList.map(gp => gp.permissionId),
    locale
  );
}

export async function updateGroupRecord(
  t: DBTransaction,
  input: UpdateGroupInput,
  locale?: string
): Promise<GroupWithPermissionIds> {
  const [existing] = await t.select().from(permissionGroups).where(eq(permissionGroups.id, input.id)).limit(1);

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

  return replaceGroupPermissionsAndReturn(t, input.id, updatedGroup, input.permissionIds, locale);
}

export async function deleteGroupRecord(t: DBTransaction, groupId: string): Promise<{ id: string }> {
  await t.delete(permissionGroups).where(eq(permissionGroups.id, groupId));
  return { id: groupId };
}

export async function insertBulkUsersToGroup(
  t: DBTransaction,
  userIds: string[],
  groupId: string,
  assignedByUserId: string | null,
  assignedAt: Date
): Promise<void> {
  await t
    .insert(userPermissionGroups)
    .values(buildGroupAssignmentRows(userIds, groupId, assignedByUserId, assignedAt))
    .onConflictDoNothing();
}

export async function deleteBulkUsersFromGroup(t: DBTransaction, userIds: string[], groupId: string): Promise<void> {
  await t
    .delete(userPermissionGroups)
    .where(and(eq(userPermissionGroups.groupId, groupId), inArray(userPermissionGroups.userId, userIds)));
}

export async function replaceUserOverrides(
  t: DBTransaction,
  userId: string,
  overrides: UserOverrideInput[],
  assignedByUserId: string | null
): Promise<void> {
  await t.delete(userPermissionOverrides).where(eq(userPermissionOverrides.userId, userId));

  if (overrides.length > 0) {
    await t.insert(userPermissionOverrides).values(buildUserOverrideRows(userId, overrides, assignedByUserId));
  }
}
