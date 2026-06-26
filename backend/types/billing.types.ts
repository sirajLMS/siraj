import type { currencyExchangeRates, invoices, payments } from "@/backend/db/schema";
import type { PageInfo } from "./pagination.types";

export type InvoiceSelectType = typeof invoices.$inferSelect;
export type InvoiceInsertInput = typeof invoices.$inferInsert;

export type PaymentSelectType = typeof payments.$inferSelect;
export type PaymentInsertInput = typeof payments.$inferInsert;

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
  readonly status: string;
  readonly invoiceType: string;
  readonly studentId: string | null;
}
