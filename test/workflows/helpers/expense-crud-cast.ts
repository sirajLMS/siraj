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
 * Actor cast for the expense operator-to-auditor journey: an accounting
 * operator (`academy_admin`, so both expense permissions resolve through the
 * real catalog), a read-only auditor whose run-owned custom group carries
 * exactly the ledger VIEW permission, and an outsider holding no group at all
 * (the "neither permission" actor). Every denial path resolves through the
 * real user_permission_groups join — nothing is monkey-patched.
 */
export interface ExpenseCrudCast {
  /** Accounting operator — `academy_admin` member, holds VIEW + MANAGE. */
  operatorUser: UserSelectType;
  operatorAssignment: SystemGroupAssignment;
  /** Read-only auditor — custom group granting exactly `ACCOUNTING_EXPENSES_VIEW`. */
  auditorUser: UserSelectType;
  auditorGroupId: string;
  /** Neither VIEW nor MANAGE — no group membership at all. */
  outsiderUser: UserSelectType;
}

/**
 * Provisions the cast in a single COMMITTING transaction: the operator via
 * `assignSystemGroup`, the auditor through a run-owned permission group bound
 * to the catalog's expenses-view row, and the outsider as a bare user.
 */
export async function provisionExpenseCrudCast(prefix: string): Promise<ExpenseCrudCast> {
  return db.transaction(async tx => {
    const now = new Date();
    const operatorUser = await createTestUser(tx, { name: `${prefix} Expense Operator` });
    const operatorAssignment = await assignSystemGroup(tx, operatorUser.id, SystemPermissionGroupSlug.ACADEMY_ADMIN);
    const auditorUser = await createTestUser(tx, { name: `${prefix} Expense Auditor` });
    const outsiderUser = await createTestUser(tx, { name: `${prefix} Expense Outsider` });

    const [viewPermission] = await tx
      .select({ id: permissions.id })
      .from(permissions)
      .where(eq(permissions.key, AppPermission.ACCOUNTING_EXPENSES_VIEW))
      .limit(1);
    if (!viewPermission) {
      throw new Error("expenses view permission row not found in the permissions catalog");
    }

    const [auditorGroup] = await tx
      .insert(permissionGroups)
      .values({
        name: { en: `${prefix} Expense Auditor` },
        description: { en: "Read-only expense ledger access for this run" },
        isSystem: false,
        slug: `${prefix}_expense_auditor`,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: permissionGroups.id });
    if (!auditorGroup) {
      throw new Error("expense auditor group insert returned no row");
    }
    await tx.insert(groupPermissions).values({ groupId: auditorGroup.id, permissionId: viewPermission.id });
    await tx.insert(userPermissionGroups).values({ userId: auditorUser.id, groupId: auditorGroup.id, assignedAt: now });

    return { operatorUser, operatorAssignment, auditorUser, auditorGroupId: auditorGroup.id, outsiderUser };
  });
}

/**
 * Hard-deletes the cast in FK-safe order: only this run's memberships, group
 * binding, custom group, and user rows are removed. System groups and the
 * permission catalog stay untouched. Expense rows the journey created must be
 * deleted by the journey itself first (createdByUserId FK).
 */
export async function cleanupExpenseCrudCast(cast: ExpenseCrudCast): Promise<void> {
  await db.transaction(async tx => {
    await revokeSystemGroupAssignments(tx, [cast.operatorAssignment]);
    await tx.delete(userPermissionGroups).where(eq(userPermissionGroups.userId, cast.auditorUser.id));
    await tx.delete(groupPermissions).where(eq(groupPermissions.groupId, cast.auditorGroupId));
    await tx.delete(permissionGroups).where(eq(permissionGroups.id, cast.auditorGroupId));
    await tx.delete(users).where(inArray(users.id, [cast.operatorUser.id, cast.auditorUser.id, cast.outsiderUser.id]));
  });
}
