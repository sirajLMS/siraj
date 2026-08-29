import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { creditTransactions, invoices, students } from "@/backend/db/schema";
import { CreditReason, NotificationEventType, PaymentGateway } from "@/backend/enum";
import { AccountingPaymentService, CreditService } from "@/backend/services/billing";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import type { AccountingPaymentReturnType, AccountingPaymentSubmitInput } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import {
  type AccountingJourneyCast,
  cleanupAccountingJourneyCast,
  dispatchTargetsForEvent,
  expectJourneyError,
  provisionAccountingJourneyCast,
  waitForEventDispatchToUser,
} from "@/test/workflows/helpers";

/**
 * Cross-actor journey: an academy admin records a paid hour-package payment
 * for a parent-linked student; the student and the linked parent then see the
 * bumped hour balance and the hour ledger entry, a view-only staff member
 * sees the payment row, an unrelated family sees nothing, and the
 * payment-recorded notification reaches only the student and the linked
 * parent.
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): accounting services spawn their own top-level
 * transactions, so fixtures are committed in beforeAll and hard-deleted in
 * afterAll via the cast helpers.
 */
describe("Record payment → hour-balance visibility journey (admin → student/parent)", () => {
  const PREFIX = `jrn_acct_${randomUUID().slice(0, 8)}`;

  let tErrors: ErrorsLabels;
  let cast: AccountingJourneyCast;
  let dispatchSpy: ReturnType<typeof spyOn>;
  let recorded: AccountingPaymentReturnType;

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    // Interception boundary for ALL notification dispatch. spyOn on the module
    // namespace is asserted empirically: the notification step below fails if
    // the real dispatcher were ever reached.
    dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);
    cast = await provisionAccountingJourneyCast(PREFIX);
  });

  afterAll(async () => {
    dispatchSpy.mockRestore();
    await cleanupAccountingJourneyCast(cast);
  });

  function submitInput(overrides: Partial<AccountingPaymentSubmitInput> = {}): AccountingPaymentSubmitInput {
    return {
      studentId: cast.student.id,
      packagePlanId: cast.plan.id,
      creditHours: 10,
      amount: 300,
      currency: CurrencyCode.USD,
      paymentGateway: PaymentGateway.PAYPAL,
      paymentDate: new Date("2026-08-01T12:00:00.000Z"),
      isPaidStatusOn: true,
      paymentNote: `${PREFIX} note`,
      ...overrides,
    };
  }

  test("step 1 — admin records the payment: invoice + payment + hour ledger + balance bump land together", async () => {
    recorded = await AccountingPaymentService.recordPayment(cast.adminUser.id, submitInput(), tErrors);

    expect(recorded.studentId).toBe(cast.student.id);
    expect(recorded.packagePlanId).toBe(cast.plan.id);
    expect(recorded.isPaidStatusOn).toBe(true);
    expect(Number(recorded.creditHours ?? "0")).toBe(10);

    // Invoice snapshot: PAID credit-hours invoice attributed to the parent.
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, recorded.invoiceId)).limit(1);
    expect(invoice?.status).toBe("PAID");
    expect(invoice?.invoiceType).toBe("CREDIT_HOURS_PACKAGE");
    expect(invoice?.parentId).toBe(cast.parent.id);
    expect(invoice?.paidDate).toBe("2026-08-01");
    expect(Number(invoice?.amount ?? "0")).toBe(300);

    // Exactly one hour-ledger PURCHASE row pointing back at the payment
    // (XOR: the class-amount column stays null on hour rows).
    const hourRows = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.studentId, cast.student.id));
    expect(hourRows).toHaveLength(1);
    expect(hourRows[0]?.reason).toBe(CreditReason.PURCHASE);
    expect(Number(hourRows[0]?.changeAmountHours ?? "0")).toBe(10);
    expect(hourRows[0]?.changeAmount).toBeNull();
    expect(hourRows[0]?.sourcePaymentId).toBe(recorded.id);

    // Denormalized balance columns moved atomically with the ledger.
    const [studentRow] = await db.select().from(students).where(eq(students.id, cast.student.id)).limit(1);
    expect(Number(studentRow?.creditHoursTotal ?? "0")).toBe(10);
    expect(Number(studentRow?.creditHoursRemaining ?? "0")).toBe(10);
  });

  test("step 2 — student and linked parent see the balance and hour ledger; VIEW-holding staff/admin see the row", async () => {
    // The family sees own balance + hour ledger entries through the real
    // IDOR-scoped service paths (associated callers need no permission).
    await Promise.all(
      [cast.studentUser.id, cast.parentUser.id].map(async actorId => {
        const balance = await AccountingPaymentService.getStudentBalance(actorId, cast.student.id, tErrors);
        expect(Number(balance.creditHoursTotal)).toBe(10);
        expect(Number(balance.creditHoursRemaining)).toBe(10);

        const ledger = await CreditService.getStudentTransactions(actorId, cast.student.id, null, tErrors, {
          hoursOnly: true,
        });
        expect(ledger.rows).toHaveLength(1);
        expect(ledger.rows[0]?.reason).toBe(CreditReason.PURCHASE);
        expect(Number(ledger.rows[0]?.changeAmountHours ?? "0")).toBe(10);
      })
    );

    // View-only staff (no MANAGE) can read the payment row and the
    // student-scoped list through ACCOUNTING_PAYMENTS_VIEW.
    const staffView = await AccountingPaymentService.getById(cast.staffViewerUser.id, recorded.id, tErrors);
    expect(staffView.studentName).toBe(cast.student.name);
    const staffList = await AccountingPaymentService.listPaginated(
      cast.staffViewerUser.id,
      { studentId: cast.student.id },
      null,
      tErrors
    );
    expect(staffList.rows.map(row => row.id)).toContain(recorded.id);

    // The admin sees everything too.
    const adminList = await AccountingPaymentService.listPaginated(
      cast.adminUser.id,
      { studentId: cast.student.id },
      null,
      tErrors
    );
    expect(adminList.rows.map(row => row.id)).toContain(recorded.id);
    const adminBalance = await AccountingPaymentService.getStudentBalance(cast.adminUser.id, cast.student.id, tErrors);
    expect(Number(adminBalance.creditHoursRemaining)).toBe(10);
  });

  test("step 3 — the unrelated family sees nothing; unassociated calls without VIEW are denied", async () => {
    await Promise.all(
      [cast.unrelatedStudentUser.id, cast.unrelatedParentUser.id].map(async outsiderId => {
        const [balanceError, detailError, listError, ledgerError] = await Promise.all([
          expectJourneyError(() => AccountingPaymentService.getStudentBalance(outsiderId, cast.student.id, tErrors)),
          expectJourneyError(() => AccountingPaymentService.getById(outsiderId, recorded.id, tErrors)),
          expectJourneyError(() =>
            AccountingPaymentService.listPaginated(outsiderId, { studentId: cast.student.id }, null, tErrors)
          ),
          expectJourneyError(() =>
            CreditService.getStudentTransactions(outsiderId, cast.student.id, null, tErrors, { hoursOnly: true })
          ),
        ]);
        expect(balanceError.message).toContain(tErrors.insufficientPermissions);
        expect(detailError.message).toContain(tErrors.insufficientPermissions);
        expect(listError.message).toContain(tErrors.insufficientPermissions);
        expect(ledgerError.message).toContain(tErrors.insufficientPermissions);
      })
    );

    // No leakage across families: the unrelated family's own hour ledger stays
    // empty even though they can legitimately read it through association.
    const ownLedger = await CreditService.getStudentTransactions(
      cast.unrelatedStudentUser.id,
      cast.unrelatedStudent.id,
      null,
      tErrors,
      { hoursOnly: true }
    );
    expect(ownLedger.rows).toHaveLength(0);

    // VIEW without MANAGE cannot record payments — denied before any write.
    const recordError = await expectJourneyError(() =>
      AccountingPaymentService.recordPayment(
        cast.staffViewerUser.id,
        submitInput({ amount: 50, paymentNote: `${PREFIX} denied` }),
        tErrors
      )
    );
    expect(recordError.message).toContain(tErrors.insufficientPermissions);
  });

  test("step 4 — ACCOUNTING_PAYMENT_RECORDED reaches the student and the linked parent only", async () => {
    // Notifications dispatch fire-and-forget after the payment commit, so the
    // spy is polled rather than asserted synchronously.
    expect(
      await waitForEventDispatchToUser(
        dispatchSpy,
        NotificationEventType.ACCOUNTING_PAYMENT_RECORDED,
        cast.studentUser.id
      )
    ).toBe(true);
    expect(
      await waitForEventDispatchToUser(
        dispatchSpy,
        NotificationEventType.ACCOUNTING_PAYMENT_RECORDED,
        cast.parentUser.id
      )
    ).toBe(true);

    const targets = dispatchTargetsForEvent(dispatchSpy, NotificationEventType.ACCOUNTING_PAYMENT_RECORDED);
    expect(targets).toContain(cast.studentUser.id);
    expect(targets).toContain(cast.parentUser.id);
    expect(targets).not.toContain(cast.adminUser.id);
    expect(targets).not.toContain(cast.staffViewerUser.id);
    expect(targets).not.toContain(cast.unrelatedStudentUser.id);
    expect(targets).not.toContain(cast.unrelatedParentUser.id);
  });
});
