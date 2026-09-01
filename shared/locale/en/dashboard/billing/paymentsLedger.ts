import type { PaymentsLedgerLabels } from "@/shared/locale/types/dashboard/billing/paymentsLedger";

export const dashboardBillingPaymentsLedgerEn: PaymentsLedgerLabels = {
  pageTitle: "Payments Ledger",
  pageSubtitle: "Your payment history and purchased credit hours",
  historySectionTitle: "Payment History",
  emptyTitle: "No payments yet",
  emptySubtitle: "Your payment history will appear here once you make a purchase.",
  loadError: "Failed to load payments.",
  balanceSubLabel: "Credit-hours balance",
  lowBalanceHint: "Low balance — consider a top-up",
  topUpAction: "Top up",
  hoursRemainingValue: (hours: number) => `${hours.toFixed(2)} h`,
  hoursAddedChip: (hours: number) => `+${hours.toFixed(2)} h`,
  creditsAddedChip: (credits: number) => `+${credits}`,
  columns: {
    student: "Student",
    credits: "Credits",
    amount: "Amount",
    packageName: "Package",
    method: "Method",
    date: "Date",
  },
};
