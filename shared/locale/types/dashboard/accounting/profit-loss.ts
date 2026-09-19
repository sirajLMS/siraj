/**
 * ProfitLossLabels — executive P&L dashboard: global filter bar (month +
 * currency), FX-warning chip and tooltip, tab labels, DataGrid column
 * headers, footer aggregates (totals, net profit, margin, dominant currency,
 * excluded rows), empty-month state, CSV export action, and month
 * validation error.
 */
export interface ProfitLossLabels {
  readonly title: string;

  readonly filter: {
    readonly month: string;
    readonly currency: string;
  };

  /** Filter-bar FX warning chip: "N rows excluded (FX rate missing)". */
  readonly fx: {
    readonly chip: (count: number) => string;
    /** Chip tooltip listing the excluded currency pairs, joined by the caller. */
    readonly tooltip: (pairs: string) => string;
  };

  readonly tab: {
    readonly payments: string;
    readonly expenses: string;
    readonly incomePayments: string;
    readonly profits: string;
  };

  readonly column: {
    readonly scheduledStart: string;
    /** Payments-tab header over the payroll calculation status badge. */
    readonly calculationStatus: string;
    readonly teacher: string;
    readonly student: string;
    readonly subject: string;
    readonly duration: string;
    readonly studentPaidAmount: string;
    readonly manualSubtractCredits: string;
    readonly title: string;
    readonly type: string;
    readonly value: string;
    readonly paymentDate: string;
    readonly paymentMethod: string;
    readonly parentName: string;
    readonly packageName: string;
    readonly invoiceId: string;
    readonly source: string;
  };

  readonly aggregate: {
    readonly totalPayments: string;
    readonly totalExpenses: string;
    readonly totalIncomePayments: string;
    readonly netProfit: string;
    readonly netProfitMargin: string;
    /** Footer caption naming the dominant original currency of the tab. */
    readonly dominantCurrency: string;
    /** Footer excluded-row count: "N rows excluded (FX rate missing)". */
    readonly excludedRows: (count: number) => string;
  };

  readonly action: {
    readonly exportCsv: string;
  };

  /** Caption describing the Net Profit row sign (green / red / grey). */
  readonly status: {
    readonly positive: string;
    readonly negative: string;
    readonly breakeven: string;
  };

  readonly empty: {
    readonly title: string;
    readonly description: string;
  };

  readonly error: {
    readonly monthInvalid: string;
    readonly paginationInvalid: string;
  };
}
