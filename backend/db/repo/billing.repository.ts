import { and, desc, eq, type SQL, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "@/backend/db/drizzleDb";
import {
  currencyExchangeAuditLogs,
  currencyExchangeRates,
  invoices,
  parents,
  payments,
  systemSettings,
  users,
} from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
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

  async function resolveExchangeRateSnapshot(
    t: DBTransaction | typeof db,
    currency: string,
    snapshot?: string | null,
    source?: string | null,
    locale?: string
  ): Promise<{ snapshot: string | null; source: string | null }> {
    if (snapshot || currency === "USD") {
      return { snapshot: snapshot ?? null, source: source ?? null };
    }

    const rate = await getLatestExchangeRate(currency, "USD", t as DBTransaction, locale);
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
    >,
    locale?: string
  ): Promise<R> {
    const { snapshot, source } = await resolveExchangeRateSnapshot(
      t,
      input.currency,
      input.exchangeRateSnapshot,
      input.exchangeRateSource,
      locale
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
   * Get the latest exchange rate.
   */
  export const getLatestExchangeRate = async (
    fromCurrency: string,
    toCurrency: string,
    tx?: DBTransaction,
    locale?: string
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
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("noExchangeRate", { fromCurrency, toCurrency }));
    }
    const latest = results[0];

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (latest.effectiveDate < twentyFourHoursAgo) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("exchangeRateStale", { fromCurrency, toCurrency }));
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
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.InvoiceSelectType> => {
    const runner = async (t: DBTransaction) => createBillingEntity<Types.InvoiceSelectType>(t, invoices, input, locale);
    return tx ? runner(tx) : db.transaction(runner);
  };

  /**
   * Records a payment with an exchange rate snapshot.
   */
  export const recordPayment = async (
    input: PaymentRecordInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.PaymentSelectType> => {
    const runner = async (t: DBTransaction) => createBillingEntity<Types.PaymentSelectType>(t, payments, input, locale);
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
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.InvoiceSelectType> => {
    const runner = async (t: DBTransaction) => {
      await acquireInvoiceLock(t, invoiceId);

      const results = await t.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
      if (results.length === 0) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("invoiceNotFound", { id: invoiceId }));
      }
      const current = results[0];

      if (expectedVersion !== undefined && current.version !== expectedVersion) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(
          tFunc("invoiceVersionMismatch", {
            id: invoiceId,
            expectedVersion,
            gotVersion: current.version,
          })
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

  export const getUnpaidInvoicesSummary = async (
    tx?: DBTransaction
  ): Promise<Types.UnpaidInvoicesSummaryResult> => {
    const t = tx ?? db;

    const unpaidInvoices = await t
      .select({
        invoiceId: invoices.id,
        parentId: invoices.parentId,
        amount: invoices.amount,
        currency: invoices.currency,
        dueDate: invoices.dueDate,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.status, "UNPAID"),
          sql`${invoices.dueDate} < CURRENT_DATE`
        )
      )
      .orderBy(invoices.dueDate);

    if (unpaidInvoices.length === 0) {
      return {
        id: "unpaid-invoices-summary",
        totalOverdueInvoices: 0,
        totalOverdueAmount: "0.00",
        items: [],
      };
    }

    const parentIds = [...new Set(unpaidInvoices.map(inv => inv.parentId))];

    const parentUsers = await t
      .select({
        parentId: parents.id,
        userId: parents.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(parents)
      .leftJoin(users, eq(parents.userId, users.id))
      .where(sql`${parents.id} IN (${sql.join(parentIds.map(id => sql`${id}`), sql`, `)})`);

    const parentMap = new Map(parentUsers.map(p => [p.parentId, p]));

    const groupedByParent = new Map<string, typeof unpaidInvoices>();
    for (const inv of unpaidInvoices) {
      const existing = groupedByParent.get(inv.parentId) ?? [];
      existing.push(inv);
      groupedByParent.set(inv.parentId, existing);
    }

    const items: Types.UnpaidInvoiceSummaryItem[] = [];
    let totalAmount = 0;

    for (const [parentId, invs] of groupedByParent) {
      const parent = parentMap.get(parentId);
      if (!parent?.userId) continue;

      const parentTotal = invs.reduce((sum, inv) => sum + Number.parseFloat(inv.amount), 0);
      totalAmount += parentTotal;

      items.push({
        id: parentId,
        userId: parent.userId,
        userName: parent.userName ?? "Unknown",
        userEmail: parent.userEmail ?? "",
        totalUnpaidAmount: parentTotal.toFixed(2),
        currency: invs[0].currency,
        overdueCount: invs.length,
        oldestDueDate: invs[0].dueDate,
      });
    }

    return {
      id: "unpaid-invoices-summary",
      totalOverdueInvoices: unpaidInvoices.length,
      totalOverdueAmount: totalAmount.toFixed(2),
      items,
    };
  };
}
