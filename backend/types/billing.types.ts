import type { currencyExchangeRates, invoices, payments } from "@/backend/db/schema";
import type { InvoiceStatus, InvoiceType } from "@/shared/lib/enum";
import type { PageInfo } from "./pagination.types";

export type InvoiceSelectType = typeof invoices.$inferSelect;
export type InvoiceInsertInput = typeof invoices.$inferInsert;

export type InvoiceReturnType = Omit<
  InvoiceSelectType,
  "idempotencyKey" | "exchangeRateSnapshot" | "exchangeRateSource" | "createdByUserId" | "deletedAt"
>;

export type PaymentSelectType = typeof payments.$inferSelect;
export type PaymentInsertInput = typeof payments.$inferInsert;

export type PaymentReturnType = Omit<
  PaymentSelectType,
  "idempotencyKey" | "gatewayResponse" | "exchangeRateSnapshot" | "exchangeRateSource"
>;

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
