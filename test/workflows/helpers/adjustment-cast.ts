import { eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import {
  groupPermissions,
  permissionGroups,
  permissions,
  teachers,
  userPermissionGroups,
  users,
} from "@/backend/db/schema";
import { createTestTeacher, createTestUser } from "@/backend/db/test/entity-setup";
import { AppPermission } from "@/backend/enum";
import type { TeacherSelectType, UserSelectType } from "@/backend/types";
import { SystemPermissionGroupSlug } from "@/shared/constants";
import {
  assignSystemGroup,
  revokeSystemGroupAssignments,
  type SystemGroupAssignment,
} from "@/test/workflows/helpers/permissions";

/**
 * Extra actor cast for credit-adjustment journeys, layered on top of the
 * accounting journey cast: a genuinely permissionless user, a user holding
 * only the legacy `credits.manage` permission through a run-prefixed custom
 * group, a second accounting operator, and two teachers (one payout target,
 * one unrelated control). Permission checks against these actors resolve
 * through real `user_permission_groups` / `group_permissions` rows.
 */
export interface AdjustmentExtraCast {
  /** Holds no group memberships of any kind. */
  permissionlessUser: UserSelectType;
  /** Member of `legacyGroupId` below, which grants only `credits.manage`. */
  legacyCreditsUser: UserSelectType;
  /** Custom, run-prefixed permission group granting only `credits.manage`. */
  legacyGroupId: string;
  /** Second `academy_admin` operator for concurrent submission scenarios. */
  secondAdminUser: UserSelectType;
  /** Carryover payout target. */
  teacherUser: UserSelectType;
  teacher: TeacherSelectType;
  /** Unrelated control teacher — must never receive a carryover hand-off. */
  unrelatedTeacherUser: UserSelectType;
  unrelatedTeacher: TeacherSelectType;
  groupAssignments: SystemGroupAssignment[];
}

/**
 * Provisions the adjustment extra cast in a single COMMITTING transaction and
 * tracks every row for `cleanupAdjustmentExtraCast`. The `credits.manage`
 * catalog row (created by migrations) is referenced by lookup; the custom
 * group, its grant, and its membership row are this run's own rows.
 */
export async function provisionAdjustmentExtraCast(prefix: string): Promise<AdjustmentExtraCast> {
  return db.transaction(async tx => {
    const permissionlessUser = await createTestUser(tx, { name: `${prefix} No Permissions` });
    const legacyCreditsUser = await createTestUser(tx, { name: `${prefix} Legacy Credits` });
    const secondAdminUser = await createTestUser(tx, { name: `${prefix} Operator B` });
    const teacherUser = await createTestUser(tx, { name: `${prefix} Carryover Teacher` });
    const unrelatedTeacherUser = await createTestUser(tx, { name: `${prefix} Other Teacher` });

    const teacher = await createTestTeacher(tx, teacherUser.id);
    const unrelatedTeacher = await createTestTeacher(tx, unrelatedTeacherUser.id);

    const [legacyPermission] = await tx
      .select({ id: permissions.id })
      .from(permissions)
      .where(eq(permissions.key, AppPermission.CREDITS_MANAGE))
      .limit(1);
    if (!legacyPermission) {
      throw new Error("Adjustment cast: credits.manage catalog row not found");
    }

    const now = new Date();
    const [group] = await tx
      .insert(permissionGroups)
      .values({
        name: { en: `${prefix} Legacy Credits`, ar: `${prefix} Legacy Credits` },
        slug: `${prefix}-legacy-credits`,
        createdByUserId: legacyCreditsUser.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: permissionGroups.id });
    if (!group) {
      throw new Error("Adjustment cast: failed to create legacy credits group");
    }
    await tx.insert(groupPermissions).values({ groupId: group.id, permissionId: legacyPermission.id });
    await tx.insert(userPermissionGroups).values({ userId: legacyCreditsUser.id, groupId: group.id, assignedAt: now });

    const groupAssignments = [await assignSystemGroup(tx, secondAdminUser.id, SystemPermissionGroupSlug.ACADEMY_ADMIN)];

    return {
      permissionlessUser,
      legacyCreditsUser,
      legacyGroupId: group.id,
      secondAdminUser,
      teacherUser,
      teacher,
      unrelatedTeacherUser,
      unrelatedTeacher,
      groupAssignments,
    };
  });
}

/**
 * Hard-deletes the extra cast in FK-safe order. Call AFTER the accounting
 * cast cleanup so adjustment ledger rows referencing the carryover teacher
 * are already gone via the student cascade sweep.
 */
export async function cleanupAdjustmentExtraCast(cast: AdjustmentExtraCast): Promise<void> {
  const userIds = [
    cast.permissionlessUser.id,
    cast.legacyCreditsUser.id,
    cast.secondAdminUser.id,
    cast.teacherUser.id,
    cast.unrelatedTeacherUser.id,
  ];

  await db.transaction(async tx => {
    await tx.delete(userPermissionGroups).where(eq(userPermissionGroups.groupId, cast.legacyGroupId));
    await revokeSystemGroupAssignments(tx, cast.groupAssignments);
    await tx.delete(groupPermissions).where(eq(groupPermissions.groupId, cast.legacyGroupId));
    await tx.delete(permissionGroups).where(eq(permissionGroups.id, cast.legacyGroupId));
    await tx.delete(teachers).where(inArray(teachers.id, [cast.teacher.id, cast.unrelatedTeacher.id]));
    await tx.delete(users).where(inArray(users.id, userIds));
  });
}
