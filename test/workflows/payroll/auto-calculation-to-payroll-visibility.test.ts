import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { classInstances } from "@/backend/db/schema";
import { NotificationEventType } from "@/backend/enum";
import { CalculationStatus } from "@/backend/enum/teachers/payroll-calculation.enum";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import { ClassSessionService } from "@/backend/services/session/class-session.service";
import { PayrollCalculationService } from "@/backend/services/teacher/payroll-calculation.service";
import type { ClassInstanceSelectType } from "@/backend/types";
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
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

/** Class-status event types the payroll calculator appends; plain varchar columns, no TypeScript enum. */
const PAYROLL_STATUS_TRANSITION_EVENT = "PAYROLL_STATUS_TRANSITION";
const PAYROLL_OVERRIDE_EVENT = "PAYROLL_OVERRIDE";

/** Hourly rate SAR 120 × a 60-minute session — the full-pay amount every on-time or student-absent row must carry. */
const FULL_SESSION_PAY = "120.00";

/**
 * Exact payroll snapshot keys that must never reach a teacher/student-facing
 * surface. Full key names only: `payrollCredited` is a scheduling flag and the
 * booking-rate snapshot is rate data, so neither may be flagged.
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

/**
 * Cross-actor journey: the teacher's attendance telemetry drives a session
 * through the real state machine, the operator's terminal transition fires
 * the automatic payroll calculation inside the same transaction, the
 * accounting operator reads the calculated rows through the report service,
 * teacher/student surfaces stay payroll-blind, and unauthorized actors are
 * denied with translated errors.
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): services spawn their own transactions over the
 * global `db`, so fixtures are committed in beforeAll and hard-deleted in
 * afterAll via the cast helpers.
 */
describe("Automatic payroll calculation journey (teacher telemetry → operator visibility)", () => {
  const PREFIX = `jrn_payroll_${randomUUID().slice(0, 8)}`;

  let tErrors: ErrorsLabels;
  let tSession: ReturnType<typeof getServerTranslations>["sessionTranslations"];
  let cast: PayrollJourneyCast;
  let dispatchSpy: DispatchSpy;

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    tSession = getServerTranslations("en").sessionTranslations;
    // Interception boundary for ALL lifecycle notifications the state machine
    // fans out (activation, start, completion, absence).
    dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);
    cast = await provisionPayrollJourneyCast(PREFIX);
  });

  afterAll(async () => {
    dispatchSpy.mockRestore();
    await cleanupPayrollJourneyCast(cast);
  });

  test("step 1 — teacher telemetry: the session is activated and joined by its own teacher", async () => {
    const activated = await ClassSessionService.activate(cast.teacherUser.id, cast.onTimeInstance.id, tErrors);
    expect(activated?.executionState).toBe(ClassExecutionState.ACTIVATED);

    const running = await ClassSessionService.updateStatusStart(cast.teacherUser.id, cast.onTimeInstance.id, tErrors);
    expect(running.executionState).toBe(ClassExecutionState.RUNNING);
    expect(running.actualStartAt).not.toBeNull();

    const persisted = await readInstance(cast.onTimeInstance.id);
    expect(persisted.executionState).toBe(ClassExecutionState.RUNNING);
    expect(persisted.actualStartAt).not.toBeNull();
  });

  test("step 2 — operator stops the session: terminal state and payroll snapshot commit together", async () => {
    dispatchSpy.mockClear();

    const completed = await ClassSessionService.stop(cast.operatorUser.id, cast.onTimeInstance.id, tErrors);
    expect(completed?.executionState).toBe(ClassExecutionState.COMPLETED);

    // Same-transaction guarantee: the snapshot columns commit together with
    // the terminal execution state. A database-level calculator failure would
    // abort the shared transaction and leave BOTH unchanged.
    const row = await readInstance(cast.onTimeInstance.id);
    expect(row.executionState).toBe(ClassExecutionState.COMPLETED);
    expect(row.calculationStatus).toBe(CalculationStatus.CALCULATED);
    expect(row.teacherPaidAmount).toBe(FULL_SESSION_PAY);
    expect(row.teacherPaidCurrency).toBe(CurrencyCode.SAR);
    expect(row.calculatedDuration).toBe(60);
    expect(row.payrollCalculatedBy).toBe(cast.operatorUser.id);
    expect(row.payrollNote).toBeNull();

    // Lifecycle side effect: the completion fan-out reaches the teacher.
    expect(dispatchTargetsForEvent(dispatchSpy, NotificationEventType.CLASS_COMPLETED)).toContain(cast.teacherUser.id);
  });

  test("step 3 — student absence after the waiting period: the full scheduled window stays payable", async () => {
    const activated = await ClassSessionService.activateOverride(
      cast.operatorUser.id,
      cast.studentAbsentInstance.id,
      tErrors
    );
    expect(activated?.executionState).toBe(ClassExecutionState.ACTIVATED);

    const absent = await ClassSessionService.updateStatusAbsent(
      cast.operatorUser.id,
      cast.studentAbsentInstance.id,
      tErrors
    );
    expect(absent?.executionState).toBe(ClassExecutionState.COMPLETED);

    const row = await readInstance(cast.studentAbsentInstance.id);
    expect(row.outcome).toBe(ClassOutcome.ABSENT);
    expect(row.calculationStatus).toBe(CalculationStatus.CALCULATED);
    // Student-absence rule: the teacher waited out the session, so the whole
    // scheduled hour is payable at the teacher rate.
    expect(row.teacherPaidAmount).toBe(FULL_SESSION_PAY);
    expect(row.teacherPaidCurrency).toBe(CurrencyCode.SAR);
    expect(row.calculatedDuration).toBe(60);
  });

  test("step 4 — unattended historical session: operator reconciliation pays zero for teaching time that never happened", async () => {
    // The unattended row was created terminal (migrated data predating
    // attendance telemetry), so the live state machine never touches it — the
    // operator settles it through the standalone reconciliation calculation.
    const result = await PayrollCalculationService.calculateForInstance(
      { instanceId: cast.unattendedInstance.id, actorUserId: cast.operatorUser.id },
      tErrors
    );

    const row = await readInstance(cast.unattendedInstance.id);
    expect(row.executionState).toBe(ClassExecutionState.COMPLETED);
    expect(row.calculationStatus).toBe(CalculationStatus.CALCULATED);
    // Nobody ever joined: with no attendance telemetry the teacher-absence
    // branch pays zero for teaching time that never happened.
    expect(row.teacherPaidAmount).toBe("0.00");
    expect(row.calculatedDuration).toBe(0);
    expect(result.isTeacherAbsence).toBe(true);
  });

  test("step 5 — accounting operator reads the calculated rows through the payroll report service", async () => {
    const page = await PayrollCalculationService.getReport(
      cast.operatorUser.id,
      { teacherId: cast.teacher.id },
      { limit: 50, offset: 0 },
      tErrors
    );

    expect(page.totalCount).toBe(3);
    const rowsByInstance = new Map(page.rows.map(row => [row.instanceId, row]));

    const onTimeRow = rowsByInstance.get(cast.onTimeInstance.id);
    expect(onTimeRow?.calculationStatus).toBe(CalculationStatus.CALCULATED);
    expect(onTimeRow?.teacherPaidAmount).toBe(FULL_SESSION_PAY);
    expect(onTimeRow?.teacherPaidCurrency).toBe(CurrencyCode.SAR);
    expect(onTimeRow?.calculatedDuration).toBe(60);
    expect(onTimeRow?.isStudentAbsence).toBe(false);
    expect(onTimeRow?.isTeacherAbsence).toBe(false);

    const absentRow = rowsByInstance.get(cast.studentAbsentInstance.id);
    expect(absentRow?.calculationStatus).toBe(CalculationStatus.CALCULATED);
    expect(absentRow?.teacherPaidAmount).toBe(FULL_SESSION_PAY);
    expect(absentRow?.isStudentAbsence).toBe(true);
    expect(absentRow?.isTeacherAbsence).toBe(false);

    const unattendedRow = rowsByInstance.get(cast.unattendedInstance.id);
    expect(unattendedRow?.calculationStatus).toBe(CalculationStatus.CALCULATED);
    expect(unattendedRow?.teacherPaidAmount).toBe("0.00");
    expect(unattendedRow?.calculatedDuration).toBe(0);

    // Aggregates describe the filtered set: two full sessions paid, the
    // unattended one paid nothing, nothing left uncalculated.
    expect(page.aggregates.totalPaidAmount).toBe("240.00");
    expect(page.aggregates.totalPaidCurrency).toBe(CurrencyCode.SAR);
    expect(page.aggregates.rowCountByStatus[CalculationStatus.CALCULATED]).toBe(3);
    expect(page.aggregates.rowCountByStatus[CalculationStatus.NOT_CALCULATED]).toBe(0);
  });

  test("step 6 — teacher and student class-detail surfaces expose no payroll data", async () => {
    const teacherDetail = await ClassSessionService.getClassInstanceDetail(
      cast.teacherUser.id,
      cast.onTimeInstance.id,
      tSession,
      tErrors
    );
    expect(collectPayrollKeys(teacherDetail)).toEqual([]);
    expect(JSON.stringify(teacherDetail)).not.toContain(FULL_SESSION_PAY);
    expect(JSON.stringify(teacherDetail)).not.toContain("teacherPaid");
    expect(JSON.stringify(teacherDetail)).not.toContain("payrollNote");

    const studentDetail = await ClassSessionService.getClassInstanceDetail(
      cast.student.userId,
      cast.onTimeInstance.id,
      tSession,
      tErrors
    );
    expect(collectPayrollKeys(studentDetail)).toEqual([]);
    expect(JSON.stringify(studentDetail)).not.toContain(FULL_SESSION_PAY);
    expect(JSON.stringify(studentDetail)).not.toContain("teacherPaid");
    expect(JSON.stringify(studentDetail)).not.toContain("payrollNote");
  });

  test("step 7 — audit trail: exactly one status-transition event per calculation, never an override event", async () => {
    const instanceIds = [cast.onTimeInstance.id, cast.studentAbsentInstance.id, cast.unattendedInstance.id];
    const eventTypesByInstance = await Promise.all(
      instanceIds.map(instanceId =>
        ClassSessionService.getClassStatusEvents(cast.operatorUser.id, instanceId, tErrors).then(events =>
          events.map(event => event.eventType)
        )
      )
    );

    for (const eventTypes of eventTypesByInstance) {
      // Automatic calculation appends one PAYROLL_STATUS_TRANSITION audit row
      // (attributed, idempotent) — operator overrides are the only source of
      // PAYROLL_OVERRIDE events, so none may appear on this journey.
      expect(eventTypes.filter(type => type === PAYROLL_OVERRIDE_EVENT)).toHaveLength(0);
      expect(eventTypes.filter(type => type === PAYROLL_STATUS_TRANSITION_EVENT)).toHaveLength(1);
    }

    // The same audit-events surface is payroll-blind for the session teacher
    // and student: PAYROLL_* payloads carry amounts in fromState/toState and
    // are reserved for ACCOUNTING_PAYROLL_VIEW holders.
    const viewerEventTypes = await Promise.all(
      [cast.teacherUser.id, cast.student.userId].map(viewerUserId =>
        ClassSessionService.getClassStatusEvents(viewerUserId, cast.onTimeInstance.id, tErrors).then(events =>
          events.map(event => event.eventType)
        )
      )
    );
    for (const eventTypes of viewerEventTypes) {
      expect(eventTypes.filter(type => type.startsWith("PAYROLL_"))).toHaveLength(0);
    }
  });

  test("step 8 — denial paths: teacher, student and parent cannot read the payroll report", async () => {
    const teacherDenied = await expectJourneyError(() =>
      PayrollCalculationService.getReport(
        cast.teacherUser.id,
        { teacherId: cast.teacher.id },
        { limit: 10, offset: 0 },
        tErrors
      )
    );
    expect(teacherDenied.message).toContain(tErrors.insufficientPermissions);

    const studentDenied = await expectJourneyError(() =>
      PayrollCalculationService.getReport(cast.student.userId, {}, { limit: 10, offset: 0 }, tErrors)
    );
    expect(studentDenied.message).toContain(tErrors.insufficientPermissions);

    const parentDenied = await expectJourneyError(() =>
      PayrollCalculationService.getReport(cast.parentUser.id, {}, { limit: 10, offset: 0 }, tErrors)
    );
    expect(parentDenied.message).toContain(tErrors.insufficientPermissions);
  });
});
