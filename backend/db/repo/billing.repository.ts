import { and, desc, eq, type SQL, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "@/backend/db/drizzleDb";
import {
  currencyExchangeAuditLogs,
  currencyExchangeRates,
  invoices,
  payments,
  systemSettings,
} from "@/backend/db/schema";
import type * as Types from "@/backend/types";

type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type CurrencyExchangeRateUpdateInput = Omit<Types.CurrencyExchangeRateInsertInput, "id" | "createdAt" | "updatedAt">;
type InvoiceCreateInput = Omit<Types.InvoiceInsertInput, "id" | "createdAt" | "updatedAt">;
type PaymentRecordInput = Omit<Types.PaymentInsertInput, "id" | "createdAt" | "updatedAt">;

export namespace BillingRepository {
  /**
   * Helper to acquire an advisory lock for an invoice
   */
  async function acquireInvoiceLock(tx: DBTransaction, invoiceId: string): Promise<void> {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('invoice_' || ${invoiceId}::text))`);
  }

  /**
   * Helper to resolve exchange rate snapshot for billing entities
   */
  async function resolveExchangeRateSnapshot(
    t: DBTransaction | typeof db,
    currency: string,
    snapshot?: string | null,
    source?: string | null
  ): Promise<{ snapshot: string | null; source: string | null }> {
    if (snapshot || currency === "USD") {
      return { snapshot: snapshot ?? null, source: source ?? null };
    }

    const rate = await getLatestExchangeRate(currency, "USD", t as DBTransaction);
    return {
      snapshot: rate.rate,
      source: rate.source || "SYSTEM_AUTO",
    };
  }

  /**
   * Internal helper to create a billing entity (invoice or payment) with exchange rate
   */
  async function createBillingEntity<R>(
    t: DBTransaction,
    table: PgTable,
    input: { currency: string; exchangeRateSnapshot?: string | null; exchangeRateSource?: string | null } & Record<
      string,
      unknown
    >
  ): Promise<R> {
    const { snapshot, source } = await resolveExchangeRateSnapshot(
      t,
      input.currency,
      input.exchangeRateSnapshot,
      input.exchangeRateSource
    );

    const results = await t
      .insert(table)
      .values({
        ...input,
        exchangeRateSnapshot: snapshot,
        exchangeRateSource: source,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return results[0] as R;
  }

  /**
   * Fetches the latest exchange rate for a currency pair.
   */
  export const getLatestExchangeRate = async (
    fromCurrency: string,
    toCurrency: string,
    tx?: DBTransaction
  ): Promise<Types.CurrencyExchangeRateSelectType> => {
    const t = tx || db;
    const results = await t
      .select()
      .from(currencyExchangeRates)
      .where(
        and(eq(currencyExchangeRates.fromCurrency, fromCurrency), eq(currencyExchangeRates.toCurrency, toCurrency))
      )
      .orderBy(desc(currencyExchangeRates.effectiveDate))
      .limit(1);

    if (results.length === 0) {
      throw new Error(`No exchange rate found for ${fromCurrency} to ${toCurrency}`);
    }
    const latest = results[0];

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (latest.effectiveDate < twentyFourHoursAgo) {
      throw new Error(`Exchange rate for ${fromCurrency} to ${toCurrency} is stale (older than 24h)`);
    }

    return latest;
  };

  /**
   * Updates an exchange rate and creates an audit log entry.
   */
  export const updateExchangeRate = async (
    input: CurrencyExchangeRateUpdateInput,
    changedByUserId: string,
    tx?: DBTransaction
  ): Promise<Types.CurrencyExchangeRateSelectType> => {
    const runner = async (t: DBTransaction) => {
      const results = await t
        .select()
        .from(currencyExchangeRates)
        .where(
          and(
            eq(currencyExchangeRates.fromCurrency, input.fromCurrency),
            eq(currencyExchangeRates.toCurrency, input.toCurrency)
          )
        )
        .orderBy(desc(currencyExchangeRates.effectiveDate))
        .limit(1);

      const oldRate = results[0];

      const [newRate] = await t
        .insert(currencyExchangeRates)
        .values({
          ...input,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      await t.insert(currencyExchangeAuditLogs).values({
        fromCurrency: input.fromCurrency,
        toCurrency: input.toCurrency,
        oldRate: results.length > 0 ? oldRate.rate : null,
        newRate: input.rate,
        source: input.source || "MANUAL",
        changedByUserId,
        createdAt: new Date(),
      });

      return newRate;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  /**
   * Creates an invoice with a mandatory exchange rate snapshot if currency != 'USD'.
   */
  export const createInvoice = async (
    input: InvoiceCreateInput,
    tx?: DBTransaction
  ): Promise<Types.InvoiceSelectType> => {
    const runner = async (t: DBTransaction) => createBillingEntity<Types.InvoiceSelectType>(t, invoices, input);
    return tx ? runner(tx) : db.transaction(runner);
  };

  /**
   * Records a payment with an exchange rate snapshot.
   */
  export const recordPayment = async (
    input: PaymentRecordInput,
    tx?: DBTransaction
  ): Promise<Types.PaymentSelectType> => {
    const runner = async (t: DBTransaction) => createBillingEntity<Types.PaymentSelectType>(t, payments, input);
    return tx ? runner(tx) : db.transaction(runner);
  };

  /**
   * Fetches rounding rules from system settings.
   */
  export const getRoundingRules = async (tx?: DBTransaction): Promise<number> => {
    const t = tx || db;
    const results = await t
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
    paidDate?: Date | null,
    expectedVersion?: number,
    tx?: DBTransaction
  ): Promise<Types.InvoiceSelectType> => {
    const runner = async (t: DBTransaction) => {
      await acquireInvoiceLock(t, invoiceId);

      const results = await t.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
      if (results.length === 0) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }
      const current = results[0];

      if (expectedVersion !== undefined && current.version !== expectedVersion) {
        throw new Error(
          `Version mismatch for invoice ${invoiceId}. Expected ${expectedVersion}, got ${current.version}. Please retry.`
        );
      }

      const updateData: {
        status: Types.InvoiceSelectType["status"];
        paidDate?: string | null;
        version: SQL;
        updatedAt: Date;
      } = {
        status: newStatus,
        version: sql`${invoices.version} + 1`,
        updatedAt: new Date(),
      };

      if (paidDate !== undefined) {
        updateData.paidDate = paidDate ? paidDate.toISOString().split("T")[0] : null;
      }

      const [updated] = await t.update(invoices).set(updateData).where(eq(invoices.id, invoiceId)).returning();

      return updated;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };
}
