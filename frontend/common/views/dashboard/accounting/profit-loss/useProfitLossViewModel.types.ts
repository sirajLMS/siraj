import type {
  ProfitLossReportQuery_profitLossReport_expensesPage,
  ProfitLossReportQuery_profitLossReport_expensesPage_rows,
  ProfitLossReportQuery_profitLossReport_incomePaymentsPage,
  ProfitLossReportQuery_profitLossReport_incomePaymentsPage_rows,
  ProfitLossReportQuery_profitLossReport_paymentsPage,
  ProfitLossReportQuery_profitLossReport_paymentsPage_rows,
  ProfitLossReportQuery_profitLossReport_profitsSummary,
} from "@/frontend/common/graphql/generated/gql/graphql";

/** One class-session payment row on the Payments tab. */
export type ProfitLossPaymentRow = ProfitLossReportQuery_profitLossReport_paymentsPage_rows;

/** One expense row on the Expenses tab. */
export type ProfitLossExpenseRow = ProfitLossReportQuery_profitLossReport_expensesPage_rows;

/** One student income payment row on the Income Payments tab. */
export type ProfitLossIncomeRow = ProfitLossReportQuery_profitLossReport_incomePaymentsPage_rows;

/** Net-result figures the Profits tab renders as a summary. */
export type ProfitLossSummary = ProfitLossReportQuery_profitLossReport_profitsSummary;

/** Server page slice of one tab: the visible rows plus whole-result metadata. */
interface ProfitLossTabPage<TRow, TAggregate> {
  readonly rows: readonly TRow[];
  /** Total rows matching the month + currency across all server pages. */
  readonly totalCount: number;
  readonly aggregate: TAggregate | null;
}

export type ProfitLossPaymentsPage = ProfitLossTabPage<
  ProfitLossPaymentRow,
  ProfitLossReportQuery_profitLossReport_paymentsPage["aggregate"]
>;
export type ProfitLossExpensesPage = ProfitLossTabPage<
  ProfitLossExpenseRow,
  ProfitLossReportQuery_profitLossReport_expensesPage["aggregate"]
>;
export type ProfitLossIncomePage = ProfitLossTabPage<
  ProfitLossIncomeRow,
  ProfitLossReportQuery_profitLossReport_incomePaymentsPage["aggregate"]
>;
