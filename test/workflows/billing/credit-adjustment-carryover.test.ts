import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { creditTransactions, students, teachers, users } from "@/backend/db/schema";
import { createTestTeacher, createTestUser } from "@/backend/db/test/entity-setup";
import { CreditAdjustmentType, CreditReason } from "@/backend/enum";
import { CreditService } from "@/backend/services/billing";
import * as CarryoverHandoff from "@/backend/services/billing/carryover-handoff";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import { AuditService } from "@/backend/services/system/audit.service";
import type { CreditAdjustmentInput } from "@/backend/types";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import {
  type AccountingJourneyCast,
  type AdjustmentExtraCast,
  cleanupAccountingJourneyCast,
  cleanupAdjustmentExtraCast,
  expectJourneyError,
  provisionAccountingJourneyCast,
  provisionAdjustmentExtraCast,
} from "@/test/workflows/helpers";

/**
 * Cross-actor journey: an accounting operator records subtract-with-carryover
 * adjustments, deducting the student's credits while handing the payout
 * obligation metadata off to the carryover settlement boundary. The student
 * and linked parent see the carryover row (teacher + date range) in the
 * credit history; unrelated actors gain nothing. The carryover payouts table
 * is not deployed in this schema yet, so the settlement boundary is observed
 * as an invocation that resolves cleanly without writing any payout row —
 * the ledger columns carry the full carryover record.
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): committed fixtures in beforeAll, tracked hard
 * deletes in afterAll.
 */
describe("Credit adjustment journey — Subtract With Carryover handoff and visibility", () => {
  const PREFIX = `jrn_co_${randomUUID().slice(0, 8)}`;
  const SEED_HOURS = 6;

  let tErrors: ErrorsLabels;
  let cast: AccountingJourneyCast;
  let extra: AdjustmentExtraCast;
  let dispatchSpy: ReturnType<typeof spyOn>;
  let auditSpy: ReturnType<typeof spyOn>;
  let carryoverSpy: ReturnType<typeof spyOn>;
  let firstCarryoverId: string;

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);
    auditSpy = spyOn(AuditService, "createManyAuditLogs").mockResolvedValue([]);
    // spyOn without a mock keeps the real no-op settlement boundary
    // underneath, so the journey proves the handoff is invoked AND resolves.
    carryoverSpy = spyOn(CarryoverHandoff, "maybeInsertCarryoverBalanceEntry");
    cast = await provisionAccountingJourneyCast(PREFIX);
    extra = await provisionAdjustmentExtraCast(PREFIX);
  });

  afterAll(async () => {
    dispatchSpy.mockRestore();
    auditSpy.mockRestore();
    carryoverSpy.mockRestore();
    await cleanupAccountingJourneyCast(cast);
    await cleanupAdjustmentExtraCast(extra);
  });

  function carryoverInput(overrides: Partial<CreditAdjustmentInput> = {}): CreditAdjustmentInput {
    return {
      studentId: cast.student.id,
      adjustmentType: CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER,
      hours: 1,
      notes: `${PREFIX} carryover`,
      carryoverTeacherId: extra.teacher.id,
      carryoverFromDate: "2026-03-01",
      carryoverToDate: "2026-03-01",
      carryoverPaymentDate: "2026-02-15",
      ...overrides,
    };
  }

  async function ledgerRows() {
    return db.select().from(creditTransactions).where(eq(creditTransactions.studentId, cast.student.id));
  }

  async function studentBalanceRow() {
    const [row] = await db
      .select({ classesTotal: students.classesTotal, classesRemaining: students.classesRemaining })
      .from(students)
      .where(eq(students.id, cast.student.id))
      .limit(1);
    return row;
  }

  test("step 1 — the operator seeds the student's balance with an Add adjustment", async () => {
    const seeded = await CreditService.recordAdjustment(
      cast.adminUser.id,
      {
        studentId: cast.student.id,
        adjustmentType: CreditAdjustmentType.ADD,
        hours: SEED_HOURS,
        notes: `${PREFIX} seed`,
      },
      tErrors
    );
    expect(seeded.changeAmount).toBe(SEED_HOURS);

    const balanceRow = await studentBalanceRow();
    expect(balanceRow?.classesTotal).toBe(SEED_HOURS);
    expect(balanceRow?.classesRemaining).toBe(SEED_HOURS);
  });

  test("step 2 — a carryover adjustment deducts, stamps the carryover columns, and hands off exactly once", async () => {
    // Single-day range plus a past payment date are both legitimate values.
    const recorded = await CreditService.recordAdjustment(
      cast.adminUser.id,
      carryoverInput({ hours: 2, notes: `${PREFIX} carryover first` }),
      tErrors
    );
    firstCarryoverId = recorded.id;

    expect(recorded.reason).toBe(CreditReason.CREDIT_ADJUSTMENT_CARRYOVER);
    expect(recorded.adjustmentType).toBe(CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER);
    expect(recorded.changeAmount).toBe(-2);
    expect(recorded.carryoverTeacherId).toBe(extra.teacher.id);
    expect(recorded.carryoverFromDate).toBe("2026-03-01");
    expect(recorded.carryoverToDate).toBe("2026-03-01");
    expect(recorded.carryoverPaymentDate).toBe("2026-02-15");

    const balanceRow = await studentBalanceRow();
    expect(balanceRow?.classesTotal).toBe(SEED_HOURS);
    expect(balanceRow?.classesRemaining).toBe(SEED_HOURS - 2);

    expect(carryoverSpy).toHaveBeenCalledTimes(1);
    const [handoffTx, payload] = carryoverSpy.mock.calls[0] ?? [];
    expect(payload).toBeDefined();
    expect(payload?.creditTransactionId).toBe(recorded.id);
    expect(payload?.teacherId).toBe(extra.teacher.id);
    expect(payload?.studentId).toBe(cast.student.id);
    expect(payload?.fromDate).toBe("2026-03-01");
    expect(payload?.toDate).toBe("2026-03-01");
    expect(payload?.paymentDate).toBe("2026-02-15");
    expect(payload?.hours).toBe(2);
    expect(payload?.approvedByUserId).toBe(cast.adminUser.id);
    // The settlement boundary received a live transaction handle and resolved.
    expect(handoffTx).toBeDefined();
  });

  test("step 3 — the student and linked parent see the carryover row with teacher and dates", async () => {
    await Promise.all(
      [cast.studentUser.id, cast.parentUser.id].map(async actorId => {
        const ledger = await CreditService.getStudentTransactions(actorId, cast.student.id, null, tErrors);
        const row = ledger.rows.find(entry => entry.id === firstCarryoverId);
        expect(row?.reason).toBe(CreditReason.CREDIT_ADJUSTMENT_CARRYOVER);
        expect(row?.carryoverTeacherId).toBe(extra.teacher.id);
        expect(row?.carryoverFromDate).toBe("2026-03-01");
        expect(row?.carryoverToDate).toBe("2026-03-01");
        expect(row?.carryoverPaymentDate).toBe("2026-02-15");
      })
    );

    // Unrelated actors stay blind to both the ledger and the balance.
    const outsiderError = await expectJourneyError(() =>
      CreditService.getStudentTransactions(cast.unrelatedParentUser.id, cast.student.id, null, tErrors)
    );
    expect(outsiderError.message).toContain(tErrors.insufficientPermissions);

    // The unrelated teacher receives nothing: no ledger row references them.
    const strayRows = await db
      .select({ id: creditTransactions.id })
      .from(creditTransactions)
      .where(eq(creditTransactions.carryoverTeacherId, extra.unrelatedTeacher.id));
    expect(strayRows).toHaveLength(0);
  });

  test("step 4 — a carryover range that starts in the future is accepted", async () => {
    const recorded = await CreditService.recordAdjustment(
      cast.adminUser.id,
      carryoverInput({
        carryoverFromDate: "2027-01-10",
        carryoverToDate: "2027-01-20",
        carryoverPaymentDate: "2026-08-01",
      }),
      tErrors
    );
    expect(recorded.changeAmount).toBe(-1);
    expect(recorded.carryoverFromDate).toBe("2027-01-10");

    const balanceRow = await studentBalanceRow();
    expect(balanceRow?.classesRemaining).toBe(SEED_HOURS - 3);
    expect(carryoverSpy).toHaveBeenCalledTimes(2);
  });

  test("step 5 — two operators concurrently submitting distinct payloads both commit", async () => {
    const [first, second] = await Promise.all([
      CreditService.recordAdjustment(
        cast.adminUser.id,
        carryoverInput({ carryoverFromDate: "2026-04-01", carryoverToDate: "2026-04-02" }),
        tErrors
      ),
      CreditService.recordAdjustment(
        extra.secondAdminUser.id,
        carryoverInput({ carryoverFromDate: "2026-04-01", carryoverToDate: "2026-04-03" }),
        tErrors
      ),
    ]);

    expect(first.id).not.toBe(second.id);
    expect(first.changeAmount).toBe(-1);
    expect(second.changeAmount).toBe(-1);
    expect(second.creditedByUserId).toBe(extra.secondAdminUser.id);

    const balanceRow = await studentBalanceRow();
    expect(balanceRow?.classesRemaining).toBe(SEED_HOURS - 5);
    expect(carryoverSpy).toHaveBeenCalledTimes(4);
  });

  test("step 6 — a repeated submission returns the first row and hands off nothing twice", async () => {
    const resubmitted = await CreditService.recordAdjustment(
      cast.adminUser.id,
      carryoverInput({
        carryoverFromDate: "2026-04-01",
        carryoverToDate: "2026-04-02",
        notes: `${PREFIX} carryover retry`,
      }),
      tErrors
    );

    const original = (await ledgerRows()).find(
      row =>
        row.carryoverFromDate === "2026-04-01" &&
        row.carryoverToDate === "2026-04-02" &&
        row.creditedByUserId === cast.adminUser.id
    );
    if (!original) {
      throw new Error("the committed carryover row was not found for the repeated submission");
    }
    expect(resubmitted.id).toBe(original.id);

    expect(await ledgerRows()).toHaveLength(5);
    expect(carryoverSpy).toHaveBeenCalledTimes(4);
    const balanceRow = await studentBalanceRow();
    expect(balanceRow?.classesRemaining).toBe(SEED_HOURS - 5);
  });

  test("step 7 — every denial path writes nothing and hands off nothing", async () => {
    // Oversized subtraction: the whole transaction reports and rolls back.
    const insufficientError = await expectJourneyError(() =>
      CreditService.recordAdjustment(
        cast.adminUser.id,
        carryoverInput({ hours: 99, carryoverFromDate: "2026-05-01", carryoverToDate: "2026-05-02" }),
        tErrors
      )
    );
    expect(insufficientError.message).toBe(
      tErrors.credit.insufficientBalance({ studentId: cast.student.id, remaining: SEED_HOURS - 5 })
    );

    // Unknown teacher id.
    const unknownTeacherId = randomUUID();
    const unknownTeacherError = await expectJourneyError(() =>
      CreditService.recordAdjustment(
        cast.adminUser.id,
        carryoverInput({
          carryoverTeacherId: unknownTeacherId,
          carryoverFromDate: "2026-05-10",
          carryoverToDate: "2026-05-11",
        }),
        tErrors
      )
    );
    expect(unknownTeacherError.message).toBe(tErrors.teacher.teacherNotFound(unknownTeacherId));

    // Teacher deleted between form-open and submit.
    const deletedTeacherId = await db.transaction(async tx => {
      const goneUser = await createTestUser(tx, { name: `${PREFIX} Gone Teacher` });
      const goneTeacher = await createTestTeacher(tx, goneUser.id);
      await tx.delete(teachers).where(eq(teachers.id, goneTeacher.id));
      await tx.delete(users).where(eq(users.id, goneUser.id));
      return goneTeacher.id;
    });
    const deletedTeacherError = await expectJourneyError(() =>
      CreditService.recordAdjustment(
        cast.adminUser.id,
        carryoverInput({
          carryoverTeacherId: deletedTeacherId,
          carryoverFromDate: "2026-05-20",
          carryoverToDate: "2026-05-21",
        }),
        tErrors
      )
    );
    expect(deletedTeacherError.message).toBe(tErrors.teacher.teacherNotFound(deletedTeacherId));

    // Permissionless operator.
    const forbiddenError = await expectJourneyError(() =>
      CreditService.recordAdjustment(extra.permissionlessUser.id, carryoverInput(), tErrors)
    );
    expect(forbiddenError.message).toContain(tErrors.insufficientPermissions);

    // Nothing new landed anywhere.
    expect(await ledgerRows()).toHaveLength(5);
    expect(carryoverSpy).toHaveBeenCalledTimes(4);
    const balanceRow = await studentBalanceRow();
    expect(balanceRow?.classesTotal).toBe(SEED_HOURS);
    expect(balanceRow?.classesRemaining).toBe(SEED_HOURS - 5);
  });

  test("step 8 — committed carryovers audit the actor, student, teacher and hours; nothing notifies a user", async () => {
    // Add seed + four carryovers + the collapsed resubmission.
    expect(auditSpy).toHaveBeenCalledTimes(6);

    const carryoverAudit = auditSpy.mock.calls[1]?.[0]?.[0];
    expect(carryoverAudit?.actorUserId).toBe(cast.adminUser.id);
    expect(carryoverAudit?.entityType).toBe("STUDENT");
    expect(carryoverAudit?.entityId).toBe(cast.student.id);
    expect(carryoverAudit?.action).toBe("UPDATE");
    expect(carryoverAudit?.description).toBe("Credit adjustment SUBTRACT_WITH_CARRYOVER");
    expect(carryoverAudit?.newState?.creditTransactionId).toBe(firstCarryoverId);
    expect(carryoverAudit?.newState?.changeAmount).toBe(-2);
    expect(carryoverAudit?.newState?.carryoverTeacherId).toBe(extra.teacher.id);

    expect(dispatchSpy).toHaveBeenCalledTimes(0);
  });
});
