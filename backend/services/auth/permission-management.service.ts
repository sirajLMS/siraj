import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { PermissionManagementRepository } from "@/backend/db/repo";
import { resolveLocalized } from "@/backend/db/repo/utils/resolve-localized";
import { permissionGroups, userPermissionGroups, users } from "@/backend/db/schema";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  GroupWithPermissionIds,
  LocalizedString,
  PermissionEntity,
  SystemPermissionUpsertInput,
  UserOverrideEntity,
  UserOverrideInput,
} from "@/backend/types";
import { DEFAULT_CONTENT_LOCALE } from "@/backend/types/shared/localized-string.types";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

export namespace PermissionManagementService {
  // ─── Private Guards ───────────────────────────────────────────────────────

  async function requireManageAccess(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
    const context = await PermissionsService.getUserContext(actorUserId);
    if (!context.isSuperAdmin && !context.permissions.includes(AppPermission.PERMISSION_GROUPS_MANAGE)) {
      throw new Error(tErrors.insufficientPermissions);
    }
  }

  async function requireAssignAccess(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
    const context = await PermissionsService.getUserContext(actorUserId);
    if (!context.isSuperAdmin && !context.permissions.includes(AppPermission.PERMISSION_GROUPS_ASSIGN)) {
      throw new Error(tErrors.insufficientPermissions);
    }
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  async function requireUserExists(userId: string, tErrors: ErrorsLabels) {
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new Error(tErrors.permissionManagement.userNotFound(userId));
    return user;
  }

  async function requireUserExistsFull(userId: string, tErrors: ErrorsLabels) {
    const [user] = await db
      .select({ id: users.id, isSuperAdmin: users.isSuperAdmin })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) throw new Error(tErrors.permissionManagement.userNotFound(userId));
    return user;
  }

  async function requireGroupExists(groupId: string, tErrors: ErrorsLabels) {
    const group = await PermissionManagementRepository.getGroupById(groupId);
    if (!group) throw new Error(tErrors.permissionManagement.permissionGroupNotFound(groupId));
    return group;
  }

  async function requireBulkGroupSetup(actorUserId: string, groupId: string, tErrors: ErrorsLabels) {
    await requireAssignAccess(actorUserId, tErrors);
    await requireGroupExists(groupId, tErrors);
  }

  async function requireUserSetup(
    actorUserId: string,
    userId: string,
    accessType: "assign" | "manage",
    checkType: "exists" | "existsFull" | "nonSuperAdmin",
    tErrors: ErrorsLabels
  ) {
    if (accessType === "assign") {
      await requireAssignAccess(actorUserId, tErrors);
    } else {
      await requireManageAccess(actorUserId, tErrors);
    }
    if (checkType === "exists") {
      await requireUserExists(userId, tErrors);
    } else if (checkType === "existsFull") {
      await requireUserExistsFull(userId, tErrors);
    } else if (checkType === "nonSuperAdmin") {
      await requireNonSuperAdmin(userId, tErrors);
    }
  }

  async function validateGroupName(name: LocalizedString, tErrors: ErrorsLabels) {
    const resolvedName = resolveLocalized(name, DEFAULT_CONTENT_LOCALE);
    const trimmedName = resolvedName.trim();
    if (!trimmedName) throw new Error(tErrors.permissionManagement.permissionGroupNameRequired);
    if (trimmedName.length > 255) throw new Error(tErrors.permissionManagement.permissionGroupNameTooLong);

    const slug = generateSlug(trimmedName);
    if (!slug) throw new Error(tErrors.permissionManagement.permissionGroupInvalidName);

    return { trimmedName, slug };
  }

  async function requireNonSuperAdmin(userId: string, tErrors: ErrorsLabels) {
    const user = await requireUserExistsFull(userId, tErrors);
    if (user.isSuperAdmin) {
      throw new Error(tErrors.permissionManagement.cannotModifySuperAdmin);
    }
    return user;
  }

  function trimLocalizedString(value: LocalizedString | null | undefined): LocalizedString | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }

    const trimmed: LocalizedString = {};
    for (const [locale, text] of Object.entries(value)) {
      if (typeof text === "string") {
        trimmed[locale as keyof LocalizedString] = text.trim();
      }
    }
    return trimmed;
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
  export async function listPermissions(actorUserId: string, tErrors: ErrorsLabels): Promise<PermissionEntity[]> {
    await requireManageAccess(actorUserId, tErrors);
    return PermissionManagementRepository.listAllPermissions();
  }

  export async function listGroups(actorUserId: string, tErrors: ErrorsLabels): Promise<GroupWithPermissionIds[]> {
    await requireManageAccess(actorUserId, tErrors);
    return PermissionManagementRepository.listAllGroups();
  }

  export async function getGroup(
    actorUserId: string,
    groupId: string,
    tErrors: ErrorsLabels
  ): Promise<GroupWithPermissionIds> {
    await requireManageAccess(actorUserId, tErrors);
    return requireGroupExists(groupId, tErrors);
  }

  // ─── Write Operations ─────────────────────────────────────────────────────

  export async function createGroup(
    actorUserId: string,
    input: { name: LocalizedString; description?: LocalizedString | null; permissionIds: string[] },
    tErrors: ErrorsLabels
  ): Promise<GroupWithPermissionIds> {
    await requireManageAccess(actorUserId, tErrors);

    const { slug: baseSlug } = await validateGroupName(input.name, tErrors);

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
    tErrors: ErrorsLabels
  ): Promise<GroupWithPermissionIds> {
    await requireManageAccess(actorUserId, tErrors);

    let slug: string | undefined;

    if (input.name !== undefined) {
      const validated = await validateGroupName(input.name, tErrors);
      slug = validated.slug;
    }

    return PermissionManagementRepository.updateGroup({
      id: input.groupId,
      name: input.name,
      slug,
      description: trimLocalizedString(input.description),
      permissionIds: input.permissionIds,
    });
  }

  export async function deleteGroup(actorUserId: string, groupId: string, tErrors: ErrorsLabels): Promise<void> {
    await requireManageAccess(actorUserId, tErrors);
    await PermissionManagementRepository.deleteGroup(groupId);
  }

  export async function assignGroupToUser(
    actorUserId: string,
    input: { userId: string; groupId: string },
    tErrors: ErrorsLabels
  ): Promise<void> {
    await requireUserSetup(actorUserId, input.userId, "assign", "existsFull", tErrors);
    await PermissionManagementRepository.bulkAssignUsersToGroup([input.userId], input.groupId, actorUserId);
  }

  export async function revokeGroupFromUser(
    actorUserId: string,
    input: { userId: string; groupId: string },
    tErrors: ErrorsLabels
  ): Promise<void> {
    await requireUserSetup(actorUserId, input.userId, "assign", "nonSuperAdmin", tErrors);
    await PermissionManagementRepository.bulkRevokeUsersFromGroup([input.userId], input.groupId);
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
    // Using the new helper
    await requireBulkGroupSetup(actorUserId, input.groupId, tErrors);
    if (input.userIds.length === 0) return;

    const foundUsers = await db.select({ id: users.id }).from(users).where(inArray(users.id, input.userIds));
    if (foundUsers.length !== input.userIds.length) throw new Error(tErrors.permissionManagement.userNotFound(""));

    await PermissionManagementRepository.bulkAssignUsersToGroup(input.userIds, input.groupId, actorUserId);
  }

  export async function bulkRevokeUsersFromGroup(
    actorUserId: string,
    input: { userIds: string[]; groupId: string },
    tErrors: ErrorsLabels
  ): Promise<void> {
    await requireBulkGroupSetup(actorUserId, input.groupId, tErrors);
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
    tErrors: ErrorsLabels
  ): Promise<UserOverrideEntity[]> {
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
  }

  export async function getEffectiveUserPermissions(
    actorUserId: string,
    userId: string,
    tErrors: ErrorsLabels
  ): Promise<AppPermission[]> {
    await requireManageAccess(actorUserId, tErrors);
    const user = await requireUserExistsFull(userId, tErrors);

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

  // ─── Bootstrap / Seeder Operations (no auth) ──────────────────────────────

  async function disableSystemPermissionTrigger(): Promise<void> {
    await db.execute(sql`
      DO $$
      BEGIN
        ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
      END $$;
    `);
  }

  async function enableSystemPermissionTrigger(): Promise<void> {
    await db.execute(sql`
      DO $$
      BEGIN
        ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
      END $$;
    `);
  }

  /**
   * Ensures app_permission enum values exist before inserting system permissions.
   */
  export async function ensurePermissionEnumValues(keys: readonly AppPermission[]): Promise<void> {
    for (const key of keys) {
      await db.execute(sql.raw(`ALTER TYPE app_permission ADD VALUE IF NOT EXISTS '${key}';`));
    }
  }

  /**
   * Upserts immutable system permissions (disables protection trigger during write).
   */
  export async function upsertSystemPermissions(
    inputs: readonly SystemPermissionUpsertInput[]
  ): Promise<AppPermission[]> {
    if (inputs.length === 0) return [];

    await ensurePermissionEnumValues(inputs.map(spec => spec.key));
    await disableSystemPermissionTrigger();

    try {
      for (const spec of inputs) {
        await db.execute(sql`
          INSERT INTO permissions (id, key, resource, action, description, category, is_system)
          VALUES (
            gen_random_uuid(),
            ${spec.key}::app_permission,
            ${spec.resource},
            ${spec.action},
            ${JSON.stringify(spec.description)}::jsonb,
            ${JSON.stringify(spec.category)}::jsonb,
            true
          )
          ON CONFLICT (key) DO UPDATE SET
            resource = EXCLUDED.resource,
            action = EXCLUDED.action,
            description = EXCLUDED.description,
            category = EXCLUDED.category,
            is_system = EXCLUDED.is_system
        `);
      }
      return inputs.map(spec => spec.key);
    } finally {
      await enableSystemPermissionTrigger();
    }
  }

  /**
   * Assigns permissions to a group by slug (idempotent).
   */
  export async function ensureGroupPermissions(
    groupSlug: string,
    permissionKeys: readonly AppPermission[]
  ): Promise<void> {
    if (permissionKeys.length === 0) return;

    for (const key of permissionKeys) {
      await db.execute(sql`
        INSERT INTO group_permissions (group_id, permission_id)
        SELECT g.id, p.id
        FROM permission_groups g, permissions p
        WHERE g.slug = ${groupSlug}
          AND p.key = ${key}::app_permission
        ON CONFLICT DO NOTHING
      `);
    }
  }

  /**
   * Assigns permissions to multiple groups by slug (idempotent).
   */
  export async function ensureGroupPermissionsForGroups(
    groupSlugs: readonly string[],
    permissionKeys: readonly AppPermission[]
  ): Promise<void> {
    for (const groupSlug of groupSlugs) {
      await ensureGroupPermissions(groupSlug, permissionKeys);
    }
  }
  /**
   * Idempotent single user permission override (seed / bootstrap use).
   */
  export async function ensureUserPermissionOverride(input: {
    userId: string;
    permissionKey: AppPermission;
    state: UserOverrideInput["state"];
    assignedByUserId: string | null;
  }): Promise<UserOverrideEntity | null> {
    const permissionId = await PermissionManagementRepository.getPermissionIdByKey(input.permissionKey);
    if (!permissionId) return null;

    return PermissionManagementRepository.upsertUserPermissionOverride({
      userId: input.userId,
      permissionId,
      state: input.state,
      assignedByUserId: input.assignedByUserId,
    });
  }

  /**
   * Idempotent upsert of a fixed-slug system permission group. Used by seeders
   * and bootstrap flows to guarantee the existence of system-ready groups whose
   * slugs are referenced externally (e.g. by `SystemPermissionGroupSlug`) but
   * which may predate the migrations inserting them. Safe to call repeatedly.
   *
   * NOTE: this bypasses `requireManageAccess` because it is part of the
   * system bootstrap surface, not user-initiated CRUD.
   */
  export async function ensureSystemPermissionGroup(input: {
    slug: string;
    name: LocalizedString;
    description?: LocalizedString | null;
  }): Promise<{ id: string; slug: string; isSystem: boolean }> {
    return PermissionManagementRepository.upsertSystemGroup({
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
    });
  }
}
