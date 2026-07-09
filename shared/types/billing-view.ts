export type CoreInvoiceStatus = "UNPAID" | "PAID" | "CANCELLED";

export type AdminInvoiceStatus = "OVERDUE" | "PENDING" | CoreInvoiceStatus;

export type StudentCreditStatus = "negative_balance" | "active_credit";
