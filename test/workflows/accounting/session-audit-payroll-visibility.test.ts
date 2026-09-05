import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { auditLogs, classInstances, teacherDues, teacherPayments } from "@/backend/db/schema";
import { AttendanceEvaluation, CalculationStatus, PaymentDirection, PaymentMethodType } from "@/backend/enum";
import { ForbiddenError } from "@/backend/lib";
import { SessionAuditService, serializeSessionAuditCsv } from "@/backend/services";
import { LessonReportService } from "@/backend/services/classes/lesson-report.service";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import { ClassSessionService } from "@/backend/services/session/class-session.service";
import { PayrollCalculationService } from "@/backend/services/teacher/payroll-calculation.service";
import { TeacherDueService } from "@/backend/services/teacher/teacher-due.service";
import type { ClassInstanceSelectType, SessionAuditReportRow, TeacherDueSelectType } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import {
  cleanupPayrollJourneyCast,
  type DispatchSpy,
  expectJourneyError,
  type PayrollJourneyCast,
  provisionPayrollJourneyCast,
} from "@/test/workflows/helpers";

/** Hourly rate SAR 120 x a 60-minute session, and its 50% partial share. */
const FULL_SESSION_PAY = "120.00";
const PARTIAL_SESSION_PAY = "60.00";
const PARTIAL_PERCENTAGE = 50;

/** Grace window for fire-and-forget notification fan-out before asserting silence. */
const NOTIFICATION_SETTLE_MS = 300;

/** Reads the live class-instance row so assertions run against committed state, not service return values. */
async function readInstance(classInstanceId: string): Promise<ClassInstanceSelectType> {
  const [row] = await db.select().from(classInstances).where(eq(classInstances.id, classInstanceId)).limit(1);
  if (!row) {
    throw new Error(`class instance ${classInstanceId} disappeared before it could be read`);
  }
  return row;
}

/** Reads the live teacher-due row accrued for one class instance. */
async function readDueRow(classInstanceId: string): Promise<TeacherDueSelectType> {
  const [row] = await db.select().from(teacherDues).where(eq(teacherDues.classInstanceId, classInstanceId)).limit(1);
  if (!row) {
    throw new Error(`teacher due for class instance ${classInstanceId} disappeared before it could be read`);
  }
  return row;
}

/**
 * Inserts the committed `teacher_payments` fixture the settlement step links
 * dues against (the mark-as-paid service expects an existing payment row).
 */
async function insertSettlementPaymentFixture(teacherId: string, amount: string): Promise<string> {
  const now = new Date();
  const [row] = await db
    .insert(teacherPayments)
    .values({
      teacherId,
      userPaymentMethodId: null,
      paymentMethodType: PaymentMethodType.CASH,
      paymentMethodSnapshot: {
        userPaymentMethodId: null,
        type: PaymentMethodType.CASH,
        direction: PaymentDirection.PAYOUT,
        label: "Cash payout",
        details: { note: "Cash payout" },
        catalog: null,
        snapshottedAt: now.toISOString(),
      },
      amount,
      currency: CurrencyCode.SAR,
      paymentDate: now,
      isTestPayment: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: teacherPayments.id });
  if (!row) {
    throw new Error("settlement payment fixture insert returned no row");
  }
  return row.id;
}

/** The operator-scoped audit page over the whole cast (three rows, one page). */
async function readCastReportPage(operatorUserId: string, teacherId: string, tErrors: ErrorsLabels) {
  return SessionAuditService.getReport(operatorUserId, { teacherId }, null, { limit: 50, offset: 0 }, tErrors);
}

/** Locates the report row for one class instance or fails the step loudly. */
function rowFor(rows: SessionAuditReportRow[], instanceId: string): SessionAuditReportRow {
  const row = rows.find(candidate => candidate.instanceId === instanceId);
  if (!row) {
    throw new Error(`audit report page does not contain instance ${instanceId}`);
  }
  return row;
}

/** Locates the CSV line for one class instance or fails the step loudly. */
function csvLineFor(csv: string, instanceId: string): string {
  // The serializer appends the join-back id columns last (AC-8.3), so the
  // instance id is always the final cell of its data line.
  const line = csv.split("\r\n").find(candidate => candidate.endsWith(`,${instanceId}`));
  if (!line) {
    throw new Error(`CSV export does not contain instance ${instanceId}`);
  }
  return line;
}

/**
 * Payroll-visibility journey: the payroll write path (auto-calculation at
 * terminal stop, operator override to PARTIALLY, lesson-report approval to
 * WAITING_PAID, settlement to PAID) mutates the payroll snapshot columns on
 * the cast's class instances, and the accounting operator's read-only session
 * audit report — plus its CSV serialization — reflects every post-override
 * value with correct aggregates and the paid-only payment-date tooltip.
 * Actors without ACCOUNTING_REPORTS_VIEW are denied before any read.
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): fixtures are committed in beforeAll and
 * hard-deleted in afterAll via the cast helpers.
 */
describe("Session audit payroll visibility journey (override → report + CSV reflect post-override values)", () => {
  const PREFIX = `jrn_sapv_${randomUUID().slice(0, 8)}`;
  const overrideNote = `${PREFIX} partial pay operator note`;

  let tErrors: ErrorsLabels;
  let cast: PayrollJourneyCast;
  let dispatchSpy: DispatchSpy;

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);
    cast = await provisionPayrollJourneyCast(PREFIX);
  });

  afterAll(async () => {
    dispatchSpy.mockRestore();
    await db.delete(teacherPayments).where(eq(teacherPayments.teacherId, cast.teacher.id));
    // Committed overrides mirror into append-only audit_logs rows referencing
    // the cast actors; the immutability trigger must be lifted for the sweep.
    await db.execute(sql`ALTER TABLE audit_logs DISABLE TRIGGER prevent_audit_log_mod_trigger`);
    try {
      await db
        .delete(auditLogs)
        .where(
          inArray(auditLogs.actorUserId, [
            cast.operatorUser.id,
            cast.teacherUser.id,
            cast.parentUser.id,
            cast.student.userId,
          ])
        );
      await cleanupPayrollJourneyCast(cast);
    } finally {
      await db.execute(sql`ALTER TABLE audit_logs ENABLE TRIGGER prevent_audit_log_mod_trigger`);
    }
  });

  test("step 1 — before any calculation the report shows NOT_CALCULATED rows with empty payroll columns", async () => {
    const page = await readCastReportPage(cast.operatorUser.id, cast.teacher.id, tErrors);

    expect(page.totalCount).toBe(3);
    expect(page.rows).toHaveLength(3);
    for (const row of page.rows) {
      expect(row.calculationStatus).toBe(CalculationStatus.NOT_CALCULATED);
      expect(row.teacherPaidAmount).toBeNull();
      expect(row.teacherPaidCurrency).toBeNull();
      expect(row.calculatedDuration).toBeNull();
      expect(row.isPartialPercentage).toBeNull();
      expect(row.payrollNote).toBeNull();
      expect(row.teacherDuePaymentDate).toBeNull();
    }
    expect(page.aggregates.rowCountByPaid).toEqual({ paid: 0, unpaid: 3 });
    expect(page.aggregates.totalPaidAmount).toBe("0.00");
    expect(page.aggregates.totalPaidCurrency).toBe(CurrencyCode.SAR);
  });

  test("step 2 — terminal session writes auto-calculate two instances to CALCULATED at full pay", async () => {
    await ClassSessionService.activate(cast.teacherUser.id, cast.onTimeInstance.id, tErrors);
    await ClassSessionService.updateStatusStart(cast.teacherUser.id, cast.onTimeInstance.id, tErrors);
    await ClassSessionService.stop(cast.operatorUser.id, cast.onTimeInstance.id, tErrors);

    await ClassSessionService.activateOverride(cast.operatorUser.id, cast.studentAbsentInstance.id, tErrors);
    await ClassSessionService.updateStatusAbsent(cast.operatorUser.id, cast.studentAbsentInstance.id, tErrors);

    const onTimeRow = await readInstance(cast.onTimeInstance.id);
    expect(onTimeRow.calculationStatus).toBe(CalculationStatus.CALCULATED);
    expect(onTimeRow.teacherPaidAmount).toBe(FULL_SESSION_PAY);

    const absentRow = await readInstance(cast.studentAbsentInstance.id);
    expect(absentRow.calculationStatus).toBe(CalculationStatus.CALCULATED);
    expect(absentRow.teacherPaidAmount).toBe(FULL_SESSION_PAY);

    const page = await readCastReportPage(cast.operatorUser.id, cast.teacher.id, tErrors);
    expect(rowFor(page.rows, cast.onTimeInstance.id).calculationStatus).toBe(CalculationStatus.CALCULATED);
    expect(rowFor(page.rows, cast.onTimeInstance.id).teacherPaidAmount).toBe(FULL_SESSION_PAY);
    expect(rowFor(page.rows, cast.studentAbsentInstance.id).calculationStatus).toBe(CalculationStatus.CALCULATED);
    expect(rowFor(page.rows, cast.studentAbsentInstance.id).teacherPaidAmount).toBe(FULL_SESSION_PAY);
    expect(rowFor(page.rows, cast.unattendedInstance.id).calculationStatus).toBe(CalculationStatus.NOT_CALCULATED);
    expect(page.aggregates.totalPaidAmount).toBe("240.00");
    expect(page.aggregates.rowCountByPaid).toEqual({ paid: 0, unpaid: 3 });
  });

  test("step 3 — operator override to PARTIALLY rewrites amount, share, and note; no notification fires", async () => {
    dispatchSpy.mockClear();

    const overridden = await PayrollCalculationService.applyOverride(
      {
        instanceId: cast.studentAbsentInstance.id,
        actorUserId: cast.operatorUser.id,
        targetStatus: CalculationStatus.PARTIALLY,
        partialPercentage: PARTIAL_PERCENTAGE,
        note: overrideNote,
      },
      tErrors
    );
    expect(overridden.calculationStatus).toBe(CalculationStatus.PARTIALLY);
    expect(overridden.teacherPaidAmount).toBe(PARTIAL_SESSION_PAY);
    expect(overridden.isPartialPercentage).toBe(PARTIAL_PERCENTAGE);
    expect(overridden.payrollNote).toBe(overrideNote);

    // The override path emits no notification; the settle window is proof.
    await new Promise<void>(resolve => {
      setTimeout(resolve, NOTIFICATION_SETTLE_MS);
    });
    expect(dispatchSpy).not.toHaveBeenCalled();

    const page = await readCastReportPage(cast.operatorUser.id, cast.teacher.id, tErrors);
    const absentRow = rowFor(page.rows, cast.studentAbsentInstance.id);
    expect(absentRow.calculationStatus).toBe(CalculationStatus.PARTIALLY);
    expect(absentRow.teacherPaidAmount).toBe(PARTIAL_SESSION_PAY);
    expect(absentRow.teacherPaidCurrency).toBe(CurrencyCode.SAR);
    expect(absentRow.isPartialPercentage).toBe(PARTIAL_PERCENTAGE);
    expect(absentRow.payrollNote).toBe(overrideNote);
    expect(absentRow.teacherDuePaymentDate).toBeNull();

    // The page-level money aggregate moved with the override: 240.00 → 180.00.
    expect(page.aggregates.totalPaidAmount).toBe("180.00");
    expect(page.aggregates.totalPaidCurrency).toBe(CurrencyCode.SAR);
    expect(page.aggregates.rowCountByPaid).toEqual({ paid: 0, unpaid: 3 });
  });

  test("step 4 — approval and settlement flip the on-time instance WAITING_PAID → PAID with a payment date", async () => {
    const report = await LessonReportService.submitReport(
      cast.teacherUser.id,
      {
        classInstanceId: cast.onTimeInstance.id,
        attendanceEvaluation: AttendanceEvaluation.PRESENT,
        durationMinutes: 60,
        completionPercentage: 100,
        teacherNotes: `${PREFIX} payroll visibility journey report`,
      },
      "en"
    );
    await LessonReportService.approveReport(cast.operatorUser.id, report.id, "en");

    const awaitingRow = await readInstance(cast.onTimeInstance.id);
    expect(awaitingRow.calculationStatus).toBe(CalculationStatus.WAITING_PAID);
    expect(awaitingRow.teacherPaidAmount).toBe(FULL_SESSION_PAY);

    const dueRow = await readDueRow(cast.onTimeInstance.id);
    const teacherPaymentId = await insertSettlementPaymentFixture(cast.teacher.id, FULL_SESSION_PAY);
    const settled = await TeacherDueService.markAsPaid(cast.operatorUser.id, [dueRow.id], teacherPaymentId, "en");
    expect(settled).toHaveLength(1);

    const paidRow = await readInstance(cast.onTimeInstance.id);
    expect(paidRow.calculationStatus).toBe(CalculationStatus.PAID);
    expect(paidRow.teacherPaidAmount).toBe(FULL_SESSION_PAY);

    const page = await readCastReportPage(cast.operatorUser.id, cast.teacher.id, tErrors);
    const paidReportRow = rowFor(page.rows, cast.onTimeInstance.id);
    expect(paidReportRow.calculationStatus).toBe(CalculationStatus.PAID);
    // The payment-date tooltip is populated only once the row is PAID.
    expect(paidReportRow.teacherDuePaymentDate).not.toBeNull();
    expect(rowFor(page.rows, cast.studentAbsentInstance.id).teacherDuePaymentDate).toBeNull();
    expect(rowFor(page.rows, cast.unattendedInstance.id).teacherDuePaymentDate).toBeNull();

    expect(page.aggregates.rowCountByPaid).toEqual({ paid: 1, unpaid: 2 });
    expect(page.aggregates.totalPaidAmount).toBe("180.00");
  });

  test("step 5 — the CSV export serializes the post-override values row by row", async () => {
    const page = await readCastReportPage(cast.operatorUser.id, cast.teacher.id, tErrors);
    const csv = serializeSessionAuditCsv(page.rows);

    const [header] = csv.split("\r\n");
    expect(header).toContain("teacherPaidAmount");
    expect(header).toContain("calculationStatus");
    expect(header).toContain("isPartialPercentage");
    expect(header).toContain("payrollNote");
    expect(header).toContain("teacherDuePaymentDate");

    const paidLine = csvLineFor(csv, cast.onTimeInstance.id);
    expect(paidLine).toContain(CalculationStatus.PAID);
    expect(paidLine).toContain(FULL_SESSION_PAY);
    const paidPaymentDate = rowFor(page.rows, cast.onTimeInstance.id).teacherDuePaymentDate;
    if (paidPaymentDate === null) {
      throw new Error("paid report row lost its teacherDuePaymentDate before CSV serialization");
    }
    expect(paidLine).toContain(paidPaymentDate);

    const partialLine = csvLineFor(csv, cast.studentAbsentInstance.id);
    expect(partialLine).toContain(CalculationStatus.PARTIALLY);
    expect(partialLine).toContain(PARTIAL_SESSION_PAY);
    expect(partialLine).toContain(String(PARTIAL_PERCENTAGE));
    expect(partialLine).toContain(overrideNote);

    const uncalculatedLine = csvLineFor(csv, cast.unattendedInstance.id);
    expect(uncalculatedLine).toContain(CalculationStatus.NOT_CALCULATED);
    expect(uncalculatedLine).not.toContain(FULL_SESSION_PAY);
  });

  test("step 6 — actors without ACCOUNTING_REPORTS_VIEW are denied before any read", async () => {
    const deniedCases = [
      { label: "teacher", actorUserId: cast.teacherUser.id },
      { label: "student", actorUserId: cast.student.userId },
      { label: "parent", actorUserId: cast.parentUser.id },
    ];
    const errors = await Promise.all(
      deniedCases.map(denied =>
        expectJourneyError(() =>
          SessionAuditService.getReport(
            denied.actorUserId,
            { teacherId: cast.teacher.id },
            null,
            { limit: 50, offset: 0 },
            tErrors
          )
        )
      )
    );
    for (const [index, error] of errors.entries()) {
      expect(error, deniedCases[index]?.label).toBeInstanceOf(ForbiddenError);
      if (error instanceof ForbiddenError) {
        expect(error.code).toBe("FORBIDDEN");
      }
      expect(error.message).toContain(tErrors.insufficientPermissions);
    }
  });
});
