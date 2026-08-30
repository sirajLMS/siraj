import { eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import {
  classCategories,
  classInstances,
  classStatusEvents,
  classSubjects,
  creditTransactions,
  lessonReports,
  parents,
  students,
  teacherDues,
  teachers,
  users,
} from "@/backend/db/schema";
import {
  createMockClassInstance,
  createTestParent,
  createTestStudent,
  createTestTeacher,
  createTestUser,
  type TestDb,
} from "@/backend/db/test/entity-setup";
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
import {
  assignSystemGroup,
  revokeSystemGroupAssignments,
  type SystemGroupAssignment,
} from "@/test/workflows/helpers/permissions";

/** Hourly rate pinned on the cast teacher so every payroll amount is derivable: 60-minute sessions pay exactly 120.00 SAR. */
const TEACHER_HOURLY_RATE = "120";

const MINUTE_MS = 60 * 1000;

/**
 * The actor "cast" for payroll journeys. Every actor resolves permissions
 * through real `user_permission_groups` rows (system groups assigned to the
 * run's own users): the operator holds `academy_admin` (payroll
 * view/manage plus the session override actions), the teacher holds
 * `teacher_default` (activate/start their own sessions), the student holds
 * `student_default` (own dashboard), and the parent is intentionally
 * permissionless beyond its own profile so denial paths resolve honestly.
 */
export interface PayrollJourneyCast {
  prefix: string;
  /** Accounting operator — academy_admin system group. */
  operatorUser: UserSelectType;
  /** Teaching actor — teacher_default system group; drives attendance telemetry. */
  teacherUser: UserSelectType;
  teacher: TeacherSelectType;
  parentUser: UserSelectType;
  parent: ParentSelectType;
  student: StudentSelectType;
  /** Session scheduled around "now": the teacher activates, joins on time, and the operator stops it. */
  onTimeInstance: ClassInstanceSelectType;
  /** Session scheduled three hours in the past: activated via override and resolved as student-absent. */
  studentAbsentInstance: ClassInstanceSelectType;
  /** Session scheduled a day in the past: force-stopped with no attendance telemetry at all. */
  unattendedInstance: ClassInstanceSelectType;
  groupAssignments: SystemGroupAssignment[];
  /** Category/subject rows created for this run (fresh rows keep the rate cascade deterministic). */
  createdCategoryId: string;
  createdSubjectId: string;
}

/**
 * Creates a run-prefixed category + subject with no hourly rate, so the rate
 * cascade for cast instances deterministically falls through to the teacher
 * tier. Reusing an arbitrary existing subject would let its subject-level
 * rate silently change every expected amount.
 */
async function createCastSubject(tx: TestDb, prefix: string): Promise<{ subjectId: string; categoryId: string }> {
  const now = new Date();
  const [category] = await tx
    .insert(classCategories)
    .values({
      name: `${prefix} Category`,
      slug: `${prefix}-category`,
      isActive: true,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: classCategories.id });
  if (!category) {
    throw new Error("Payroll cast: failed to create class category");
  }

  const [subject] = await tx
    .insert(classSubjects)
    .values({
      categoryId: category.id,
      name: `${prefix} Subject`,
      slug: `${prefix}-subject`,
      isActive: true,
      sortOrder: 0,
    })
    .returning({ id: classSubjects.id });
  if (!subject) {
    throw new Error("Payroll cast: failed to create class subject");
  }

  return { subjectId: subject.id, categoryId: category.id };
}

/**
 * Provisions the full payroll cast in a single COMMITTING transaction:
 * operator, teacher (hourly rate SAR 120), parent, student, and three
 * 60-minute class instances whose scheduling windows predetermine the payroll
 * branch each will land in: two are driven to a terminal execution state by
 * the journey's state-machine calls, while the unattended row is created
 * already terminal (migrated data predating attendance telemetry). All rows
 * are tracked on the returned cast for `afterAll` hard deletion via
 * `cleanupPayrollJourneyCast`.
 */
export async function provisionPayrollJourneyCast(prefix: string): Promise<PayrollJourneyCast> {
  return db.transaction(async tx => {
    const now = new Date();
    const subject = await createCastSubject(tx, prefix);

    const operatorUser = await createTestUser(tx, { name: `${prefix} Operator` });
    const teacherUser = await createTestUser(tx, { name: `${prefix} Teacher` });
    const parentUser = await createTestUser(tx, { name: `${prefix} Parent` });

    const teacher = await createTestTeacher(tx, teacherUser.id, {
      hourlyRate: TEACHER_HOURLY_RATE,
      rateCurrency: CurrencyCode.SAR,
    });
    const parent = await createTestParent(tx, parentUser.id);
    const student = await createTestStudent(tx, parent.id, { name: `${prefix} Student` });

    const instanceOverrides = {
      subjectId: subject.subjectId,
      durationMinutes: 60,
    };
    const onTimeInstance = await createMockClassInstance(tx, student.id, teacher.id, {
      ...instanceOverrides,
      scheduledStartAt: new Date(now.getTime() - 2 * MINUTE_MS),
      scheduledEndAt: new Date(now.getTime() + 58 * MINUTE_MS),
    });
    const studentAbsentInstance = await createMockClassInstance(tx, student.id, teacher.id, {
      ...instanceOverrides,
      scheduledStartAt: new Date(now.getTime() - 180 * MINUTE_MS),
      scheduledEndAt: new Date(now.getTime() - 120 * MINUTE_MS),
    });
    const unattendedInstance = await createMockClassInstance(tx, student.id, teacher.id, {
      ...instanceOverrides,
      scheduledStartAt: new Date(now.getTime() - 1440 * MINUTE_MS),
      scheduledEndAt: new Date(now.getTime() - 1380 * MINUTE_MS),
      // Historical terminal row: a completed session migrated from a system
      // that predates attendance telemetry — no actualStartAt, outcome
      // ABSENT (the state-machine CHECK forbids COMPLETED rows with a PENDING
      // outcome). The live state machine has no path to it; only operator
      // reconciliation can settle its payroll snapshot.
      executionState: ClassExecutionState.COMPLETED,
      outcome: ClassOutcome.ABSENT,
    });

    const groupAssignments = [
      await assignSystemGroup(tx, operatorUser.id, SystemPermissionGroupSlug.ACADEMY_ADMIN),
      await assignSystemGroup(tx, teacherUser.id, SystemPermissionGroupSlug.TEACHER_DEFAULT),
      await assignSystemGroup(tx, student.userId, SystemPermissionGroupSlug.STUDENT_DEFAULT),
    ];

    return {
      prefix,
      operatorUser,
      teacherUser,
      teacher,
      parentUser,
      parent,
      student,
      onTimeInstance,
      studentAbsentInstance,
      unattendedInstance,
      groupAssignments,
      createdCategoryId: subject.categoryId,
      createdSubjectId: subject.subjectId,
    };
  });
}

/**
 * Hard-deletes the full cast in FK-safe order, INCLUDING side-effect rows the
 * services create during the journey (class status events — lifecycle AND
 * payroll audit rows — lesson reports, teacher dues, credit ledger rows).
 * System permission groups themselves are untouched; only this run's
 * membership rows are revoked.
 */
export async function cleanupPayrollJourneyCast(cast: PayrollJourneyCast): Promise<void> {
  const instanceIds = [cast.onTimeInstance.id, cast.studentAbsentInstance.id, cast.unattendedInstance.id];
  const userIds = [cast.operatorUser.id, cast.teacherUser.id, cast.parentUser.id, cast.student.userId];

  await db.transaction(async tx => {
    await tx.delete(classStatusEvents).where(inArray(classStatusEvents.classInstanceId, instanceIds));
    await tx.delete(lessonReports).where(inArray(lessonReports.classInstanceId, instanceIds));
    await tx.delete(teacherDues).where(inArray(teacherDues.classInstanceId, instanceIds));
    await tx.delete(creditTransactions).where(eq(creditTransactions.studentId, cast.student.id));
    await revokeSystemGroupAssignments(tx, cast.groupAssignments);
    await tx.delete(classInstances).where(inArray(classInstances.id, instanceIds));
    await tx.delete(students).where(eq(students.id, cast.student.id));
    await tx.delete(parents).where(eq(parents.id, cast.parent.id));
    await tx.delete(teachers).where(eq(teachers.id, cast.teacher.id));
    await tx.delete(users).where(inArray(users.id, userIds));
    await tx.delete(classSubjects).where(eq(classSubjects.id, cast.createdSubjectId));
    await tx.delete(classCategories).where(eq(classCategories.id, cast.createdCategoryId));
  });
}
