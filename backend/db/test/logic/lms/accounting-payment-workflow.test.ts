import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { StudentRepository } from "@/backend/db/repo/students";
import {
  creditTransactions,
  invoices,
  packagePlans,
  parents,
  payments,
  students,
  systemSettings,
  users,
} from "@/backend/db/schema";
import { createTestParent, createTestStudent, createTestUser } from "@/backend/db/test/entity-setup";
import { PaymentGateway } from "@/backend/enum";
import { AccountingPaymentService } from "@/backend/services/billing/accounting-payment.service";
import { PackagePlanService } from "@/backend/services/billing/package-plan.service";
import type { AccountingPaymentSubmitInput } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

async function catchError(fn: () => Promise<unknown>): Promise<Error> {
  try {
    await fn();
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    const safeError = error instanceof Error ? error : new Error("Unexpected rejection shape");
    return safeError;
  }
  throw new Error("expected the wrapped service call to throw");
}

async function creditHourCountFor(studentId: string): Promise<number> {
  const rows = await db.select().from(creditTransactions).where(eq(creditTransactions.studentId, studentId));
  return rows.length;
}

/**
 * Service-level workflows spawn their own top-level transactions and resolve
 * permissions against committed rows, so fixtures are created COMMITTED in
 * `beforeAll` and explicitly hard-deleted in `afterAll` (db/test AGENTS rule 9).
 */
describe("Accounting payment workflow", () => {
  const UNIQUE = `apwf_${randomUUID().slice(0, 8)}`;
  const PLAN_CODENAME = `${UNIQUE}_plan`;

  let tErrors: ErrorsLabels;
  let actorUserId = "";
  let unrelatedUserId = "";
  let parentUserId = "";
  let parentRowId = "";
  let studentLoginId = "";
  let studentRowId = "";
  let overflowStudentId = "";
  let overflowLoginId = "";
  let planId = "";

  /** Row ids produced by service calls during this suite (for afterAll wipe). */
  const createdInvoiceIds: string[] = [];
  const createdPlanIds: string[] = [];

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;

    await db.transaction(async t => {
      // Permissions resolve through the REAL path: super-admin actor passes every
      // guard; the unrelated user fails them naturally without any mocking.
      const actor = await createTestUser(t, { isSuperAdmin: true });
      const unrelated = await createTestUser(t);
      const parentUser = await createTestUser(t);
      const studentLogin = await createTestUser(t);
      const parentRow = await createTestParent(t, parentUser.id);
      const studentRow = await createTestStudent(t, parentRow.id, { userId: studentLogin.id });

      // Second student sharing the parent: isolates the insufficient-hours
      // overflow scenario from the main flow’s accumulated balance.
      const overflowLogin = await createTestUser(t);
      const overflowStudent = await createTestStudent(t, parentRow.id, { userId: overflowLogin.id });
      overflowStudentId = overflowStudent.id;
      overflowLoginId = overflowLogin.id;

      actorUserId = actor.id;
      unrelatedUserId = unrelated.id;
      parentUserId = parentUser.id;
      parentRowId = parentRow.id;
      studentLoginId = studentLogin.id;
      studentRowId = studentRow.id;

      const [plan] = await t
        .insert(packagePlans)
        .values({
          codename: PLAN_CODENAME.toLowerCase(),
          displayName: "Workflow Fixture Plan",
          description: null,
          creditHours: "10.0000",
          priceAmount: "300.00",
          currency: CurrencyCode.USD,
          active: true,
          sortOrder: 1,
        })
        .returning();
      planId = plan.id;
      createdPlanIds.push(plan.id);
    });
  });

  afterAll(async () => {
    if (!studentRowId) return;

    await db.transaction(async t => {
      if (!overflowStudentId) return;

      const invoiceIds = [
        ...createdInvoiceIds,
        ...(await t.select({ id: invoices.id }).from(invoices).where(eq(invoices.parentId, parentRowId))).map(
          row => row.id
        ),
      ];

      if (invoiceIds.length > 0) {
        await t.delete(creditTransactions).where(inArray(creditTransactions.sourcePaymentId, invoiceIds));
      }
      await t
        .delete(creditTransactions)
        .where(inArray(creditTransactions.studentId, [studentRowId, overflowStudentId]));

      if (invoiceIds.length > 0) {
        await t.delete(payments).where(inArray(payments.invoiceId, invoiceIds));
      }
      if (invoiceIds.length > 0) {
        await t.delete(invoices).where(inArray(invoices.id, invoiceIds));
      }

      await t.delete(packagePlans).where(inArray(packagePlans.id, createdPlanIds));
      await t.delete(students).where(inArray(students.id, [studentRowId, overflowStudentId]));
      await t.delete(parents).where(inArray(parents.id, [parentRowId]));
      await t
        .delete(users)
        .where(inArray(users.id, [actorUserId, unrelatedUserId, parentUserId, studentLoginId, overflowLoginId]));
    });
  });

  function submitInput(overrides: Partial<AccountingPaymentSubmitInput> = {}): AccountingPaymentSubmitInput {
    return {
      studentId: studentRowId,
      packagePlanId: planId,
      creditHours: 10,
      amount: 300,
      currency: CurrencyCode.USD,
      paymentGateway: PaymentGateway.PAYPAL,
      paymentDate: new Date("2026-07-05T12:00:00.000Z"),
      isPaidStatusOn: true,
      paymentNote: `${UNIQUE} note`,
      ...overrides,
    };
  }

  test("recordPayment creates invoice + payment + hour ledger in one tx and bumps the live balance", async () => {
    const recorded = await AccountingPaymentService.recordPayment(actorUserId, submitInput(), tErrors);
    createdInvoiceIds.push(recorded.invoiceId);

    expect(recorded.packageCodename).toBe(PLAN_CODENAME.toLowerCase());
    expect(recorded.packageName).toBe("Workflow Fixture Plan");
    expect(recorded.paymentGateway).toBe(PaymentGateway.PAYPAL);
    expect(recorded.isPaidStatusOn).toBe(true);

    // Invoice snapshot is PAID with paidDate = paymentDate.
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, recorded.invoiceId)).limit(1);
    expect(invoice?.status).toBe("PAID");
    expect(invoice?.paidDate).toBe("2026-07-05");
    expect(Number(invoice?.amount ?? "0")).toBe(300);

    // Exactly one hour-ledger PURCHASE row references the payment…
    expect(await creditHourCountFor(studentRowId)).toBe(1);
    const hourRows = await db.select().from(creditTransactions).where(eq(creditTransactions.studentId, studentRowId));
    expect(hourRows).toHaveLength(1);
    expect(hourRows[0]?.reason).toBe("PURCHASE");
    expect(Number(hourRows[0]?.changeAmountHours ?? "0")).toBe(10);

    // …and the denormalized student balance was bumped atomically.
    const balance = await AccountingPaymentService.getStudentBalance(actorUserId, studentRowId, tErrors);
    expect(Number(balance.creditHoursTotal)).toBe(10);
    expect(Number(balance.creditHoursRemaining)).toBe(10);
  });

  test("replaying the exact submit returns the existing payment instead of duplicating anything", async () => {
    const recorded = await AccountingPaymentService.recordPayment(actorUserId, submitInput(), tErrors);
    createdInvoiceIds.push(recorded.invoiceId);

    const replay = await AccountingPaymentService.recordPayment(actorUserId, submitInput(), tErrors);
    expect(replay.id).toBe(recorded.id);
    expect(await creditHourCountFor(studentRowId)).toBe(1);

    // Varying ONLY the gateway yields a NEW payment reusing the SAME invoice
    // (gateway participates in payment idempotency but not invoice derivation).
    const secondGateway = await AccountingPaymentService.recordPayment(
      actorUserId,
      submitInput({ paymentGateway: PaymentGateway.BANK }),
      tErrors
    );
    createdInvoiceIds.push(secondGateway.invoiceId);
    expect(secondGateway.id).not.toBe(recorded.id);
    expect(secondGateway.invoiceId).toBe(recorded.invoiceId);
    expect(secondGateway.paymentGateway).toBe(PaymentGateway.BANK);

    const siblings = await AccountingPaymentService.getById(actorUserId, secondGateway.id, tErrors);
    expect(siblings.studentName).toBe("Test Student");
  });

  test("submitting against an archived plan rejects with the localized archived error", async () => {
    await PackagePlanService.archive(actorUserId, planId, tErrors);
    try {
      const error = await catchError(() =>
        AccountingPaymentService.recordPayment(
          actorUserId,
          submitInput({ paymentGateway: PaymentGateway.OTHER, amount: 310 }),
          tErrors
        )
      );
      expect(error.message).toBe(tErrors.package.planArchived(planId));
    } finally {
      // Reactivate the plan so later fixtures keep working regardless of order.
      await db.update(packagePlans).set({ active: true, deletedAt: null }).where(eq(packagePlans.id, planId));
    }
  });

  test("toggle lifecycle honors sibling rule, optimistic lock and the auto-flip setting", async () => {
    const primary = await AccountingPaymentService.recordPayment(
      actorUserId,
      submitInput({ paymentDate: new Date("2026-07-06T08:00:00.000Z") }),
      tErrors
    );
    createdInvoiceIds.push(primary.invoiceId);

    const sibling = await AccountingPaymentService.recordPayment(
      actorUserId,
      submitInput({
        paymentGateway: PaymentGateway.WESTERN_UNION,
        // Same content-date as the primary so the gateway-varied submission
        // lands on the SHARED derived invoice (split-payment path).
        paymentDate: new Date("2026-07-06T08:00:00.000Z"),
      }),
      tErrors
    );

    const readStatus = async () => {
      const [row] = await db.select().from(invoices).where(eq(invoices.id, primary.invoiceId)).limit(1);
      return row ?? undefined;
    };
    expect((await readStatus())?.status).toBe("PAID");

    // Sibling still paid → invoice intentionally stays PAID.
    await AccountingPaymentService.togglePaidStatus(actorUserId, { id: primary.id, isPaidStatusOn: false }, tErrors);
    expect((await readStatus())?.status).toBe("PAID");

    // Last paid sibling flips off → invoice drops to UNPAID and loses paidDate.
    await AccountingPaymentService.togglePaidStatus(actorUserId, { id: sibling.id, isPaidStatusOn: false }, tErrors);
    const unpaidState = await readStatus();
    expect(unpaidState?.status).toBe("UNPAID");
    expect(unpaidState?.paidDate).toBeNull();

    // Stale expectedInvoiceVersion surfaces the typed conflict error.
    const staleExpected = (unpaidState?.version ?? 0) - 5;
    const staleError = await catchError(() =>
      AccountingPaymentService.togglePaidStatus(
        actorUserId,
        { id: sibling.id, isPaidStatusOn: true, expectedInvoiceVersion: staleExpected },
        tErrors
      )
    );
    expect(staleError.message).toBe(
      tErrors.billing.invoiceVersionMismatch({
        id: primary.invoiceId,
        expectedVersion: staleExpected,
        gotVersion: unpaidState?.version ?? 0,
      })
    );

    // Disabling auto-flip decouples the two ledgers' statuses.
    const originalSetting = "true";
    await db
      .update(systemSettings)
      .set({ value: "false", updatedAt: new Date() })
      .where(eq(systemSettings.key, "accounting_paid_toggle_auto_flips_invoice"));
    try {
      await AccountingPaymentService.togglePaidStatus(
        actorUserId,
        { id: sibling.id, isPaidStatusOn: true, expectedInvoiceVersion: unpaidState?.version },
        tErrors
      );
      const decoupled = await readStatus();
      expect(decoupled?.status).toBe("UNPAID");

      await AccountingPaymentService.togglePaidStatus(actorUserId, { id: primary.id, isPaidStatusOn: true }, tErrors);
      expect((await readStatus())?.status).toBe("UNPAID");
    } finally {
      await db
        .update(systemSettings)
        .set({ value: originalSetting, updatedAt: new Date() })
        .where(eq(systemSettings.key, "accounting_paid_toggle_auto_flips_invoice"));
    }
  });

  test("note-only edits skip the ledger while hour edits write ADJUSTMENT rows and move balances", async () => {
    const balanceBeforeEdits = await AccountingPaymentService.getStudentBalance(actorUserId, studentRowId, tErrors);
    const recorded = await AccountingPaymentService.recordPayment(
      actorUserId,
      submitInput({ amount: 250, creditHours: 4 }),
      tErrors
    );
    createdInvoiceIds.push(recorded.invoiceId);

    const notesBefore = await creditHourCountFor(studentRowId);
    const noteOnly = await AccountingPaymentService.update(
      actorUserId,
      { id: recorded.id, paymentNote: "gateway-only edit" },
      tErrors
    );
    expect(noteOnly.paymentNote).toBe("gateway-only edit");
    expect(await creditHourCountFor(studentRowId)).toBe(notesBefore);

    // Increase hours: ADJUSTMENT (+6) + invoice snapshot refresh + balance bump.
    const increased = await AccountingPaymentService.update(actorUserId, { id: recorded.id, creditHours: 10 }, tErrors);
    expect(Number(increased.creditHours ?? "0")).toBe(10);
    const adjustmentsAfterIncrease = await creditHourCountFor(studentRowId);
    expect(adjustmentsAfterIncrease).toBe(notesBefore + 1);
    const midBalance = await AccountingPaymentService.getStudentBalance(actorUserId, studentRowId, tErrors);
    expect(Number(midBalance.creditHoursRemaining)).toBeCloseTo(
      Number(balanceBeforeEdits.creditHoursRemaining) + 4 + 6,
      6
    );

    // Decrease within balance mirrors the delta with a negative adjustment row.
    await AccountingPaymentService.update(actorUserId, { id: recorded.id, creditHours: 7 }, tErrors);
    const decreasedBalance = await AccountingPaymentService.getStudentBalance(actorUserId, studentRowId, tErrors);
    expect(Number(decreasedBalance.creditHoursRemaining)).toBeCloseTo(Number(midBalance.creditHoursRemaining) - 3, 6);

    // Decreasing past the available balance is rejected with the typed payload.
    // Isolated on the overflow student so shared-balance noise cannot flake it:
    // they own exactly 2 hours; requesting 6 implies a -4 deduction against 2.
    // The only realistic route to "decrease past balance" is concurrent
    // consumption (a booking) between form-open and submit: buy 5 hours, a
    // booking burns 4 of them, THEN an admin edit tries to claw back 4.
    const overflowRecorded = await AccountingPaymentService.recordPayment(
      actorUserId,
      submitInput({ studentId: overflowStudentId, amount: 40, creditHours: 5 }),
      tErrors
    );
    createdInvoiceIds.push(overflowRecorded.invoiceId);
    expect(
      Number(
        (await AccountingPaymentService.getStudentBalance(actorUserId, overflowStudentId, tErrors)).creditHoursRemaining
      )
    ).toBe(5);

    await db.transaction(async tx => {
      await StudentRepository.deductCreditHours(overflowStudentId, tErrors, 4, undefined, tx);
    });
    expect(
      Number(
        (await AccountingPaymentService.getStudentBalance(actorUserId, overflowStudentId, tErrors)).creditHoursRemaining
      )
    ).toBe(1);

    // Editing the payment down to 1 hour implies a -4 deduction against 1 left.
    const drainToZero = await catchError(() =>
      AccountingPaymentService.update(actorUserId, { id: overflowRecorded.id, creditHours: 1 }, tErrors)
    );
    expect(drainToZero.message).toBe(
      tErrors.credit.insufficientHours({ studentId: overflowStudentId, remaining: 1, required: 4 })
    );
  });

  test("IDOR guards: unrelated callers without VIEW cannot read balances or list payments", async () => {
    const forbidden = tErrors.insufficientPermissions;

    const balanceError = await catchError(() =>
      AccountingPaymentService.getStudentBalance(unrelatedUserId, studentRowId, tErrors)
    );
    expect(balanceError.message).toBe(forbidden);

    const listError = await catchError(() =>
      AccountingPaymentService.listPaginated(unrelatedUserId, {}, null, tErrors)
    );
    expect(listError.message).toBe(forbidden);

    // Super-admin listing succeeds (admin view-all needs VIEW only).
    const adminList = await AccountingPaymentService.listPaginated(actorUserId, {}, null, tErrors);
    expect(adminList.totalCount).toBeGreaterThan(0);
    expect(Array.isArray(adminList.rows)).toBe(true);
  });
});
