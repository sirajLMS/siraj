import { eq, inArray } from "drizzle-orm";
import { groupPermissions, permissionGroups, permissions, userPermissionGroups, users } from "@/backend/db/schema";
import { createTestUser } from "@/backend/db/test/entity-setup";
import type { AppPermission } from "@/backend/enum";
import type { DBTransaction, UserSelectType } from "@/backend/types";
import type { SystemPermissionGroupSlug } from "@/shared/constants";
import { assignSystemGroup, type SystemGroupAssignment } from "@/test/workflows/helpers/permissions";

export interface SystemGroupActor {
  user: UserSelectType;
  assignment: SystemGroupAssignment;
}

/**
 * Provisions one actor bound to a system permission group inside the caller's
 * transaction, so journey casts can stack operators onto a cast without
 * re-wiring `createTestUser` + `assignSystemGroup` by hand each time.
 */
export async function provisionSystemGroupActor(
  tx: DBTransaction,
  name: string,
  slug: SystemPermissionGroupSlug
): Promise<SystemGroupActor> {
  const user = await createTestUser(tx, { name });
  const assignment = await assignSystemGroup(tx, user.id, slug);
  return { user, assignment };
}

export interface CustomPermissionGroupOptions {
  /** Catalog permission key the run-owned custom group grants exclusively. */
  permissionKey: AppPermission;
  /** Thrown when the catalog has no row for `permissionKey`. */
  permissionMissingError: string;
  /** Thrown when the custom group insert returns no row. */
  groupMissingError: string;
  /** Localized display name of the run-owned custom group. */
  groupName: string;
  groupDescription: string;
  /** Unique per-run slug for the custom group. */
  slug: string;
  /** User bound to the custom group through a real membership row. */
  memberUserId: string;
}

/**
 * Provisions a run-owned custom permission group inside the caller's
 * transaction: looks the catalog permission up by key, inserts the non-system
 * group, then binds it to the group catalog and to the member through the real
 * `user_permission_groups` join — nothing is monkey-patched. Returns the
 * custom group id for the cast cleanup tracker.
 */
export async function provisionCustomPermissionGroup(
  tx: DBTransaction,
  options: CustomPermissionGroupOptions
): Promise<string> {
  const [viewPermission] = await tx
    .select({ id: permissions.id })
    .from(permissions)
    .where(eq(permissions.key, options.permissionKey))
    .limit(1);
  if (!viewPermission) {
    throw new Error(options.permissionMissingError);
  }
  const now = new Date();
  const [group] = await tx
    .insert(permissionGroups)
    .values({
      name: { en: options.groupName },
      description: { en: options.groupDescription },
      isSystem: false,
      slug: options.slug,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: permissionGroups.id });
  if (!group) {
    throw new Error(options.groupMissingError);
  }
  await tx.insert(groupPermissions).values({ groupId: group.id, permissionId: viewPermission.id });
  await tx.insert(userPermissionGroups).values({ userId: options.memberUserId, groupId: group.id, assignedAt: now });
  return group.id;
}

export interface CustomPermissionGroupCleanup {
  /** User whose membership row binds the custom group. */
  userId: string;
  groupId: string;
  /** All cast user ids, hard-deleted in FK-safe order after the group rows. */
  userIds: string[];
}

/**
 * Hard-deletes a run-owned custom permission group in FK-safe order: only this
 * run's memberships, group binding, custom group, and user rows are removed.
 * System groups and the permission catalog stay untouched.
 */
export async function cleanupCustomPermissionGroup(
  tx: DBTransaction,
  options: CustomPermissionGroupCleanup
): Promise<void> {
  await tx.delete(userPermissionGroups).where(eq(userPermissionGroups.userId, options.userId));
  await tx.delete(groupPermissions).where(eq(groupPermissions.groupId, options.groupId));
  await tx.delete(permissionGroups).where(eq(permissionGroups.id, options.groupId));
  await tx.delete(users).where(inArray(users.id, options.userIds));
}
