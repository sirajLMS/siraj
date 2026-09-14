import type { InvoiceStatus } from "@/shared/constants/billing.enum";

type CoreInvoiceStatus = `${InvoiceStatus}`;

export type AdminInvoiceStatus = "OVERDUE" | "PENDING" | CoreInvoiceStatus;

export type StudentCreditStatus = "negative_balance" | "active_credit";
