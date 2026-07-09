import type { currencyExchangeRates, invoices, payments } from "@/backend/db/schema";
import type { InvoiceStatus, InvoiceType } from "@/backend/enum";
import type { PageInfo } from "@/backend/types/shared/pagination.types";

export type InvoiceSelectType = typeof invoices.$inferSelect;
export type InvoiceInsertType = typeof invoices.$inferInsert;

export type InvoiceReturnType = Omit<
  InvoiceSelectType,
  "deletedAt" | "idempotencyKey" | "version" | "createdByUserId"
> & {
  status: InvoiceStatus;
  invoiceType: InvoiceType;
};

export type InvoiceSubmitInput = Omit<
  InvoiceInsertType,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "deletedAt"
  | "idempotencyKey"
  | "version"
  | "createdByUserId"
  | "status"
  | "paidDate"
>;

export type PaymentSelectType = typeof payments.$inferSelect;
export type PaymentInsertType = typeof payments.$inferInsert;

export type PaymentReturnType = Omit<PaymentSelectType, "deletedAt" | "idempotencyKey" | "refundedAmount">;

export type PaymentSubmitInput = Omit<
  PaymentInsertType,
  "id" | "createdAt" | "updatedAt" | "deletedAt" | "idempotencyKey" | "refundedAmount"
>;

export type CurrencyExchangeRateSelectType = typeof currencyExchangeRates.$inferSelect;
export type CurrencyExchangeRateInsertType = typeof currencyExchangeRates.$inferInsert;

export type CurrencyExchangeRateSubmitInput = Omit<CurrencyExchangeRateInsertType, "id" | "createdAt" | "updatedAt">;

export type UnpaidInvoiceSummaryItem = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  totalUnpaidAmount: string;
  currency: string;
  overdueCount: number;
  oldestDueDate: string;
};

export type UnpaidInvoicesSummaryResult = {
  id: string;
  totalOverdueInvoices: number;
  totalOverdueAmount: string;
  items: UnpaidInvoiceSummaryItem[];
};

export type InvoiceHistoryPaginatedResult = {
  readonly id: string;
  readonly rows: InvoiceHistoryRow[];
  readonly totalCount: number;
  readonly pageInfo: PageInfo | null;
};

export type InvoiceHistoryRow = {
  readonly id: string;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly paidDate: string | null;
  readonly amount: string;
  readonly currency: string;
  readonly status: InvoiceStatus;
  readonly invoiceType: InvoiceType;
  readonly studentId: string | null;
  readonly studentName: string | null;
};

export type AdminBillingSummaryResult = {
  readonly id: string;
  readonly totalOutstanding: string;
  readonly pendingCount: number;
  readonly mtdRevenue: string;
  readonly negativeBalanceCount: number;
};

export type StudentCreditRow = {
  readonly id: string;
  readonly studentName: string;
  readonly parentEmail: string;
  readonly planType: InvoiceType;
  readonly classesRemaining: number;
  readonly classesTotal: number;
  readonly status: import("@/backend/enum").StudentStatus;
};

export type ParentBillingSummaryResult = {
  readonly id: string;
  readonly outstandingBalance: string;
  readonly paidThisTerm: string;
  readonly nextDueDate: string | null;
  readonly activeStudents: number;
};

export type ManualInvoiceResult = {
  readonly id: string;
  readonly parentId: string;
  readonly studentId: string | null;
  readonly amount: string;
  readonly currency: string;
  readonly status: InvoiceStatus;
  readonly invoiceType: InvoiceType;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly paidDate: string | null;
  readonly version: number;
  readonly createdAt: Date;
};

export type MarkInvoicePaidResult = {
  readonly invoice: {
    readonly id: string;
    readonly parentId: string;
    readonly status: InvoiceStatus;
    readonly paidDate: string | null;
    readonly version: number;
  };
  readonly notificationSummaryUpdated: boolean;
};

export type DeleteInvoiceResult = {
  readonly invoice: {
    readonly id: string;
    readonly parentId: string;
    readonly deletedAt: string | null;
    readonly version: number;
  };
  readonly notificationSummaryUpdated: boolean;
};

export type SendPaymentReminderResult = {
  readonly id: string;
  readonly success: boolean;
};

export type CreateManualInvoiceInput = {
  readonly parentId: string;
  readonly studentId?: string | null;
  readonly amount: string;
  readonly currency: string;
  readonly invoiceType: string;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly exchangeRateSnapshot?: string | null;
  readonly exchangeRateSource?: string | null;
  readonly billingMonths?: readonly { readonly year: number; readonly month: number }[] | null;
  readonly sendEmail?: boolean | null;
  readonly idempotencyKey?: string;
};

export type MarkInvoicePaidReturnType = {
  readonly id: string;
  readonly parentId: string;
  readonly status: InvoiceStatus;
  readonly paidDate: string | null;
  readonly version: number;
  readonly notificationSummaryUpdated: boolean;
};

export type DeleteInvoiceReturnType = {
  readonly id: string;
  readonly parentId: string;
  readonly version: number;
  readonly notificationSummaryUpdated: boolean;
};
