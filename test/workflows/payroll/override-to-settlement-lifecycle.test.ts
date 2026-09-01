import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { auditLogs, classInstances, classStatusEvents, teacherDues, teacherPayments } from "@/backend/db/schema";
import {
  AttendanceEvaluation,
  LessonReportStatus,
  NotificationEventType,
  PaymentDirection,
  PaymentMethodType,
  TeacherDueStatus,
} from "@/backend/enum";
import { CalculationStatus } from "@/backend/enum/teachers/payroll-calculation.enum";
import { LessonReportService } from "@/backend/services/classes/lesson-report.service";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import { ClassSessionService } from "@/backend/services/session/class-session.service";
import { PayrollCalculationService } from "@/backend/services/teacher/payroll-calculation.service";
import { TeacherDueService } from "@/backend/services/teacher/teacher-due.service";
import type { ClassInstanceSelectType, LessonReportSubmitInput, TeacherDueSelectType } from "@/backend/types";
import { ClassExecutionState } from "@/shared/constants/class-instance-detail.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import {
  cleanupPayrollJourneyCast,
  type DispatchSpy,
  dispatchTargetsForEvent,
  expectJourneyError,
  type PayrollJourneyCast,
  provisionPayrollJourneyCast,
} from "@/test/workflows/helpers";

/** Class-status event types the payroll services append; plain varchar columns, no TypeScript enum. */
const PAYROLL_STATUS_TRANSITION_EVENT = "PAYROLL_STATUS_TRANSITION";
const PAYROLL_OVERRIDE_EVENT = "PAYROLL_OVERRIDE";

/** Hourly rate SAR 120 × a 60-minute session, and its 50% partial share. */
const FULL_SESSION_PAY = "120.00";
const PARTIAL_SESSION_PAY = "60.00";
const PARTIAL_PERCENTAGE = 50;

/**
 * Exact payroll snapshot keys that must never reach a teacher/student-facing
 * surface (same contract as the auto-calculation journey).
 */
const PAYROLL_SURFACE_KEYS = new Set([
  "calculationStatus",
  "teacherPaidAmount",
  "teacherPaidCurrency",
  "calculatedDuration",
  "isPartialPercentage",
  "payrollNote",
  "payrollCalculatedAt",
  "payrollCalculatedBy",
]);

/** Structural guard so the payroll-key walk needs no type assertion. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

/**
 * Collects the object paths whose key names carry payroll semantics, walking
 * nested objects and arrays. An empty result proves the surface exposes no
 * payroll fields without the test hard-coding the surface's exact shape.
 */
function collectPayrollKeys(value: unknown, path = "$"): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectPayrollKeys(item, `${path}[${index}]`));
  }
  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, child]) => {
      const childPath = `${path}.${key}`;
      return PAYROLL_SURFACE_KEYS.has(key) ? [childPath] : collectPayrollKeys(child, childPath);
    });
  }
  return [];
}

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

/** Raw audit rows for one instance — actor attribution lives on the table, not the service surface. */
async function readAuditRows(
  classInstanceId: string
): Promise<{ eventType: string; actorUserId: string | null; description: string | null }[]> {
  return db
    .select({
      eventType: classStatusEvents.eventType,
      actorUserId: classStatusEvents.actorUserId,
      description: classStatusEvents.description,
    })
    .from(classStatusEvents)
    .where(eq(classStatusEvents.classInstanceId, classInstanceId));
}

/**
 * Inserts the committed `teacher_payments` fixture the settlement step links
 * dues against (the mark-as-paid service expects an existing payment row; the
 * payment-method creation flow is outside this journey's scope). Mirrors the
 * minimal CASH-payout snapshot shape used by the repository test suite.
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

/**
 * Cross-actor settlement journey: the operator overrides a calculated session
 * to Partially 50%, the teacher's lesson report is approved so the due accrues
 * from the OVERRIDDEN amount and the instance flips to WAITING_PAID inside the
 * approval transaction, the operator then settles the due against a recorded
 * payment (PAID flip plus teacherPaymentId link in one transaction), the audit
 * trail attributes every payroll event to the operator while the teacher sees
 * only their settled dues, and settled rows reject further overrides.
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): services spawn their own transactions over the
 * global `db`, so fixtures are committed in beforeAll and hard-deleted in
 * afterAll via the cast helpers.
 */
describe("Override-to-settlement lifecycle journey (operator override → lesson-report approval → dues settlement)", () => {
  const PREFIX = `jrn_settle_${randomUUID().slice(0, 8)}`;
  const overrideNote = `${PREFIX} partial pay operator note`;

  let tErrors: ErrorsLabels;
  let tSession: ReturnType<typeof getServerTranslations>["sessionTranslations"];
  let cast: PayrollJourneyCast;
  let dispatchSpy: DispatchSpy;
  let overrideAuditEventId = "";

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    tSession = getServerTranslations("en").sessionTranslations;
    // Interception boundary for ALL lifecycle notifications the journey fans
    // out (completion, lesson-report submitted/reviewed).
    dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);
    cast = await provisionPayrollJourneyCast(PREFIX);
  });

  afterAll(async () => {
    dispatchSpy.mockRestore();
    // teacher_payments references teachers with ON DELETE RESTRICT, so the
    // run's payment fixture must go before the cast cleanup deletes the teacher.
    await db.delete(teacherPayments).where(eq(teacherPayments.teacherId, cast.teacher.id));
    // Committed overrides mirror into append-only audit_logs rows referencing
    // the cast actors; the immutability trigger must be lifted for the sweep
    // (same precedent as the billing credit-adjustment journey). INSERT traffic
    // from concurrent suites is unaffected while the trigger is off.
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

  function buildSubmitInput(classInstanceId: string): LessonReportSubmitInput {
    return {
      classInstanceId,
      attendanceEvaluation: AttendanceEvaluation.PRESENT,
      durationMinutes: 60,
      completionPercentage: 100,
      teacherNotes: `${PREFIX} settlement journey report`,
    };
  }

  test("step 1 — teacher telemetry and the operator's terminal stop commit the CALCULATED snapshot", async () => {
    await ClassSessionService.activate(cast.teacherUser.id, cast.onTimeInstance.id, tErrors);
    await ClassSessionService.updateStatusStart(cast.teacherUser.id, cast.onTimeInstance.id, tErrors);

    const completed = await ClassSessionService.stop(cast.operatorUser.id, cast.onTimeInstance.id, tErrors);
    expect(completed?.executionState).toBe(ClassExecutionState.COMPLETED);

    const row = await readInstance(cast.onTimeInstance.id);
    expect(row.executionState).toBe(ClassExecutionState.COMPLETED);
    expect(row.calculationStatus).toBe(CalculationStatus.CALCULATED);
    expect(row.teacherPaidAmount).toBe(FULL_SESSION_PAY);
  });

  test("step 2 — operator override: Partially 50% rewrites the payable amount with an audit event", async () => {
    const overridden = await PayrollCalculationService.applyOverride(
      {
        instanceId: cast.onTimeInstance.id,
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
    expect(overridden.auditEventId.length).toBeGreaterThan(0);
    overrideAuditEventId = overridden.auditEventId;

    const row = await readInstance(cast.onTimeInstance.id);
    expect(row.calculationStatus).toBe(CalculationStatus.PARTIALLY);
    expect(row.teacherPaidAmount).toBe(PARTIAL_SESSION_PAY);
    expect(row.teacherPaidCurrency).toBe(CurrencyCode.SAR);
    expect(row.isPartialPercentage).toBe(PARTIAL_PERCENTAGE);
    expect(row.payrollNote).toBe(overrideNote);
    expect(row.payrollCalculatedBy).toBe(cast.operatorUser.id);
  });

  test("step 3 — duplicate override submission inside the idempotency window adds no second event", async () => {
    const duplicate = await PayrollCalculationService.applyOverride(
      {
        instanceId: cast.onTimeInstance.id,
        actorUserId: cast.operatorUser.id,
        targetStatus: CalculationStatus.PARTIALLY,
        partialPercentage: PARTIAL_PERCENTAGE,
        note: overrideNote,
      },
      tErrors
    );

    // The re-submission collapses onto the first-applied result.
    expect(duplicate.calculationStatus).toBe(CalculationStatus.PARTIALLY);
    expect(duplicate.teacherPaidAmount).toBe(PARTIAL_SESSION_PAY);
    expect(duplicate.auditEventId).toBe(overrideAuditEventId);

    const overrideEvents = (await readAuditRows(cast.onTimeInstance.id)).filter(
      row => row.eventType === PAYROLL_OVERRIDE_EVENT
    );
    expect(overrideEvents).toHaveLength(1);
    expect(overrideEvents[0]?.description).toContain(overrideNote);

    const row = await readInstance(cast.onTimeInstance.id);
    expect(row.calculationStatus).toBe(CalculationStatus.PARTIALLY);
    expect(row.teacherPaidAmount).toBe(PARTIAL_SESSION_PAY);
  });

  test("step 4 — lesson-report approval accrues the due from the OVERRIDDEN amount and flips WAITING_PAID", async () => {
    dispatchSpy.mockClear();

    const report = await LessonReportService.submitReport(
      cast.teacherUser.id,
      buildSubmitInput(cast.onTimeInstance.id),
      "en"
    );
    const approved = await LessonReportService.approveReport(cast.operatorUser.id, report.id, "en");
    expect(approved.status).toBe(LessonReportStatus.APPROVED);

    // Side effect: the due accrues from the overridden snapshot amount, not the
    // full calculated one — Partially 60.00 is exactly what the teacher is owed.
    const dueRow = await readDueRow(cast.onTimeInstance.id);
    expect(dueRow.teacherId).toBe(cast.teacher.id);
    expect(dueRow.studentId).toBe(cast.student.id);
    expect(dueRow.amount).toBe(PARTIAL_SESSION_PAY);
    expect(dueRow.currency).toBe(CurrencyCode.SAR);
    expect(dueRow.hours).toBe("1");
    expect(dueRow.status).toBe(TeacherDueStatus.PENDING);
    expect(dueRow.teacherPaymentId).toBeNull();
    expect(dueRow.approvedByUserId).toBe(cast.operatorUser.id);

    // Same-transaction guarantee: the accrual flips the instance to
    // WAITING_PAID together with the due insert. Entering settlement clears
    // the partial share on the row (schema CHECK) while the money stays put.
    const row = await readInstance(cast.onTimeInstance.id);
    expect(row.calculationStatus).toBe(CalculationStatus.WAITING_PAID);
    expect(row.teacherPaidAmount).toBe(PARTIAL_SESSION_PAY);
    expect(row.isPartialPercentage).toBeNull();

    // Lifecycle side effect: the reviewed fan-out reaches the submitting teacher.
    expect(dispatchTargetsForEvent(dispatchSpy, NotificationEventType.LESSON_REPORT_REVIEWED)).toContain(
      cast.teacherUser.id
    );
  });

  test("step 5 — teacher sees the accrued due but never the override internals", async () => {
    const pending = await TeacherDueService.getPendingDues(cast.teacherUser.id, cast.teacher.id, "en");
    const ownPending = pending.filter(due => due.classInstanceId === cast.onTimeInstance.id);
    expect(ownPending).toHaveLength(1);
    expect(ownPending[0]?.amount).toBe(PARTIAL_SESSION_PAY);
    expect(ownPending[0]?.status).toBe(TeacherDueStatus.PENDING);

    // The teacher-facing due surface carries amounts only: no operator note,
    // no payroll snapshot keys, no override status, no audit identifiers.
    const serialized = JSON.stringify(pending);
    expect(serialized).not.toContain(overrideNote);
    expect(serialized).not.toContain("payrollNote");
    expect(serialized).not.toContain("PARTIALLY");
    expect(serialized).not.toContain("auditEventId");

    // Monthly aggregates are keyed on the due's own approval timestamp, so the
    // accrual month is derived from the committed row, never from wall clock.
    const dueRow = await readDueRow(cast.onTimeInstance.id);
    const monthly = await TeacherDueService.getMonthlyReport(
      cast.teacherUser.id,
      cast.teacher.id,
      dueRow.approvedAt.getUTCFullYear(),
      dueRow.approvedAt.getUTCMonth() + 1,
      "en"
    );
    expect(monthly.approvedCount).toBe(1);
    expect(monthly.totalDueAmount).toBe(60);
    expect(monthly.totalPaidAmount).toBe(0);
    expect(JSON.stringify(monthly)).not.toContain(overrideNote);

    // The teacher's class-detail surface stays payroll-blind throughout.
    const teacherDetail = await ClassSessionService.getClassInstanceDetail(
      cast.teacherUser.id,
      cast.onTimeInstance.id,
      tSession,
      tErrors
    );
    expect(collectPayrollKeys(teacherDetail)).toEqual([]);
    expect(JSON.stringify(teacherDetail)).not.toContain("teacherPaid");
    expect(JSON.stringify(teacherDetail)).not.toContain("payrollNote");
  });

  test("step 6 — operator settles the due: PAID flip and teacherPaymentId link commit together", async () => {
    const teacherPaymentId = await insertSettlementPaymentFixture(cast.teacher.id, PARTIAL_SESSION_PAY);
    const dueRow = await readDueRow(cast.onTimeInstance.id);

    const settled = await TeacherDueService.markAsPaid(cast.operatorUser.id, [dueRow.id], teacherPaymentId, "en");
    expect(settled).toHaveLength(1);
    expect(settled[0]?.status).toBe(TeacherDueStatus.PAID);

    const paidDue = await readDueRow(cast.onTimeInstance.id);
    expect(paidDue.status).toBe(TeacherDueStatus.PAID);
    expect(paidDue.teacherPaymentId).toBe(teacherPaymentId);

    // Same-transaction guarantee: the linked instance flips to PAID together
    // with the due settlement, and settled money is never rewritten.
    const row = await readInstance(cast.onTimeInstance.id);
    expect(row.calculationStatus).toBe(CalculationStatus.PAID);
    expect(row.teacherPaidAmount).toBe(PARTIAL_SESSION_PAY);

    // Teacher read after settlement: the pending queue drained for this
    // instance and the monthly report now carries the settled amount.
    const pending = await TeacherDueService.getPendingDues(cast.teacherUser.id, cast.teacher.id, "en");
    expect(pending.filter(due => due.classInstanceId === cast.onTimeInstance.id)).toHaveLength(0);

    const monthly = await TeacherDueService.getMonthlyReport(
      cast.teacherUser.id,
      cast.teacher.id,
      paidDue.approvedAt.getUTCFullYear(),
      paidDue.approvedAt.getUTCMonth() + 1,
      "en"
    );
    expect(monthly.totalPaidAmount).toBe(60);
    expect(monthly.totalDueAmount).toBe(0);
  });

  test("step 7 — audit trail: one event per transition, all attributed to the operator", async () => {
    // The service surface returns newest-first and omits actor ids.
    const events = await ClassSessionService.getClassStatusEvents(
      cast.operatorUser.id,
      cast.onTimeInstance.id,
      tErrors
    );
    const payrollEvents = events.filter(
      event => event.eventType === PAYROLL_OVERRIDE_EVENT || event.eventType === PAYROLL_STATUS_TRANSITION_EVENT
    );
    expect(payrollEvents.map(event => event.eventType)).toEqual([
      PAYROLL_STATUS_TRANSITION_EVENT, // settlement → PAID (newest)
      PAYROLL_STATUS_TRANSITION_EVENT, // accrual → WAITING_PAID
      PAYROLL_OVERRIDE_EVENT, // Partially 50%
      PAYROLL_STATUS_TRANSITION_EVENT, // auto-calculation at the terminal stop (oldest)
    ]);
    const overrideEvent = payrollEvents.find(event => event.eventType === PAYROLL_OVERRIDE_EVENT);
    expect(overrideEvent?.description).toContain(overrideNote);

    // Actor attribution lives on the raw audit rows: the operator drove every
    // payroll write on this instance (stop, override, approval, settlement).
    const auditRows = (await readAuditRows(cast.onTimeInstance.id)).filter(
      row => row.eventType === PAYROLL_OVERRIDE_EVENT || row.eventType === PAYROLL_STATUS_TRANSITION_EVENT
    );
    expect(auditRows).toHaveLength(4);
    for (const auditRow of auditRows) {
      expect(auditRow.actorUserId).toBe(cast.operatorUser.id);
    }
  });

  test("step 8 — denial paths: settled rows are immutable and overrides stay operator-only", async () => {
    const paidDenied = await expectJourneyError(() =>
      PayrollCalculationService.applyOverride(
        {
          instanceId: cast.onTimeInstance.id,
          actorUserId: cast.operatorUser.id,
          targetStatus: CalculationStatus.REFUND,
          note: `${PREFIX} refund attempt on paid row`,
        },
        tErrors
      )
    );
    expect(paidDenied.message).toContain(tErrors.payroll.alreadyPaid);

    // The rejected attempt leaves the settled state untouched.
    const row = await readInstance(cast.onTimeInstance.id);
    expect(row.calculationStatus).toBe(CalculationStatus.PAID);
    expect(row.teacherPaidAmount).toBe(PARTIAL_SESSION_PAY);

    const teacherDenied = await expectJourneyError(() =>
      PayrollCalculationService.applyOverride(
        {
          instanceId: cast.onTimeInstance.id,
          actorUserId: cast.teacherUser.id,
          targetStatus: CalculationStatus.PARTIALLY,
          partialPercentage: PARTIAL_PERCENTAGE,
          note: `${PREFIX} teacher attempt`,
        },
        tErrors
      )
    );
    expect(teacherDenied.message).toContain(tErrors.insufficientPermissions);
  });

  test("step 9 — second instance: student absence resolves CALCULATED at full pay", async () => {
    await ClassSessionService.activateOverride(cast.operatorUser.id, cast.studentAbsentInstance.id, tErrors);
    const absent = await ClassSessionService.updateStatusAbsent(
      cast.operatorUser.id,
      cast.studentAbsentInstance.id,
      tErrors
    );
    expect(absent?.executionState).toBe(ClassExecutionState.COMPLETED);

    const row = await readInstance(cast.studentAbsentInstance.id);
    expect(row.calculationStatus).toBe(CalculationStatus.CALCULATED);
    expect(row.teacherPaidAmount).toBe(FULL_SESSION_PAY);
  });

  test("step 10 — approval moves the second instance to WAITING_PAID with a full-pay due", async () => {
    const report = await LessonReportService.submitReport(
      cast.teacherUser.id,
      buildSubmitInput(cast.studentAbsentInstance.id),
      "en"
    );
    await LessonReportService.approveReport(cast.operatorUser.id, report.id, "en");

    const row = await readInstance(cast.studentAbsentInstance.id);
    expect(row.calculationStatus).toBe(CalculationStatus.WAITING_PAID);

    const dueRow = await readDueRow(cast.studentAbsentInstance.id);
    expect(dueRow.amount).toBe(FULL_SESSION_PAY);
    expect(dueRow.status).toBe(TeacherDueStatus.PENDING);
  });

  test("step 11 — denial path: overriding a row awaiting settlement requires force", async () => {
    const waitingDenied = await expectJourneyError(() =>
      PayrollCalculationService.applyOverride(
        {
          instanceId: cast.studentAbsentInstance.id,
          actorUserId: cast.operatorUser.id,
          targetStatus: CalculationStatus.PARTIALLY,
          partialPercentage: PARTIAL_PERCENTAGE,
          note: `${PREFIX} unforced attempt on awaiting row`,
        },
        tErrors
      )
    );
    expect(waitingDenied.message).toContain(tErrors.payroll.awaitingSettlement);

    // The rejected attempt leaves the awaiting state, the due, and the audit
    // trail exactly as the approval left them.
    const row = await readInstance(cast.studentAbsentInstance.id);
    expect(row.calculationStatus).toBe(CalculationStatus.WAITING_PAID);
    expect(row.teacherPaidAmount).toBe(FULL_SESSION_PAY);

    const dueRow = await readDueRow(cast.studentAbsentInstance.id);
    expect(dueRow.status).toBe(TeacherDueStatus.PENDING);

    const overrideEvents = (await readAuditRows(cast.studentAbsentInstance.id)).filter(
      auditRow => auditRow.eventType === PAYROLL_OVERRIDE_EVENT
    );
    expect(overrideEvents).toHaveLength(0);
  });
});
