import { and, eq, inArray, isNull } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import {
  buildExchangeRateHistoryResult,
  collectLatestExchangeRates,
  fetchLatestExchangeRateRow,
  findLatestExchangeRateOrThrow,
  upsertExchangeRateRows,
  writeExchangeRateWithAudit,
} from "@/backend/db/repo/billing/billing-exchange-rate.parts";
import { isExchangeRateStale, mergeBillingWhereConditions } from "@/backend/db/repo/billing/billing-helpers";
import {
  createBillingEntity,
  deleteInvoiceInTx,
  updateInvoiceStatusInTx,
  upsertInvoiceRows,
  upsertPaymentRows,
} from "@/backend/db/repo/billing/billing-invoice.parts";
import { buildInvoiceSearchCondition, fetchInvoiceHistory } from "@/backend/db/repo/billing/billing-invoice.queries";
import {
  buildAdminBillingSummary,
  buildParentBillingSummary,
  buildStudentsWithCreditStatus,
  buildUnpaidInvoicesSummary,
} from "@/backend/db/repo/billing/billing-summary.parts";
import {
  currencyExchangeAuditLogs,
  invoiceCoverageMonths,
  invoices,
  payments,
  systemSettings,
} from "@/backend/db/schema";
import type * as Types from "@/backend/types";
import type {
  CurrencyExchangeRateSubmitInput,
  DBTransaction,
  ManualInvoiceInsertType,
  PaymentRecordInput,
} from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";

export namespace BillingRepository {
  export const getLatestExchangeRate = async (
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    tErrors: ErrorsLabels,
    tx?: DBTransaction | typeof db
  ): Promise<Types.CurrencyExchangeRateSelectType> =>
    findLatestExchangeRateOrThrow(fromCurrency, toCurrency, tErrors, tx);

  /**
   * Soft FX read for UI display conversion only.
   * Financial insert paths MUST use {@link getLatestExchangeRate} (throw variant).
   */
  export const getLatestExchangeRateForDisplay = async (
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    tx?: DBTransaction,
    _locale?: string
  ): Promise<{ rate: string | null; stale: boolean }> => {
    const latest = await fetchLatestExchangeRateRow(fromCurrency, toCurrency, tx);

    if (!latest || isExchangeRateStale(latest.effectiveDate)) {
      return { rate: null, stale: true };
    }

    return { rate: latest.rate, stale: false };
  };

  /**
   * Updates an exchange rate and creates an audit log entry.
   * Accepts `changedByUserId: string | null` so the cron path can pass null.
   */
  export const updateExchangeRate = async (
    input: CurrencyExchangeRateSubmitInput,
    changedByUserId: string | null,
    tx?: DBTransaction
  ): Promise<Types.CurrencyExchangeRateSelectType> => {
    const runner = async (t: DBTransaction) => writeExchangeRateWithAudit(t, input, changedByUserId);
    return tx ? runner(tx) : db.transaction(runner);
  };

  /**
   * Writes an exchange rate + audit log inside a caller-provided transaction.
   * Never starts a nested transaction — `tx` is required.
   */
  export const updateExchangeRateInTx = async (
    input: CurrencyExchangeRateSubmitInput,
    changedByUserId: string | null,
    tx: DBTransaction
  ): Promise<Types.CurrencyExchangeRateSelectType> => writeExchangeRateWithAudit(tx, input, changedByUserId);

  /**
   * Lists the latest exchange rate per `(fromCurrency, toCurrency)` pair.
   * Supports optional limit/offset pagination; defaults to 200 when null.
   */
  export const listLatestExchangeRates = async (
    pagination: Types.PaginationArgs | null = null,
    tx?: DBTransaction
  ): Promise<Types.CurrencyExchangeRateReturnType[]> => collectLatestExchangeRates(queryDb(tx), pagination);

  export const listExchangeRateHistory = async (
    from: CurrencyCode,
    to: CurrencyCode,
    pagination: Types.PaginationArgs | null = null,
    maxDays = 90,
    tx?: DBTransaction
  ): Promise<Types.ExchangeRateHistoryPaginatedResult> =>
    buildExchangeRateHistoryResult(queryDb(tx), from, to, pagination, maxDays);

  /**
   * Creates an invoice with a mandatory exchange rate snapshot if currency != 'USD'.
   */
  export const createInvoice = async (
    input: ManualInvoiceInsertType,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<Types.InvoiceSelectType> => {
    const runner = async (t: DBTransaction) => createBillingEntity(t, invoices, input, tErrors);
    return tx ? runner(tx) : db.transaction(runner);
  };

  /**
   * Records a payment with an exchange rate snapshot.
   */
  export const recordPayment = async (
    input: PaymentRecordInput,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<Types.PaymentSelectType> => {
    const runner = async (t: DBTransaction) => createBillingEntity(t, payments, input, tErrors);
    return tx ? runner(tx) : db.transaction(runner);
  };

  export const getPaymentsByInvoiceId = async (
    invoiceId: string,
    tx?: DBTransaction
  ): Promise<Types.PaymentSelectType[]> => {
    const q = queryDb(tx);
    return q.select().from(payments).where(eq(payments.invoiceId, invoiceId));
  };

  /**
   * Fetches rounding rules from system settings.
   */
  export const getRoundingRules = async (tx?: DBTransaction): Promise<number> => {
    const q = queryDb(tx);
    const results = await q
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "billing_rounding_decimals"))
      .limit(1);

    if (results.length === 0) return 2;
    return Number.parseInt(results[0].value, 10);
  };

  /**
   * Updates invoice status with optimistic locking.
   */
  export const updateInvoiceStatus = async (
    invoiceId: string,
    newStatus: string,
    tErrors: ErrorsLabels,
    paidDate?: Date | null,
    expectedVersion?: number,
    tx?: DBTransaction
  ): Promise<Types.InvoiceSelectType> => {
    const runner = async (t: DBTransaction) =>
      updateInvoiceStatusInTx(t, invoiceId, newStatus, tErrors, paidDate, expectedVersion);
    return tx ? runner(tx) : db.transaction(runner);
  };

  export const getUnpaidInvoicesSummary = async (tx?: DBTransaction): Promise<Types.UnpaidInvoicesSummaryResult> =>
    buildUnpaidInvoicesSummary(tx);

  export const getInvoicesForParent = async (
    parentId: string,
    pagination: Types.PaginationArgs | null = null,
    search: string | null | undefined = null,
    tx?: DBTransaction
  ): Promise<Types.InvoiceHistoryPaginatedResult> =>
    fetchInvoiceHistory(
      mergeBillingWhereConditions(
        and(eq(invoices.parentId, parentId), isNull(invoices.deletedAt)),
        buildInvoiceSearchCondition(search)
      ),
      `parent-invoice-history-${parentId}`,
      pagination,
      tx
    );

  export const getAllInvoices = async (
    pagination: Types.PaginationArgs | null = null,
    search: string | null | undefined = null,
    tx?: DBTransaction
  ): Promise<Types.InvoiceHistoryPaginatedResult> =>
    fetchInvoiceHistory(
      mergeBillingWhereConditions(isNull(invoices.deletedAt), buildInvoiceSearchCondition(search)),
      "admin-invoice-history",
      pagination,
      tx
    );

  export const getAdminBillingSummary = async (tx?: DBTransaction): Promise<Types.AdminBillingSummaryResult> =>
    buildAdminBillingSummary(tx);

  export const getStudentsWithCreditStatus = async (tx?: DBTransaction): Promise<Types.StudentCreditRow[]> =>
    buildStudentsWithCreditStatus(tx);

  export const getParentBillingSummary = async (
    parentId: string,
    tx?: DBTransaction
  ): Promise<Types.ParentBillingSummaryResult> => buildParentBillingSummary(parentId, tx);

  export const createInvoiceCoverageMonths = async (
    invoiceId: string,
    months: readonly { readonly year: number; readonly month: number }[],
    tx?: DBTransaction
  ): Promise<void> => {
    const t = tx ?? db;
    if (months.length === 0) return;
    await t.insert(invoiceCoverageMonths).values(
      months.map(m => ({
        invoiceId,
        year: m.year,
        month: m.month,
      }))
    );
  };

  export const deleteInvoice = async (
    invoiceId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<Types.InvoiceSelectType> => {
    const runner = async (t: DBTransaction) => deleteInvoiceInTx(t, invoiceId, tErrors);
    return tx ? runner(tx) : db.transaction(runner);
  };

  export const getInvoiceById = async (
    invoiceId: string,
    tx?: DBTransaction
  ): Promise<Types.InvoiceSelectType | null> => {
    const q = queryDb(tx);
    const results = await q
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), isNull(invoices.deletedAt)))
      .limit(1);
    return results[0] ?? null;
  };

  export const setInvoicePaymentPending = async (
    invoiceId: string,
    tErrors: ErrorsLabels,
    expectedVersion?: number,
    tx?: DBTransaction
  ): Promise<Types.InvoiceSelectType> =>
    updateInvoiceStatus(invoiceId, "PAYMENT_PENDING", tErrors, null, expectedVersion, tx);

  export const markInvoiceAsPaid = async (
    invoiceId: string,
    tErrors: ErrorsLabels,
    expectedVersion?: number,
    tx?: DBTransaction
  ): Promise<Types.InvoiceSelectType> =>
    updateInvoiceStatus(invoiceId, "PAID", tErrors, new Date(), expectedVersion, tx);

  export const findInvoicesByIdempotencyKeys = async (
    keys: readonly string[],
    tx?: DBTransaction
  ): Promise<Types.InvoiceSelectType[]> => {
    if (keys.length === 0) return [];
    const q = queryDb(tx);
    return q
      .select()
      .from(invoices)
      .where(inArray(invoices.idempotencyKey, [...keys]));
  };

  export const upsertManyInvoices = async (
    inputs: readonly ManualInvoiceInsertType[],
    tx?: DBTransaction
  ): Promise<Types.InvoiceSelectType[]> => {
    if (inputs.length === 0) return [];
    return upsertInvoiceRows(tx, inputs);
  };

  export const findPaymentsByIdempotencyKeys = async (
    keys: readonly string[],
    tx?: DBTransaction
  ): Promise<Types.PaymentSelectType[]> => {
    if (keys.length === 0) return [];
    const q = queryDb(tx);
    return q
      .select()
      .from(payments)
      .where(inArray(payments.idempotencyKey, [...keys]));
  };

  export const upsertManyPayments = async (
    inputs: readonly PaymentRecordInput[],
    tx?: DBTransaction
  ): Promise<Types.PaymentSelectType[]> => {
    if (inputs.length === 0) return [];
    return upsertPaymentRows(tx, inputs);
  };

  export const upsertManyExchangeRates = async (
    inputs: readonly CurrencyExchangeRateSubmitInput[],
    tx?: DBTransaction
  ): Promise<Types.CurrencyExchangeRateSelectType[]> => {
    if (inputs.length === 0) return [];
    return upsertExchangeRateRows(tx ?? db, inputs);
  };

  export const createManyExchangeAuditLogs = async (
    inputs: readonly Omit<Types.CurrencyExchangeAuditLogInsertType, "id">[],
    tx?: DBTransaction
  ): Promise<Types.CurrencyExchangeAuditLogInsertType[]> => {
    if (inputs.length === 0) return [];
    const t = tx ?? db;
    return t
      .insert(currencyExchangeAuditLogs)
      .values([...inputs])
      .returning();
  };

  export const findInvoiceCoverageMonthsByInvoiceIds = async (
    invoiceIds: readonly string[],
    tx?: DBTransaction
  ): Promise<Types.InvoiceCoverageMonthSelectType[]> => {
    if (invoiceIds.length === 0) return [];
    const q = queryDb(tx);
    return q
      .select()
      .from(invoiceCoverageMonths)
      .where(inArray(invoiceCoverageMonths.invoiceId, [...invoiceIds]));
  };

  export const createManyInvoiceCoverageMonths = async (
    inputs: readonly Types.InvoiceCoverageMonthInput[],
    tx?: DBTransaction
  ): Promise<Types.InvoiceCoverageMonthSelectType[]> => {
    if (inputs.length === 0) return [];
    const t = tx ?? db;
    return t
      .insert(invoiceCoverageMonths)
      .values([...inputs])
      .onConflictDoNothing()
      .returning();
  };
}
