import type { currencyExchangeRates, invoices, payments } from "@/backend/db";
import type { PageInfo } from "@/backend/types";
import type { InvoiceStatus, InvoiceType } from "@/shared/lib";

export type InvoiceSelectType = typeof invoices.$inferSelect;
export type InvoiceInsertInput = typeof invoices.$inferInsert;

// InvoiceReturnType removed — was unused. Re-create from InvoiceSelectType if needed.

export type PaymentSelectType = typeof payments.$inferSelect;
export type PaymentInsertInput = typeof payments.$inferInsert;

// PaymentReturnType removed — was unused. Re-create from PaymentSelectType if needed.

export type CurrencyExchangeRateSelectType = typeof currencyExchangeRates.$inferSelect;
export type CurrencyExchangeRateInsertInput = typeof currencyExchangeRates.$inferInsert;

export interface UnpaidInvoiceSummaryItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  totalUnpaidAmount: string;
  currency: string;
  overdueCount: number;
  oldestDueDate: string;
}

export interface UnpaidInvoicesSummaryResult {
  id: string;
  totalOverdueInvoices: number;
  totalOverdueAmount: string;
  items: UnpaidInvoiceSummaryItem[];
}

export interface InvoiceHistoryPaginatedResult {
  readonly id: string;
  readonly rows: InvoiceHistoryRow[];
  readonly totalCount: number;
  readonly pageInfo: PageInfo | null;
}

export interface InvoiceHistoryRow {
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
}

export interface AdminBillingSummaryResult {
  readonly id: string;
  readonly totalOutstanding: string;
  readonly pendingCount: number;
  readonly mtdRevenue: string;
  readonly negativeBalanceCount: number;
}

export interface StudentCreditRow {
  readonly id: string;
  readonly studentName: string;
  readonly parentEmail: string;
  readonly planType: InvoiceType;
  readonly classesRemaining: number;
  readonly classesTotal: number;
  readonly status: import("@/shared/lib/enum").StudentStatus;
}

export interface ParentBillingSummaryResult {
  readonly id: string;
  readonly outstandingBalance: string;
  readonly paidThisTerm: string;
  readonly nextDueDate: string | null;
  readonly activeStudents: number;
}

export interface ManualInvoiceResult {
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
}

export interface MarkInvoicePaidResult {
  readonly invoice: {
    readonly id: string;
    readonly parentId: string;
    readonly status: InvoiceStatus;
    readonly paidDate: string | null;
    readonly version: number;
  };
  readonly notificationSummaryUpdated: boolean;
}

export interface DeleteInvoiceResult {
  readonly invoice: {
    readonly id: string;
    readonly parentId: string;
    readonly deletedAt: string | null;
    readonly version: number;
  };
  readonly notificationSummaryUpdated: boolean;
}

export interface SendPaymentReminderResult {
  readonly id: string;
  readonly success: boolean;
}

export interface CreateManualInvoiceInput {
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
}

export interface MarkInvoicePaidReturnType {
  readonly id: string;
  readonly parentId: string;
  readonly status: InvoiceStatus;
  readonly paidDate: string | null;
  readonly version: number;
  readonly notificationSummaryUpdated: boolean;
}

export interface DeleteInvoiceReturnType {
  readonly id: string;
  readonly parentId: string;
  readonly version: number;
  readonly notificationSummaryUpdated: boolean;
}
