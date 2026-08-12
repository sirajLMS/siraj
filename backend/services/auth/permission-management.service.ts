import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { PermissionManagementRepository } from "@/backend/db/repo/permissions";
import { permissionGroups, userPermissionGroups, users } from "@/backend/db/schema";
import { AppPermission, parseAppPermission } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { invalidateRoleChange } from "@/backend/services/cache";
import type {
  GroupWithPermissionIds,
  PermissionReturnType,
  SystemPermissionUpsertInput,
  UserOverrideEntity,
  UserOverrideInput,
} from "@/backend/types";
import { resolveLocalizedString } from "@/shared/lib/localized-string";
import type { ErrorsLabels } from "@/shared/locale";
import { DEFAULT_CONTENT_LOCALE, isAppLocale, type LocalizedString } from "@/shared/types";

export namespace PermissionManagementService {
  // ─── Private Helpers ──────────────────────────────────────────────────────

  async function buildPermissionMap(): Promise<Map<string, AppPermission>> {
    const allPerms = await PermissionManagementRepository.listAllPermissions();
    const permMap = new Map<string, AppPermission>();
    for (const p of allPerms) {
      const parsed = parseAppPermission(p.key);
      if (parsed) {
        permMap.set(p.id, parsed);
      }
    }
    return permMap;
  }

  async function getAllSystemPermissions(): Promise<AppPermission[]> {
    const allPerms = await PermissionManagementRepository.listAllPermissions();
    const result: AppPermission[] = [];
    for (const p of allPerms) {
      const parsed = parseAppPermission(p.key);
      if (parsed) {
        result.push(parsed);
      }
    }
    return result;
  }

  function applyOverrides(
    effectiveSet: Set<AppPermission>,
    overrides: UserOverrideEntity[],
    permMap: Map<string, AppPermission>
  ): Set<AppPermission> {
    for (const override of overrides) {
      const key = permMap.get(override.permissionId);
      if (!key) continue;
      if (override.state === "GRANTED") effectiveSet.add(key);
      else if (override.state === "DENIED") effectiveSet.delete(key);
    }
    return effectiveSet;
  }

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

  async function fetchUserById(userId: string, tErrors: ErrorsLabels) {
    const [user] = await db
      .select({ id: users.id, isSuperAdmin: users.isSuperAdmin })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) throw new Error(tErrors.permissionManagement.userNotFound(userId));
    return user;
  }

  async function requireUserExists(userId: string, tErrors: ErrorsLabels) {
    return fetchUserById(userId, tErrors);
  }

  async function requireUserExistsFull(userId: string, tErrors: ErrorsLabels) {
    return fetchUserById(userId, tErrors);
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

  /**
   * Shared fail-open cache invalidation helper. Wraps {@link invalidateRoleChange}
   * in a try/catch so cache provider errors never crash the calling request.
   * Returns the same `userIds` it was given so batch callers can chain inline.
   */
  async function invalidateRoleChangeFailOpen(userIds: string | string[], context: string): Promise<void> {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    try {
      await Promise.all(ids.map(uid => invalidateRoleChange(uid)));
    } catch (cacheErr) {
      logger.error("Failed to invalidate role change cache", { userIds: ids, context, error: cacheErr });
    }
  }

  /**
   * Toggles the `trg_protect_system_permissions` trigger on the `permissions`
   * table. The DO $$ block swallows concurrent / missing-table errors so the
   * call is safe to run even when the trigger does not exist.
   */
  async function setSystemPermissionTrigger(enabled: boolean): Promise<void> {
    const action = enabled ? "ENABLE" : "DISABLE";
    await db.execute(sql`
      DO $$
      BEGIN
        ALTER TABLE permissions ${sql.raw(action)} TRIGGER trg_protect_system_permissions;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not ${sql.raw(action.toLowerCase())} trigger: %', SQLERRM;
      END $$;
    `);
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
    const resolvedName = resolveLocalizedString(name, DEFAULT_CONTENT_LOCALE);
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
      if (typeof text === "string" && isAppLocale(locale)) {
        trimmed[locale] = text.trim();
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
      .where(sql`${permissionGroups.slug} LIKE ${baseSlug + "%"}`);

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

  async function requireBulkSetupOrReturn(
    actorUserId: string,
    input: { userIds: string[]; groupId: string },
    tErrors: ErrorsLabels
  ): Promise<boolean> {
    await requireBulkGroupSetup(actorUserId, input.groupId, tErrors);
    return input.userIds.length === 0;
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

  async function disableSystemPermissionTrigger(): Promise<void> {
    await setSystemPermissionTrigger(false);
  }

  async function enableSystemPermissionTrigger(): Promise<void> {
    await setSystemPermissionTrigger(true);
  }

  /**
   * Ensures app_permission enum values exist before inserting system permissions.
   */
  export async function ensurePermissionEnumValues(keys: readonly AppPermission[]): Promise<void> {
    await Promise.all(
      keys.map(key => db.execute(sql.raw(`ALTER TYPE app_permission ADD VALUE IF NOT EXISTS '${key}';`)))
    );
  }

  /**
   * Upserts immutable system permissions (disables protection trigger during write).
   */
  export async function upsertSystemPermissions(
    inputs: readonly SystemPermissionUpsertInput[]
  ): Promise<AppPermission[]> {
    if (inputs.length === 0) return [];

    const permissionKeys: AppPermission[] = [];
    for (const spec of inputs) {
      const parsed = parseAppPermission(spec.key);
      if (!parsed) {
        throw new Error(`Invalid AppPermission key: ${spec.key}`);
      }
      permissionKeys.push(parsed);
    }

    await ensurePermissionEnumValues(permissionKeys);
    await disableSystemPermissionTrigger();

    try {
      await Promise.all(
        inputs.map(spec =>
          db.execute(sql`
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
        `)
        )
      );
      return permissionKeys;
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

    await Promise.all(
      permissionKeys.map(key =>
        db.execute(sql`
        INSERT INTO group_permissions (group_id, permission_id)
        SELECT g.id, p.id
        FROM permission_groups g, permissions p
        WHERE g.slug = ${groupSlug}
          AND p.key = ${key}::app_permission
        ON CONFLICT DO NOTHING
      `)
      )
    );
  }

  /**
   * Assigns permissions to multiple groups by slug (idempotent).
   */
  export async function ensureGroupPermissionsForGroups(
    groupSlugs: readonly string[],
    permissionKeys: readonly AppPermission[]
  ): Promise<void> {
    await Promise.all(groupSlugs.map(groupSlug => ensureGroupPermissions(groupSlug, permissionKeys)));
  }

  /**
   * Removes specific permissions from a group by slug (idempotent).
   * Used by seeds when a previously granted key must be withdrawn.
   */
  export async function revokeGroupPermissions(
    groupSlug: string,
    permissionKeys: readonly AppPermission[]
  ): Promise<void> {
    if (permissionKeys.length === 0) return;

    await Promise.all(
      permissionKeys.map(key =>
        db.execute(sql`
        DELETE FROM group_permissions gp
        USING permission_groups g, permissions p
        WHERE gp.group_id = g.id
          AND gp.permission_id = p.id
          AND g.slug = ${groupSlug}
          AND p.key = ${key}::app_permission
      `)
      )
    );
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
