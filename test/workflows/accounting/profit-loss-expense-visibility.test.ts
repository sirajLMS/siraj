import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { carryoverBalances, classInstances, expenses, users } from "@/backend/db/schema";
import { createTestUser } from "@/backend/db/test/entity-setup";
import { ExpenseType, NotificationEventType } from "@/backend/enum";
import { ForbiddenError } from "@/backend/lib";
import { CarryoverBalanceService, ExpenseService, ProfitLossService } from "@/backend/services";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import { ClassSessionService } from "@/backend/services/session/class-session.service";
import type { ProfitLossReport, UserSelectType } from "@/backend/types";
import { SystemPermissionGroupSlug } from "@/shared/constants";
import { ClassExecutionState } from "@/shared/constants/class-instance-detail.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { CalculationStatus } from "@/shared/constants/teachers/payroll-calculation.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import type { ProfitLossLabels } from "@/shared/locale/types/dashboard/accounting";
import {
  assignSystemGroup,
  cleanupExpenseViewerExtras,
  cleanupPayrollJourneyCast,
  type DispatchSpy,
  deleteAuditLogsByActorIds,
  type ExpenseViewerCastExtras,
  expectJourneyError,
  type PayrollJourneyCast,
  provisionExpenseViewerExtras,
  provisionPayrollJourneyCast,
  revokeSystemGroupAssignments,
  type SystemGroupAssignment,
  waitForEventDispatchToUser,
} from "@/test/workflows/helpers";

/** Ledger provenance marker the carryover settlement writes onto its expense rows. */
const EXPENSE_SOURCE_CARRYOVER = "carryover_balances";

/**
 * Manual manager-entered spend for the journey, distinct from the salary the
 * settlement writes so the Expenses tab must carry both kinds.
 */
const MANUAL_EXPENSE_VALUE = "75.00";
/** 60-minute session at the cast teacher's SAR 120 hourly rate. */
const SALARY_EXPENSE_VALUE = "120.00";
/** Both journey expenses summed: the floor Total Expenses must reach. */
const COMBINED_EXPENSES_FLOOR = Number(MANUAL_EXPENSE_VALUE) + Number(SALARY_EXPENSE_VALUE);

/** Payout day both expenses settle on; the report month is its YYYY-MM bucket. */
const SETTLE_DATE = new Date().toISOString().slice(0, 10);
const MONTH = SETTLE_DATE.slice(0, 7);

/**
 * The actor cast for the expense-visibility journey: the payroll journey cast
 * (academy_admin operator + teacher + student + sessions), one executive who
 * holds `ACCOUNTING_PROFITS_VIEW` through a real `academy_admin` membership,
 * and one expense-ledger VIEW-only actor (a run-owned custom group without
 * the profits permission) for the denial path. Every permission outcome
 * resolves through the real `user_permission_groups` join.
 */
interface ExpenseVisibilityJourneyCast {
  payroll: PayrollJourneyCast;
  executiveUser: UserSelectType;
  executiveAssignment: SystemGroupAssignment;
  viewerExtras: ExpenseViewerCastExtras;
}

/** Provisions the cast in committing transactions: payroll cast, viewer extras, executive. */
async function provisionExpenseVisibilityCast(prefix: string): Promise<ExpenseVisibilityJourneyCast> {
  const payroll = await provisionPayrollJourneyCast(prefix);
  const viewerExtras = await provisionExpenseViewerExtras(prefix);
  const { executiveUser, executiveAssignment } = await db.transaction(async tx => {
    const executive = await createTestUser(tx, { name: `${prefix} Executive` });
    const assignment = await assignSystemGroup(tx, executive.id, SystemPermissionGroupSlug.ACADEMY_ADMIN);
    return { executiveUser: executive, executiveAssignment: assignment };
  });
  return { payroll, executiveUser, executiveAssignment, viewerExtras };
}

/**
 * Hard-deletes the cast in FK-safe order, INCLUDING the rows the journey
 * services wrote: both expense ledger rows (manual + settlement), the
 * carryover (its FK to the cast teacher is RESTRICT), and the append-only
 * audit rows the write paths mirrored — the audit immutability trigger is
 * lifted for that sweep exactly as the carryover settlement journey does.
 */
async function cleanupExpenseVisibilityCast(
  cast: ExpenseVisibilityJourneyCast,
  manualExpenseId: string | null,
  carryoverId: string | null
): Promise<void> {
  if (manualExpenseId) {
    await db.delete(expenses).where(eq(expenses.id, manualExpenseId));
  }
  if (carryoverId) {
    await db.delete(expenses).where(eq(expenses.sourceEntityId, carryoverId));
    await db.delete(carryoverBalances).where(eq(carryoverBalances.id, carryoverId));
  }
  await deleteAuditLogsByActorIds([
    cast.payroll.operatorUser.id,
    cast.payroll.teacherUser.id,
    cast.payroll.parentUser.id,
    cast.payroll.student.userId,
    cast.executiveUser.id,
    cast.viewerExtras.viewerUser.id,
  ]);
  await cleanupExpenseViewerExtras(cast.viewerExtras);
  await db.transaction(async tx => {
    await revokeSystemGroupAssignments(tx, [cast.executiveAssignment]);
    await tx.delete(users).where(eq(users.id, cast.executiveUser.id));
  });
  await cleanupPayrollJourneyCast(cast.payroll);
}

function previousMonth(month: string): string {
  const year = Number(month.slice(0, 4));
  const mm = Number(month.slice(5, 7));
  return mm === 1 ? `${year - 1}-12` : `${year}-${String(mm - 1).padStart(2, "0")}`;
}

/**
 * Expense-visibility journey: the academy operator drives a session to
 * CALCULATED, records a manual marketing expense through the real expense
 * service, and settles the carryover — which auto-generates a `Salaries`
 * expense with carryover provenance. The executive (ACCOUNTING_PROFITS_VIEW)
 * sees both rows in the Expenses tab for the expense month — and no other
 * month — with Total Expenses and Net Profit recomputed; a soft-deleted
 * expense disappears from the tab; and a ledger VIEW-only actor without the
 * profits permission is denied before any data is read.
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): services spawn their own transactions over the
 * global `db`, so fixtures are committed in beforeAll and hard-deleted in
 * afterAll. Notification dispatch is spied across the whole journey: the
 * completion fan-out is drained after step 1, and every later surface —
 * writes and the report read path alike — dispatches nothing.
 */
describe("Profit & loss expense-visibility journey (manager → executive)", () => {
  const PREFIX = `jrn_plex_${randomUUID().slice(0, 8)}`;

  const PAGINATION = {
    paymentsLimit: 50,
    paymentsOffset: 0,
    expensesLimit: 200,
    expensesOffset: 0,
    incomePaymentsLimit: 50,
    incomePaymentsOffset: 0,
  };

  let tErrors: ErrorsLabels;
  let tLabels: ProfitLossLabels;
  let cast: ExpenseVisibilityJourneyCast;
  let dispatchSpy: DispatchSpy;
  let manualExpenseId = "";
  let carryoverId = "";
  let settledExpenseId = "";
  /** Total Expenses the month showed before this journey wrote a single row. */
  let baselineTotalExpenses = "0";

  function readReport(actorUserId: string, month: string): Promise<ProfitLossReport> {
    return ProfitLossService.getReport(
      actorUserId,
      { month, currency: CurrencyCode.SAR },
      PAGINATION,
      tErrors,
      tLabels
    );
  }

  beforeAll(async () => {
    const translations = getServerTranslations("en");
    tErrors = translations.errorsTranslations;
    tLabels = translations.dashboardTranslations.accountingProfitLoss;
    // Interception boundary for ALL notification dispatch — nothing may reach
    // real email/SMS/push providers; spyOn interception is asserted
    // empirically by the step-1 drain (it must observe CLASS_COMPLETED).
    dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);
    cast = await provisionExpenseVisibilityCast(PREFIX);
  });

  afterAll(async () => {
    dispatchSpy.mockRestore();
    await cleanupExpenseVisibilityCast(cast, manualExpenseId || null, carryoverId || null);
  });

  test("step 1 — the teacher's telemetry and the operator's stop leave the session payroll-CALCULATED", async () => {
    const { onTimeInstance, teacherUser, operatorUser } = cast.payroll;
    await ClassSessionService.activate(teacherUser.id, onTimeInstance.id, tErrors);
    await ClassSessionService.updateStatusStart(teacherUser.id, onTimeInstance.id, tErrors);
    const completed = await ClassSessionService.stop(operatorUser.id, onTimeInstance.id, tErrors);
    expect(completed?.executionState).toBe(ClassExecutionState.COMPLETED);

    const [row] = await db
      .select({
        calculationStatus: classInstances.calculationStatus,
        teacherPaidAmount: classInstances.teacherPaidAmount,
      })
      .from(classInstances)
      .where(eq(classInstances.id, onTimeInstance.id))
      .limit(1);
    expect(row?.calculationStatus).toBe(CalculationStatus.CALCULATED);
    expect(row?.teacherPaidAmount).toBe(SALARY_EXPENSE_VALUE);

    // The completion fan-out reaches the teacher through the intercepted
    // dispatch boundary; once it lands, the spy is cleared so every later
    // step sees only its own traffic.
    expect(await waitForEventDispatchToUser(dispatchSpy, NotificationEventType.CLASS_COMPLETED, teacherUser.id)).toBe(
      true
    );
    dispatchSpy.mockClear();
  });

  test("step 2 — the manager's manual expense lands via the real expense service", async () => {
    // Baseline the month BEFORE this journey writes its rows, so step 4 can
    // prove the aggregates moved by exactly the two journey expenses.
    const baseline = await readReport(cast.executiveUser.id, MONTH);
    baselineTotalExpenses = baseline.profitsSummary.totalExpenses;

    const created = await ExpenseService.create(
      {
        title: `${PREFIX} marketing spend`,
        type: ExpenseType.MARKETING,
        expenseValue: MANUAL_EXPENSE_VALUE,
        expenseCurrency: CurrencyCode.SAR,
        paymentDate: SETTLE_DATE,
        expenseDate: MONTH,
        note: `${PREFIX} manual note`,
        createdByUserId: cast.payroll.operatorUser.id,
        clientRequestId: `${PREFIX}_manual_expense`,
      },
      cast.payroll.operatorUser.id,
      tErrors
    );

    manualExpenseId = created.id;
    expect(created.type).toBe(ExpenseType.MARKETING);
    expect(created.expenseValue).toBe(MANUAL_EXPENSE_VALUE);
    expect(created.expenseDate).toBe(MONTH);
    expect(created.sourceEntity).toBeNull();
    expect(created.sourceEntityId).toBeNull();
    expect(created.createdByUserId).toBe(cast.payroll.operatorUser.id);

    // The ledger write path dispatches no notifications.
    expect(dispatchSpy.mock.calls).toHaveLength(0);
  });

  test("step 3 — the carryover settlement auto-generates the Salaries expense with provenance", async () => {
    const { onTimeInstance, operatorUser } = cast.payroll;
    const created = await CarryoverBalanceService.bulkCreateCarryoverBalances(
      { instanceIds: [onTimeInstance.id], actorUserId: operatorUser.id, note: `${PREFIX} aggregate` },
      tErrors
    );
    expect(created.groups).toHaveLength(1);
    const group = created.groups[0];
    if (!group) {
      throw new Error("carryover group missing from the bulk-create result");
    }
    expect(group.payable).toBe(SALARY_EXPENSE_VALUE);
    expect(group.currency).toBe(CurrencyCode.SAR);
    carryoverId = group.carryoverId;

    const settled = await CarryoverBalanceService.bulkCarryoverToExpense(
      {
        carryoverIds: [carryoverId],
        paymentDate: SETTLE_DATE,
        expenseDate: MONTH,
        note: `${PREFIX} settle`,
        actorUserId: operatorUser.id,
      },
      tErrors
    );
    expect(settled.items).toHaveLength(1);
    const item = settled.items[0];
    expect(item?.amount).toBe(SALARY_EXPENSE_VALUE);
    expect(item?.expenseId.length).toBeGreaterThan(0);
    settledExpenseId = item?.expenseId ?? "";

    // Committed ledger row: one Salaries expense provenance-linked to the
    // carryover and attributed to the settling operator.
    const [expenseRow] = await db.select().from(expenses).where(eq(expenses.id, settledExpenseId)).limit(1);
    expect(expenseRow?.type).toBe(ExpenseType.SALARIES);
    expect(expenseRow?.expenseValue).toBe(SALARY_EXPENSE_VALUE);
    expect(expenseRow?.expenseDate).toBe(MONTH);
    expect(expenseRow?.sourceEntity).toBe(EXPENSE_SOURCE_CARRYOVER);
    expect(expenseRow?.sourceEntityId).toBe(carryoverId);
    expect(expenseRow?.teacherId).toBe(cast.payroll.teacher.id);
    expect(expenseRow?.deletedAt).toBeNull();

    // The settled session closes PAID; the settle surface itself is silent.
    const [instance] = await db
      .select({
        calculationStatus: classInstances.calculationStatus,
        carryoverBalanceId: classInstances.carryoverBalanceId,
      })
      .from(classInstances)
      .where(eq(classInstances.id, onTimeInstance.id))
      .limit(1);
    expect(instance?.calculationStatus).toBe(CalculationStatus.PAID);
    expect(instance?.carryoverBalanceId).toBe(carryoverId);
    expect(dispatchSpy.mock.calls).toHaveLength(0);
  });

  test("step 4 — the executive sees both expense kinds in the Expenses tab, with aggregates recomputed", async () => {
    const report = await readReport(cast.executiveUser.id, MONTH);

    const manualRow = report.expensesPage.rows.find(row => row.id === manualExpenseId);
    expect(manualRow).toBeDefined();
    expect(manualRow?.type).toBe(ExpenseType.MARKETING);
    expect(manualRow?.expenseValue).toBe(MANUAL_EXPENSE_VALUE);
    expect(manualRow?.sourceEntity).toBeNull();
    expect(manualRow?.sourceEntityId).toBeNull();
    // SAR → SAR is an identity conversion: the row is included, never FX-excluded.
    expect(manualRow?.convertedAmount).toBe("75.00");

    const salaryRow = report.expensesPage.rows.find(row => row.id === settledExpenseId);
    expect(salaryRow).toBeDefined();
    expect(salaryRow?.type).toBe(ExpenseType.SALARIES);
    // The carryover-sourced row carries its source linkage into the tab.
    expect(salaryRow?.sourceEntity).toBe(EXPENSE_SOURCE_CARRYOVER);
    expect(salaryRow?.sourceEntityId).toBe(carryoverId);
    expect(salaryRow?.teacherName).toBe(cast.payroll.teacherUser.name);
    expect(salaryRow?.expenseValue).toBe(SALARY_EXPENSE_VALUE);
    expect(salaryRow?.convertedAmount).toBe("120.00");

    expect(report.expensesPage.aggregate.rowCountByType[ExpenseType.MARKETING]).toBeGreaterThanOrEqual(1);
    expect(report.expensesPage.aggregate.rowCountByType[ExpenseType.SALARIES]).toBeGreaterThanOrEqual(1);

    // Total Expenses moved up by at least both journey expenses (other
    // journeys may commit into the same month concurrently — exact-equality
    // against a shared calendar month would be flaky by design).
    expect(Number(report.profitsSummary.totalExpenses)).toBeGreaterThanOrEqual(
      Number(baselineTotalExpenses) + COMBINED_EXPENSES_FLOOR
    );

    // Net Profit is the derived identity, recomputed off the fresh aggregates.
    expect(Number(report.profitsSummary.netProfit)).toBe(
      Number(report.profitsSummary.totalPayments) - Number(report.profitsSummary.totalExpenses)
    );
  });

  test("step 5 — neither expense surfaces in a different month", async () => {
    const report = await readReport(cast.executiveUser.id, previousMonth(MONTH));
    expect(report.expensesPage.rows.some(row => row.id === manualExpenseId)).toBe(false);
    expect(report.expensesPage.rows.some(row => row.id === settledExpenseId)).toBe(false);
  });

  test("step 6 — a ledger VIEW-only actor without ACCOUNTING_PROFITS_VIEW is denied at the gate", async () => {
    // The viewer can legally read the expense ledger, but the executive
    // report has its own permission — denial resolves before any data reads.
    const denied = await expectJourneyError(() => readReport(cast.viewerExtras.viewerUser.id, MONTH));
    expect(denied).toBeInstanceOf(ForbiddenError);
    expect(denied.message).toContain(tErrors.insufficientPermissions);
  });

  test("step 7 — soft-deleting the manual expense removes it while the settled salary stays", async () => {
    const before = await readReport(cast.executiveUser.id, MONTH);
    expect(before.expensesPage.rows.some(row => row.id === manualExpenseId)).toBe(true);

    await ExpenseService.softDelete(
      { id: manualExpenseId, actorUserId: cast.payroll.operatorUser.id, reason: `${PREFIX} void` },
      tErrors
    );

    // The row survives in the ledger with its deleted stamp; only the report
    // drops it.
    const [deletedRow] = await db.select().from(expenses).where(eq(expenses.id, manualExpenseId)).limit(1);
    expect(deletedRow?.deletedAt).not.toBeNull();
    expect(deletedRow?.deletedByUserId).toBe(cast.payroll.operatorUser.id);

    const after = await readReport(cast.executiveUser.id, MONTH);
    expect(after.expensesPage.rows.some(row => row.id === manualExpenseId)).toBe(false);
    // The settlement's Salaries expense is untouched by the manual delete.
    expect(after.expensesPage.rows.some(row => row.id === settledExpenseId)).toBe(true);

    // Total Expenses dropped by the deleted row; Net Profit recomputed.
    expect(Number(after.profitsSummary.totalExpenses)).toBeLessThanOrEqual(
      Number(before.profitsSummary.totalExpenses) - Number(MANUAL_EXPENSE_VALUE)
    );
    expect(Number(after.profitsSummary.netProfit)).toBe(
      Number(after.profitsSummary.totalPayments) - Number(after.profitsSummary.totalExpenses)
    );

    expect(dispatchSpy.mock.calls).toHaveLength(0);
  });

  test("step 8 — the report read path itself dispatches no notifications", async () => {
    dispatchSpy.mockClear();
    const report = await readReport(cast.executiveUser.id, MONTH);
    expect(report.month).toBe(MONTH);
    expect(report.expensesPage.rows.some(row => row.id === settledExpenseId)).toBe(true);
    expect(dispatchSpy.mock.calls).toHaveLength(0);
  });
});
