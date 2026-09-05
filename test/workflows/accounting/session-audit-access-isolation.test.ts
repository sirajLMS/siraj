import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
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
} from "@/backend/db/test/entity-setup";
import { AppPermission } from "@/backend/enum";
import { ForbiddenError, logger, ValidationError } from "@/backend/lib";
import { requirePermission, SessionAuditService } from "@/backend/services";
import type {
  ClassInstanceSelectType,
  ParentSelectType,
  SessionAuditReportFilters,
  StudentSelectType,
  TeacherSelectType,
  UserSelectType,
} from "@/backend/types";
import { SystemPermissionGroupSlug } from "@/shared/constants";
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import {
  assignSystemGroup,
  createCastSubjectPair,
  expectJourneyError,
  revokeSystemGroupAssignments,
  type SystemGroupAssignment,
} from "@/test/workflows/helpers";

/** Row count the CSV export route reads at once; past it the route flags truncation. */
const EXPORT_LIMIT = 10_000;

const DAY_ONE = "2026-08-10";
const DAY_TWO = "2026-08-11";

/** The structured-log message emitted by every successful report read. */
const REPORT_LOG_MESSAGE = "Session audit report query";

/**
 * The actor cast for the session-audit access-isolation journey: one
 * accounting operator (academy_admin — VIEW + MANAGE per the permission
 * catalog grants), two teachers and two students whose sessions form a
 * filterable matrix, and four committed class instances:
 *  - takenInstance: teacher A + student A, completed with attendance → "end"
 *  - absentInstance: teacher A + student A, completed without a join → "Absent"
 *  - studentBInstance: teacher A + student B, completed → "end" (day two)
 *  - teacherBInstance: teacher B + student A, completed → "end"
 */
interface SessionAuditJourneyCast {
  prefix: string;
  operatorUser: UserSelectType;
  teacherAUser: UserSelectType;
  teacherA: TeacherSelectType;
  teacherBUser: UserSelectType;
  teacherB: TeacherSelectType;
  parentUser: UserSelectType;
  parent: ParentSelectType;
  studentA: StudentSelectType;
  studentB: StudentSelectType;
  takenInstance: ClassInstanceSelectType;
  absentInstance: ClassInstanceSelectType;
  studentBInstance: ClassInstanceSelectType;
  teacherBInstance: ClassInstanceSelectType;
  groupAssignments: SystemGroupAssignment[];
  subjectId: string;
  categoryId: string;
}

function completedSession(scheduledStart: string): Partial<typeof classInstances.$inferInsert> {
  const start = new Date(scheduledStart);
  return {
    scheduledStartAt: start,
    scheduledEndAt: new Date(start.getTime() + 60 * 60 * 1000),
    durationMinutes: 60,
    executionState: ClassExecutionState.COMPLETED,
    outcome: ClassOutcome.TAKEN,
    actualStartAt: new Date(start.getTime() + 2 * 60 * 1000),
    actualEndAt: new Date(start.getTime() + 60 * 60 * 1000),
  };
}

/**
 * Provisions the cast in a single COMMITTING transaction. Group memberships
 * are real `user_permission_groups` rows against system groups, so every
 * permission outcome in the journey resolves honestly.
 */
async function provisionSessionAuditCast(prefix: string): Promise<SessionAuditJourneyCast> {
  return db.transaction(async tx => {
    const subject = await createCastSubjectPair(tx, prefix);
    const operatorUser = await createTestUser(tx, { name: `${prefix} Operator` });
    const teacherAUser = await createTestUser(tx, { name: `${prefix} Teacher A` });
    const teacherBUser = await createTestUser(tx, { name: `${prefix} Teacher B` });
    const parentUser = await createTestUser(tx, { name: `${prefix} Parent` });

    const teacherA = await createTestTeacher(tx, teacherAUser.id);
    const teacherB = await createTestTeacher(tx, teacherBUser.id);
    const parent = await createTestParent(tx, parentUser.id);
    const studentA = await createTestStudent(tx, parent.id, { name: `${prefix} Student A` });
    const studentB = await createTestStudent(tx, parent.id, { name: `${prefix} Student B` });

    const base = { subjectId: subject.subjectId };
    const takenInstance = await createMockClassInstance(tx, studentA.id, teacherA.id, {
      ...base,
      ...completedSession(`${DAY_ONE}T10:00:00.000Z`),
    });
    // Historical completed row with no attendance write: teacher absence.
    const absentInstance = await createMockClassInstance(tx, studentA.id, teacherA.id, {
      ...base,
      scheduledStartAt: new Date(`${DAY_ONE}T12:00:00.000Z`),
      scheduledEndAt: new Date(`${DAY_ONE}T13:00:00.000Z`),
      durationMinutes: 60,
      executionState: ClassExecutionState.COMPLETED,
      outcome: ClassOutcome.ABSENT,
    });
    const studentBInstance = await createMockClassInstance(tx, studentB.id, teacherA.id, {
      ...base,
      ...completedSession(`${DAY_TWO}T10:00:00.000Z`),
    });
    const teacherBInstance = await createMockClassInstance(tx, studentA.id, teacherB.id, {
      ...base,
      ...completedSession(`${DAY_ONE}T14:00:00.000Z`),
    });

    const groupAssignments = [
      await assignSystemGroup(tx, operatorUser.id, SystemPermissionGroupSlug.ACADEMY_ADMIN),
      await assignSystemGroup(tx, teacherAUser.id, SystemPermissionGroupSlug.TEACHER_DEFAULT),
      await assignSystemGroup(tx, teacherBUser.id, SystemPermissionGroupSlug.TEACHER_DEFAULT),
      await assignSystemGroup(tx, studentA.userId, SystemPermissionGroupSlug.STUDENT_DEFAULT),
      await assignSystemGroup(tx, studentB.userId, SystemPermissionGroupSlug.STUDENT_DEFAULT),
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
      takenInstance,
      absentInstance,
      studentBInstance,
      teacherBInstance,
      groupAssignments,
      subjectId: subject.subjectId,
      categoryId: subject.categoryId,
    };
  });
}

/**
 * Hard-deletes the cast in FK-safe order, including side-effect rows that
 * could hang off the class instances (status events, lesson reports, teacher
 * dues, credit ledger rows). Read-only as this journey is, the deletes keep
 * the fixture fully self-cleaning against future edits.
 */
async function cleanupSessionAuditCast(cast: SessionAuditJourneyCast): Promise<void> {
  const instanceIds = [
    cast.takenInstance.id,
    cast.absentInstance.id,
    cast.studentBInstance.id,
    cast.teacherBInstance.id,
  ];
  const studentIds = [cast.studentA.id, cast.studentB.id];
  await db.transaction(async tx => {
    await tx.delete(classStatusEvents).where(inArray(classStatusEvents.classInstanceId, instanceIds));
    await tx.delete(lessonReports).where(inArray(lessonReports.classInstanceId, instanceIds));
    await tx.delete(teacherDues).where(inArray(teacherDues.classInstanceId, instanceIds));
    await tx.delete(creditTransactions).where(inArray(creditTransactions.studentId, studentIds));
    await revokeSystemGroupAssignments(tx, cast.groupAssignments);
    await tx.delete(classInstances).where(inArray(classInstances.id, instanceIds));
    await tx.delete(students).where(inArray(students.id, studentIds));
    await tx.delete(parents).where(eq(parents.id, cast.parent.id));
    await tx.delete(teachers).where(inArray(teachers.id, [cast.teacherA.id, cast.teacherB.id]));
    await tx
      .delete(users)
      .where(
        inArray(users.id, [
          cast.operatorUser.id,
          cast.teacherAUser.id,
          cast.teacherBUser.id,
          cast.parentUser.id,
          cast.studentA.userId,
          cast.studentB.userId,
        ])
      );
    await tx.delete(classSubjects).where(eq(classSubjects.id, cast.subjectId));
    await tx.delete(classCategories).where(eq(classCategories.id, cast.categoryId));
  });
}

/** All class-instance ids created by this run. */
function castInstanceIds(cast: SessionAuditJourneyCast): string[] {
  return [cast.takenInstance.id, cast.absentInstance.id, cast.studentBInstance.id, cast.teacherBInstance.id];
}

/**
 * The columns a read-only report must never move, frozen as comparable
 * primitives so a before/after diff catches any write — including one that
 * only touched a timestamp.
 */
function projectInstanceState(row: ClassInstanceSelectType): string[] {
  return [
    row.executionState,
    row.outcome ?? "null",
    row.actualStartAt?.toISOString() ?? "null",
    row.actualEndAt?.toISOString() ?? "null",
    row.updatedAt.toISOString(),
  ];
}

/**
 * Access-isolation journey: an accounting operator reads the session audit
 * report scoped to one teacher and observes exactly that teacher's rows; the
 * same teacher/student actors are denied the report outright — even when
 * filtering by their own ids — because the permission check precedes every
 * read. Each successful read emits the structured audit log line, and the
 * export-shaped call carries the totalCount the CSV route's truncation
 * header depends on.
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): fixtures are committed in beforeAll and
 * hard-deleted in afterAll via the cast helpers.
 *
 * Layer note: the CSV export route's HTTP-level surface (401 without a
 * session, 403 without the view permission, the X-Export-Truncated header on
 * a live 10 001-row count) is asserted in `app/api/accounting/reports/export/
 * route.test.ts`; this journey exercises the service-level contract the route
 * is built on — the same permission gate and the same limit-10 000 read —
 * because a journey has no HTTP layer to reach the route through.
 */
describe("Session audit access isolation journey (operator scoping + actor denials)", () => {
  const PREFIX = `jrn_saiso_${randomUUID().slice(0, 8)}`;

  let tErrors: ErrorsLabels;
  let cast: SessionAuditJourneyCast;
  let logSpy: ReturnType<typeof spyOn>;

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    cast = await provisionSessionAuditCast(PREFIX);
    logSpy = spyOn(logger, "info").mockImplementation(() => {});
  });

  afterAll(async () => {
    logSpy.mockRestore();
    await cleanupSessionAuditCast(cast);
  });

  test("step 1 — operator filtering by teacher A receives exactly teacher A's rows", async () => {
    const page = await SessionAuditService.getReport(
      cast.operatorUser.id,
      { teacherId: cast.teacherA.id, dateFrom: DAY_ONE, dateTo: DAY_TWO },
      null,
      { limit: 50, offset: 0 },
      tErrors
    );

    expect(page.totalCount).toBe(3);
    expect(page.rows.map(row => row.instanceId).toSorted((a, b) => a.localeCompare(b))).toEqual(
      [cast.takenInstance.id, cast.absentInstance.id, cast.studentBInstance.id].toSorted((a, b) => a.localeCompare(b))
    );
    expect(page.rows.every(row => row.teacherId === cast.teacherA.id)).toBe(true);
    expect(page.rows.every(row => row.teacherName === cast.teacherAUser.name)).toBe(true);
    // Teacher B's instance and no foreign rows leak into the scoped slice.
    expect(page.rows.some(row => row.instanceId === cast.teacherBInstance.id)).toBe(false);

    expect(page.aggregates.rowCountByStatus).toEqual({ open: 0, end: 2, Absent: 1, absent_student: 0 });
    expect(page.aggregates.rowCountByPaid).toEqual({ paid: 0, unpaid: 3 });
    expect(page.aggregates.totalPaidAmount).toBe("0.00");
    expect(page.aggregates.totalPaidCurrency).toBe(CurrencyCode.SAR);
  });

  test("step 2 — student, status, and date filters narrow the teacher-scoped slice", async () => {
    const byStudent = await SessionAuditService.getReport(
      cast.operatorUser.id,
      { teacherId: cast.teacherA.id, studentId: cast.studentB.id, dateFrom: DAY_ONE, dateTo: DAY_TWO },
      null,
      { limit: 50, offset: 0 },
      tErrors
    );
    expect(byStudent.totalCount).toBe(1);
    expect(byStudent.rows.map(row => row.instanceId)).toEqual([cast.studentBInstance.id]);

    const byStatus = await SessionAuditService.getReport(
      cast.operatorUser.id,
      { teacherId: cast.teacherA.id, currentStatuses: ["Absent"], dateFrom: DAY_ONE, dateTo: DAY_TWO },
      null,
      { limit: 50, offset: 0 },
      tErrors
    );
    expect(byStatus.totalCount).toBe(1);
    expect(byStatus.rows.map(row => row.instanceId)).toEqual([cast.absentInstance.id]);
    expect(byStatus.rows[0]?.currentStatus).toBe("Absent");

    const byDate = await SessionAuditService.getReport(
      cast.operatorUser.id,
      { teacherId: cast.teacherA.id, dateFrom: DAY_TWO, dateTo: DAY_TWO },
      null,
      { limit: 50, offset: 0 },
      tErrors
    );
    expect(byDate.totalCount).toBe(1);
    expect(byDate.rows.map(row => row.instanceId)).toEqual([cast.studentBInstance.id]);
  });

  test("step 3 — the default sort is scheduled start, newest first", async () => {
    const page = await SessionAuditService.getReport(
      cast.operatorUser.id,
      { teacherId: cast.teacherA.id, dateFrom: DAY_ONE, dateTo: DAY_TWO },
      null,
      { limit: 50, offset: 0 },
      tErrors
    );
    expect(page.rows.map(row => row.instanceId)).toEqual([
      cast.studentBInstance.id,
      cast.absentInstance.id,
      cast.takenInstance.id,
    ]);
  });

  test("step 4 — every successful read emits the structured log with actorUserId and filters", async () => {
    logSpy.mockClear();
    // Pin the fixture window explicitly: the service resolves an empty window
    // to the default last-30-days range and logs the resolved filters, so an
    // unbounded filter object would not survive the identity assertion below.
    const filters: SessionAuditReportFilters = {
      teacherId: cast.teacherA.id,
      studentId: cast.studentB.id,
      dateFrom: DAY_ONE,
      dateTo: DAY_TWO,
    };
    await SessionAuditService.getReport(cast.operatorUser.id, filters, null, { limit: 25, offset: 0 }, tErrors);

    expect(logSpy).toHaveBeenCalledWith(
      REPORT_LOG_MESSAGE,
      expect.objectContaining({
        actorUserId: cast.operatorUser.id,
        filters,
        limit: 25,
        offset: 0,
        rowCount: 1,
      })
    );
  });

  test("step 5 — the export-shaped read carries the totalCount the truncation header encodes", async () => {
    // The route issues this call shape (limit 10 000, offset 0) and sets
    // X-Export-Truncated from totalCount > 10 000; here the invariant is
    // proven against real rows. The fixture window is pinned explicitly so the
    // count survives the service's default last-30-days resolution.
    const page = await SessionAuditService.getReport(
      cast.operatorUser.id,
      { dateFrom: DAY_ONE, dateTo: DAY_TWO },
      null,
      { limit: EXPORT_LIMIT, offset: 0 },
      tErrors
    );

    expect(page.rows.length).toBeLessThanOrEqual(EXPORT_LIMIT);
    expect(page.totalCount).toBeGreaterThanOrEqual(page.rows.length);
    expect(page.totalCount).toBeGreaterThanOrEqual(castInstanceIds(cast).length);
    // With limit 10 000 and offset 0, rows.length === min(10 000, totalCount):
    // the header's "truncated" flag is equivalent to the CSV body omitting rows.
    const truncated = page.totalCount > EXPORT_LIMIT;
    expect(truncated).toBe(page.rows.length < page.totalCount);
  });

  test("step 6 — teacher and student actors are denied before any read or log, even for their own ids", async () => {
    logSpy.mockClear();

    const denialCases: { actorUserId: string; filters: SessionAuditReportFilters }[] = [
      // Teacher filtering by their OWN id: denial precedes data scoping.
      { actorUserId: cast.teacherAUser.id, filters: { teacherId: cast.teacherA.id } },
      // Teacher reaching for another teacher's slice.
      { actorUserId: cast.teacherBUser.id, filters: { teacherId: cast.teacherA.id } },
      // Student filtering by their OWN id: denial precedes data scoping.
      { actorUserId: cast.studentA.userId, filters: { studentId: cast.studentA.id } },
    ];
    const errors = await Promise.all(
      denialCases.map(denial =>
        expectJourneyError(() =>
          SessionAuditService.getReport(denial.actorUserId, denial.filters, null, { limit: 50, offset: 0 }, tErrors)
        )
      )
    );
    for (const error of errors) {
      expect(error).toBeInstanceOf(ForbiddenError);
      if (error instanceof ForbiddenError) {
        expect(error.code).toBe("FORBIDDEN");
      }
      expect(error.message).toContain(tErrors.insufficientPermissions);
    }

    // The CSV route runs the same gate after session resolution; denied actors
    // never reach the read here either.
    const gateErrors = await Promise.all(
      denialCases.map(denial =>
        expectJourneyError(() => requirePermission(denial.actorUserId, AppPermission.ACCOUNTING_REPORTS_VIEW, tErrors))
      )
    );
    for (const error of gateErrors) {
      expect(error).toBeInstanceOf(ForbiddenError);
    }

    // Permission denial precedes even input validation: a reversed date range
    // still surfaces as FORBIDDEN for an unauthorized actor.
    const reversedRangeError = await expectJourneyError(() =>
      SessionAuditService.getReport(
        cast.teacherAUser.id,
        { dateFrom: DAY_TWO, dateTo: DAY_ONE },
        null,
        { limit: 50, offset: 0 },
        tErrors
      )
    );
    expect(reversedRangeError).toBeInstanceOf(ForbiddenError);

    // The authorized operator instead receives the INVALID_DATE_RANGE
    // validation error that the export route maps to a 400.
    const validationError = await expectJourneyError(() =>
      SessionAuditService.getReport(
        cast.operatorUser.id,
        { dateFrom: DAY_TWO, dateTo: DAY_ONE },
        null,
        { limit: 50, offset: 0 },
        tErrors
      )
    );
    expect(validationError).toBeInstanceOf(ValidationError);
    if (validationError instanceof ValidationError) {
      expect(validationError.code).toBe("INVALID_DATE_RANGE");
    }

    // No denied or invalid call produced a structured report-query log line.
    const firedReportLogs = logSpy.mock.calls.filter((args: unknown[]) => args[0] === REPORT_LOG_MESSAGE);
    expect(firedReportLogs).toHaveLength(0);
  });

  test("step 7 — every audit read is side-effect free: instance rows are byte-identical", async () => {
    const rows = await db
      .select()
      .from(classInstances)
      .where(inArray(classInstances.id, castInstanceIds(cast)));
    expect(rows).toHaveLength(4);

    const expectedById = new Map(
      castInstanceIds(cast).map(instanceId => {
        const fixture = [cast.takenInstance, cast.absentInstance, cast.studentBInstance, cast.teacherBInstance].find(
          instance => instance.id === instanceId
        );
        if (!fixture) throw new Error(`fixture for instance ${instanceId} missing`);
        return [instanceId, projectInstanceState(fixture)] as const;
      })
    );
    for (const row of rows) {
      const expected = expectedById.get(row.id);
      if (!expected) throw new Error(`unexpected class instance ${row.id} in cast read-back`);
      expect(projectInstanceState(row)).toEqual(expected);
    }
  });
});
