import { eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import {
  carryoverBalances,
  classCategories,
  classInstances,
  classStatusEvents,
  classSubjects,
  parents,
  students,
  teachers,
  users,
} from "@/backend/db/schema";
import {
  createMockClassInstance,
  createTestParent,
  createTestStudent,
  createTestTeacher,
  createTestUser,
} from "@/backend/db/test/entity-setup";
import { CalculationStatus } from "@/backend/enum";
import type {
  ClassInstanceSelectType,
  ParentSelectType,
  StudentSelectType,
  TeacherSelectType,
  UserSelectType,
} from "@/backend/types";
import { SystemPermissionGroupSlug } from "@/shared/constants";
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { createCastSubjectPair } from "@/test/workflows/helpers/cast-scaffold";
import {
  assignSystemGroup,
  revokeSystemGroupAssignments,
  type SystemGroupAssignment,
} from "@/test/workflows/helpers/permissions";

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

/**
 * One audited session fixture: a terminal TAKEN class instance with a fully
 * resolved payroll snapshot. The audit pre-state of the carryover journey is
 * the fixture itself (migrated-data style, mirroring the payroll cast's
 * unattended terminal row), so no session lifecycle choreography runs here.
 */
interface CarryoverAuditedSession {
  instance: ClassInstanceSelectType;
  teacherId: string;
  amount: string;
}

/**
 * The actor "cast" for the carryover bulk-create journey. Every committed row
 * id created by `provisionCarryoverCreateCast` is tracked here so
 * `cleanupCarryoverCreateCast` can hard-delete the fixture in `afterAll`;
 * carryover rows the service creates during the journey are swept by teacher.
 */
export interface CarryoverCreateCast {
  prefix: string;
  /** Accounting operator — `academy_admin` member (VIEW + MANAGE + REPORTS_VIEW). */
  operatorUser: UserSelectType;
  /** First aggregation target — owns two audited sessions. */
  teacherAUser: UserSelectType;
  teacherA: TeacherSelectType;
  /** Second aggregation target — owns one audited session. */
  teacherBUser: UserSelectType;
  teacherB: TeacherSelectType;
  parentUser: UserSelectType;
  parent: ParentSelectType;
  studentA: StudentSelectType;
  studentB: StudentSelectType;
  /** Audited sessions: two for teacher A (students A and B), one for teacher B (student A). */
  sessions: CarryoverAuditedSession[];
  /**
   * Teacher B session used by the already-linked denial step: an audited row
   * that the journey links to the created carryover directly (legacy/migrated
   * data shape — a link without the WAITING_PAID transition), because every
   * service-created link atomically moves the session off the audited states.
   */
  legacySession: CarryoverAuditedSession;
  groupAssignments: SystemGroupAssignment[];
  createdCategoryId: string;
  createdSubjectId: string;
}

/**
 * Provisions the cast in a single COMMITTING transaction: an academy-admin
 * operator, two SAR-rated teachers, one household (parent + two students),
 * and three audited sessions distributed 2:1 across the teachers. All rows
 * are tracked on the returned cast for `afterAll` hard deletion.
 */
export async function provisionCarryoverCreateCast(prefix: string): Promise<CarryoverCreateCast> {
  return db.transaction(async tx => {
    const now = Date.now();
    const subject = await createCastSubjectPair(tx, prefix);

    const operatorUser = await createTestUser(tx, { name: `${prefix} Operator` });
    const teacherAUser = await createTestUser(tx, { name: `${prefix} Teacher A` });
    const teacherBUser = await createTestUser(tx, { name: `${prefix} Teacher B` });
    const parentUser = await createTestUser(tx, { name: `${prefix} Parent` });

    const teacherA = await createTestTeacher(tx, teacherAUser.id, {
      hourlyRate: "120",
      rateCurrency: CurrencyCode.SAR,
    });
    const teacherB = await createTestTeacher(tx, teacherBUser.id, {
      hourlyRate: "120",
      rateCurrency: CurrencyCode.SAR,
    });
    const parent = await createTestParent(tx, parentUser.id);
    const studentA = await createTestStudent(tx, parent.id, { name: `${prefix} Student A` });
    const studentB = await createTestStudent(tx, parent.id, { name: `${prefix} Student B` });

    async function auditedSession(
      studentId: string,
      teacherId: string,
      amount: string,
      durationMinutes: number,
      daysAgo: number
    ): Promise<CarryoverAuditedSession> {
      const scheduledStart = new Date(now - daysAgo * DAY_MS);
      const scheduledEnd = new Date(scheduledStart.getTime() + durationMinutes * MINUTE_MS);
      const instance = await createMockClassInstance(tx, studentId, teacherId, {
        subjectId: subject.subjectId,
        scheduledStartAt: scheduledStart,
        scheduledEndAt: scheduledEnd,
        durationMinutes,
        executionState: ClassExecutionState.COMPLETED,
        outcome: ClassOutcome.TAKEN,
        actualStartAt: scheduledStart,
        actualEndAt: scheduledEnd,
        calculationStatus: CalculationStatus.CALCULATED,
        calculatedDuration: durationMinutes,
        teacherPaidAmount: amount,
        teacherPaidCurrency: CurrencyCode.SAR,
        payrollCalculatedAt: scheduledEnd,
      });
      return { instance, teacherId, amount };
    }

    const sessions: CarryoverAuditedSession[] = [
      await auditedSession(studentA.id, teacherA.id, "120.00", 60, 2),
      await auditedSession(studentB.id, teacherA.id, "180.00", 90, 3),
      await auditedSession(studentA.id, teacherB.id, "120.00", 60, 4),
    ];
    const legacySession = await auditedSession(studentA.id, teacherB.id, "120.00", 60, 5);

    const groupAssignments = [
      await assignSystemGroup(tx, operatorUser.id, SystemPermissionGroupSlug.ACADEMY_ADMIN),
      await assignSystemGroup(tx, teacherAUser.id, SystemPermissionGroupSlug.TEACHER_DEFAULT),
      await assignSystemGroup(tx, teacherBUser.id, SystemPermissionGroupSlug.TEACHER_DEFAULT),
    ];

    return {
      prefix,
      operatorUser,
      teacherAUser,
      teacherA,
      teacherBUser,
      teacherB,
      parentUser,
      parent,
      studentA,
      studentB,
      sessions,
      legacySession,
      groupAssignments,
      createdCategoryId: subject.categoryId,
      createdSubjectId: subject.subjectId,
    };
  });
}

/**
 * Hard-deletes the full cast in FK-safe order, INCLUDING the rows the service
 * created during the journey: carryover balances (their item snapshots cascade
 * and the linked sessions' link column reverts to NULL via the FK action),
 * payroll transition events, then the instances and the actor hierarchy.
 * Caller order matters: this runs AFTER the journey swept its audit_logs rows
 * (the audit table's immutability trigger lives outside this transaction).
 */
export async function cleanupCarryoverCreateCast(cast: CarryoverCreateCast): Promise<void> {
  const instanceIds = [...cast.sessions.map(session => session.instance.id), cast.legacySession.instance.id];
  await db.transaction(async tx => {
    await tx
      .delete(carryoverBalances)
      .where(inArray(carryoverBalances.teacherId, [cast.teacherA.id, cast.teacherB.id]));
    await tx.delete(classStatusEvents).where(inArray(classStatusEvents.classInstanceId, instanceIds));
    await tx.delete(classInstances).where(inArray(classInstances.id, instanceIds));
    await revokeSystemGroupAssignments(tx, cast.groupAssignments);
    await tx.delete(students).where(inArray(students.id, [cast.studentA.id, cast.studentB.id]));
    await tx.delete(parents).where(eq(parents.id, cast.parent.id));
    await tx.delete(teachers).where(inArray(teachers.id, [cast.teacherA.id, cast.teacherB.id]));
    await tx
      .delete(users)
      .where(inArray(users.id, [cast.operatorUser.id, cast.teacherAUser.id, cast.teacherBUser.id, cast.parentUser.id]));
    await tx.delete(classSubjects).where(eq(classSubjects.id, cast.createdSubjectId));
    await tx.delete(classCategories).where(eq(classCategories.id, cast.createdCategoryId));
  });
}
