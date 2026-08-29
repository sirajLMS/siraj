import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { creditTransactions, students } from "@/backend/db/schema";
import { CreditAdjustmentType, CreditReason } from "@/backend/enum";
import { CreditService, deriveAdjustmentIdempotencyKey } from "@/backend/services/billing";
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
 * Cross-actor journey: an accounting operator submits credit Add / Subtract
 * adjustments for a student; the student and the linked parent observe the
 * resulting balance and the ledger rows, while an unrelated family, a
 * genuinely permissionless user, and a legacy credits.manage-only user are
 * denied. Repeated and oversized submissions write nothing new.
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): the credit service spawns its own top-level
 * transactions, so fixtures are committed in beforeAll and hard-deleted in
 * afterAll via the cast helpers.
 */
describe("Credit adjustment journey — operator Add/Subtract and family visibility", () => {
  const PREFIX = `jrn_cadj_${randomUUID().slice(0, 8)}`;
  const ADD_HOURS = 4;
  const SUBTRACT_HOURS = 2;

  let tErrors: ErrorsLabels;
  let cast: AccountingJourneyCast;
  let extra: AdjustmentExtraCast;
  let dispatchSpy: ReturnType<typeof spyOn>;
  let auditSpy: ReturnType<typeof spyOn>;
  let addedRowId: string;

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    // Notification dispatch never reaches a real channel in journeys; audit is
    // captured instead of written so no side-effect rows need cleanup.
    dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);
    auditSpy = spyOn(AuditService, "createManyAuditLogs").mockResolvedValue([]);
    cast = await provisionAccountingJourneyCast(PREFIX);
    extra = await provisionAdjustmentExtraCast(PREFIX);
  });

  afterAll(async () => {
    dispatchSpy.mockRestore();
    auditSpy.mockRestore();
    await cleanupAccountingJourneyCast(cast);
    await cleanupAdjustmentExtraCast(extra);
  });

  function adjustInput(overrides: Partial<CreditAdjustmentInput> = {}): CreditAdjustmentInput {
    return { studentId: cast.student.id, adjustmentType: CreditAdjustmentType.ADD, hours: ADD_HOURS, ...overrides };
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

  test("step 1 — an Add adjustment commits the positive ledger row and moves the balance by +4", async () => {
    const input = adjustInput({ notes: `${PREFIX} add` });
    const recorded = await CreditService.recordAdjustment(cast.adminUser.id, input, tErrors);

    addedRowId = recorded.id;
    expect(recorded.studentId).toBe(cast.student.id);
    expect(recorded.reason).toBe(CreditReason.CREDIT_ADJUSTMENT_ADD);
    expect(recorded.adjustmentType).toBe(CreditAdjustmentType.ADD);
    expect(recorded.changeAmount).toBe(ADD_HOURS);
    expect(recorded.changeAmountHours).toBeNull();
    expect(recorded.creditedByUserId).toBe(cast.adminUser.id);
    expect(recorded.notes).toBe(`${PREFIX} add`);
    expect(recorded.idempotencyKey).toBe(deriveAdjustmentIdempotencyKey(input));
    expect(recorded.carryoverTeacherId).toBeNull();

    const ledger = await ledgerRows();
    expect(ledger).toHaveLength(1);
    expect(ledger[0]?.id).toBe(recorded.id);

    const balanceRow = await studentBalanceRow();
    expect(balanceRow?.classesTotal).toBe(ADD_HOURS);
    expect(balanceRow?.classesRemaining).toBe(ADD_HOURS);
  });

  test("step 2 — a Subtract adjustment commits the negative ledger row and lowers the remaining balance", async () => {
    const recorded = await CreditService.recordAdjustment(
      cast.adminUser.id,
      adjustInput({
        adjustmentType: CreditAdjustmentType.SUBTRACT,
        hours: SUBTRACT_HOURS,
        notes: `${PREFIX} subtract`,
      }),
      tErrors
    );

    expect(recorded.reason).toBe(CreditReason.CREDIT_ADJUSTMENT_SUBTRACT);
    expect(recorded.adjustmentType).toBe(CreditAdjustmentType.SUBTRACT);
    expect(recorded.changeAmount).toBe(-SUBTRACT_HOURS);

    const ledger = await ledgerRows();
    expect(ledger).toHaveLength(2);

    const balanceRow = await studentBalanceRow();
    expect(balanceRow?.classesTotal).toBe(ADD_HOURS);
    expect(balanceRow?.classesRemaining).toBe(ADD_HOURS - SUBTRACT_HOURS);
  });

  test("step 3 — the student and the linked parent see both rows and the adjusted balance", async () => {
    await Promise.all(
      [cast.studentUser.id, cast.parentUser.id].map(async actorId => {
        const balance = await CreditService.getStudentBalance(actorId, cast.student.id, tErrors);
        expect(balance.classesTotal).toBe(ADD_HOURS);
        expect(balance.classesRemaining).toBe(ADD_HOURS - SUBTRACT_HOURS);

        const ledger = await CreditService.getStudentTransactions(actorId, cast.student.id, null, tErrors);
        expect(ledger.totalCount).toBe(2);

        const addRow = ledger.rows.find(row => row.id === addedRowId);
        const subtractRow = ledger.rows.find(row => row.changeAmount === -SUBTRACT_HOURS);
        expect(addRow?.reason).toBe(CreditReason.CREDIT_ADJUSTMENT_ADD);
        expect(addRow?.adjustmentType).toBe(CreditAdjustmentType.ADD);
        expect(subtractRow?.reason).toBe(CreditReason.CREDIT_ADJUSTMENT_SUBTRACT);
        expect(subtractRow?.adjustmentType).toBe(CreditAdjustmentType.SUBTRACT);
      })
    );

    // The operator's own read goes through the permission-based path.
    const operatorBalance = await CreditService.getStudentBalance(cast.adminUser.id, cast.student.id, tErrors);
    expect(operatorBalance.classesRemaining).toBe(ADD_HOURS - SUBTRACT_HOURS);
  });

  test("step 4 — the unrelated family sees nothing of the target student, and its own ledger stays empty", async () => {
    await Promise.all(
      [cast.unrelatedStudentUser.id, cast.unrelatedParentUser.id].map(async outsiderId => {
        const [balanceError, ledgerError] = await Promise.all([
          expectJourneyError(() => CreditService.getStudentBalance(outsiderId, cast.student.id, tErrors)),
          expectJourneyError(() => CreditService.getStudentTransactions(outsiderId, cast.student.id, null, tErrors)),
        ]);
        expect(balanceError.message).toContain(tErrors.insufficientPermissions);
        expect(ledgerError.message).toContain(tErrors.insufficientPermissions);
      })
    );

    const ownLedger = await CreditService.getStudentTransactions(
      cast.unrelatedStudentUser.id,
      cast.unrelatedStudent.id,
      null,
      tErrors
    );
    expect(ownLedger.rows).toHaveLength(0);
  });

  test("step 5 — actors without the manage permission are denied before any write", async () => {
    // Genuinely permissionless actor: no group memberships at all.
    const permissionlessError = await expectJourneyError(() =>
      CreditService.recordAdjustment(extra.permissionlessUser.id, adjustInput({ hours: 1 }), tErrors)
    );
    expect(permissionlessError.message).toContain(tErrors.insufficientPermissions);

    // Legacy credit-portal permission alone is not the adjustment permission:
    // the actor can still read the balance but is denied the write.
    const legacyBalance = await CreditService.getStudentBalance(extra.legacyCreditsUser.id, cast.student.id, tErrors);
    expect(legacyBalance.classesRemaining).toBe(ADD_HOURS - SUBTRACT_HOURS);
    const legacyError = await expectJourneyError(() =>
      CreditService.recordAdjustment(extra.legacyCreditsUser.id, adjustInput({ hours: 1 }), tErrors)
    );
    expect(legacyError.message).toContain(tErrors.insufficientPermissions);

    // The view-only staff member (payment VIEW, no credits MANAGE) is denied too.
    const staffError = await expectJourneyError(() =>
      CreditService.recordAdjustment(cast.staffViewerUser.id, adjustInput({ hours: 1 }), tErrors)
    );
    expect(staffError.message).toContain(tErrors.insufficientPermissions);

    // No denial path wrote anything.
    expect(await ledgerRows()).toHaveLength(2);
    const balanceRow = await studentBalanceRow();
    expect(balanceRow?.classesTotal).toBe(ADD_HOURS);
    expect(balanceRow?.classesRemaining).toBe(ADD_HOURS - SUBTRACT_HOURS);
  });

  test("step 6 — a repeated submission returns the first row; an oversized subtraction is rejected atomically", async () => {
    // Same identifying payload (different notes still collapse) → first row.
    const resubmitted = await CreditService.recordAdjustment(
      cast.adminUser.id,
      adjustInput({ notes: `${PREFIX} add retry` }),
      tErrors
    );
    expect(resubmitted.id).toBe(addedRowId);

    expect(await ledgerRows()).toHaveLength(2);
    let balanceRow = await studentBalanceRow();
    expect(balanceRow?.classesTotal).toBe(ADD_HOURS);
    expect(balanceRow?.classesRemaining).toBe(ADD_HOURS - SUBTRACT_HOURS);

    // Subtracting beyond the remaining balance leaves zero writes behind.
    const insufficientError = await expectJourneyError(() =>
      CreditService.recordAdjustment(
        cast.adminUser.id,
        adjustInput({ adjustmentType: CreditAdjustmentType.SUBTRACT, hours: 99 }),
        tErrors
      )
    );
    expect(insufficientError.message).toBe(
      tErrors.credit.insufficientBalance({ studentId: cast.student.id, remaining: ADD_HOURS - SUBTRACT_HOURS })
    );

    expect(await ledgerRows()).toHaveLength(2);
    balanceRow = await studentBalanceRow();
    expect(balanceRow?.classesTotal).toBe(ADD_HOURS);
    expect(balanceRow?.classesRemaining).toBe(ADD_HOURS - SUBTRACT_HOURS);
  });

  test("step 7 — every committed adjustment emits an UPDATE audit entry; nothing notifies a user", async () => {
    // Add, Subtract, and the collapsed re-submit (a successful adjustment
    // record) each emit exactly one audit entry.
    expect(auditSpy).toHaveBeenCalledTimes(3);

    const addAudit = auditSpy.mock.calls[0]?.[0]?.[0];
    expect(addAudit?.actorUserId).toBe(cast.adminUser.id);
    expect(addAudit?.entityType).toBe("STUDENT");
    expect(addAudit?.entityId).toBe(cast.student.id);
    expect(addAudit?.action).toBe("UPDATE");
    expect(addAudit?.description).toBe("Credit adjustment ADD");
    expect(addAudit?.newState?.creditTransactionId).toBe(addedRowId);
    expect(addAudit?.newState?.changeAmount).toBe(ADD_HOURS);

    const subtractAudit = auditSpy.mock.calls[1]?.[0]?.[0];
    expect(subtractAudit?.description).toBe("Credit adjustment SUBTRACT");
    expect(subtractAudit?.newState?.changeAmount).toBe(-SUBTRACT_HOURS);

    // Adjustments carry no user-facing notification fan-out.
    expect(dispatchSpy).toHaveBeenCalledTimes(0);
  });
});
