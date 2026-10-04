import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { PermissionManagementRepository } from "@/backend/db/repo/permissions";
import { permissionGroups, userPermissionGroups, users } from "@/backend/db/schema";
import type { AppPermission } from "@/backend/enum";
import {
  applyOverrides,
  buildPermissionMap,
  getAllSystemPermissions,
  invalidateRoleChangeFailOpen,
  requireAssignAccess,
  requireBulkSetupOrReturn,
  requireGroupExists,
  requireManageAccess,
  requireUserExistsFull,
  requireUserSetup,
  trimLocalizedString,
  validateGroupName,
} from "@/backend/services/auth/permission-management.helpers";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  GroupWithPermissionIds,
  PermissionReturnType,
  UserOverrideInput,
  UserPermissionOverrideSelectType,
} from "@/backend/types";
import { escapeLikeWildcards } from "@/backend/utils";
import type { ErrorsLabels } from "@/shared/locale";
import type { LocalizedString } from "@/shared/types";

export namespace PermissionManagementService {
  // ─── Read Operations ──────────────────────────────────────────────────────

  /**
   * List all permission catalog entries.
   * NOTE: The is_system property for permissions is protected by a database trigger (trg_protect_system_permissions).
   * Creating new system permissions or converting existing custom permissions to system permissions is strictly
   * prohibited by the database schema. All system permissions are seeded and immutable.
   */
  export async function listPermissions(actorUserId: string, tErrors: ErrorsLabels): Promise<PermissionReturnType[]> {
    await requireManageAccess(actorUserId, tErrors);
    return PermissionManagementRepository.listAllPermissions();
  }

  export async function listGroups(actorUserId: string, tErrors: ErrorsLabels): Promise<GroupWithPermissionIds[]> {
    await requireManageAccess(actorUserId, tErrors);
    const groups = await PermissionManagementRepository.listAllGroups();
    const groupUsersMap = await PermissionManagementRepository.listAllGroupUsers();
    for (const group of groups) {
      group.assignedUsers = groupUsersMap.get(group.id) ?? [];
    }
    return groups;
  }

  export async function getGroup(
    actorUserId: string,
    groupId: string,
    tErrors: ErrorsLabels
  ): Promise<GroupWithPermissionIds> {
    await requireManageAccess(actorUserId, tErrors);
    const group = await requireGroupExists(groupId, tErrors);
    const groupUsersMap = await PermissionManagementRepository.listAllGroupUsers();
    group.assignedUsers = groupUsersMap.get(groupId) ?? [];
    return group;
  }

  // ─── Write Operations ─────────────────────────────────────────────────────

  export async function createGroup(
    actorUserId: string,
    input: { name: LocalizedString; description?: LocalizedString | null; permissionIds: string[] },
    tErrors: ErrorsLabels
  ): Promise<GroupWithPermissionIds> {
    await requireManageAccess(actorUserId, tErrors);

    const { slug: baseSlug } = await validateGroupName(input.name, tErrors);

    // Find next available slug by checking existing slugs in a single query
    const existingSlugs = await db
      .select({ slug: permissionGroups.slug })
      .from(permissionGroups)
      .where(sql`${permissionGroups.slug} LIKE ${escapeLikeWildcards(baseSlug) + "%"}`);

    const existingSlugSet = new Set(existingSlugs.map(s => s.slug));
    let slug = baseSlug;
    let counter = 1;
    while (existingSlugSet.has(slug)) {
      slug = `${baseSlug}_${counter}`;
      counter++;
    }

    return PermissionManagementRepository.createGroup({
      name: input.name,
      slug,
      description: input.description ?? null,
      permissionIds: input.permissionIds,
      createdByUserId: actorUserId,
    });
  }

  export async function updateGroup(
    actorUserId: string,
    input: {
      groupId: string;
      name?: LocalizedString;
      description?: LocalizedString | null;
      permissionIds?: string[];
    },
    tErrors: ErrorsLabels,
    locale?: string
  ): Promise<GroupWithPermissionIds> {
    await requireManageAccess(actorUserId, tErrors);

    // Fetch the group first to check if it's a system group.
    // System groups: only permissionIds is editable; name/slug/description are immutable.
    const existing = await PermissionManagementRepository.getGroupById(input.groupId, locale);

    if (!existing) {
      throw new Error(tErrors.permissionManagement.permissionGroupNotFound(input.groupId));
    }

    if (existing.isSystem) {
      return PermissionManagementRepository.updateGroup(
        {
          id: input.groupId,
          name: undefined,
          slug: undefined,
          description: undefined,
          permissionIds: input.permissionIds,
        },
        locale
      );
    }

    let slug: string | undefined;

    if (input.name !== undefined) {
      const validated = await validateGroupName(input.name, tErrors);
      slug = validated.slug;
    }

    return PermissionManagementRepository.updateGroup(
      {
        id: input.groupId,
        name: input.name,
        slug,
        description: trimLocalizedString(input.description),
        permissionIds: input.permissionIds,
      },
      locale
    );
  }

  export async function deleteGroup(
    actorUserId: string,
    groupId: string,
    tErrors: ErrorsLabels,
    locale?: string
  ): Promise<void> {
    await requireManageAccess(actorUserId, tErrors);

    const existing = await PermissionManagementRepository.getGroupById(groupId, locale);
    if (!existing) {
      throw new Error(tErrors.permissionManagement.permissionGroupNotFound(groupId));
    }

    if (existing.isSystem) {
      throw new Error(tErrors.permissionManagement.cannotDeleteSystemPermissionGroup);
    }

    await PermissionManagementRepository.deleteGroup(groupId, locale);
  }

  export async function assignGroupToUser(
    actorUserId: string,
    input: { userId: string; groupId: string },
    tErrors: ErrorsLabels
  ): Promise<void> {
    await requireUserSetup(actorUserId, input.userId, "assign", "existsFull", tErrors);
    await PermissionManagementRepository.bulkAssignUsersToGroup([input.userId], input.groupId, actorUserId);
    await invalidateRoleChangeFailOpen(input.userId, "assignGroupToUser");
  }

  export async function revokeGroupFromUser(
    actorUserId: string,
    input: { userId: string; groupId: string },
    tErrors: ErrorsLabels
  ): Promise<void> {
    await requireUserSetup(actorUserId, input.userId, "assign", "nonSuperAdmin", tErrors);
    await PermissionManagementRepository.bulkRevokeUsersFromGroup([input.userId], input.groupId);
    await invalidateRoleChangeFailOpen(input.userId, "revokeGroupFromUser");
  }

  export async function listGroupsForUser(
    actorUserId: string,
    userId: string,
    tErrors: ErrorsLabels
  ): Promise<string[]> {
    await requireAssignAccess(actorUserId, tErrors);
    const rows = await db
      .select({ groupId: userPermissionGroups.groupId })
      .from(userPermissionGroups)
      .where(eq(userPermissionGroups.userId, userId));
    return rows.map(r => r.groupId);
  }

  export async function bulkAssignUsersToGroup(
    actorUserId: string,
    input: { userIds: string[]; groupId: string },
    tErrors: ErrorsLabels
  ): Promise<void> {
    if (await requireBulkSetupOrReturn(actorUserId, input, tErrors)) return;

    const foundUsers = await db.select({ id: users.id }).from(users).where(inArray(users.id, input.userIds));
    if (foundUsers.length !== input.userIds.length) throw new Error(tErrors.permissionManagement.userNotFound(""));

    await PermissionManagementRepository.bulkAssignUsersToGroup(input.userIds, input.groupId, actorUserId);
    await invalidateRoleChangeFailOpen(input.userIds, "bulkAssignUsersToGroup");
  }

  export async function bulkRevokeUsersFromGroup(
    actorUserId: string,
    input: { userIds: string[]; groupId: string },
    tErrors: ErrorsLabels
  ): Promise<void> {
    if (await requireBulkSetupOrReturn(actorUserId, input, tErrors)) return;

    const targetUsers = await db
      .select({ id: users.id, isSuperAdmin: users.isSuperAdmin })
      .from(users)
      .where(inArray(users.id, input.userIds));

    const nonSuperAdminUserIds = targetUsers.filter(u => !u.isSuperAdmin).map(u => u.id);
    if (nonSuperAdminUserIds.length === 0) return;

    await PermissionManagementRepository.bulkRevokeUsersFromGroup(nonSuperAdminUserIds, input.groupId);
    await invalidateRoleChangeFailOpen(nonSuperAdminUserIds, "bulkRevokeUsersFromGroup");
  }

  export async function listUserOverrides(
    actorUserId: string,
    userId: string,
    tErrors: ErrorsLabels
  ): Promise<UserPermissionOverrideSelectType[]> {
    await requireUserSetup(actorUserId, userId, "manage", "exists", tErrors);
    return PermissionManagementRepository.getUserOverrides(userId);
  }

  export async function updateUserOverrides(
    actorUserId: string,
    input: { userId: string; overrides: UserOverrideInput[] },
    tErrors: ErrorsLabels
  ): Promise<void> {
    await requireUserSetup(actorUserId, input.userId, "manage", "nonSuperAdmin", tErrors);
    await PermissionManagementRepository.setUserOverrides(input.userId, input.overrides, actorUserId);
    await invalidateRoleChangeFailOpen(input.userId, "updateUserOverrides");
  }

  export async function getEffectiveUserPermissions(
    actorUserId: string,
    userId: string,
    tErrors: ErrorsLabels
  ): Promise<AppPermission[]> {
    await requireManageAccess(actorUserId, tErrors);
    const user = await requireUserExistsFull(userId, tErrors);

    if (user.isSuperAdmin) {
      return getAllSystemPermissions();
    }

    // Resolve base group permissions
    const groupContext = await PermissionsService.getUserContext(userId);
    const effectiveSet = new Set<AppPermission>(groupContext.permissions);

    // Resolve overrides
    const overrides = await PermissionManagementRepository.getUserOverrides(userId);
    if (overrides.length === 0) return [...effectiveSet];

    const permMap = await buildPermissionMap();
    applyOverrides(effectiveSet, overrides, permMap);

    return [...effectiveSet];
  }

  // ─── Bootstrap / Seeder Operations (no auth) ──────────────────────────────

  /**
   * Idempotent single user permission override (seed / bootstrap use).
   */
  export async function ensureUserPermissionOverride(input: {
    userId: string;
    permissionKey: AppPermission;
    state: UserOverrideInput["state"];
    assignedByUserId: string | null;
  }): Promise<UserPermissionOverrideSelectType | null> {
    const permissionId = await PermissionManagementRepository.getPermissionIdByKey(input.permissionKey);
    if (!permissionId) return null;

    return PermissionManagementRepository.upsertUserPermissionOverride({
      userId: input.userId,
      permissionId,
      state: input.state,
      assignedByUserId: input.assignedByUserId,
    });
  }
}
