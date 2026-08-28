import { and, eq, or } from "drizzle-orm";
import { permissionGroups, userPermissionGroups } from "@/backend/db/schema";
import type { TestDb } from "@/backend/db/test/entity-setup";
import type { SystemPermissionGroupSlug } from "@/shared/constants";

/**
 * A committed `user_permission_groups` membership created by a journey cast.
 * Tracked so `revokeSystemGroupAssignments` can hard-delete exactly these rows.
 */
export interface SystemGroupAssignment {
  userId: string;
  groupId: string;
  slug: string;
}

/**
 * Assigns an existing SYSTEM permission group (created by migrations, e.g.
 * `teacher_default`, `supervisor_default`) to a test user by inserting a real
 * `user_permission_groups` membership row.
 *
 * This is the honest-permission path for journey tests: `PermissionsService`
 * resolves the user's permissions through the real group-membership join, so
 * no service-level mocking of permission checks is ever needed. System group
 * rows are catalog definitions (not demo data), so referencing them is safe;
 * demo/seeded entity rows remain forbidden as fixtures.
 */
export async function assignSystemGroup(
  tx: TestDb,
  userId: string,
  slug: SystemPermissionGroupSlug
): Promise<SystemGroupAssignment> {
  const [group] = await tx
    .select({ id: permissionGroups.id, slug: permissionGroups.slug })
    .from(permissionGroups)
    .where(eq(permissionGroups.slug, slug))
    .limit(1);
  if (!group) {
    throw new Error(`System permission group not found: ${slug}`);
  }

  await tx
    .insert(userPermissionGroups)
    .values({ userId, groupId: group.id, assignedAt: new Date() })
    .onConflictDoNothing();

  return { userId, groupId: group.id, slug: group.slug };
}

/**
 * Hard-deletes the membership rows created by `assignSystemGroup`. The system
 * group itself (a migration-owned catalog row) is intentionally left intact —
 * only this run's memberships are removed.
 */
export async function revokeSystemGroupAssignments(tx: TestDb, assignments: SystemGroupAssignment[]): Promise<void> {
  if (assignments.length === 0) return;
  const membershipConditions = assignments.map(assignment =>
    and(eq(userPermissionGroups.userId, assignment.userId), eq(userPermissionGroups.groupId, assignment.groupId))
  );
  await tx.delete(userPermissionGroups).where(or(...membershipConditions));
}
