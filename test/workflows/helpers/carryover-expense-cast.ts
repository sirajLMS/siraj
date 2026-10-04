import { db } from "@/backend/db/drizzleDb";
import { createTestUser } from "@/backend/db/test/entity-setup";
import { AppPermission } from "@/backend/enum";
import type { UserSelectType } from "@/backend/types";
import { SystemPermissionGroupSlug } from "@/shared/constants";
import {
  cleanupCustomPermissionGroup,
  provisionCustomPermissionGroup,
  provisionSystemGroupActor,
} from "@/test/workflows/helpers/custom-permission-group.helpers";
import { revokeSystemGroupAssignments, type SystemGroupAssignment } from "@/test/workflows/helpers/permissions";

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
    const secondOperator = await provisionSystemGroupActor(
      tx,
      `${prefix} Operator Two`,
      SystemPermissionGroupSlug.ACADEMY_ADMIN
    );
    const viewerUser = await createTestUser(tx, { name: `${prefix} Carryover Viewer` });
    const viewerGroupId = await provisionCustomPermissionGroup(tx, {
      permissionKey: AppPermission.ACCOUNTING_CARRYOVER_VIEW,
      permissionMissingError: "carryover view permission row not found in the permissions catalog",
      groupMissingError: "carryover viewer group insert returned no row",
      groupName: `${prefix} Carryover Viewer`,
      groupDescription: "Read-only carryover access for this run",
      slug: `${prefix}_carryover_viewer`,
      memberUserId: viewerUser.id,
    });

    return {
      secondOperatorUser: secondOperator.user,
      secondOperatorAssignment: secondOperator.assignment,
      viewerUser,
      viewerGroupId,
      viewerMembershipId: { userId: viewerUser.id, groupId: viewerGroupId },
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
    await cleanupCustomPermissionGroup(tx, {
      userId: extras.viewerUser.id,
      groupId: extras.viewerGroupId,
      userIds: [extras.secondOperatorUser.id, extras.viewerUser.id],
    });
  });
}
