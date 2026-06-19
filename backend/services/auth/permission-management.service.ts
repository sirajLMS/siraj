import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { PermissionManagementRepository } from "@/backend/db/repo";
import { userPermissionGroups, users } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import type { GroupWithPermissionIds, PermissionEntity } from "@/backend/types";
import { AppPermission } from "@/shared/lib/enum";
import { PermissionsService } from "./permissions.service";

export namespace PermissionManagementService {
  // ─── Private Guards ───────────────────────────────────────────────────────

  async function requireManageAccess(actorUserId: string, locale?: string): Promise<void> {
    const context = await PermissionsService.getUserContext(actorUserId);
    if (!context.isSuperAdmin && !(context.permissions as string[]).includes(AppPermission.PERMISSION_GROUPS_MANAGE)) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorized"));
    }
  }

  async function requireAssignAccess(actorUserId: string, locale?: string): Promise<void> {
    const context = await PermissionsService.getUserContext(actorUserId);
    if (!context.isSuperAdmin && !(context.permissions as string[]).includes(AppPermission.PERMISSION_GROUPS_ASSIGN)) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorized"));
    }
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .substring(0, 100);
  }

  // ─── Read Operations ──────────────────────────────────────────────────────

  /**
   * List all permission catalog entries.
   * NOTE: The is_system property for permissions is protected by a database trigger (trg_protect_system_permissions).
   * Creating new system permissions or converting existing custom permissions to system permissions is strictly
   * prohibited by the database schema. All system permissions are seeded and immutable.
   */
  export async function listPermissions(actorUserId: string, locale?: string): Promise<PermissionEntity[]> {
    await requireManageAccess(actorUserId, locale);
    return PermissionManagementRepository.listAllPermissions();
  }

  export async function listGroups(actorUserId: string, locale?: string): Promise<GroupWithPermissionIds[]> {
    await requireManageAccess(actorUserId, locale);
    return PermissionManagementRepository.listAllGroups();
  }

  export async function getGroup(
    actorUserId: string,
    groupId: string,
    locale?: string
  ): Promise<GroupWithPermissionIds> {
    await requireManageAccess(actorUserId, locale);
    const group = await PermissionManagementRepository.getGroupById(groupId);
    if (!group) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("permissionGroupNotFound", { id: groupId }));
    }
    return group;
  }

  // ─── Write Operations ─────────────────────────────────────────────────────

  export async function createGroup(
    actorUserId: string,
    input: { name: string; description?: string; permissionIds: string[] },
    locale?: string
  ): Promise<GroupWithPermissionIds> {
    await requireManageAccess(actorUserId, locale);
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    const trimmedName = input.name.trim();
    if (!trimmedName) throw new Error(t("permissionGroupNameRequired"));
    if (trimmedName.length > 255) throw new Error(t("permissionGroupNameTooLong"));
    const slug = generateSlug(trimmedName);
    if (!slug) throw new Error(t("permissionGroupInvalidName"));
    return PermissionManagementRepository.createGroup({
      name: trimmedName,
      slug,
      description: input.description?.trim(),
      permissionIds: input.permissionIds,
      createdByUserId: actorUserId,
    });
  }

  export async function updateGroup(
    actorUserId: string,
    input: { groupId: string; name?: string; description?: string; permissionIds?: string[] },
    locale?: string
  ): Promise<GroupWithPermissionIds> {
    await requireManageAccess(actorUserId, locale);
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    let trimmedName: string | undefined;
    let slug: string | undefined;
    if (input.name !== undefined) {
      trimmedName = input.name.trim();
      if (!trimmedName) throw new Error(t("permissionGroupNameRequired"));
      if (trimmedName.length > 255) throw new Error(t("permissionGroupNameTooLong"));
      slug = generateSlug(trimmedName);
      if (!slug) throw new Error(t("permissionGroupInvalidName"));
    }
    return PermissionManagementRepository.updateGroup(
      {
        id: input.groupId,
        name: trimmedName,
        slug,
        description: input.description === undefined ? undefined : input.description?.trim(),
        permissionIds: input.permissionIds,
      },
      locale
    );
  }

  export async function deleteGroup(actorUserId: string, groupId: string, locale?: string): Promise<void> {
    await requireManageAccess(actorUserId, locale);
    await PermissionManagementRepository.deleteGroup(groupId, locale);
  }

  export async function assignGroupToUser(
    actorUserId: string,
    input: { userId: string; groupId: string },
    locale?: string
  ): Promise<void> {
    await requireAssignAccess(actorUserId, locale);
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    const [targetUser] = await db
      .select({ id: users.id, isSuperAdmin: users.isSuperAdmin })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);
    if (!targetUser) throw new Error(t("userNotFound", { id: input.userId }));
    await PermissionManagementRepository.bulkAssignUsersToGroup([input.userId], input.groupId, actorUserId);
  }

  export async function revokeGroupFromUser(
    actorUserId: string,
    input: { userId: string; groupId: string },
    locale?: string
  ): Promise<void> {
    await requireAssignAccess(actorUserId, locale);
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    const [targetUser] = await db
      .select({ id: users.id, isSuperAdmin: users.isSuperAdmin })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);
    if (!targetUser) throw new Error(t("userNotFound", { id: input.userId }));
    if (targetUser.isSuperAdmin) throw new Error(t("cannotModifySuperAdmin"));
    await PermissionManagementRepository.bulkRevokeUsersFromGroup([input.userId], input.groupId);
  }

  export async function listGroupsForUser(actorUserId: string, userId: string, locale?: string): Promise<string[]> {
    await requireAssignAccess(actorUserId, locale);
    const rows = await db
      .select({ groupId: userPermissionGroups.groupId })
      .from(userPermissionGroups)
      .where(eq(userPermissionGroups.userId, userId));
    return rows.map(r => r.groupId);
  }
}
