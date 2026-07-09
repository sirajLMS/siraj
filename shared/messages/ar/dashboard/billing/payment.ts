import type { PaymentComponentLabels } from "@/shared/messages/types/dashboard/billing";

export const payment: PaymentComponentLabels = {
  paymentMethodSelector: {
    bank_account: "حساب بنكي",
    paypal: "باي بال",
    label: "طريقة الدفع",
  },
  paymentStatusBadge: {
    paid: "مدفوع",
    pending: "قيد الانتظار",
    unpaid: "غير مدفوع",
    overdue: "متأخر",
    cancelled: "ملغى",
    refunded: "مسترد",
  },
  paymentSummaryCard: {
    amount: "المبلغ",
    date: "التاريخ",
    paymentMethod: "طريقة الدفع",
  },
};