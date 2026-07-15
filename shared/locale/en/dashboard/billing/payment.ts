import type { PaymentComponentLabels } from "@/shared/locale/types/dashboard/billing/payment";

export const payment: PaymentComponentLabels = {
  paymentMethodSelector: {
    label: "Payment Method",
    placeholder: "Select saved payment method",
  },
  paymentStatusBadge: {
    paid: "Paid",
    pending: "Pending",
    unpaid: "Unpaid",
    overdue: "Overdue",
    cancelled: "Cancelled",
    refunded: "Refunded",
  },
  paymentSummaryCard: {
    amount: "Amount",
    date: "Date",
    paymentMethod: "Payment Method",
  },
};
