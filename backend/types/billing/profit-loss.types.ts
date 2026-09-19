import type { CalculationStatus, ExpenseType, PaymentMethodType } from "@/backend/enum";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Profit & Loss dashboard canonical types.
 *
 * The dashboard is a read-only executive report over one accounting month:
 * completed class sessions (teacher payouts), expense ledger rows, and income
 * payments, all converted into a single target currency for the summary
 * aggregates. Monetary amounts are precision-safe decimal strings (text
 * columns), and per-row conversion is nullable — an FX-missing row keeps its
 * original currency and is excluded from aggregates, surfaced instead as an
 * `FxWarning` grouped by currency pair.
 */

/** Month + target-currency selector for the whole report payload. */
export interface ProfitLossInput {
  /** Accounting month (YYYY-MM). */
  month: string;
  /** Target currency all aggregate sums are converted into. */
  currency: CurrencyCode;
}

/** Per-tab paging knobs; each tab pages independently inside one query. */
export interface ProfitLossPagination {
  paymentsLimit?: number;
  paymentsOffset?: number;
  expensesLimit?: number;
  expensesOffset?: number;
  incomePaymentsLimit?: number;
  incomePaymentsOffset?: number;
}

/**
 * One completed class session in the Payments tab: the joined teacher,
 * student, and subject display fields, the student-side charge, the manual
 * credit subtraction from the session, and the teacher-side amount converted
 * into the target currency (null when the FX rate is missing).
 */
export interface ProfitLossPaymentRow {
  instanceId: string;
  scheduledStartAt: string;
  teacherName: string;
  studentName: string;
  subjectName: string;
  durationMinutes: number;
  studentPaidAmount: string;
  studentPaidCurrency: CurrencyCode;
  /** Amount in the target currency; null when the FX rate is missing. */
  convertedAmount: string | null;
  manualSubtractCredits: string | null;
  manualSubtractCreditsCurrency: CurrencyCode | null;
  calculationStatus: CalculationStatus;
}

/**
 * Raw joined values returned by the repository for one Payments-tab session.
 * The payroll snapshot amount/currency are passed through exactly as persisted
 * (nullable when a reportable session's snapshot lacks them); the service
 * layer maps them into the report-facing student-side charge columns.
 */
export interface ProfitLossPaymentRepoRow
  extends Omit<
    ProfitLossPaymentRow,
    | "convertedAmount"
    | "manualSubtractCredits"
    | "manualSubtractCreditsCurrency"
    | "studentPaidAmount"
    | "studentPaidCurrency"
  > {
  teacherPaidAmount: string | null;
  teacherPaidCurrency: CurrencyCode | null;
}

export interface ProfitLossPaymentsPage {
  rows: ProfitLossPaymentRow[];
  totalCount: number;
  aggregate: {
    /** Sum of converted teacher payout amounts, in the target currency. */
    totalPayments: string;
    /** Sum of unconverted amounts in the dominant original currency. */
    totalOriginalCurrency: string;
    dominantCurrency: CurrencyCode;
    /** Rows excluded from the aggregates because their FX rate is missing. */
    excludedRowCount: number;
  };
}

/**
 * One expense-ledger row in the Expenses tab, with the teacher name resolved
 * for salary payouts and the amount converted into the target currency
 * (null when the FX rate is missing).
 */
export interface ProfitLossExpenseRow {
  id: string;
  title: string;
  type: ExpenseType;
  teacherName: string | null;
  expenseValue: string;
  expenseCurrency: CurrencyCode;
  /** Amount in the target currency; null when the FX rate is missing. */
  convertedAmount: string | null;
  paymentDate: string;
  sourceEntity: string | null;
  sourceEntityId: string | null;
  note: string | null;
}

/** Month + paging window for one Expenses tab page read. */
export interface ProfitLossExpensesPageFilter {
  /** Accounting month (YYYY-MM). */
  month: string;
  limit: number;
  offset: number;
}

export interface ProfitLossExpensesPage {
  rows: ProfitLossExpenseRow[];
  totalCount: number;
  aggregate: {
    /** Sum of converted expense amounts, in the target currency. */
    totalExpenses: string;
    dominantCurrency: CurrencyCode;
    /** Rows excluded from the aggregates because their FX rate is missing. */
    excludedRowCount: number;
    rowCountByType: Record<ExpenseType, number>;
  };
}

/** Month filter for the Income Payments tab read: the `YYYY-MM` accounting month. */
export interface ProfitLossIncomeFilter {
  month: string;
}

/**
 * One income payment in the Income Payments tab: the joined student/parent
 * display fields, package and invoice provenance, and the amount converted
 * into the target currency (null when the FX rate is missing).
 */
export interface ProfitLossIncomeRow {
  paymentId: string;
  paymentDate: string;
  studentName: string;
  parentName: string | null;
  amount: string;
  currency: CurrencyCode;
  /** Amount in the target currency; null when the FX rate is missing. */
  convertedAmount: string | null;
  paymentMethodType: PaymentMethodType;
  packageName: string | null;
  invoiceId: string | null;
}

export interface ProfitLossIncomePage {
  rows: ProfitLossIncomeRow[];
  totalCount: number;
  aggregate: {
    /** Sum of converted income payment amounts, in the target currency. */
    totalIncomePayments: string;
    dominantCurrency: CurrencyCode;
    /** Rows excluded from the aggregates because their FX rate is missing. */
    excludedRowCount: number;
  };
}

/**
 * Four-row executive summary over the selected month, all in the target
 * currency: income payments, teacher payments, expenses, and the derived net
 * profit with its margin percentage (null when no income to divide by).
 */
export interface ProfitLossSummary {
  totalIncomePayments: string;
  totalPayments: string;
  totalExpenses: string;
  netProfit: string;
  /** Percentage string (e.g. "12.5"); null when there is no income base. */
  netProfitMargin: string | null;
  currency: CurrencyCode;
}

/** FX-missing exclusion grouped by currency pair, for the report's warning banner. */
export interface FxWarning {
  originalCurrency: CurrencyCode;
  targetCurrency: CurrencyCode;
  rowCount: number;
}

/** The full read-only report payload returned by the single GraphQL query. */
export interface ProfitLossReport {
  month: string;
  currency: CurrencyCode;
  paymentsPage: ProfitLossPaymentsPage;
  expensesPage: ProfitLossExpensesPage;
  incomePaymentsPage: ProfitLossIncomePage;
  profitsSummary: ProfitLossSummary;
  fxWarnings: FxWarning[];
}
