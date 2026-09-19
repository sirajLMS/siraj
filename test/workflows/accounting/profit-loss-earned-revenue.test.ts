import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { classInstances, creditTransactions, users } from "@/backend/db/schema";
import { createTestUser } from "@/backend/db/test/entity-setup";
import { CreditAdjustmentType, CreditReason, NotificationEventType } from "@/backend/enum";
import { ForbiddenError } from "@/backend/lib";
import { ClassSessionService, ProfitLossService } from "@/backend/services";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import type { ClassInstanceSelectType, ProfitLossReport, UserSelectType } from "@/backend/types";
import { SystemPermissionGroupSlug } from "@/shared/constants";
import { ClassExecutionState } from "@/shared/constants/class-instance-detail.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { CalculationStatus } from "@/shared/constants/teachers/payroll-calculation.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import type { ProfitLossLabels } from "@/shared/locale/types/dashboard/accounting";
import {
  assignSystemGroup,
  cleanupPayrollJourneyCast,
  type DispatchSpy,
  expectJourneyError,
  type PayrollJourneyCast,
  provisionPayrollJourneyCast,
  revokeSystemGroupAssignments,
  type SystemGroupAssignment,
  waitForEventDispatchToUser,
} from "@/test/workflows/helpers";

/**
 * Session-linked manual subtract credit recorded against the completed
 * session. The manual-adjustment write path always persists
 * session-UNLINKED rows (`classInstanceId` null — excluded from the Payments
 * tab), so the journey inserts the session-linked ledger shape directly:
 * exactly the row shape the Payments tab's per-session subtract-credit
 * column aggregates (adjustmentType SUBTRACT, class-amount ledger entry).
 */
const SUBTRACT_CREDIT_AMOUNT = 30;

/** A 60-minute session at the payroll cast's pinned SAR 120/h teacher rate. */
const SESSION_EARNED_AMOUNT = "120.00";

/** Calculation statuses the Payments tab reports on (NOT_CALCULATED is excluded). */
const REPORTABLE_CALCULATION_STATUSES: CalculationStatus[] = [
  CalculationStatus.CALCULATED,
  CalculationStatus.PARTIALLY,
  CalculationStatus.REFUND,
  CalculationStatus.WAITING_PAID,
  CalculationStatus.PAID,
];

/**
 * The actor cast for the earned-revenue journey: the payroll journey cast
 * (operator + teacher + student + three sessions) plus one executive
 * (academy_admin — holds `ACCOUNTING_PROFITS_VIEW`) and one plain user with
 * no permission group (denial path).
 */
interface EarnedRevenueJourneyCast {
  payroll: PayrollJourneyCast;
  executiveUser: UserSelectType;
  plainUser: UserSelectType;
  groupAssignments: SystemGroupAssignment[];
}

/**
 * Provisions the payroll cast plus the executive and plain user, WITHOUT
 * driving any session — the permission-gated baseline read must observe the
 * month before the journey's session is calculated and its subtract credit
 * exists.
 */
async function provisionEarnedRevenueCast(prefix: string): Promise<EarnedRevenueJourneyCast> {
  const payroll = await provisionPayrollJourneyCast(prefix);

  const extra = await db.transaction(async tx => {
    const executiveUser = await createTestUser(tx, { name: `${prefix} Executive` });
    const plainUser = await createTestUser(tx, { name: `${prefix} Plain` });
    const groupAssignments = [await assignSystemGroup(tx, executiveUser.id, SystemPermissionGroupSlug.ACADEMY_ADMIN)];
    return { executiveUser, plainUser, groupAssignments };
  });

  return { payroll, ...extra };
}

/**
 * Hard-deletes the cast: the payroll cast's own cleanup (which also sweeps
 * this run's credit-ledger rows by student) plus the executive and plain
 * users and their group assignments.
 */
async function cleanupEarnedRevenueCast(cast: EarnedRevenueJourneyCast): Promise<void> {
  await cleanupPayrollJourneyCast(cast.payroll);
  await db.transaction(async tx => {
    await revokeSystemGroupAssignments(tx, cast.groupAssignments);
    await tx.delete(users).where(inArray(users.id, [cast.executiveUser.id, cast.plainUser.id]));
  });
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
 * Earned-revenue journey: a teacher session completed + payroll-calculated
 * surfaces in the executive's Payments tab for its scheduled month with the
 * session charge and its manual subtract credit summed into Total Payments,
 * while never-calculated sessions do not surface, other months are
 * unaffected, and actors without `ACCOUNTING_PROFITS_VIEW` are rejected at
 * the permission gate.
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): fixtures are committed in beforeAll and
 * hard-deleted in afterAll via the cast helpers. Notification dispatch is
 * spied across the whole journey; the state-machine writes legitimately fan
 * out lifecycle notifications (drained and snapshotted after step 1), and
 * the report read path must add none.
 */
describe("Profit & loss earned-revenue journey (teacher → executive)", () => {
  const PREFIX = `jrn_pler_${randomUUID().slice(0, 8)}`;

  const pagination = {
    paymentsLimit: 50,
    paymentsOffset: 0,
    expensesLimit: 50,
    expensesOffset: 0,
    incomePaymentsLimit: 50,
    incomePaymentsOffset: 0,
  };

  let tErrors: ErrorsLabels;
  let tLabels: ProfitLossLabels;
  let cast: EarnedRevenueJourneyCast;
  let dispatchSpy: DispatchSpy;
  /** The Payments tab buckets sessions by `scheduledStartAt` — derived from the committed fixture row. */
  let journeyMonth: string;
  /** Total Payments before the session is calculated and its subtract credit exists. */
  let baselineTotalPayments: number;
  /** Spy depth after the write-path notification fan-out settles. */
  let dispatchCountAfterWrites: number;

  function readReport(actorUserId: string, month: string): Promise<ProfitLossReport> {
    return ProfitLossService.getReport(
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
    // real email/SMS/push providers. Installed before provisioning because the
    // state-machine writes fan out lifecycle notifications.
    dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);

    cast = await provisionEarnedRevenueCast(PREFIX);

    // The committed fixture row decides the accounting month, never the wall
    // clock at read time (robust across a midnight/month boundary mid-run).
    journeyMonth = cast.payroll.onTimeInstance.scheduledStartAt.toISOString().slice(0, 7);

    // Baseline before any journey write lands: the session row is still
    // NOT_CALCULATED (excluded) and the subtract credit does not exist yet.
    const baseline = await readReport(cast.executiveUser.id, journeyMonth);
    baselineTotalPayments = Number(baseline.paymentsPage.aggregate?.totalPayments ?? "0");

    // Session-linked manual subtract credit committed as a fixture ledger row.
    await db.insert(creditTransactions).values({
      studentId: cast.payroll.student.id,
      changeAmount: -SUBTRACT_CREDIT_AMOUNT,
      reason: CreditReason.CREDIT_ADJUSTMENT_SUBTRACT,
      adjustmentType: CreditAdjustmentType.SUBTRACT,
      classInstanceId: cast.payroll.onTimeInstance.id,
      notes: `${PREFIX} session subtract credit`,
      creditedByUserId: cast.payroll.operatorUser.id,
      idempotencyKey: `jrn-pler-subtract-${randomUUID()}`,
    });
  });

  afterAll(async () => {
    dispatchSpy.mockRestore();
    await cleanupEarnedRevenueCast(cast);
  });

  test("step 1 — the teacher drives the session to terminal; payroll auto-calculation commits the snapshot", async () => {
    // Real state-machine path: the teacher activates and joins on time, the
    // operator stops — the payroll snapshot commits in the same transaction.
    await ClassSessionService.activate(cast.payroll.teacherUser.id, cast.payroll.onTimeInstance.id, tErrors);
    await ClassSessionService.updateStatusStart(cast.payroll.teacherUser.id, cast.payroll.onTimeInstance.id, tErrors);
    await ClassSessionService.stop(cast.payroll.operatorUser.id, cast.payroll.onTimeInstance.id, tErrors);

    const committed = await readInstance(cast.payroll.onTimeInstance.id);
    expect(committed.executionState).toBe(ClassExecutionState.COMPLETED);
    expect(REPORTABLE_CALCULATION_STATUSES).toContain(committed.calculationStatus);
    expect(committed.teacherPaidAmount).toBe(SESSION_EARNED_AMOUNT);
    expect(committed.teacherPaidCurrency).toBe(CurrencyCode.SAR);

    // The stop path fans out its lifecycle notification asynchronously; wait
    // for it to settle so the read-path silence check in step 5 is exact.
    expect(
      await waitForEventDispatchToUser(dispatchSpy, NotificationEventType.CLASS_COMPLETED, cast.payroll.teacherUser.id)
    ).toBe(true);
    dispatchCountAfterWrites = dispatchSpy.mock.calls.length;
  });

  test("step 2 — the calculated session surfaces in the executive's Payments tab with its subtract credit", async () => {
    const report = await readReport(cast.executiveUser.id, journeyMonth);

    const row = report.paymentsPage.rows.find(candidate => candidate.instanceId === cast.payroll.onTimeInstance.id);
    expect(row).toBeDefined();
    const status = row?.calculationStatus;
    expect(status).toBeDefined();
    if (status != null) {
      expect(REPORTABLE_CALCULATION_STATUSES).toContain(status);
    }
    expect(row?.studentPaidAmount).toBe(SESSION_EARNED_AMOUNT);
    expect(row?.studentPaidCurrency).toBe(CurrencyCode.SAR);
    // SAR → SAR is an identity conversion: the row is included, never FX-excluded.
    expect(row?.convertedAmount).toBe(SESSION_EARNED_AMOUNT);
    expect(row?.manualSubtractCredits).toBe(String(SUBTRACT_CREDIT_AMOUNT));
    expect(row?.teacherName).toBe(cast.payroll.teacherUser.name);
    expect(row?.studentName).toBe(cast.payroll.student.name);
    expect(report.paymentsPage.totalCount).toBeGreaterThanOrEqual(1);
  });

  test("step 3 — Total Payments and Net Profit move by the session charge plus the subtract credit", async () => {
    const report = await readReport(cast.executiveUser.id, journeyMonth);

    // At-least assertion: other journeys may commit into the same calendar
    // month concurrently, so exact equality against a shared month is flaky.
    const totalPayments = Number(report.paymentsPage.aggregate?.totalPayments ?? "0");
    expect(totalPayments).toBeGreaterThanOrEqual(
      baselineTotalPayments + Number(SESSION_EARNED_AMOUNT) + SUBTRACT_CREDIT_AMOUNT
    );

    // Net Profit is the composed identity over both tab aggregates.
    expect(Number(report.profitsSummary.netProfit)).toBe(
      Number(report.profitsSummary.totalPayments) - Number(report.profitsSummary.totalExpenses)
    );
    expect(report.profitsSummary.currency).toBe(CurrencyCode.SAR);

    // Cross-actor: the operator (also permission-holding) sees the same row
    // on their own read.
    const operatorView = await readReport(cast.payroll.operatorUser.id, journeyMonth);
    expect(operatorView.paymentsPage.rows.some(row => row.instanceId === cast.payroll.onTimeInstance.id)).toBe(true);
  });

  test("step 4 — never-calculated sessions do not surface, and neither does the session in a different month", async () => {
    const year = Number(journeyMonth.slice(0, 4));
    const mm = Number(journeyMonth.slice(5, 7));
    const previousMonth = mm === 1 ? `${year - 1}-12` : `${year}-${String(mm - 1).padStart(2, "0")}`;

    const [current, previous] = await Promise.all([
      readReport(cast.executiveUser.id, journeyMonth),
      readReport(cast.executiveUser.id, previousMonth),
    ]);

    // The unattended and student-absent instances were never driven to a
    // calculated state — both stay out of the Payments tab.
    for (const hiddenId of [cast.payroll.unattendedInstance.id, cast.payroll.studentAbsentInstance.id]) {
      expect(current.paymentsPage.rows.some(row => row.instanceId === hiddenId)).toBe(false);
    }

    // Month scoping: the completed session belongs to its scheduled month only.
    expect(previous.paymentsPage.rows.some(row => row.instanceId === cast.payroll.onTimeInstance.id)).toBe(false);
  });

  test("step 5 — actors without ACCOUNTING_PROFITS_VIEW are denied before any data is read", async () => {
    const deniedActors = [
      { label: "teacher", actorUserId: cast.payroll.teacherUser.id },
      { label: "student", actorUserId: cast.payroll.student.userId },
      { label: "parent", actorUserId: cast.payroll.parentUser.id },
      { label: "plain", actorUserId: cast.plainUser.id },
    ];
    const errors = await Promise.all(
      deniedActors.map(denied => expectJourneyError(() => readReport(denied.actorUserId, journeyMonth)))
    );
    for (const [index, error] of errors.entries()) {
      expect(error, deniedActors[index]?.label).toBeInstanceOf(ForbiddenError);
      if (error instanceof ForbiddenError) {
        expect(error.code).toBe("FORBIDDEN");
      }
      expect(error.message).toContain(tErrors.insufficientPermissions);
    }
  });

  test("step 6 — the report read path dispatches no notifications", () => {
    expect(dispatchSpy.mock.calls).toHaveLength(dispatchCountAfterWrites);
  });
});
