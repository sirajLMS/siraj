import { and, count, desc, eq, isNull, type SQL, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "@/backend/db/drizzleDb";
import {
  currencyExchangeAuditLogs,
  currencyExchangeRates,
  invoiceCoverageMonths,
  invoices,
  parents,
  payments,
  students,
  systemSettings,
  users,
} from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import type * as Types from "@/backend/types";
import type { PaginationArgs } from "@/backend/types";
import type { DBTransaction } from "../db.types";

type CurrencyExchangeRateUpdateInput = Omit<Types.CurrencyExchangeRateInsertInput, "id" | "createdAt" | "updatedAt">;
type InvoiceCreateInput = Omit<Types.InvoiceInsertInput, "id" | "createdAt" | "updatedAt">;
type PaymentRecordInput = Omit<Types.PaymentInsertInput, "id" | "createdAt" | "updatedAt">;

export namespace BillingRepository {
  async function acquireInvoiceLock(tx: DBTransaction, invoiceId: string): Promise<void> {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('invoice_' || ${invoiceId}::text))`);
  }

  async function getExistingInvoiceOrThrow(
    t: DBTransaction,
    invoiceId: string,
    locale?: string
  ): Promise<Types.InvoiceSelectType> {
    await acquireInvoiceLock(t, invoiceId);

    const existing = await t
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), isNull(invoices.deletedAt)))
      .limit(1);

    if (existing.length === 0) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("invoiceNotFound", { id: invoiceId }));
    }

    return existing[0];
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

  export const getUnpaidInvoicesSummary = async (tx?: DBTransaction): Promise<Types.UnpaidInvoicesSummaryResult> => {
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
      .where(and(eq(invoices.status, "UNPAID"), sql`${invoices.dueDate} < CURRENT_DATE`))
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
      .where(
        sql`${parents.id} IN (${sql.join(
          parentIds.map(id => sql`${id}`),
          sql`, `
        )})`
      );

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

  const invoiceBaseFields = {
    id: invoices.id,
    issueDate: invoices.issueDate,
    dueDate: invoices.dueDate,
    paidDate: invoices.paidDate,
    amount: invoices.amount,
    currency: invoices.currency,
    status: invoices.status,
    invoiceType: invoices.invoiceType,
    studentId: invoices.studentId,
    studentName: students.name,
  };

  function mapInvoiceRow(r: {
    id: string;
    issueDate: string;
    dueDate: string;
    paidDate: string | null;
    amount: string;
    currency: string;
    status: string;
    invoiceType: string | null;
    studentId: string | null;
    studentName: string | null;
  }): Types.InvoiceHistoryRow {
    return {
      id: r.id,
      issueDate: r.issueDate,
      dueDate: r.dueDate,
      paidDate: r.paidDate ?? null,
      amount: r.amount,
      currency: r.currency,
      status: r.status,
      invoiceType: r.invoiceType ?? "",
      studentId: r.studentId ?? null,
      studentName: r.studentName ?? null,
    };
  }

  export const getInvoicesForParent = async (
    parentId: string,
    pagination: PaginationArgs | null = null,
    tx?: DBTransaction
  ): Promise<Types.InvoiceHistoryPaginatedResult> => {
    const queryDb = tx ?? db;
    const whereCondition = and(eq(invoices.parentId, parentId), isNull(invoices.deletedAt));

    if (!pagination) {
      const rows = await queryDb
        .select(invoiceBaseFields)
        .from(invoices)
        .leftJoin(students, eq(invoices.studentId, students.id))
        .where(whereCondition)
        .orderBy(desc(invoices.issueDate));

      return {
        id: `parent-invoice-history-${parentId}`,
        rows: rows.map(mapInvoiceRow),
        totalCount: rows.length,
        pageInfo: null,
      };
    }

    return fetchInvoicesPaginated(queryDb, parentId, whereCondition, pagination);
  };

  async function fetchInvoicesPaginated(
    queryDb: DBTransaction | typeof db,
    parentId: string,
    whereCondition: SQL | undefined,
    pagination: PaginationArgs
  ): Promise<Types.InvoiceHistoryPaginatedResult> {
    const perPage = pagination.perPage;
    const currentPage = pagination.currentPage;
    const offset = pagination.offset;

    const [dataRows, countResult] = await Promise.all([
      queryDb
        .select(invoiceBaseFields)
        .from(invoices)
        .leftJoin(students, eq(invoices.studentId, students.id))
        .where(whereCondition)
        .orderBy(desc(invoices.issueDate))
        .limit(perPage)
        .offset(offset),
      queryDb.select({ count: count() }).from(invoices).where(whereCondition),
    ]);

    const totalCount = countResult[0]?.count ?? 0;
    const lastPage = Math.max(1, Math.ceil(totalCount / perPage));
    const rows: Types.InvoiceHistoryRow[] = dataRows.map(mapInvoiceRow);

    return {
      id: `parent-invoice-history-${parentId}`,
      rows,
      totalCount,
      pageInfo: {
        count: rows.length,
        currentPage,
        firstItem: rows.length > 0 ? offset + 1 : null,
        lastItem: rows.length > 0 ? offset + rows.length : null,
        hasMorePages: currentPage < lastPage,
        lastPage,
        perPage,
        total: totalCount,
      },
    };
  }

  export const getAllInvoices = async (
    pagination: PaginationArgs | null = null,
    tx?: DBTransaction
  ): Promise<Types.InvoiceHistoryPaginatedResult> => {
    const queryDb = tx ?? db;
    const whereCondition = isNull(invoices.deletedAt);

    if (!pagination) {
      const rows = await queryDb
        .select(invoiceBaseFields)
        .from(invoices)
        .leftJoin(students, eq(invoices.studentId, students.id))
        .where(whereCondition)
        .orderBy(desc(invoices.issueDate));

      return {
        id: "admin-invoice-history",
        rows: rows.map(mapInvoiceRow),
        totalCount: rows.length,
        pageInfo: null,
      };
    }

    const perPage = pagination.perPage;
    const currentPage = pagination.currentPage;
    const offset = pagination.offset;

    const [dataRows, countResult] = await Promise.all([
      queryDb
        .select(invoiceBaseFields)
        .from(invoices)
        .leftJoin(students, eq(invoices.studentId, students.id))
        .where(whereCondition)
        .orderBy(desc(invoices.issueDate))
        .limit(perPage)
        .offset(offset),
      queryDb.select({ count: count() }).from(invoices).where(whereCondition),
    ]);

    const totalCount = countResult[0]?.count ?? 0;
    const lastPage = Math.max(1, Math.ceil(totalCount / perPage));
    const rows: Types.InvoiceHistoryRow[] = dataRows.map(mapInvoiceRow);

    return {
      id: "admin-invoice-history",
      rows,
      totalCount,
      pageInfo: {
        count: rows.length,
        currentPage,
        firstItem: rows.length > 0 ? offset + 1 : null,
        lastItem: rows.length > 0 ? offset + rows.length : null,
        hasMorePages: currentPage < lastPage,
        lastPage,
        perPage,
        total: totalCount,
      },
    };
  };

  export const getAdminBillingSummary = async (tx?: DBTransaction): Promise<Types.AdminBillingSummaryResult> => {
    const t = tx ?? db;

    const unpaidResult = await t
      .select({
        totalOutstanding: sql<string>`COALESCE(SUM(${invoices.amount}), '0.00')`,
        pendingCount: count(),
      })
      .from(invoices)
      .where(and(eq(invoices.status, "UNPAID"), isNull(invoices.deletedAt)));

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

    const mtdResult = await t
      .select({
        mtdRevenue: sql<string>`COALESCE(SUM(${invoices.amount}), '0.00')`,
      })
      .from(invoices)
      .where(
        and(eq(invoices.status, "PAID"), isNull(invoices.deletedAt), sql`${invoices.paidDate} >= ${firstOfMonth}`)
      );

    const negBalanceResult = await t
      .select({
        negativeBalanceCount: count(),
      })
      .from(students)
      .where(sql`${students.classesRemaining} = 0`);

    return {
      id: "admin-billing-summary",
      totalOutstanding: unpaidResult[0]?.totalOutstanding ?? "0.00",
      pendingCount: unpaidResult[0]?.pendingCount ?? 0,
      mtdRevenue: mtdResult[0]?.mtdRevenue ?? "0.00",
      negativeBalanceCount: negBalanceResult[0]?.negativeBalanceCount ?? 0,
    };
  };

  export const getStudentsWithCreditStatus = async (tx?: DBTransaction): Promise<Types.StudentCreditRow[]> => {
    const t = tx ?? db;

    const rows = await t
      .select({
        id: students.id,
        studentName: students.name,
        parentEmail: users.email,
        planType: sql<string>`COALESCE(${parents.invoiceType}, 'MONTHLY')`,
        classesRemaining: students.classesRemaining,
        classesTotal: students.classesTotal,
        status: students.status,
      })
      .from(students)
      .leftJoin(parents, eq(students.parentId, parents.id))
      .leftJoin(users, eq(parents.userId, users.id))
      .where(sql`${students.classesRemaining} <= 5`)
      .orderBy(students.classesRemaining);

    return rows.map(r => ({
      id: r.id,
      studentName: r.studentName ?? "Unknown",
      parentEmail: r.parentEmail ?? "",
      planType: r.planType ?? "MONTHLY",
      classesRemaining: r.classesRemaining,
      classesTotal: r.classesTotal,
      status: r.status ?? "active",
    }));
  };

  export const getParentBillingSummary = async (
    parentId: string,
    tx?: DBTransaction
  ): Promise<Types.ParentBillingSummaryResult> => {
    const t = tx ?? db;

    const unpaidResult = await t
      .select({
        outstandingBalance: sql<string>`COALESCE(SUM(${invoices.amount}), '0.00')`,
        nextDueDate: sql<string | null>`MIN(${invoices.dueDate})`,
      })
      .from(invoices)
      .where(and(eq(invoices.parentId, parentId), eq(invoices.status, "UNPAID"), isNull(invoices.deletedAt)));

    const paidResult = await t
      .select({
        paidThisTerm: sql<string>`COALESCE(SUM(${invoices.amount}), '0.00')`,
      })
      .from(invoices)
      .where(and(eq(invoices.parentId, parentId), eq(invoices.status, "PAID"), isNull(invoices.deletedAt)));

    const activeStudentsResult = await t
      .select({
        activeStudents: count(),
      })
      .from(students)
      .where(and(eq(students.parentId, parentId), eq(students.status, "ACTIVE")));

    return {
      id: `parent-billing-summary-${parentId}`,
      outstandingBalance: unpaidResult[0]?.outstandingBalance ?? "0.00",
      paidThisTerm: paidResult[0]?.paidThisTerm ?? "0.00",
      nextDueDate: unpaidResult[0]?.nextDueDate ?? null,
      activeStudents: activeStudentsResult[0]?.activeStudents ?? 0,
    };
  };

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
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.InvoiceSelectType> => {
    const runner = async (t: DBTransaction) => {
      await getExistingInvoiceOrThrow(t, invoiceId, locale);

      const now = new Date();
      const [deleted] = await t
        .update(invoices)
        .set({
          deletedAt: now,
          updatedAt: now,
          version: sql`${invoices.version} + 1`,
        })
        .where(eq(invoices.id, invoiceId))
        .returning();

      return deleted;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  export const markInvoiceAsPaid = async (
    invoiceId: string,
    expectedVersion?: number,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.InvoiceSelectType> => {
    const runner = async (t: DBTransaction) => {
      const current = await getExistingInvoiceOrThrow(t, invoiceId, locale);

      if (current.status !== "UNPAID") {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("invoiceAlreadyPaid", { id: invoiceId, status: current.status }));
      }

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

      const paidDate = new Date();
      const [updated] = await t
        .update(invoices)
        .set({
          status: "PAID",
          paidDate: paidDate.toISOString().split("T")[0],
          version: sql`${invoices.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoiceId))
        .returning();

      return updated;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };
}
