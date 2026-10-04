import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { PermissionManagementRepository } from "@/backend/db/repo/permissions";
import { users } from "@/backend/db/schema";
import { AppPermission, parseAppPermission } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { invalidateRoleChange } from "@/backend/services/cache";
import type { UserPermissionOverrideSelectType } from "@/backend/types";
import { resolveLocalizedString } from "@/shared/lib/localized-string";
import type { ErrorsLabels } from "@/shared/locale";
import { DEFAULT_CONTENT_LOCALE, isAppLocale, type LocalizedString } from "@/shared/types";

async function loadParsedPermissions(): Promise<Array<{ id: string; permission: AppPermission }>> {
  const allPerms = await PermissionManagementRepository.listAllPermissions();
  const parsedPairs: Array<{ id: string; permission: AppPermission }> = [];
  for (const p of allPerms) {
    const parsed = parseAppPermission(p.key);
    if (parsed) {
      parsedPairs.push({ id: p.id, permission: parsed });
    }
  }
  return parsedPairs;
}

export async function buildPermissionMap(): Promise<Map<string, AppPermission>> {
  const parsedPairs = await loadParsedPermissions();
  return new Map(parsedPairs.map(({ id, permission }) => [id, permission]));
}

export async function getAllSystemPermissions(): Promise<AppPermission[]> {
  return (await loadParsedPermissions()).map(({ permission }) => permission);
}

export function applyOverrides(
  effectiveSet: Set<AppPermission>,
  overrides: UserPermissionOverrideSelectType[],
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

export async function requireManageAccess(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
  const context = await PermissionsService.getUserContext(actorUserId);
  if (!context.isSuperAdmin && !context.permissions.includes(AppPermission.PERMISSION_GROUPS_MANAGE)) {
    throw new Error(tErrors.insufficientPermissions);
  }
}

export async function requireAssignAccess(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
  const context = await PermissionsService.getUserContext(actorUserId);
  if (!context.isSuperAdmin && !context.permissions.includes(AppPermission.PERMISSION_GROUPS_ASSIGN)) {
    throw new Error(tErrors.insufficientPermissions);
  }
}

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

export async function requireUserExistsFull(userId: string, tErrors: ErrorsLabels) {
  return fetchUserById(userId, tErrors);
}

export async function requireGroupExists(groupId: string, tErrors: ErrorsLabels) {
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
export async function invalidateRoleChangeFailOpen(userIds: string | string[], context: string): Promise<void> {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  try {
    await Promise.all(ids.map(uid => invalidateRoleChange(uid)));
  } catch (cacheErr) {
    logger.error("Failed to invalidate role change cache", { userIds: ids, context, error: cacheErr });
  }
}

export async function requireUserSetup(
  actorUserId: string,
  userId: string,
  accessType: "assign" | "manage",
  checkType: "exists" | "existsFull" | "nonSuperAdmin",
  tErrors: ErrorsLabels
) {
  if (userId === actorUserId) {
    throw new Error(tErrors.permissionManagement.cannotModifySelf);
  }
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

export async function validateGroupName(name: LocalizedString, tErrors: ErrorsLabels) {
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

export function trimLocalizedString(value: LocalizedString | null | undefined): LocalizedString | null | undefined {
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

export async function requireBulkSetupOrReturn(
  actorUserId: string,
  input: { userIds: string[]; groupId: string },
  tErrors: ErrorsLabels
): Promise<boolean> {
  if (input.userIds.includes(actorUserId)) {
    throw new Error(tErrors.permissionManagement.cannotModifySelf);
  }
  await requireBulkGroupSetup(actorUserId, input.groupId, tErrors);
  return input.userIds.length === 0;
}
