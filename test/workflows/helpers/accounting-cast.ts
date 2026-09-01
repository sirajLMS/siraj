import { eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { creditTransactions, invoices, packagePlans, parents, payments, students, users } from "@/backend/db/schema";
import { createTestParent, createTestStudent, createTestUser } from "@/backend/db/test/entity-setup";
import type { PackagePlanSelectType, ParentSelectType, StudentSelectType, UserSelectType } from "@/backend/types";
import { SystemPermissionGroupSlug } from "@/shared/constants";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import {
  assignSystemGroup,
  revokeSystemGroupAssignments,
  type SystemGroupAssignment,
} from "@/test/workflows/helpers/permissions";

/**
 * The actor cast for credit-hours accounting journeys. Every committed row id
 * created by `provisionAccountingJourneyCast` is tracked here so
 * `cleanupAccountingJourneyCast` can hard-delete the fixture in `afterAll`.
 * Rows the services create during the journey (invoices, payments, hour ledger
 * entries) are swept via the two family parent ids.
 */
export interface AccountingJourneyCast {
  prefix: string;
  /** Recording actor — `academy_admin` member (VIEW + MANAGE). */
  adminUser: UserSelectType;
  /** View-only observer — `staff_default` member (VIEW, no MANAGE). */
  staffViewerUser: UserSelectType;
  /** Family under test: linked parent + student, each with a login user. */
  parentUser: UserSelectType;
  parent: ParentSelectType;
  studentUser: UserSelectType;
  student: StudentSelectType;
  /** Second family — proves cross-actor invisibility honestly. */
  unrelatedParentUser: UserSelectType;
  unrelatedParent: ParentSelectType;
  unrelatedStudentUser: UserSelectType;
  unrelatedStudent: StudentSelectType;
  /** Active hour package plan the journey buys from. */
  plan: PackagePlanSelectType;
  groupAssignments: SystemGroupAssignment[];
}

/**
 * Provisions the accounting cast in a single COMMITTING transaction: an
 * academy admin, a view-only staff member, the target family (parent +
 * student), an unrelated second family, and one active hour package plan.
 * Permissions resolve honestly through real system group memberships.
 */
export async function provisionAccountingJourneyCast(prefix: string): Promise<AccountingJourneyCast> {
  return db.transaction(async tx => {
    const adminUser = await createTestUser(tx, { name: `${prefix} Admin` });
    const staffViewerUser = await createTestUser(tx, { name: `${prefix} Staff Viewer` });

    const parentUser = await createTestUser(tx, { name: `${prefix} Parent` });
    const parent = await createTestParent(tx, parentUser.id);
    const studentUser = await createTestUser(tx, { name: `${prefix} Student` });
    const student = await createTestStudent(tx, parent.id, {
      userId: studentUser.id,
      name: `${prefix} Student`,
    });

    const unrelatedParentUser = await createTestUser(tx, { name: `${prefix} Other Parent` });
    const unrelatedParent = await createTestParent(tx, unrelatedParentUser.id);
    const unrelatedStudentUser = await createTestUser(tx, { name: `${prefix} Other Student` });
    const unrelatedStudent = await createTestStudent(tx, unrelatedParent.id, {
      userId: unrelatedStudentUser.id,
      name: `${prefix} Other Student`,
    });

    const [plan] = await tx
      .insert(packagePlans)
      .values({
        codename: `${prefix}_plan`,
        displayName: `${prefix} Plan`,
        description: null,
        creditHours: "10.0000",
        priceAmount: "300.00",
        currency: CurrencyCode.USD,
        active: true,
        sortOrder: 0,
      })
      .returning();
    if (!plan) {
      throw new Error("Accounting journey cast: failed to create package plan");
    }

    const groupAssignments = [
      await assignSystemGroup(tx, adminUser.id, SystemPermissionGroupSlug.ACADEMY_ADMIN),
      await assignSystemGroup(tx, staffViewerUser.id, SystemPermissionGroupSlug.STAFF_DEFAULT),
      await assignSystemGroup(tx, parentUser.id, SystemPermissionGroupSlug.PARENT_DEFAULT),
      await assignSystemGroup(tx, studentUser.id, SystemPermissionGroupSlug.STUDENT_DEFAULT),
      await assignSystemGroup(tx, unrelatedParentUser.id, SystemPermissionGroupSlug.PARENT_DEFAULT),
      await assignSystemGroup(tx, unrelatedStudentUser.id, SystemPermissionGroupSlug.STUDENT_DEFAULT),
    ];

    return {
      prefix,
      adminUser,
      staffViewerUser,
      parentUser,
      parent,
      studentUser,
      student,
      unrelatedParentUser,
      unrelatedParent,
      unrelatedStudentUser,
      unrelatedStudent,
      plan,
      groupAssignments,
    };
  });
}

/**
 * Hard-deletes the cast in FK-safe order, INCLUDING the side-effect rows the
 * services create during the journey (credit-transaction hour ledger entries,
 * payments, and invoices discovered via the two family parent ids). System
 * permission groups themselves are untouched — only this run's membership
 * rows are revoked.
 */
export async function cleanupAccountingJourneyCast(cast: AccountingJourneyCast): Promise<void> {
  const parentIds = [cast.parent.id, cast.unrelatedParent.id];
  const studentIds = [cast.student.id, cast.unrelatedStudent.id];
  const userIds = [
    cast.adminUser.id,
    cast.staffViewerUser.id,
    cast.parentUser.id,
    cast.studentUser.id,
    cast.unrelatedParentUser.id,
    cast.unrelatedStudentUser.id,
  ];

  await db.transaction(async tx => {
    const invoiceRows = await tx
      .select({ id: invoices.id })
      .from(invoices)
      .where(inArray(invoices.parentId, parentIds));
    const invoiceIds = invoiceRows.map(row => row.id);

    await tx.delete(creditTransactions).where(inArray(creditTransactions.studentId, studentIds));
    if (invoiceIds.length > 0) {
      await tx.delete(payments).where(inArray(payments.invoiceId, invoiceIds));
      await tx.delete(invoices).where(inArray(invoices.id, invoiceIds));
    }
    await tx.delete(packagePlans).where(eq(packagePlans.id, cast.plan.id));
    await revokeSystemGroupAssignments(tx, cast.groupAssignments);
    await tx.delete(students).where(inArray(students.id, studentIds));
    await tx.delete(parents).where(inArray(parents.id, parentIds));
    await tx.delete(users).where(inArray(users.id, userIds));
  });
}
