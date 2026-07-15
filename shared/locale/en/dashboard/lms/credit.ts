import type { CreditLabels } from "@/shared/locale/types/dashboard/lms/credit";

export const credit: CreditLabels = {
  title: "Credits",
  balance: "Remaining Balance",
  purchase: "Purchase",
  deduction: "Deduction",
  refund: "Refund",
  adjustment: "Adjustment",
  transactionsHistory: "Transactions History",
  hoursRemaining: "Hours Remaining",
  hoursTotal: "Total Hours",
  recordPurchase: "Record Purchase",
  purchaseSuccess: hours => `Purchase recorded successfully: ${hours} hours`,
  insufficientCredits: remaining => `Insufficient credits. Remaining: ${remaining} hours`,
};
