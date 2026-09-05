import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { classInstances, teachers, users } from "@/backend/db/schema";
import { createMockClassInstance, createTestTeacher, createTestUser } from "@/backend/db/test/entity-setup";
import { CalculationStatus } from "@/backend/enum";
import { ForbiddenError } from "@/backend/lib";
import { SessionAuditService } from "@/backend/services/accounting";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import { ClassSessionService } from "@/backend/services/session/class-session.service";
import type {
  ClassInstanceSelectType,
  SessionAuditReportFilters,
  SessionAuditReportPage,
  SessionAuditReportRow,
  TeacherSelectType,
  UserSelectType,
} from "@/backend/types";
import { SystemPermissionGroupSlug } from "@/shared/constants";
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import { mapToSessionAuditStatus, type SessionAuditStatus } from "@/shared/constants/classes/session-audit-status";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { parseClassExecutionState, parseClassOutcome } from "@/shared/lib/enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import {
  assignSystemGroup,
  cleanupPayrollJourneyCast,
  type DispatchSpy,
  expectJourneyError,
  type PayrollJourneyCast,
  provisionPayrollJourneyCast,
  revokeSystemGroupAssignments,
  type SystemGroupAssignment,
} from "@/test/workflows/helpers";

const FULL_SESSION_PAY = "120.00";
const REPORT_PAGE = { limit: 50, offset: 0 };

/** Keys that must never surface on teacher- or student-facing class-detail payloads. */
const ACCOUNTING_ONLY_KEYS = ["calculationStatus", "teacherPaidAmount", "teacherPaidCurrency", "payrollNote"];

/** Reads the live class-instance row so assertions run against committed state, not service return values. */
async function readRawInstance(instanceId: string): Promise<ClassInstanceSelectType> {
  const [row] = await db.select().from(classInstances).where(eq(classInstances.id, instanceId)).limit(1);
  if (!row) {
    throw new Error(`class instance ${instanceId} disappeared before it could be read`);
  }
  return row;
}

/**
 * Cross-actor journey: session lifecycle telemetry on `class_instances`
 * (activate → join → stop / never-joined absence) read back through the
 * accounting-only `SessionAuditService.getReport` grid. The shared
 * `mapToSessionAuditStatus` rule is asserted against the committed row for
 * every transition, a second teacher's rows prove scoped-filter isolation,
 * actors without `ACCOUNTING_REPORTS_VIEW` are rejected with FORBIDDEN,
 * session-audit reads never trigger notification dispatch, and the
 * teacher/student-facing class-detail surfaces stay payroll-blind even after
 * the terminal stop surfaces the auto-calculated payroll snapshot.
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): services spawn their own committed transactions
 * over the global `db`, so fixtures commit in beforeAll and are hard-deleted
 * in afterAll via the cast helpers.
 */
describe("Session lifecycle → session-audit grid journey", () => {
  const PREFIX = `jrn_saud_${randomUUID().slice(0, 8)}`;

  let tErrors: ErrorsLabels;
  let tSession: ReturnType<typeof getServerTranslations>["sessionTranslations"];
  let cast: PayrollJourneyCast;
  let dispatchSpy: DispatchSpy;

  // Rows this suite adds on top of the payroll cast, all tracked for afterAll.
  let secondTeacherUser: UserSelectType;
  let secondTeacher: TeacherSelectType;
  let secondTeacherAssignment: SystemGroupAssignment;
  /** Second teacher's untouched, never-activated session — the cross-actor isolation probe. */
  let otherTeacherInstance: ClassInstanceSelectType;

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    tSession = getServerTranslations("en").sessionTranslations;
    // Interception boundary for ALL notification dispatch the journey fires
    // (activation/start/stop/absent fan-outs); report reads must never reach it.
    dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);
    cast = await provisionPayrollJourneyCast(PREFIX);

    await db.transaction(async tx => {
      const now = new Date();
      secondTeacherUser = await createTestUser(tx, { name: `${PREFIX} Second Teacher` });
      secondTeacher = await createTestTeacher(tx, secondTeacherUser.id);
      secondTeacherAssignment = await assignSystemGroup(
        tx,
        secondTeacherUser.id,
        SystemPermissionGroupSlug.TEACHER_DEFAULT
      );

      // The second teacher's session stays untouched for the whole journey.
      otherTeacherInstance = await createMockClassInstance(tx, cast.student.id, secondTeacher.id, {
        subjectId: cast.createdSubjectId,
        durationMinutes: 60,
        scheduledStartAt: new Date(now.getTime() - 480 * 60_000),
        scheduledEndAt: new Date(now.getTime() - 420 * 60_000),
      });
    });
  });

  afterAll(async () => {
    dispatchSpy.mockRestore();
    await db.delete(classInstances).where(eq(classInstances.id, otherTeacherInstance.id));
    await revokeSystemGroupAssignments(db, [secondTeacherAssignment]);
    await db.delete(teachers).where(eq(teachers.id, secondTeacher.id));
    await db.delete(users).where(eq(users.id, secondTeacherUser.id));
    await cleanupPayrollJourneyCast(cast);
  });

  async function readReportPage(filters: SessionAuditReportFilters): Promise<SessionAuditReportPage> {
    return SessionAuditService.getReport(cast.operatorUser.id, filters, null, REPORT_PAGE, tErrors);
  }

  async function readReportRow(
    instanceId: string,
    teacherId: string,
    extraFilters: SessionAuditReportFilters = {}
  ): Promise<SessionAuditReportRow> {
    const page = await readReportPage({ ...extraFilters, teacherId });
    const row = page.rows.find(candidate => candidate.instanceId === instanceId);
    if (!row) {
      throw new Error(`session audit row for ${instanceId} not found in the operator's page`);
    }
    return row;
  }

  /**
   * The grid status must equal the shared mapper's verdict for the committed
   * row, not just the expected literal: the predicate and the mapper are the
   * same rule, so this pins both against the live database state.
   */
  async function expectStatusFromMapper(
    instanceId: string,
    teacherId: string,
    expected: SessionAuditStatus
  ): Promise<{ raw: ClassInstanceSelectType; reportRow: SessionAuditReportRow }> {
    const raw = await readRawInstance(instanceId);
    const mapped = mapToSessionAuditStatus(
      parseClassExecutionState(raw.executionState),
      parseClassOutcome(raw.outcome),
      raw.actualStartAt
    );
    expect(mapped).toBe(expected);
    const reportRow = await readReportRow(instanceId, teacherId);
    expect(reportRow.currentStatus).toBe(mapped);
    return { raw, reportRow };
  }

  test("step 1 — untouched sessions read as open with null attendance and null payroll snapshot", async () => {
    const reportRow = await readReportRow(cast.onTimeInstance.id, cast.teacher.id);
    expect(reportRow.currentStatus).toBe("open");
    expect(reportRow.actualStartAt).toBeNull();
    expect(reportRow.actualEndAt).toBeNull();
    expect(reportRow.teacherId).toBe(cast.teacher.id);
    expect(reportRow.studentId).toBe(cast.student.id);
    // Graceful degradation: no payroll calculation has ever run, so the
    // accounting-only payroll columns carry their pre-calculation values
    // (NOT_CALCULATED default, null amounts/note) rather than fabricated data.
    expect(reportRow.calculationStatus).toBe(CalculationStatus.NOT_CALCULATED);
    expect(reportRow.teacherPaidAmount).toBeNull();
    expect(reportRow.payrollNote).toBeNull();
  });

  test("step 2 — teacher activates and joins: RUNNING with actual_start_at still reads as open", async () => {
    await ClassSessionService.activate(cast.teacherUser.id, cast.onTimeInstance.id, tErrors);
    await ClassSessionService.updateStatusStart(cast.teacherUser.id, cast.onTimeInstance.id, tErrors);

    const { raw, reportRow } = await expectStatusFromMapper(cast.onTimeInstance.id, cast.teacher.id, "open");
    expect(raw.executionState).toBe(ClassExecutionState.RUNNING);
    expect(raw.actualStartAt).not.toBeNull();
    expect(raw.actualEndAt).toBeNull();
    expect(reportRow.actualStartAt).not.toBeNull();
  });

  test("step 3 — terminal stop resolves end and surfaces the auto-calculated payroll snapshot", async () => {
    await ClassSessionService.stop(cast.operatorUser.id, cast.onTimeInstance.id, tErrors);

    const { raw, reportRow } = await expectStatusFromMapper(cast.onTimeInstance.id, cast.teacher.id, "end");
    expect(raw.outcome).toBe(ClassOutcome.TAKEN);
    expect(raw.actualEndAt).not.toBeNull();
    // Side effect of the terminal transition: the payroll snapshot commits on
    // the same row the audit grid reads (60-minute session at SAR 120/hour).
    expect(reportRow.actualEndAt).not.toBeNull();
    expect(reportRow.calculationStatus).toBe(CalculationStatus.CALCULATED);
    expect(reportRow.teacherPaidAmount).toBe(FULL_SESSION_PAY);
    expect(reportRow.teacherPaidCurrency).toBe(CurrencyCode.SAR);
    expect(reportRow.calculatedDuration).not.toBeNull();
  });

  test("step 4 — service-driven absence stamps a start, so the live branch lands absent_student", async () => {
    await ClassSessionService.activateOverride(cast.operatorUser.id, cast.studentAbsentInstance.id, tErrors);
    await ClassSessionService.updateStatusAbsent(cast.operatorUser.id, cast.studentAbsentInstance.id, tErrors);

    // The live state machine stamps actual_start_at (existing ?? now) when a
    // class is marked absent, so the COMPLETED + ABSENT row the service just
    // produced satisfies the mapper's joined-but-absent branch.
    const { raw, reportRow } = await expectStatusFromMapper(
      cast.studentAbsentInstance.id,
      cast.teacher.id,
      "absent_student"
    );
    expect(raw.executionState).toBe(ClassExecutionState.COMPLETED);
    expect(raw.outcome).toBe(ClassOutcome.ABSENT);
    expect(raw.actualStartAt).not.toBeNull();
    expect(reportRow.actualStartAt).not.toBeNull();
    // The absent terminal transition also auto-calculates the payroll snapshot.
    expect(reportRow.calculationStatus).toBe(CalculationStatus.CALCULATED);
    expect(reportRow.teacherPaidAmount).toBe(FULL_SESSION_PAY);
  });

  test("step 5 — never-joined COMPLETED + ABSENT rows (no attendance telemetry) map to Absent", async () => {
    // The cast's unattended row is committed terminal data predating
    // attendance telemetry: COMPLETED + ABSENT with actual_start_at null —
    // the only shape that reaches the mapper's Absent branch.
    const { raw, reportRow } = await expectStatusFromMapper(cast.unattendedInstance.id, cast.teacher.id, "Absent");
    expect(raw.executionState).toBe(ClassExecutionState.COMPLETED);
    expect(raw.outcome).toBe(ClassOutcome.ABSENT);
    expect(raw.actualStartAt).toBeNull();
    expect(reportRow.actualStartAt).toBeNull();
    // No payroll calculation ever ran for the migrated row — the grid renders
    // the graceful-degradation nulls intact.
    expect(
      reportRow.calculationStatus === null || reportRow.calculationStatus === CalculationStatus.NOT_CALCULATED
    ).toBe(true);
    expect(reportRow.teacherPaidAmount).toBeNull();
  });

  test("step 6 — operator's scoped page aggregates reflect the whole evolved cast", async () => {
    const page = await readReportPage({ teacherId: cast.teacher.id });
    const castInstanceIds = new Set([
      cast.onTimeInstance.id,
      cast.studentAbsentInstance.id,
      cast.unattendedInstance.id,
    ]);
    expect(page.totalCount).toBe(castInstanceIds.size);
    expect(new Set(page.rows.map(row => row.instanceId))).toEqual(castInstanceIds);

    // Every status the journey produced is tallied: the stopped session, the
    // service-driven absence (start stamped), and the telemetry-less absence.
    expect(page.aggregates.rowCountByStatus).toEqual({ open: 0, end: 1, Absent: 1, absent_student: 1 });
    // Nothing is settled yet, so paid splits read zero while the sum carries
    // both auto-calculated snapshots (no floats: 120.00 + 120.00 = 240.00).
    expect(page.aggregates.rowCountByPaid).toEqual({ paid: 0, unpaid: castInstanceIds.size });
    expect(page.aggregates.totalPaidAmount).toBe("240.00");
    expect(page.aggregates.totalPaidCurrency).toBe(CurrencyCode.SAR);
  });

  test("step 7 — status filter expansion matches the mapper branch for each terminal outcome", async () => {
    const endPage = await readReportPage({ teacherId: cast.teacher.id, currentStatuses: ["end"] });
    expect(endPage.rows.map(row => row.instanceId)).toEqual([cast.onTimeInstance.id]);

    const absentPage = await readReportPage({ teacherId: cast.teacher.id, currentStatuses: ["Absent"] });
    expect(absentPage.rows.map(row => row.instanceId)).toEqual([cast.unattendedInstance.id]);

    const absentStudentPage = await readReportPage({
      teacherId: cast.teacher.id,
      currentStatuses: ["absent_student"],
    });
    expect(absentStudentPage.rows.map(row => row.instanceId)).toEqual([cast.studentAbsentInstance.id]);
  });

  test("step 8 — scoped filters never leak the second teacher's rows", async () => {
    const firstTeacherPage = await readReportPage({ teacherId: cast.teacher.id });
    expect(firstTeacherPage.totalCount).toBe(3);
    expect(firstTeacherPage.rows.some(row => row.instanceId === otherTeacherInstance.id)).toBe(false);
    expect(firstTeacherPage.rows.some(row => row.teacherId === secondTeacher.id)).toBe(false);

    const secondTeacherPage = await readReportPage({ teacherId: secondTeacher.id });
    expect(secondTeacherPage.rows.map(row => row.instanceId)).toEqual([otherTeacherInstance.id]);
    expect(secondTeacherPage.rows[0]?.teacherId).toBe(secondTeacher.id);
    expect(secondTeacherPage.rows[0]?.currentStatus).toBe("open");
  });

  test("step 9 — actors without ACCOUNTING_REPORTS_VIEW are rejected before any read", async () => {
    // The accounting teacher and the permissionless parent both fail through
    // the real group-membership check (neither grants reports view).
    const teacherDenied = await expectJourneyError(() => readReportPageFor(cast.teacherUser.id));
    expect(teacherDenied).toBeInstanceOf(ForbiddenError);
    if (teacherDenied instanceof ForbiddenError) {
      expect(teacherDenied.code).toBe("FORBIDDEN");
    }
    expect(teacherDenied.message).toContain(tErrors.insufficientPermissions);

    const parentDenied = await expectJourneyError(() => readReportPageFor(cast.parentUser.id));
    expect(parentDenied).toBeInstanceOf(ForbiddenError);
    expect(parentDenied.message).toContain(tErrors.insufficientPermissions);
  });

  async function readReportPageFor(actorUserId: string): Promise<SessionAuditReportPage> {
    return SessionAuditService.getReport(actorUserId, { teacherId: cast.teacher.id }, null, REPORT_PAGE, tErrors);
  }

  test("step 10 — session-audit reads never dispatch notifications", async () => {
    dispatchSpy.mockClear();

    await readReportPage({});
    await readReportPage({ teacherId: cast.teacher.id });
    await readReportPage({ teacherId: secondTeacher.id, currentStatuses: ["open"] });

    // The grid is a pure read model: none of the lifecycle fan-outs the prior
    // steps produced belongs to a report read, and no read fires its own.
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  test("step 11 — teacher- and student-facing detail surfaces stay payroll-blind after calculation", async () => {
    const teacherDetail = await ClassSessionService.getClassInstanceDetail(
      cast.teacherUser.id,
      cast.onTimeInstance.id,
      tSession,
      tErrors
    );
    const studentDetail = await ClassSessionService.getClassInstanceDetail(
      cast.student.userId,
      cast.onTimeInstance.id,
      tSession,
      tErrors
    );

    // The same committed row carries the CALCULATED 120.00 snapshot for the
    // operator (step 3), but neither actor-facing surface serializes it.
    for (const key of ACCOUNTING_ONLY_KEYS) {
      expect(JSON.stringify(teacherDetail)).not.toContain(key);
      expect(JSON.stringify(studentDetail)).not.toContain(key);
    }
  });
});
