type CoreInvoiceStatus = "UNPAID" | "PAYMENT_PENDING" | "PAID" | "CANCELLED";

export type AdminInvoiceStatus = "OVERDUE" | "PENDING" | CoreInvoiceStatus;

export type StudentCreditStatus = "negative_balance" | "active_credit";
