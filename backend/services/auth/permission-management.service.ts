import { eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { PermissionManagementRepository } from "@/backend/db/repo";
import { permissionGroups, userPermissionGroups, users } from "@/backend/db/schema";
import { getBackendTranslations, type TranslationFn } from "@/backend/lib/intl";
import type { GroupWithPermissionIds, PermissionEntity, UserOverrideEntity, UserOverrideInput } from "@/backend/types";
import { AppPermission } from "@/shared/lib/enum";
import type { ErrorsLabels } from "@/shared/messages/types/errors";
import { PermissionsService } from "./permissions.service";

export namespace PermissionManagementService {
  // ─── Private Guards ───────────────────────────────────────────────────────

  async function requireManageAccess(actorUserId: string, locale?: string): Promise<void> {
    const context = await PermissionsService.getUserContext(actorUserId);
    if (!context.isSuperAdmin && !context.permissions.includes(AppPermission.PERMISSION_GROUPS_MANAGE)) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorized"));
    }
  }

  async function requireAssignAccess(actorUserId: string, locale?: string): Promise<void> {
    const context = await PermissionsService.getUserContext(actorUserId);
    if (!context.isSuperAdmin && !context.permissions.includes(AppPermission.PERMISSION_GROUPS_ASSIGN)) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorized"));
    }
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  async function requireUserExists(userId: string, t: TranslationFn<ErrorsLabels>) {
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new Error(t("userNotFound", { id: userId }));
    return user;
  }

  async function requireUserExistsFull(userId: string, t: TranslationFn<ErrorsLabels>) {
    const [user] = await db
      .select({ id: users.id, isSuperAdmin: users.isSuperAdmin })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) throw new Error(t("userNotFound", { id: userId }));
    return user;
  }

  async function requireGroupExists(groupId: string, t: TranslationFn<ErrorsLabels>) {
    const group = await PermissionManagementRepository.getGroupById(groupId);
    if (!group) throw new Error(t("permissionGroupNotFound", { id: groupId }));
    return group;
  }

  async function requireBulkGroupSetup(actorUserId: string, groupId: string, locale?: string) {
    await requireAssignAccess(actorUserId, locale);
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    await requireGroupExists(groupId, t);
    return t;
  }

  async function requireUserSetup(
    actorUserId: string,
    userId: string,
    accessType: "assign" | "manage",
    checkType: "exists" | "existsFull" | "nonSuperAdmin",
    locale?: string
  ) {
    if (accessType === "assign") {
      await requireAssignAccess(actorUserId, locale);
    } else {
      await requireManageAccess(actorUserId, locale);
    }
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    if (checkType === "exists") {
      await requireUserExists(userId, t);
    } else if (checkType === "existsFull") {
      await requireUserExistsFull(userId, t);
    } else if (checkType === "nonSuperAdmin") {
      await requireNonSuperAdmin(userId, t);
    }
    return t;
  }

  async function validateGroupName(name: string, t: TranslationFn<ErrorsLabels>) {
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error(t("permissionGroupNameRequired"));
    if (trimmedName.length > 255) throw new Error(t("permissionGroupNameTooLong"));

    const slug = generateSlug(trimmedName);
    if (!slug) throw new Error(t("permissionGroupInvalidName"));

    return { trimmedName, slug };
  }

  async function requireNonSuperAdmin(userId: string, t: TranslationFn<ErrorsLabels>) {
    const user = await requireUserExistsFull(userId, t);
    if (user.isSuperAdmin) {
      throw new Error(t("cannotModifySuperAdmin"));
    }
    return user;
  }

  function generateSlug(name: string): string {
    // 1. Truncate early and sanitize non-alphanumerics into underscores
    const slug = name
      .substring(0, 200)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_");

    // 2. Strip leading underscores (O(N) safe)
    let start = 0;
    while (start < slug.length && slug[start] === "_") {
      start++;
    }

    // 3. Strip trailing underscores (O(N) safe)
    let end = slug.length;
    while (end > start && slug[end - 1] === "_") {
      end--;
    }

    // 4. Return the safely sliced and accurately truncated string
    return slug.slice(start, end).substring(0, 100);
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
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    return requireGroupExists(groupId, t);
  }

  // ─── Write Operations ─────────────────────────────────────────────────────

  export async function createGroup(
    actorUserId: string,
    input: { name: string; description?: string; permissionIds: string[] },
    locale?: string
  ): Promise<GroupWithPermissionIds> {
    await requireManageAccess(actorUserId, locale);
    const t = await getBackendTranslations({ locale, namespace: "errors" });

    // Using the new helper
    const { trimmedName, slug: baseSlug } = await validateGroupName(input.name, t);

    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const [existingGroup] = await db
        .select({ id: permissionGroups.id })
        .from(permissionGroups)
        .where(eq(permissionGroups.slug, slug))
        .limit(1);
      if (!existingGroup) break;
      slug = `${baseSlug}_${counter}`;
      counter++;
    }

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
      // Using the new helper
      const validated = await validateGroupName(input.name, t);
      trimmedName = validated.trimmedName;
      slug = validated.slug;
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
    await requireUserSetup(actorUserId, input.userId, "assign", "existsFull", locale);
    await PermissionManagementRepository.bulkAssignUsersToGroup([input.userId], input.groupId, actorUserId);
  }

  export async function revokeGroupFromUser(
    actorUserId: string,
    input: { userId: string; groupId: string },
    locale?: string
  ): Promise<void> {
    await requireUserSetup(actorUserId, input.userId, "assign", "nonSuperAdmin", locale);
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

  export async function bulkAssignUsersToGroup(
    actorUserId: string,
    input: { userIds: string[]; groupId: string },
    locale?: string
  ): Promise<void> {
    // Using the new helper
    const t = await requireBulkGroupSetup(actorUserId, input.groupId, locale);
    if (input.userIds.length === 0) return;

    const foundUsers = await db.select({ id: users.id }).from(users).where(inArray(users.id, input.userIds));
    if (foundUsers.length !== input.userIds.length) throw new Error(t("userNotFound"));

    await PermissionManagementRepository.bulkAssignUsersToGroup(input.userIds, input.groupId, actorUserId);
  }

  export async function bulkRevokeUsersFromGroup(
    actorUserId: string,
    input: { userIds: string[]; groupId: string },
    locale?: string
  ): Promise<void> {
    await requireBulkGroupSetup(actorUserId, input.groupId, locale);
    if (input.userIds.length === 0) return;

    const targetUsers = await db
      .select({ id: users.id, isSuperAdmin: users.isSuperAdmin })
      .from(users)
      .where(inArray(users.id, input.userIds));

    const nonSuperAdminUserIds = targetUsers.filter(u => !u.isSuperAdmin).map(u => u.id);
    if (nonSuperAdminUserIds.length === 0) return;

    await PermissionManagementRepository.bulkRevokeUsersFromGroup(nonSuperAdminUserIds, input.groupId);
  }

  export async function listUserOverrides(
    actorUserId: string,
    userId: string,
    locale?: string
  ): Promise<UserOverrideEntity[]> {
    await requireUserSetup(actorUserId, userId, "manage", "exists", locale);
    return PermissionManagementRepository.getUserOverrides(userId);
  }

  export async function updateUserOverrides(
    actorUserId: string,
    input: { userId: string; overrides: UserOverrideInput[] },
    locale?: string
  ): Promise<void> {
    await requireUserSetup(actorUserId, input.userId, "manage", "nonSuperAdmin", locale);
    await PermissionManagementRepository.setUserOverrides(input.userId, input.overrides, actorUserId);
  }

  export async function getEffectiveUserPermissions(
    actorUserId: string,
    userId: string,
    locale?: string
  ): Promise<AppPermission[]> {
    await requireManageAccess(actorUserId, locale);
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    const user = await requireUserExistsFull(userId, t);

    if (user.isSuperAdmin) {
      const allPerms = await PermissionManagementRepository.listAllPermissions();
      return allPerms.map(p => p.key);
    }

    // Resolve base group permissions
    const groupContext = await PermissionsService.getUserContext(userId);
    const effectiveSet = new Set<AppPermission>(groupContext.permissions);

    // Resolve overrides
    const overrides = await PermissionManagementRepository.getUserOverrides(userId);
    if (overrides.length === 0) return [...effectiveSet];

    const allPerms = await PermissionManagementRepository.listAllPermissions();
    const permMap = new Map(allPerms.map(p => [p.id, p.key]));

    for (const override of overrides) {
      const key = permMap.get(override.permissionId);
      if (!key) continue;
      if (override.state === "GRANTED") effectiveSet.add(key);
      else if (override.state === "DENIED") effectiveSet.delete(key);
    }

    return [...effectiveSet];
  }
}
