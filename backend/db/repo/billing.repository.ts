import { and, desc, eq } from "drizzle-orm";
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
   * Fetches the latest exchange rate for a currency pair.
   * Throws if rate is older than 24 hours (Stale Rate Alert).
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
      // In a real app, this might trigger a background refresh or an alert
      // For now, we follow the mandate to detect stale rates
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
      // Get existing rate for audit
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

      // Insert new rate
      const [newRate] = await t
        .insert(currencyExchangeRates)
        .values({
          ...input,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Audit Log
      await t.insert(currencyExchangeAuditLogs).values({
        fromCurrency: input.fromCurrency,
        toCurrency: input.toCurrency,
        oldRate: results.length > 0 ? (oldRate.rate) : null,
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
   * Assumes USD is the base currency for hedging.
   */
  export const createInvoice = async (
    input: InvoiceCreateInput,
    tx?: DBTransaction
  ): Promise<Types.InvoiceSelectType> => {
    const runner = async (t: DBTransaction) => {
      let rateSnapshot = input.exchangeRateSnapshot;
      let rateSource = input.exchangeRateSource;

      if (!rateSnapshot && input.currency !== "USD") {
        const rate = await getLatestExchangeRate(input.currency, "USD", t);
        rateSnapshot = rate.rate;
        rateSource = rate.source || "SYSTEM_AUTO";
      }

      const [created] = await t
        .insert(invoices)
        .values({
          ...input,
          exchangeRateSnapshot: rateSnapshot,
          exchangeRateSource: rateSource,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return created;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  /**
   * Records a payment with an exchange rate snapshot.
   */
  export const recordPayment = async (
    input: PaymentRecordInput,
    tx?: DBTransaction
  ): Promise<Types.PaymentSelectType> => {
    const runner = async (t: DBTransaction) => {
      let rateSnapshot = input.exchangeRateSnapshot;
      let rateSource = input.exchangeRateSource;

      if (!rateSnapshot && input.currency !== "USD") {
        const rate = await getLatestExchangeRate(input.currency, "USD", t);
        rateSnapshot = rate.rate;
        rateSource = rate.source || "SYSTEM_AUTO";
      }

      const [created] = await t
        .insert(payments)
        .values({
          ...input,
          exchangeRateSnapshot: rateSnapshot,
          exchangeRateSource: rateSource,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return created;
    };

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
    const setting = results[0];
    return parseInt(setting.value, 10);
  };
}
