import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { auditLogs, creditTransactions, parents, students, teachers, users } from "@/backend/db/schema";
import { createTestParent, createTestStudent, createTestTeacher, createTestUser } from "@/backend/db/test/entity-setup";
import { CreditAdjustmentType } from "@/backend/enum";
import { ForbiddenError, NotFoundError } from "@/backend/lib";
import { CreditService } from "@/backend/services/billing";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import type {
  CreditAdjustmentInput,
  ParentSelectType,
  StudentSelectType,
  TeacherSelectType,
  UserSelectType,
} from "@/backend/types";
import { SystemPermissionGroupSlug } from "@/shared/constants";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import {
  assignSystemGroup,
  expectJourneyError,
  revokeSystemGroupAssignments,
  type SystemGroupAssignment,
  withAuditLogMaintenance,
} from "@/test/workflows/helpers";

/**
 * Adversarial probes against the real credit-adjustment service stack:
 * permission escalation by teacher/parent/student actors, adjustments against
 * removed (soft-deleted) or unknown students/teachers, stored-XSS notes on the
 * write/read roundtrip, and sequential + concurrent double-submit replay.
 *
 * Runs UNWRAPPED from any rollback transaction by design (adjustment services
 * spawn their own top-level transactions); fixtures are committed in
 * beforeAll and hard-deleted in afterAll, including the append-only audit rows
 * the successful adjustments emit (the audit immutability trigger is toggled
 * off for the duration of the sweep, as in the permission-management tests).
 */

interface SecurityCast {
  operatorUser: UserSelectType;
  teacherActorUser: UserSelectType;
  parentActorUser: UserSelectType;
  parentActor: ParentSelectType;
  studentUser: UserSelectType;
  student: StudentSelectType;
  removedStudentUser: UserSelectType;
  removedStudent: StudentSelectType;
  payeeTeacherUser: UserSelectType;
  payeeTeacher: TeacherSelectType;
  removedTeacherUser: UserSelectType;
  removedTeacher: TeacherSelectType;
  groupAssignments: SystemGroupAssignment[];
}

async function provisionSecurityCast(prefix: string): Promise<SecurityCast> {
  return db.transaction(async tx => {
    const operatorUser = await createTestUser(tx, { name: `${prefix} Operator` });
    const teacherActorUser = await createTestUser(tx, { name: `${prefix} Teacher Actor` });
    const parentActorUser = await createTestUser(tx, { name: `${prefix} Parent Actor` });
    const parentActor = await createTestParent(tx, parentActorUser.id);

    const studentUser = await createTestUser(tx, { name: `${prefix} Student` });
    const student = await createTestStudent(tx, parentActor.id, {
      userId: studentUser.id,
      name: `${prefix} Student`,
      classesTotal: 10,
      classesRemaining: 10,
    });

    const removedStudentUser = await createTestUser(tx, { name: `${prefix} Removed Student` });
    const removedStudent = await createTestStudent(tx, parentActor.id, {
      userId: removedStudentUser.id,
      name: `${prefix} Removed Student`,
    });
    await tx.update(users).set({ deletedAt: new Date() }).where(eq(users.id, removedStudentUser.id));

    const payeeTeacherUser = await createTestUser(tx, { name: `${prefix} Payee Teacher` });
    const payeeTeacher = await createTestTeacher(tx, payeeTeacherUser.id);
    const removedTeacherUser = await createTestUser(tx, { name: `${prefix} Removed Teacher` });
    const removedTeacher = await createTestTeacher(tx, removedTeacherUser.id);
    await tx.update(users).set({ deletedAt: new Date() }).where(eq(users.id, removedTeacherUser.id));

    const groupAssignments = [
      await assignSystemGroup(tx, operatorUser.id, SystemPermissionGroupSlug.ACADEMY_ADMIN),
      await assignSystemGroup(tx, teacherActorUser.id, SystemPermissionGroupSlug.TEACHER_DEFAULT),
      await assignSystemGroup(tx, parentActorUser.id, SystemPermissionGroupSlug.PARENT_DEFAULT),
      await assignSystemGroup(tx, studentUser.id, SystemPermissionGroupSlug.STUDENT_DEFAULT),
    ];

    return {
      operatorUser,
      teacherActorUser,
      parentActorUser,
      parentActor,
      studentUser,
      student,
      removedStudentUser,
      removedStudent,
      payeeTeacherUser,
      payeeTeacher,
      removedTeacherUser,
      removedTeacher,
      groupAssignments,
    };
  });
}

async function cleanupSecurityCast(cast: SecurityCast): Promise<void> {
  const studentIds = [cast.student.id, cast.removedStudent.id];
  const teacherIds = [cast.payeeTeacher.id, cast.removedTeacher.id];
  const userIds = [
    cast.operatorUser.id,
    cast.teacherActorUser.id,
    cast.parentActorUser.id,
    cast.studentUser.id,
    cast.removedStudentUser.id,
    cast.payeeTeacherUser.id,
    cast.removedTeacherUser.id,
  ];

  // Committed adjustments produce append-only audit rows referencing the
  // operator as actor; the whole sweep runs in the transaction-scoped audit
  // maintenance window.
  await withAuditLogMaintenance(async tx => {
    await tx.delete(auditLogs).where(eq(auditLogs.actorUserId, cast.operatorUser.id));
    await tx.delete(creditTransactions).where(inArray(creditTransactions.studentId, studentIds));
    await revokeSystemGroupAssignments(tx, cast.groupAssignments);
    await tx.delete(students).where(inArray(students.id, studentIds));
    await tx.delete(parents).where(eq(parents.id, cast.parentActor.id));
    await tx.delete(teachers).where(inArray(teachers.id, teacherIds));
    await tx.delete(users).where(inArray(users.id, userIds));
  });
}

async function ledgerRowCount(studentId: string): Promise<number> {
  const rows = await db
    .select({ id: creditTransactions.id })
    .from(creditTransactions)
    .where(eq(creditTransactions.studentId, studentId));
  return rows.length;
}

async function remainingClasses(studentId: string): Promise<number> {
  const [row] = await db
    .select({ remaining: students.classesRemaining })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);
  return row?.remaining ?? Number.NaN;
}

describe("Credit adjustment security probes (real services, real permission rows)", () => {
  const PREFIX = `wf-csec-${randomUUID().slice(0, 8)}`;

  let tErrors: ErrorsLabels;
  let cast: SecurityCast;
  let dispatchSpy: ReturnType<typeof spyOn>;

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);
    cast = await provisionSecurityCast(PREFIX);
  });

  afterAll(async () => {
    dispatchSpy.mockRestore();
    await cleanupSecurityCast(cast);
  });

  function addInput(overrides: Partial<CreditAdjustmentInput> = {}): CreditAdjustmentInput {
    return {
      studentId: cast.student.id,
      adjustmentType: CreditAdjustmentType.ADD,
      hours: 1,
      notes: `${PREFIX} probe`,
      ...overrides,
    };
  }

  function carryoverInput(overrides: Partial<CreditAdjustmentInput> = {}): CreditAdjustmentInput {
    return {
      studentId: cast.student.id,
      adjustmentType: CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER,
      hours: 1,
      notes: `${PREFIX} carryover probe`,
      carryoverTeacherId: cast.payeeTeacher.id,
      carryoverFromDate: "2026-08-01",
      carryoverToDate: "2026-08-05",
      carryoverPaymentDate: "2026-08-06",
      ...overrides,
    };
  }

  async function ledgerRowsByNote(note: string) {
    return db
      .select()
      .from(creditTransactions)
      .where(and(eq(creditTransactions.studentId, cast.student.id), eq(creditTransactions.notes, note)));
  }

  test("denies teacher, parent, and student actors with real permission rows — zero writes", async () => {
    const intruders = [cast.teacherActorUser.id, cast.parentActorUser.id, cast.studentUser.id];

    const errors = await Promise.all(
      intruders.map(intruderId =>
        expectJourneyError(() => CreditService.recordAdjustment(intruderId, addInput(), tErrors))
      )
    );
    for (const error of errors) {
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toContain(tErrors.insufficientPermissions);
    }

    expect(await ledgerRowCount(cast.student.id)).toBe(0);
    expect(await remainingClasses(cast.student.id)).toBe(10);
  });

  async function assertAdjustmentNotFoundError(
    input: CreditAdjustmentInput,
    expectedCode?: string,
    expectedStudentId = cast.student.id,
    expectedRemaining = 10
  ) {
    const error = await expectJourneyError(() => CreditService.recordAdjustment(cast.operatorUser.id, input, tErrors));
    expect(error).toBeInstanceOf(NotFoundError);
    if (expectedCode && error instanceof NotFoundError) {
      expect(error.code).toBe(expectedCode);
    }
    expect(await ledgerRowCount(expectedStudentId)).toBe(0);
    expect(await remainingClasses(expectedStudentId)).toBe(expectedRemaining);
  }

  test("rejects an adjustment targeting a soft-deleted student with zero writes", async () => {
    await assertAdjustmentNotFoundError(
      addInput({ studentId: cast.removedStudent.id }),
      "STUDENT_NOT_FOUND",
      cast.removedStudent.id,
      0
    );
  });

  test("rejects an adjustment targeting an unknown student id with zero writes", async () => {
    await assertAdjustmentNotFoundError(addInput({ studentId: randomUUID() }));
  });

  test("rejects a carryover whose teacher account is soft-deleted with zero writes", async () => {
    await assertAdjustmentNotFoundError(
      carryoverInput({ carryoverTeacherId: cast.removedTeacher.id }),
      "TEACHER_NOT_FOUND"
    );
  });

  test("rejects a carryover referencing an unknown teacher id with zero writes", async () => {
    await assertAdjustmentNotFoundError(carryoverInput({ carryoverTeacherId: randomUUID() }));
  });

  test("collapses a sequential double-submit onto a single ledger row", async () => {
    const note = `${PREFIX} replay sequential`;
    const balanceBefore = await remainingClasses(cast.student.id);

    const first = await CreditService.recordAdjustment(
      cast.operatorUser.id,
      addInput({ hours: 2, notes: note }),
      tErrors
    );
    const second = await CreditService.recordAdjustment(
      cast.operatorUser.id,
      addInput({ hours: 2, notes: note }),
      tErrors
    );

    expect(second.id).toBe(first.id);
    const rows = await ledgerRowsByNote(note);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.reason).toBe("CREDIT_ADJUSTMENT_ADD");
    expect(await remainingClasses(cast.student.id)).toBe(balanceBefore + 2);
  });

  test("collapses a concurrent double-submit onto a single ledger row with a single balance change", async () => {
    const note = `${PREFIX} replay concurrent`;
    const balanceBefore = await remainingClasses(cast.student.id);

    const [first, second] = await Promise.all([
      CreditService.recordAdjustment(cast.operatorUser.id, addInput({ hours: 3, notes: note }), tErrors),
      CreditService.recordAdjustment(cast.operatorUser.id, addInput({ hours: 3, notes: note }), tErrors),
    ]);

    expect(second.id).toBe(first.id);
    const rows = await ledgerRowsByNote(note);
    expect(rows).toHaveLength(1);
    expect(await remainingClasses(cast.student.id)).toBe(balanceBefore + 3);
  });

  test("persists sanitized notes and serves the sanitized value on transaction-history read-back", async () => {
    const hostileNotes = `<p onclick="trackOp()"><b>${PREFIX} legit reason</b></p><script>alert(1)</script><img src="x" onerror="alert(2)">`;

    const recorded = await CreditService.recordAdjustment(
      cast.operatorUser.id,
      addInput({ notes: hostileNotes }),
      tErrors
    );

    const [row] = await db
      .select({ notes: creditTransactions.notes })
      .from(creditTransactions)
      .where(eq(creditTransactions.id, recorded.id));
    const stored = row?.notes;
    expect(stored).not.toBeNull();
    expect(stored).toContain(`<b>${PREFIX} legit reason</b>`);
    expect(stored).not.toContain("<script");
    expect(stored).not.toContain("onerror");
    expect(stored).not.toContain("onclick");
    expect(stored).not.toContain("alert");

    // The reader surface returns exactly the sanitized value.
    const history = await CreditService.getStudentTransactions(cast.operatorUser.id, cast.student.id, null, tErrors);
    const historyRow = history.rows.find(entry => entry.id === recorded.id);
    expect(historyRow?.notes).toBe(stored);
  });
});
