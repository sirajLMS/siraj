import { ValidationError } from "@/backend/lib";
import type {
  ProfitLossExpenseRow,
  ProfitLossIncomeRow,
  ProfitLossInput,
  ProfitLossPaymentRow,
  ProfitLossSummary,
} from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type CsvColumn, serializeCsvRowset } from "@/shared/lib/csv";
import { EXPORT_ROW_LIMIT } from "@/shared/lib/csv/export-row-limit";
import { readTrimmedParam } from "@/shared/lib/query-params.helpers";
import type { ErrorsLabels } from "@/shared/locale";

/** One CSV column per completed-session row field, in the row-contract declaration order. */
const PAYMENT_COLUMNS: readonly CsvColumn<ProfitLossPaymentRow>[] = [
  { header: "instanceId", pick: row => row.instanceId },
  { header: "scheduledStartAt", pick: row => row.scheduledStartAt },
  { header: "teacherName", pick: row => row.teacherName },
  { header: "studentName", pick: row => row.studentName },
  { header: "subjectName", pick: row => row.subjectName },
  { header: "durationMinutes", pick: row => String(row.durationMinutes) },
  { header: "studentPaidAmount", pick: row => row.studentPaidAmount },
  { header: "studentPaidCurrency", pick: row => row.studentPaidCurrency },
  { header: "convertedAmount", pick: row => row.convertedAmount ?? "" },
  { header: "manualSubtractCredits", pick: row => row.manualSubtractCredits ?? "" },
  { header: "manualSubtractCreditsCurrency", pick: row => row.manualSubtractCreditsCurrency ?? "" },
  { header: "calculationStatus", pick: row => row.calculationStatus },
];

/** Serializes the Payments tab of the P&L report. */
export function serializeProfitLossPaymentsCsv(rows: readonly ProfitLossPaymentRow[]): string {
  return serializeCsvRowset(PAYMENT_COLUMNS, rows);
}

/** One CSV column per expense-ledger row field, in the row-contract declaration order. */
const EXPENSE_COLUMNS: readonly CsvColumn<ProfitLossExpenseRow>[] = [
  { header: "id", pick: row => row.id },
  { header: "title", pick: row => row.title },
  { header: "type", pick: row => row.type },
  { header: "teacherName", pick: row => row.teacherName ?? "" },
  { header: "expenseValue", pick: row => row.expenseValue },
  { header: "expenseCurrency", pick: row => row.expenseCurrency },
  { header: "convertedAmount", pick: row => row.convertedAmount ?? "" },
  { header: "paymentDate", pick: row => row.paymentDate },
  { header: "sourceEntity", pick: row => row.sourceEntity ?? "" },
  { header: "sourceEntityId", pick: row => row.sourceEntityId ?? "" },
  { header: "note", pick: row => row.note ?? "" },
];

/** Serializes the Expenses tab of the P&L report. */
export function serializeProfitLossExpensesCsv(rows: readonly ProfitLossExpenseRow[]): string {
  return serializeCsvRowset(EXPENSE_COLUMNS, rows);
}

/** One CSV column per income-payment row field, in the row-contract declaration order. */
const INCOME_COLUMNS: readonly CsvColumn<ProfitLossIncomeRow>[] = [
  { header: "paymentId", pick: row => row.paymentId },
  { header: "paymentDate", pick: row => row.paymentDate },
  { header: "studentName", pick: row => row.studentName },
  { header: "parentName", pick: row => row.parentName ?? "" },
  { header: "amount", pick: row => row.amount },
  { header: "currency", pick: row => row.currency },
  { header: "convertedAmount", pick: row => row.convertedAmount ?? "" },
  { header: "paymentMethodType", pick: row => row.paymentMethodType },
  { header: "packageName", pick: row => row.packageName ?? "" },
  { header: "invoiceId", pick: row => row.invoiceId ?? "" },
];

/** Serializes the Income Payments tab of the P&L report. */
export function serializeProfitLossIncomeCsv(rows: readonly ProfitLossIncomeRow[]): string {
  return serializeCsvRowset(INCOME_COLUMNS, rows);
}

/** The Profits tab is a fixed four-row summary: metric name, amount, currency. */
interface SummaryLine {
  readonly metric: string;
  readonly amount: string;
}

/** Localizable metric labels for the summary rows, supplied by the caller from the dashboard label bundle. */
interface SummaryLabels {
  readonly totalIncomePayments: string;
  readonly totalPayments: string;
  readonly totalExpenses: string;
  readonly netProfit: string;
  readonly netProfitMargin: string;
}

/**
 * Serializes the Profits tab of the P&L report: a `metric,value,currency`
 * header plus one line per summary figure (income, teacher payments,
 * expenses, net profit, margin). The net-profit margin line carries the
 * percentage in the value cell and an empty currency cell. Pure and
 * synchronous.
 */
export function serializeProfitLossSummaryCsv(summary: ProfitLossSummary, labels: SummaryLabels): string {
  const lines: readonly SummaryLine[] = [
    { metric: labels.totalIncomePayments, amount: summary.totalIncomePayments },
    { metric: labels.totalPayments, amount: summary.totalPayments },
    { metric: labels.totalExpenses, amount: summary.totalExpenses },
    { metric: labels.netProfit, amount: summary.netProfit },
    { metric: labels.netProfitMargin, amount: summary.netProfitMargin ?? "" },
  ];
  const columns: readonly CsvColumn<SummaryLine>[] = [
    { header: "metric", pick: line => line.metric },
    { header: "value", pick: line => line.amount },
    { header: "currency", pick: line => (line.metric === labels.netProfitMargin ? "" : summary.currency) },
  ];
  return serializeCsvRowset(columns, lines);
}

/**
 * Truncation flag for one P&L export: `true` when the tab's full row count
 * exceeds the 10 000-row export ceiling (the file then holds only the first
 * 10 000 rows).
 */
export function isProfitLossExportTruncated(totalCount: number): boolean {
  return totalCount > EXPORT_ROW_LIMIT;
}

/** The shared export ceiling, re-exposed so route handlers and tests stay in sync with it. */
export const PROFIT_LOSS_EXPORT_ROW_LIMIT = EXPORT_ROW_LIMIT;

/** Currency selector for the export query string: any supported ISO-4217 code. */
function isSupportedCurrency(value: string): value is CurrencyCode {
  return (Object.values(CurrencyCode) as readonly string[]).includes(value);
}

/**
 * Parses the export query string (params: `month`, `currency`) into the
 * report's global input. A missing/blank/invalid value rejects with the
 * localized invalid-input error before any report data is read.
 */
export function parseProfitLossExportInput(searchParams: URLSearchParams, tErrors: ErrorsLabels): ProfitLossInput {
  const month = readTrimmedParam(searchParams, "month");
  if (month === null) {
    throw new ValidationError(tErrors.invalidInput);
  }
  const currency = readTrimmedParam(searchParams, "currency");
  if (currency === null || !isSupportedCurrency(currency)) {
    throw new ValidationError(tErrors.invalidInput);
  }
  return { month, currency };
}

/** RFC-compliant attachment filename: `profit-loss-<tab>-<month>.csv` (month is already validated as YYYY-MM). */
function buildProfitLossCsvFilename(tab: string, month: string): string {
  return `attachment; filename="profit-loss-${tab}-${month}.csv"`;
}

/** Response headers for one P&L CSV export: content type, attachment filename, security headers, truncation flag. */
export function buildProfitLossCsvHeaders(tab: string, month: string, truncated: boolean): Headers {
  const headers = new Headers();
  headers.set("Content-Type", "text/csv; charset=utf-8");
  headers.set("Content-Disposition", buildProfitLossCsvFilename(tab, month));
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
  headers.set("X-Export-Truncated", truncated ? "true" : "false");
  return headers;
}
