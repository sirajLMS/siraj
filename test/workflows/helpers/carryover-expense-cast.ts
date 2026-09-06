import { eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { groupPermissions, permissionGroups, permissions, userPermissionGroups, users } from "@/backend/db/schema";
import { createTestUser } from "@/backend/db/test/entity-setup";
import { AppPermission } from "@/backend/enum";
import type { UserSelectType } from "@/backend/types";
import { SystemPermissionGroupSlug } from "@/shared/constants";
import {
  assignSystemGroup,
  revokeSystemGroupAssignments,
  type SystemGroupAssignment,
} from "@/test/workflows/helpers/permissions";

/**
 * Extra actors provisioned per run on top of the shared payroll cast for the
 * carryover to-expense journey: a second full operator (same `academy_admin`
 * group, so cross-operator contention resolves through real permissions) and a
 * read-only viewer whose one custom group carries exactly the carryover view
 * permission (the catalog keeps view separate from manage precisely so
 * read-only auditors can exist without settlement capability).
 */
export interface CarryoverExpenseCastExtras {
  /** Second accounting operator — `academy_admin` member, used for the concurrent-settlement denial. */
  secondOperatorUser: UserSelectType;
  secondOperatorAssignment: SystemGroupAssignment;
  /** Read-only auditor — custom group granting exactly `ACCOUNTING_CARRYOVER_VIEW`. */
  viewerUser: UserSelectType;
  viewerGroupId: string;
  viewerMembershipId: { userId: string; groupId: string };
}

/**
 * Provisions the extras in a single COMMITTING transaction: the second
 * operator via `assignSystemGroup`, and the viewer through a run-owned
 * permission group bound to the catalog's carryover-view row. Permissions
 * resolve honestly through the real group-membership join.
 */
export async function provisionCarryoverExpenseExtras(prefix: string): Promise<CarryoverExpenseCastExtras> {
  return db.transaction(async tx => {
    const now = new Date();
    const secondOperatorUser = await createTestUser(tx, { name: `${prefix} Operator Two` });
    const secondOperatorAssignment = await assignSystemGroup(
      tx,
      secondOperatorUser.id,
      SystemPermissionGroupSlug.ACADEMY_ADMIN
    );
    const viewerUser = await createTestUser(tx, { name: `${prefix} Carryover Viewer` });

    const [viewPermission] = await tx
      .select({ id: permissions.id })
      .from(permissions)
      .where(eq(permissions.key, AppPermission.ACCOUNTING_CARRYOVER_VIEW))
      .limit(1);
    if (!viewPermission) {
      throw new Error("carryover view permission row not found in the permissions catalog");
    }

    const [viewerGroup] = await tx
      .insert(permissionGroups)
      .values({
        name: { en: `${prefix} Carryover Viewer` },
        description: { en: "Read-only carryover access for this run" },
        isSystem: false,
        slug: `${prefix}_carryover_viewer`,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: permissionGroups.id });
    if (!viewerGroup) {
      throw new Error("carryover viewer group insert returned no row");
    }
    await tx.insert(groupPermissions).values({ groupId: viewerGroup.id, permissionId: viewPermission.id });
    await tx.insert(userPermissionGroups).values({ userId: viewerUser.id, groupId: viewerGroup.id, assignedAt: now });

    return {
      secondOperatorUser,
      secondOperatorAssignment,
      viewerUser,
      viewerGroupId: viewerGroup.id,
      viewerMembershipId: { userId: viewerUser.id, groupId: viewerGroup.id },
    };
  });
}

/**
 * Hard-deletes the extras in FK-safe order: only this run's memberships,
 * group binding, custom group, and user rows are removed. System groups and
 * the permission catalog stay untouched.
 */
export async function cleanupCarryoverExpenseExtras(extras: CarryoverExpenseCastExtras): Promise<void> {
  await db.transaction(async tx => {
    await revokeSystemGroupAssignments(tx, [extras.secondOperatorAssignment]);
    await tx.delete(userPermissionGroups).where(eq(userPermissionGroups.userId, extras.viewerUser.id));
    await tx.delete(groupPermissions).where(eq(groupPermissions.groupId, extras.viewerGroupId));
    await tx.delete(permissionGroups).where(eq(permissionGroups.id, extras.viewerGroupId));
    await tx.delete(users).where(inArray(users.id, [extras.secondOperatorUser.id, extras.viewerUser.id]));
  });
}
