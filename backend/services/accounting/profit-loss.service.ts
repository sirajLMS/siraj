import { AccountingPaymentRepository, CreditRepository } from "@/backend/db/repo/billing";
import { ExpenseRepository } from "@/backend/db/repo/expenses";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { AppPermission, ExpenseType } from "@/backend/enum";
import { logger } from "@/backend/lib";
import {
  aggregateWithFx,
  collectFxWarnings,
  composeProfitsSummary,
  convertCurrency,
  createFxRateLookup,
  type FxRateLookup,
  validateMonth,
  validatePagination,
} from "@/backend/services/accounting/profit-loss-helpers";
import { requirePermission } from "@/backend/services/billing/permission-utils";
import type {
  ProfitLossExpenseRow,
  ProfitLossExpensesPage,
  ProfitLossIncomePage,
  ProfitLossInput,
  ProfitLossPagination,
  ProfitLossPaymentRepoRow,
  ProfitLossPaymentRow,
  ProfitLossPaymentsPage,
  ProfitLossReport,
} from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";
import type { ProfitLossLabels } from "@/shared/locale/types/dashboard/accounting";

/** Per-tab page size when the caller supplies no limit. */
const DEFAULT_PAGE_LIMIT = 50;

/** Zero-amount fallback for a reportable session whose payroll snapshot lacks an amount. */
const ZERO_PAID_AMOUNT = "0";

/** House-default currency for a reportable session whose snapshot lacks a currency. */
const DEFAULT_PAID_CURRENCY = CurrencyCode.SAR;

/**
 * Maps a raw repository row into the report-facing payment row: by accounting
 * convention the student-side charge equals the payroll snapshot amount the
 * teacher is owed, with a zero-amount / house-currency fallback for a
 * reportable session whose snapshot columns are still empty.
 */
function toProfitLossPaymentRow(
  row: ProfitLossPaymentRepoRow
): Omit<ProfitLossPaymentRow, "convertedAmount" | "manualSubtractCredits" | "manualSubtractCreditsCurrency"> {
  return {
    instanceId: row.instanceId,
    scheduledStartAt: row.scheduledStartAt,
    teacherName: row.teacherName,
    studentName: row.studentName,
    subjectName: row.subjectName,
    durationMinutes: row.durationMinutes,
    studentPaidAmount: row.teacherPaidAmount ?? ZERO_PAID_AMOUNT,
    // A session in a reportable status whose snapshot lacks a currency
    // falls back to the house default, consistent with the payroll
    // calculation service.
    studentPaidCurrency: row.teacherPaidCurrency ?? DEFAULT_PAID_CURRENCY,
    calculationStatus: row.calculationStatus,
  };
}

/** Renders a numeric amount as the canonical two-decimal money string. */
function toTwoDecimalString(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "0";
}

/** Zero-initialized per-type counters covering every ledger type key. */
function emptyRowCountsByType(): Record<ExpenseType, number> {
  const counts: Record<ExpenseType, number> = {
    [ExpenseType.SALARIES]: 0,
    [ExpenseType.MARKETING]: 0,
    [ExpenseType.LOGISTICS]: 0,
    [ExpenseType.TECHNOLOGY]: 0,
  };
  return counts;
}

/** Tallies the expense rows by ledger type with every type key pre-zeroed. */
function countRowsByType(rows: readonly ProfitLossExpenseRow[]): Record<ExpenseType, number> {
  const counts = emptyRowCountsByType();
  for (const row of rows) {
    counts[row.type] += 1;
  }
  return counts;
}

/**
 * Shared tab-page pipeline for the Expenses and Income Payments tabs: converts
 * every raw row's amount into the target currency and aggregates the converted
 * rows into the target-currency sum, the dominant source currency, and the
 * FX-excluded row count. Both tab readers follow this identical
 * convert-then-aggregate flow around row-shape-specific amount/currency
 * accessors, so it is extracted here to keep the two page builders in step.
 */
async function convertRowsAndAggregate<RawRow>(
  rows: readonly RawRow[],
  getAmount: (row: RawRow) => string,
  getCurrency: (row: RawRow) => CurrencyCode,
  targetCurrency: CurrencyCode,
  rateLookup: FxRateLookup
): Promise<{
  convertedRows: (RawRow & { convertedAmount: string | null })[];
  sum: string;
  dominantCurrency: CurrencyCode;
  excludedRowCount: number;
}> {
  const convertedRows = await Promise.all(
    rows.map(async row =>
      Object.assign({}, row, {
        convertedAmount: await convertCurrency(getAmount(row), getCurrency(row), targetCurrency, rateLookup),
      })
    )
  );

  const { sum, dominantCurrency, excludedRowCount } = await aggregateWithFx(
    convertedRows,
    getAmount,
    getCurrency,
    targetCurrency,
    rateLookup
  );
  return { convertedRows, sum, dominantCurrency, excludedRowCount };
}

/**
 * Reads the Payments tab: one page of completed sessions, the manual
 * subtract credits per session fetched in a single batched read, and each
 * session's student-side charge converted into the target currency. The
 * footer total combines the converted payouts with the subtracted credits
 * (one combined figure per the dashboard's single-total contract); an
 * FX-excluded session contributes neither its payout nor its credits.
 */
async function getPaymentsPage(
  input: ProfitLossInput,
  pagination: ProfitLossPagination,
  rateLookup: FxRateLookup
): Promise<ProfitLossPaymentsPage> {
  const { rows, totalCount } = await SchedulingRepository.findProfitLossPayments({
    month: input.month,
    limit: pagination.paymentsLimit ?? DEFAULT_PAGE_LIMIT,
    offset: pagination.paymentsOffset ?? 0,
  });

  const instanceIds = rows.map(row => row.instanceId);
  const subtractCreditsByInstance = await CreditRepository.findSubtractCreditsByInstanceIds(instanceIds);

  const paymentRows = rows.map(row => toProfitLossPaymentRow(row));
  const convertedRows = await Promise.all(
    paymentRows.map(async row => {
      const subtract = subtractCreditsByInstance.get(row.instanceId) ?? null;
      const convertedAmount = await convertCurrency(
        row.studentPaidAmount,
        row.studentPaidCurrency,
        input.currency,
        rateLookup
      );
      return Object.assign({}, row, {
        convertedAmount,
        manualSubtractCredits: subtract == null ? null : String(subtract.amount),
        manualSubtractCreditsCurrency: subtract == null ? null : subtract.currency,
      });
    })
  );

  const { sum, dominantCurrency, excludedRowCount } = await aggregateWithFx(
    convertedRows,
    row => row.studentPaidAmount,
    row => row.studentPaidCurrency,
    input.currency,
    rateLookup
  );

  let subtractCreditsTotal = 0;
  for (const row of convertedRows) {
    if (row.convertedAmount == null || row.manualSubtractCredits == null) continue;
    subtractCreditsTotal += Number(row.manualSubtractCredits);
  }
  const totalPayments = toTwoDecimalString(Number(sum) + subtractCreditsTotal);

  return {
    rows: convertedRows,
    totalCount,
    aggregate: {
      totalPayments,
      totalOriginalCurrency: totalPayments,
      dominantCurrency,
      excludedRowCount,
    },
  };
}

/**
 * Shared converted-tab-page reader for the Expenses and Income Payments tabs:
 * fetches one repo page for the accounting month, converts every row's amount
 * into the target currency, aggregates the converted rows, and returns the
 * page slice with the tab-specific aggregate built from the shared figures.
 */
async function readConvertedTabPage<TRawRow, TAggregate>(
  fetchPage: () => Promise<{ rows: readonly TRawRow[]; totalCount: number }>,
  getAmount: (row: TRawRow) => string,
  getCurrency: (row: TRawRow) => CurrencyCode,
  targetCurrency: CurrencyCode,
  rateLookup: FxRateLookup,
  buildAggregate: (
    convertedRows: readonly (TRawRow & { convertedAmount: string | null })[],
    sum: string,
    dominantCurrency: CurrencyCode,
    excludedRowCount: number
  ) => TAggregate
): Promise<{ rows: (TRawRow & { convertedAmount: string | null })[]; totalCount: number; aggregate: TAggregate }> {
  const { rows, totalCount } = await fetchPage();
  const { convertedRows, sum, dominantCurrency, excludedRowCount } = await convertRowsAndAggregate(
    rows,
    getAmount,
    getCurrency,
    targetCurrency,
    rateLookup
  );
  return {
    rows: convertedRows,
    totalCount,
    aggregate: buildAggregate(convertedRows, sum, dominantCurrency, excludedRowCount),
  };
}

/**
 * Reads the Expenses tab: one page of the month's expense-ledger rows with
 * each amount converted into the target currency, and the per-type row
 * counts tallied for the footer breakdown.
 */
function getExpensesPage(
  input: ProfitLossInput,
  pagination: ProfitLossPagination,
  rateLookup: FxRateLookup
): Promise<ProfitLossExpensesPage> {
  return readConvertedTabPage(
    () =>
      ExpenseRepository.findProfitLossExpenses({
        month: input.month,
        limit: pagination.expensesLimit ?? DEFAULT_PAGE_LIMIT,
        offset: pagination.expensesOffset ?? 0,
      }),
    row => row.expenseValue,
    row => row.expenseCurrency,
    input.currency,
    rateLookup,
    (convertedRows, sum, dominantCurrency, excludedRowCount) => ({
      totalExpenses: sum,
      dominantCurrency,
      excludedRowCount,
      rowCountByType: countRowsByType(convertedRows),
    })
  );
}

/**
 * Reads the Income Payments tab: one accounting month of recorded payments
 * with each amount converted into the target currency.
 */
function getIncomePaymentsPage(
  input: ProfitLossInput,
  pagination: ProfitLossPagination,
  rateLookup: FxRateLookup
): Promise<ProfitLossIncomePage> {
  return readConvertedTabPage(
    () =>
      AccountingPaymentRepository.findProfitLossIncome(
        { month: input.month },
        {
          limit: pagination.incomePaymentsLimit ?? DEFAULT_PAGE_LIMIT,
          offset: pagination.incomePaymentsOffset ?? 0,
        }
      ),
    row => row.amount,
    row => row.currency,
    input.currency,
    rateLookup,
    (_convertedRows, sum, dominantCurrency, excludedRowCount) => ({
      totalIncomePayments: sum,
      dominantCurrency,
      excludedRowCount,
    })
  );
}

export namespace ProfitLossService {
  /**
   * Reads the full Profit & Loss dashboard payload for one accounting month:
   * permission-gated, month-validated (well-shaped YYYY-MM, real calendar
   * month), and composed of the three tab pages read in parallel. The
   * executive summary converts every tab total into the target currency with
   * Net Profit = Total Payments − Total Expenses, and the FX warnings group
   * the rows excluded from the aggregates by currency pair. Structured
   * logging records every invocation for the audit trail.
   */
  export async function getReport(
    actorUserId: string,
    input: ProfitLossInput,
    pagination: ProfitLossPagination,
    tErrors: ErrorsLabels,
    tLabels: ProfitLossLabels
  ): Promise<ProfitLossReport> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_PROFITS_VIEW, tErrors);
    validateMonth(input.month, tLabels);
    validatePagination(pagination, tLabels);

    const rateLookup = createFxRateLookup();
    const [paymentsPage, expensesPage, incomePaymentsPage] = await Promise.all([
      getPaymentsPage(input, pagination, rateLookup),
      getExpensesPage(input, pagination, rateLookup),
      getIncomePaymentsPage(input, pagination, rateLookup),
    ]);

    const profitsSummary = composeProfitsSummary(
      input.currency,
      paymentsPage.aggregate,
      expensesPage.aggregate,
      incomePaymentsPage.aggregate
    );

    const fxWarnings = collectFxWarnings(
      [
        paymentsPage.rows.map(row => ({
          originalCurrency: row.studentPaidCurrency,
          convertedAmount: row.convertedAmount,
        })),
        expensesPage.rows.map(row => ({
          originalCurrency: row.expenseCurrency,
          convertedAmount: row.convertedAmount,
        })),
        incomePaymentsPage.rows.map(row => ({
          originalCurrency: row.currency,
          convertedAmount: row.convertedAmount,
        })),
      ],
      input.currency
    );

    logger.info("Profit & loss report generated", {
      actorUserId,
      month: input.month,
      currency: input.currency,
      paymentsCount: paymentsPage.rows.length,
      expensesCount: expensesPage.rows.length,
      incomePaymentsCount: incomePaymentsPage.rows.length,
      excludedRowCount:
        paymentsPage.aggregate.excludedRowCount +
        expensesPage.aggregate.excludedRowCount +
        incomePaymentsPage.aggregate.excludedRowCount,
    });

    return {
      month: input.month,
      currency: input.currency,
      paymentsPage,
      expensesPage,
      incomePaymentsPage,
      profitsSummary,
      fxWarnings,
    };
  }
}
