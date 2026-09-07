import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { groupPermissions, permissionGroups, permissions, userPermissionGroups, users } from "@/backend/db/schema";
import { createTestUser } from "@/backend/db/test/entity-setup";
import { AppPermission } from "@/backend/enum";
import type { UserSelectType } from "@/backend/types";

/**
 * A read-only expense-ledger auditor provisioned per journey run on top of any
 * journey cast. The custom group grants exactly `ACCOUNTING_EXPENSES_VIEW` —
 * the ledger keeps view and manage as separate catalog permissions precisely
 * so read-only accounting audiences can exist without any write capability.
 */
export interface ExpenseViewerCastExtras {
  /** Read-only auditor — custom group granting exactly `ACCOUNTING_EXPENSES_VIEW`. */
  viewerUser: UserSelectType;
  viewerGroupId: string;
}

/**
 * Provisions the viewer in a single COMMITTING transaction: one user bound to
 * a run-owned permission group wired to the catalog's expense-view row.
 * Permissions resolve honestly through the real group-membership join.
 */
export async function provisionExpenseViewerExtras(prefix: string): Promise<ExpenseViewerCastExtras> {
  return db.transaction(async tx => {
    const now = new Date();
    const viewerUser = await createTestUser(tx, { name: `${prefix} Expense Viewer` });

    const [viewPermission] = await tx
      .select({ id: permissions.id })
      .from(permissions)
      .where(eq(permissions.key, AppPermission.ACCOUNTING_EXPENSES_VIEW))
      .limit(1);
    if (!viewPermission) {
      throw new Error("expense view permission row not found in the permissions catalog");
    }

    const [viewerGroup] = await tx
      .insert(permissionGroups)
      .values({
        name: { en: `${prefix} Expense Viewer` },
        description: { en: "Read-only expense-ledger access for this run" },
        isSystem: false,
        slug: `${prefix}_expense_viewer`,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: permissionGroups.id });
    if (!viewerGroup) {
      throw new Error("expense viewer group insert returned no row");
    }
    await tx.insert(groupPermissions).values({ groupId: viewerGroup.id, permissionId: viewPermission.id });
    await tx.insert(userPermissionGroups).values({ userId: viewerUser.id, groupId: viewerGroup.id, assignedAt: now });

    return { viewerUser, viewerGroupId: viewerGroup.id };
  });
}

/**
 * Hard-deletes the viewer extras in FK-safe order: only this run's
 * membership, group binding, custom group, and user row are removed. The
 * permission catalog stays untouched.
 */
export async function cleanupExpenseViewerExtras(extras: ExpenseViewerCastExtras): Promise<void> {
  await db.transaction(async tx => {
    await tx.delete(userPermissionGroups).where(eq(userPermissionGroups.userId, extras.viewerUser.id));
    await tx.delete(groupPermissions).where(eq(groupPermissions.groupId, extras.viewerGroupId));
    await tx.delete(permissionGroups).where(eq(permissionGroups.id, extras.viewerGroupId));
    await tx.delete(users).where(eq(users.id, extras.viewerUser.id));
  });
}
