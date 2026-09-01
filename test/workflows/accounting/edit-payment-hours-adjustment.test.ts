import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { StudentRepository } from "@/backend/db/repo/students";
import { creditTransactions, invoices, students } from "@/backend/db/schema";
import { CreditReason, PaymentGateway } from "@/backend/enum";
import { ConflictError } from "@/backend/lib";
import { AccountingPaymentService, CreditService } from "@/backend/services/billing";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import type { AccountingPaymentReturnType, AccountingPaymentSubmitInput } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import {
  type AccountingJourneyCast,
  cleanupAccountingJourneyCast,
  expectJourneyError,
  provisionAccountingJourneyCast,
} from "@/test/workflows/helpers";

/** String view of the adjustment reason — raw select rows type `reason` as string. */
const ADJUSTMENT_REASON: string = CreditReason.ADJUSTMENT;

async function hourLedgerRows(studentId: string) {
  return db.select().from(creditTransactions).where(eq(creditTransactions.studentId, studentId));
}

async function readStudentBalanceFacets(studentId: string) {
  const [row] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
  return {
    total: Number(row?.creditHoursTotal ?? "0"),
    remaining: Number(row?.creditHoursRemaining ?? "0"),
  };
}

/**
 * Cross-actor journey: an academy admin edits a paid hour-package payment's
 * creditHours. An upward edit writes a positive ADJUSTMENT hour-ledger row and
 * bumps the student's balance facets; a decrease within the available balance
 * writes a negative ADJUSTMENT row; the student and the linked parent observe
 * every change while the unrelated family sees nothing. A note/gateway-only
 * edit writes NO ledger row, a decrease past the available balance is rejected
 * with ConflictError, and actors without ACCOUNTING_PAYMENTS_MANAGE are denied
 * before any write.
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): accounting services spawn their own top-level
 * transactions, so fixtures are committed in beforeAll and hard-deleted in
 * afterAll via the cast helpers.
 */
describe("Edit payment hours → ADJUSTMENT ledger journey (admin → student/parent)", () => {
  const PREFIX = `jrn_acct_${randomUUID().slice(0, 8)}`;

  let tErrors: ErrorsLabels;
  let cast: AccountingJourneyCast;
  let dispatchSpy: ReturnType<typeof spyOn>;
  let recorded: AccountingPaymentReturnType;

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    // Interception boundary for ALL notification dispatch: recordPayment fires
    // ACCOUNTING_PAYMENT_RECORDED and hour-decrease edits probe the low-hours
    // threshold — none of it may reach a real channel in a journey.
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

  test("step 1 — admin records a paid 10h package payment (baseline)", async () => {
    recorded = await AccountingPaymentService.recordPayment(cast.adminUser.id, submitInput(), tErrors);

    const rows = await hourLedgerRows(cast.student.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.reason).toBe(CreditReason.PURCHASE);
    expect(Number(rows[0]?.changeAmountHours ?? "0")).toBe(10);

    const facets = await readStudentBalanceFacets(cast.student.id);
    expect(facets).toEqual({ total: 10, remaining: 10 });
  });

  test("step 2 — admin edits creditHours upward: +5 ADJUSTMENT row, balance bump, invoice sync", async () => {
    const adjusted = await AccountingPaymentService.update(
      cast.adminUser.id,
      {
        id: recorded.id,
        creditHours: 15,
        paymentGateway: PaymentGateway.BANK,
        paymentNote: `${PREFIX} topped up to 15h`,
      },
      tErrors
    );
    expect(Number(adjusted.creditHours ?? "0")).toBe(15);
    expect(adjusted.paymentGateway).toBe(PaymentGateway.BANK);
    expect(adjusted.paymentNote).toBe(`${PREFIX} topped up to 15h`);

    // A second ledger row carrying the +5 delta (XOR: class-amount stays null).
    const rows = await hourLedgerRows(cast.student.id);
    expect(rows).toHaveLength(2);
    const adjustment = rows.find(row => row.reason === ADJUSTMENT_REASON);
    if (!adjustment) throw new Error("expected an ADJUSTMENT ledger row");
    expect(Number(adjustment.changeAmountHours ?? "0")).toBe(5);
    expect(adjustment.changeAmount).toBeNull();
    expect(adjustment.sourcePaymentId).toBe(recorded.id);
    expect(adjustment.creditedByUserId).toBe(cast.adminUser.id);
    expect(adjustment.notes).toBe(`${PREFIX} topped up to 15h`);

    // The ADD path bumps both denormalized facets.
    const facets = await readStudentBalanceFacets(cast.student.id);
    expect(facets).toEqual({ total: 15, remaining: 15 });

    // The invoice's denormalized credit-hours snapshot follows the edit.
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, recorded.invoiceId)).limit(1);
    expect(Number(invoice?.creditHours ?? "0")).toBe(15);
  });

  test("step 3 — student and linked parent observe the bumped balance and both ledger entries", async () => {
    await Promise.all(
      [cast.studentUser.id, cast.parentUser.id].map(async actorId => {
        const balance = await AccountingPaymentService.getStudentBalance(actorId, cast.student.id, tErrors);
        expect(Number(balance.creditHoursTotal)).toBe(15);
        expect(Number(balance.creditHoursRemaining)).toBe(15);

        const ledger = await CreditService.getStudentTransactions(actorId, cast.student.id, null, tErrors, {
          hoursOnly: true,
        });
        expect(ledger.rows).toHaveLength(2);
        const adjustment = ledger.rows.find(row => row.reason === CreditReason.ADJUSTMENT);
        expect(Number(adjustment?.changeAmountHours ?? "0")).toBe(5);
        const purchase = ledger.rows.find(row => row.reason === CreditReason.PURCHASE);
        expect(Number(purchase?.changeAmountHours ?? "0")).toBe(10);
      })
    );
  });

  test("step 4 — decrease within balance writes a negative ADJUSTMENT row observed by the family", async () => {
    const decreased = await AccountingPaymentService.update(
      cast.adminUser.id,
      { id: recorded.id, creditHours: 12 },
      tErrors
    );
    expect(Number(decreased.creditHours ?? "0")).toBe(12);

    const rows = await hourLedgerRows(cast.student.id);
    expect(rows).toHaveLength(3);
    const negatives = rows.filter(row => row.reason === ADJUSTMENT_REASON && Number(row.changeAmountHours ?? "0") < 0);
    expect(negatives).toHaveLength(1);
    expect(Number(negatives[0]?.changeAmountHours ?? "0")).toBe(-3);
    expect(negatives[0]?.sourcePaymentId).toBe(recorded.id);

    // Clawbacks touch only creditHoursRemaining — creditHoursTotal keeps the
    // historical granted amount.
    const facets = await readStudentBalanceFacets(cast.student.id);
    expect(facets).toEqual({ total: 15, remaining: 12 });

    await Promise.all(
      [cast.studentUser.id, cast.parentUser.id].map(async actorId => {
        const balance = await AccountingPaymentService.getStudentBalance(actorId, cast.student.id, tErrors);
        expect(Number(balance.creditHoursTotal)).toBe(15);
        expect(Number(balance.creditHoursRemaining)).toBe(12);

        const ledger = await CreditService.getStudentTransactions(actorId, cast.student.id, null, tErrors, {
          hoursOnly: true,
        });
        expect(ledger.rows).toHaveLength(3);
        const negative = ledger.rows.find(row => Number(row.changeAmountHours ?? "0") < 0);
        expect(Number(negative?.changeAmountHours ?? "0")).toBe(-3);
      })
    );
  });

  test("step 5 — note/gateway-only edits insert NO ledger row and leave the balance untouched", async () => {
    // Variant A: creditHours omitted entirely.
    const noteOnly = await AccountingPaymentService.update(
      cast.adminUser.id,
      { id: recorded.id, paymentGateway: PaymentGateway.OTHER, paymentNote: `${PREFIX} gateway-only edit` },
      tErrors
    );
    expect(noteOnly.paymentGateway).toBe(PaymentGateway.OTHER);
    expect(noteOnly.paymentNote).toBe(`${PREFIX} gateway-only edit`);
    expect(Number(noteOnly.creditHours ?? "0")).toBe(12);

    // Variant B: creditHours present but unchanged.
    const sameHours = await AccountingPaymentService.update(
      cast.adminUser.id,
      { id: recorded.id, creditHours: 12, paymentNote: `${PREFIX} same-hours edit` },
      tErrors
    );
    expect(Number(sameHours.creditHours ?? "0")).toBe(12);
    expect(sameHours.paymentNote).toBe(`${PREFIX} same-hours edit`);

    expect(await hourLedgerRows(cast.student.id)).toHaveLength(3);
    const facets = await readStudentBalanceFacets(cast.student.id);
    expect(facets).toEqual({ total: 15, remaining: 12 });
  });

  test("step 6 — the unrelated family sees none of it; unassociated reads are denied", async () => {
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

    // The edits did not bleed across families: the unrelated ledger stays empty.
    const ownLedger = await CreditService.getStudentTransactions(
      cast.unrelatedStudentUser.id,
      cast.unrelatedStudent.id,
      null,
      tErrors,
      { hoursOnly: true }
    );
    expect(ownLedger.rows).toHaveLength(0);
  });

  test("step 7 — a decrease past the available balance is rejected and rolls back fully", async () => {
    // The only realistic route to "decrease past balance": hours were consumed
    // (a booking) between form-open and submit. Simulate that consumption with
    // a direct repo deduction (same precedent as the Phase 10 logic test — the
    // booking producer does not exist in v1 and a class-instance fixture would
    // add nothing to this journey).
    await db.transaction(async tx => {
      await StudentRepository.deductCreditHours(cast.student.id, tErrors, 11, undefined, tx);
    });
    expect((await readStudentBalanceFacets(cast.student.id)).remaining).toBe(1);

    // Clawing the payment down to 1h implies a -11 delta against 1 remaining.
    const conflict = await expectJourneyError(() =>
      AccountingPaymentService.update(cast.adminUser.id, { id: recorded.id, creditHours: 1 }, tErrors)
    );
    expect(conflict).toBeInstanceOf(ConflictError);
    expect(conflict.message).toBe(
      tErrors.credit.insufficientHours({ studentId: cast.student.id, remaining: 1, required: 11 })
    );

    // Full rollback: no new ledger row, balance and payment row untouched.
    expect(await hourLedgerRows(cast.student.id)).toHaveLength(3);
    const facets = await readStudentBalanceFacets(cast.student.id);
    expect(facets).toEqual({ total: 15, remaining: 1 });
    const paymentRow = await AccountingPaymentService.getById(cast.adminUser.id, recorded.id, tErrors);
    expect(Number(paymentRow.creditHours ?? "0")).toBe(12);
  });

  test("step 8 — actors without ACCOUNTING_PAYMENTS_MANAGE are denied before any write", async () => {
    // View-only staff hold VIEW but not MANAGE.
    const staffError = await expectJourneyError(() =>
      AccountingPaymentService.update(cast.staffViewerUser.id, { id: recorded.id, creditHours: 20 }, tErrors)
    );
    expect(staffError.message).toContain(tErrors.insufficientPermissions);

    // An unrelated parent has no accounting permission at all.
    const outsiderError = await expectJourneyError(() =>
      AccountingPaymentService.update(cast.unrelatedParentUser.id, { id: recorded.id, creditHours: 20 }, tErrors)
    );
    expect(outsiderError.message).toContain(tErrors.insufficientPermissions);

    // Denials happened pre-tx: nothing moved.
    expect(await hourLedgerRows(cast.student.id)).toHaveLength(3);
    const facets = await readStudentBalanceFacets(cast.student.id);
    expect(facets).toEqual({ total: 15, remaining: 1 });
    const paymentRow = await AccountingPaymentService.getById(cast.adminUser.id, recorded.id, tErrors);
    expect(Number(paymentRow.creditHours ?? "0")).toBe(12);
  });
});
