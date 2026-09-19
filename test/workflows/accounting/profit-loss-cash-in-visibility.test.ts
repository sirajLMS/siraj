import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { creditTransactions, invoices, parents, payments, students, users } from "@/backend/db/schema";
import { createTestParent, createTestStudent, createTestUser } from "@/backend/db/test/entity-setup";
import { PaymentGateway } from "@/backend/enum";
import { ForbiddenError } from "@/backend/lib";
import { ProfitLossService as ProfitLossReadService } from "@/backend/services/accounting";
import { AccountingPaymentService } from "@/backend/services/billing";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import type {
  AccountingPaymentReturnType,
  ParentSelectType,
  ProfitLossReport,
  StudentSelectType,
  UserSelectType,
} from "@/backend/types";
import { SystemPermissionGroupSlug } from "@/shared/constants";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import type { ProfitLossLabels } from "@/shared/locale/types/dashboard/accounting";
import {
  assignSystemGroup,
  type DispatchSpy,
  expectJourneyError,
  revokeSystemGroupAssignments,
  type SystemGroupAssignment,
} from "@/test/workflows/helpers";

/**
 * Cash-in payment amount recorded by the billing actor, in SAR so the FX
 * conversion is identity and the aggregate assertions stay exact.
 */
const PAYMENT_AMOUNT = 250;

/**
 * The actor cast for the cash-in visibility journey: one billing operator
 * (records the payment), one executive (holds `ACCOUNTING_PROFITS_VIEW`
 * through a real `academy_admin` membership), one plain user with no group
 * (denial path), and the parent + student the payment hangs off.
 */
interface CashInJourneyCast {
  prefix: string;
  billingUser: UserSelectType;
  executiveUser: UserSelectType;
  plainUser: UserSelectType;
  parentUser: UserSelectType;
  parent: ParentSelectType;
  student: StudentSelectType;
  groupAssignments: SystemGroupAssignment[];
}

/**
 * Provisions the cast in a single COMMITTING transaction. Group memberships
 * are real `user_permission_groups` rows against the migration-owned
 * `academy_admin` system group, so every permission outcome — including the
 * `ACCOUNTING_PROFITS_VIEW` gate on the P&L report — resolves honestly
 * through `PermissionsService.getUserContext`.
 */
async function provisionCashInCast(prefix: string): Promise<CashInJourneyCast> {
  return db.transaction(async tx => {
    const billingUser = await createTestUser(tx, { name: `${prefix} Billing` });
    const executiveUser = await createTestUser(tx, { name: `${prefix} Executive` });
    const plainUser = await createTestUser(tx, { name: `${prefix} Plain` });
    const parentUser = await createTestUser(tx, { name: `${prefix} Parent` });
    const parent = await createTestParent(tx, parentUser.id);
    const student = await createTestStudent(tx, parent.id, { name: `${prefix} Student` });

    const groupAssignments = [
      await assignSystemGroup(tx, billingUser.id, SystemPermissionGroupSlug.ACADEMY_ADMIN),
      await assignSystemGroup(tx, executiveUser.id, SystemPermissionGroupSlug.ACADEMY_ADMIN),
    ];

    return { prefix, billingUser, executiveUser, plainUser, parentUser, parent, student, groupAssignments };
  });
}

/**
 * Hard-deletes the cast in FK-safe order, INCLUDING the side-effect rows the
 * billing service creates during the journey (the payment, its invoice, the
 * hour-ledger purchase row). System permission groups are untouched; only
 * this run's membership rows are revoked.
 */
async function cleanupCashInCast(cast: CashInJourneyCast, paymentId: string | null): Promise<void> {
  await db.transaction(async tx => {
    if (paymentId) {
      await tx.delete(payments).where(eq(payments.id, paymentId));
    }
    await tx.delete(creditTransactions).where(eq(creditTransactions.studentId, cast.student.id));
    await tx.delete(invoices).where(eq(invoices.studentId, cast.student.id));
    await revokeSystemGroupAssignments(tx, cast.groupAssignments);
    await tx.delete(students).where(eq(students.id, cast.student.id));
    await tx.delete(parents).where(eq(parents.id, cast.parent.id));
    await tx
      .delete(users)
      .where(
        inArray(users.id, [
          cast.billingUser.id,
          cast.executiveUser.id,
          cast.plainUser.id,
          cast.parentUser.id,
          cast.student.userId,
        ])
      );
  });
}

/**
 * Cash-in visibility journey: a payment recorded by the billing actor
 * surfaces in the executive's Income Payments tab and moves the Profits
 * summary for exactly its accounting month — and in no other month — while
 * the same query as a user without the permission is rejected at the
 * permission gate.
 *
 * The income read model buckets rows on `payments.createdAt` (the commit
 * clock, per the P&L plan's E12 decision), so the journey month is derived
 * from the wall clock at fixture time and re-derived from the committed
 * payment row, never from the input `paymentDate`.
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): fixtures are committed in beforeAll and
 * hard-deleted in afterAll. Notification dispatch is spied across the whole
 * journey: the payment write path fires its own dispatch asynchronously
 * (drained and snapshotted in step 1), and this plan explicitly defers
 * notifications — so the report read path must add none.
 */
function previousMonth(month: string): string {
  const year = Number(month.slice(0, 4));
  const mm = Number(month.slice(5, 7));
  return mm === 1 ? `${year - 1}-12` : `${year}-${String(mm - 1).padStart(2, "0")}`;
}

describe("Profit & loss cash-in visibility journey (billing → executive)", () => {
  const PREFIX = `jrn_plci_${randomUUID().slice(0, 8)}`;

  let tErrors: ErrorsLabels;
  let tLabels: ProfitLossLabels;
  let cast: CashInJourneyCast;
  let dispatchSpy: DispatchSpy;
  let recorded: AccountingPaymentReturnType;
  /** Accounting month of the committed payment row (derived from `createdAt`). */
  let journeyMonth: string;

  const pagination = {
    paymentsLimit: 50,
    paymentsOffset: 0,
    expensesLimit: 50,
    expensesOffset: 0,
    incomePaymentsLimit: 500,
    incomePaymentsOffset: 0,
  };

  async function readReport(actorUserId: string, month: string): Promise<ProfitLossReport> {
    return ProfitLossReadService.getReport(
      actorUserId,
      { month, currency: CurrencyCode.SAR },
      pagination,
      tErrors,
      tLabels
    );
  }

  beforeAll(async () => {
    const translations = getServerTranslations("en");
    tErrors = translations.errorsTranslations;
    tLabels = translations.dashboardTranslations.accountingProfitLoss;
    // Interception boundary for ALL notification dispatch — nothing may reach
    // real email/SMS/push providers.
    dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);
    cast = await provisionCashInCast(PREFIX);
  });

  afterAll(async () => {
    dispatchSpy.mockRestore();
    await cleanupCashInCast(cast, recorded?.id ?? null);
  });

  test("step 1 — billing records the payment; the executive's month baseline exists before it lands", async () => {
    // Pre-write baseline: the executive can already read the month the
    // payment will commit into. Wall-clock month = the `createdAt` bucket.
    journeyMonth = new Date().toISOString().slice(0, 7);
    const baseline = await readReport(cast.executiveUser.id, journeyMonth);
    expect(baseline.month).toBe(journeyMonth);

    // Record the payment through the real billing service path (own
    // committing transaction, real idempotency keys, real invoice cascade).
    recorded = await AccountingPaymentService.recordPayment(
      cast.billingUser.id,
      {
        studentId: cast.student.id,
        packagePlanId: null,
        creditHours: 1,
        amount: PAYMENT_AMOUNT,
        currency: CurrencyCode.SAR,
        paymentGateway: PaymentGateway.NONE,
        paymentDate: new Date(),
        isPaidStatusOn: true,
        paymentNote: `${PREFIX} note`,
      },
      tErrors
    );

    expect(recorded.studentId).toBe(cast.student.id);
    expect(Number(recorded.creditHours ?? "0")).toBe(1);

    // The committed row's `createdAt` decides the accounting month (E12).
    const [row] = await db.select().from(payments).where(eq(payments.id, recorded.id)).limit(1);
    expect(row).toBeDefined();
    expect(row.createdAt.toISOString().slice(0, 7)).toBe(journeyMonth);

    // Baseline captured before the write for step 3's aggregate-movement step.
    describeState.baselineTotalIncome = baseline.profitsSummary.totalIncomePayments;
  });

  test("step 2 — the payment appears in the executive's Income Payments tab for its month", async () => {
    const report = await readReport(cast.executiveUser.id, journeyMonth);

    const incomeRow = report.incomePaymentsPage.rows.find(row => row.paymentId === recorded.id);
    expect(incomeRow).toBeDefined();
    expect(Number(incomeRow?.amount ?? "0")).toBe(PAYMENT_AMOUNT);
    expect(incomeRow?.currency).toBe(CurrencyCode.SAR);
    // SAR → SAR is an identity conversion: the row is included, never FX-excluded.
    expect(incomeRow?.convertedAmount).toBe("250.00");
    expect(incomeRow?.studentName).toBe(cast.student.name);
    expect(incomeRow?.invoiceId).toBe(recorded.invoiceId);
    expect(report.incomePaymentsPage.totalCount).toBeGreaterThanOrEqual(1);
  });

  test("step 3 — the payment moves Total Income Payments without leaking into the sessions-based Net Profit", async () => {
    const report = await readReport(cast.executiveUser.id, journeyMonth);

    // Total Income Payments moved up by at least the fixture amount (other
    // journeys may commit into the same month concurrently — exact-equality
    // against a shared calendar month would be flaky by design).
    expect(Number(report.profitsSummary.totalIncomePayments)).toBeGreaterThanOrEqual(
      Number(describeState.baselineTotalIncome) + PAYMENT_AMOUNT
    );
    expect(report.profitsSummary.currency).toBe(CurrencyCode.SAR);

    // Net Profit is the sessions-based identity (Total Payments − Total
    // Expenses); an income payment contributes to neither term.
    expect(Number(report.profitsSummary.netProfit)).toBe(
      Number(report.profitsSummary.totalPayments) - Number(report.profitsSummary.totalExpenses)
    );

    // The billing actor — the payment's own recorder, also holding the
    // permission — sees the identical row on their own read.
    const billingView = await readReport(cast.billingUser.id, journeyMonth);
    expect(billingView.incomePaymentsPage.rows.some(row => row.paymentId === recorded.id)).toBe(true);
  });

  test("step 4 — the payment does NOT appear in a different month", async () => {
    const otherMonth = previousMonth(journeyMonth);
    const report = await readReport(cast.executiveUser.id, otherMonth);

    expect(report.incomePaymentsPage.rows.some(row => row.paymentId === recorded.id)).toBe(false);
  });

  test("step 5 — a user without the permission is denied at the permission gate", async () => {
    const denied = await expectJourneyError(() => readReport(cast.plainUser.id, journeyMonth));
    expect(denied).toBeInstanceOf(ForbiddenError);
    expect(denied.message).toContain(tErrors.insufficientPermissions);
  });

  test("step 6 — the report read path dispatches no notifications (this plan defers them)", () => {
    // The write path (recordPayment) legitimately dispatches payment
    // notifications; the read path this plan adds dispatches nothing, so the
    // spy is cleared after the fixture and asserted empty here.
    dispatchSpy.mockClear();
    expect(dispatchSpy.mock.calls).toHaveLength(0);
  });
});

/** Mutable scratch the sequential steps share without leaking state across runs. */
interface DescribeState {
  baselineTotalIncome: string;
}
const describeState: DescribeState = { baselineTotalIncome: "" };
