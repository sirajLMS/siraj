import type { ProfitLossLabels } from "@/shared/locale/types/dashboard/accounting/profit-loss";

export const dashboardAccountingProfitLossEn: ProfitLossLabels = {
  title: "Profit & Loss",

  filter: {
    month: "Month",
    currency: "Currency",
  },

  fx: {
    chip: count => (count === 1 ? "1 row excluded (FX rate missing)" : `${count} rows excluded (FX rate missing)`),
    tooltip: pairs => `Rows in these currency pairs are excluded from totals because no FX rate is available: ${pairs}`,
  },

  tab: {
    payments: "Payments",
    expenses: "Expenses",
    incomePayments: "Income Payments",
    profits: "Profits",
  },

  column: {
    scheduledStart: "Scheduled start",
    calculationStatus: "Calculation status",
    teacher: "Teacher",
    student: "Student",
    subject: "Subject",
    duration: "Duration (min)",
    studentPaidAmount: "Student paid",
    manualSubtractCredits: "Subtract credits",
    title: "Title",
    type: "Type",
    value: "Value",
    paymentDate: "Payment date",
    paymentMethod: "Payment method",
    parentName: "Parent",
    packageName: "Package",
    invoiceId: "Invoice",
    source: "Source",
  },

  aggregate: {
    totalPayments: "Total Payments",
    totalExpenses: "Total Expenses",
    totalIncomePayments: "Total Income Payments",
    netProfit: "Net Profit",
    netProfitMargin: "Net Profit Margin",
    dominantCurrency: "Dominant currency",
    excludedRows: count =>
      count === 1 ? "1 row excluded (FX rate missing)" : `${count} rows excluded (FX rate missing)`,
  },

  action: {
    exportCsv: "Export CSV",
  },

  status: {
    positive: "Profit",
    negative: "Loss",
    breakeven: "Break-even",
  },

  empty: {
    title: "No data for this month",
    description: "Try a different month or check back later.",
  },

  error: {
    monthInvalid: "Month must be in YYYY-MM format.",
    paginationInvalid: "Page size and offset must be positive numbers within the allowed range.",
  },
};
