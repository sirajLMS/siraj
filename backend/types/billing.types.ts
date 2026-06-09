import type { currencyExchangeRates, invoices, payments } from "@/backend/db/schema";

export type InvoiceSelectType = typeof invoices.$inferSelect;
export type InvoiceInsertInput = typeof invoices.$inferInsert;

export type PaymentSelectType = typeof payments.$inferSelect;
export type PaymentInsertInput = typeof payments.$inferInsert;

export type CurrencyExchangeRateSelectType = typeof currencyExchangeRates.$inferSelect;
export type CurrencyExchangeRateInsertInput = typeof currencyExchangeRates.$inferInsert;
