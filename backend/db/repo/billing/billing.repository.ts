import { and, asc, count, desc, eq, inArray, isNull, ne, or, type SQL, sql } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import type { DBTransaction } from "@/backend/db/db.types";
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
import { CurrencyCode, StudentStatus } from "@/backend/enum";
import { parseInvoiceStatus, parseInvoiceType, parseStudentStatus } from "@/backend/lib/enum";
import type * as Types from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

type CurrencyExchangeRateUpdateInput = Omit<Types.CurrencyExchangeRateInsertType, "id" | "createdAt" | "updatedAt">;
type InvoiceCreateInput = Omit<Types.InvoiceInsertType, "id" | "createdAt" | "updatedAt">;
type PaymentRecordInput = Omit<Types.PaymentInsertType, "id" | "createdAt" | "updatedAt">;

export namespace BillingRepository {
  async function acquireInvoiceLock(tx: DBTransaction, invoiceId: string): Promise<void> {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('invoice_' || ${invoiceId}::text))`);
  }

  async function getExistingInvoiceOrThrow(
    t: DBTransaction,
    invoiceId: string,
    tErrors: ErrorsLabels
  ): Promise<Types.InvoiceSelectType> {
    await acquireInvoiceLock(t, invoiceId);

    const existing = await t
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), isNull(invoices.deletedAt)))
      .limit(1);

    if (existing.length === 0) {
      throw new Error(tErrors.billing.invoiceNotFound(invoiceId));
    }

    return existing[0];
  }

  async function resolveExchangeRateSnapshot(
    t: DBTransaction | typeof db,
    currency: CurrencyCode,
    tErrors: ErrorsLabels,
    snapshot?: string | null,
    source?: string | null
  ): Promise<{ snapshot: string | null; source: string | null }> {
    if (snapshot || currency === CurrencyCode.USD) {
      return { snapshot: snapshot ?? null, source: source ?? null };
    }

    const rate = await getLatestExchangeRate(currency, CurrencyCode.USD,tErrors, t as DBTransaction, );
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
    input: {
      currency: CurrencyCode;
      exchangeRateSnapshot?: string | null;
      exchangeRateSource?: string | null;
    } & Record<string, unknown>,
    tErrors: ErrorsLabels
  ): Promise<R> {
    const { snapshot, source } = await resolveExchangeRateSnapshot(
      t,
      input.currency,
      tErrors,
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
   * Get the latest exchange rate.
   */
  export const getLatestExchangeRate = async (
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    tErrors: ErrorsLabels,
    tx?: DBTransaction,
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
      throw new Error(
        tErrors.file.recordNotFound({
          tableName: "currency_exchange_rates",
          entityId: `${fromCurrency}_${toCurrency}`,
        })
      );
    }
    const latest = results[0];

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (latest.effectiveDate < twentyFourHoursAgo) {
      throw new Error(
        tErrors.file.recordNotFound({
          tableName: "currency_exchange_rates",
          entityId: `${fromCurrency}_${toCurrency}`,
        })
      );
    }

    return latest;
  };

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
    const queryDb = tx ?? db;
    const results = await queryDb
      .select()
      .from(currencyExchangeRates)
      .where(
        and(eq(currencyExchangeRates.fromCurrency, fromCurrency), eq(currencyExchangeRates.toCurrency, toCurrency))
      )
      .orderBy(desc(currencyExchangeRates.effectiveDate))
      .limit(1);

    if (results.length === 0) {
      return { rate: null, stale: true };
    }

    const latest = results[0];
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (latest.effectiveDate < twentyFourHoursAgo) {
      return { rate: null, stale: true };
    }

    return { rate: latest.rate, stale: false };
  };

  /**
   * Inserts a new exchange rate row and audit log entry within a single transaction.
   * Shared by {@link updateExchangeRate} (own transaction) and
   * {@link updateExchangeRateInTx} (caller-provided transaction).
   */
  async function writeExchangeRateWithAudit(
    t: DBTransaction,
    input: CurrencyExchangeRateUpdateInput,
    changedByUserId: string | null
  ): Promise<Types.CurrencyExchangeRateSelectType> {
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
  }

  /**
   * Updates an exchange rate and creates an audit log entry.
   * Accepts `changedByUserId: string | null` so the cron path can pass null.
   */
  export const updateExchangeRate = async (
    input: CurrencyExchangeRateUpdateInput,
    changedByUserId: string | null,
    tx?: DBTransaction
  ): Promise<Types.CurrencyExchangeRateSelectType> => {
    const runner = async (t: DBTransaction) => writeExchangeRateWithAudit(t, input, changedByUserId);
    return tx ? runner(tx) : db.transaction(runner);
  };

  /**
   * Writes an exchange rate + audit log inside a caller-provided transaction.
   * Used so the FX ingestion service can write many pairs in one transaction (C3).
   * Never starts a nested transaction — `tx` is required.
   */
  export const updateExchangeRateInTx = async (
    input: CurrencyExchangeRateUpdateInput,
    changedByUserId: string | null,
    tx: DBTransaction
  ): Promise<Types.CurrencyExchangeRateSelectType> => writeExchangeRateWithAudit(tx, input, changedByUserId);

  /**
   * Lists the latest exchange rate per `(fromCurrency, toCurrency)` pair using
   * `DISTINCT ON` ordered by `effective_date DESC` (P2 — reports/latest query).
   * Supports optional limit/offset pagination; defaults to 200 when null.
   *
   * Drizzle lacks a first-class DISTINCT ON DSL, so we fetch ordered rows and
   * deduplicate in-memory: the ORDER BY (from, to, effective_date DESC) ensures
   * the first row encountered per pair is the latest.
   */
  export const listLatestExchangeRates = async (
    pagination: Types.PaginationArgs | null = null,
    tx?: DBTransaction
  ): Promise<Types.CurrencyExchangeRateReturnType[]> => {
    const queryDb = tx ?? db;
    const limit = pagination ? pagination.perPage : 200;
    const offset = pagination ? pagination.offset : 0;

    const rows = await queryDb
      .select()
      .from(currencyExchangeRates)
      .orderBy(
        currencyExchangeRates.fromCurrency,
        currencyExchangeRates.toCurrency,
        desc(currencyExchangeRates.effectiveDate)
      )
      .limit(limit)
      .offset(offset);

    const seen = new Set<string>();
    const latest: Types.CurrencyExchangeRateReturnType[] = [];
    for (const row of rows) {
      const key = `${row.fromCurrency}:${row.toCurrency}`;
      if (seen.has(key)) continue;
      seen.add(key);
      latest.push({
        id: row.id,
        fromCurrency: row.fromCurrency,
        toCurrency: row.toCurrency,
        rate: row.rate,
        source: row.source,
        effectiveDate: row.effectiveDate,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
    }

    return latest;
  };

  /**
   * Returns paginated exchange-rate history for a single (from, to) pair
   * filtered to the last `maxDays` days (default 90), capped at limit 100 (S5).
   * Uses the same pagination pattern as {@link getInvoicesForParent}.
   */
  type ExchangeRateHistorySelectRow = {
    id: string;
    fromCurrency: string;
    toCurrency: string;
    rate: string;
    source: string | null;
    effectiveDate: Date;
  };

  const exchangeRateHistoryFields = {
    id: currencyExchangeRates.id,
    fromCurrency: currencyExchangeRates.fromCurrency,
    toCurrency: currencyExchangeRates.toCurrency,
    rate: currencyExchangeRates.rate,
    source: currencyExchangeRates.source,
    effectiveDate: currencyExchangeRates.effectiveDate,
  };

  function mapExchangeRateHistoryRow(r: ExchangeRateHistorySelectRow): Types.ExchangeRateHistoryRow {
    return {
      id: r.id,
      fromCurrency: r.fromCurrency as Types.ExchangeRateHistoryRow["fromCurrency"],
      toCurrency: r.toCurrency as Types.ExchangeRateHistoryRow["toCurrency"],
      rate: r.rate,
      source: r.source,
      effectiveDate: r.effectiveDate,
    };
  }

  export const listExchangeRateHistory = async (
    from: CurrencyCode,
    to: CurrencyCode,
    pagination: Types.PaginationArgs | null = null,
    maxDays = 90,
    tx?: DBTransaction
  ): Promise<Types.ExchangeRateHistoryPaginatedResult> => {
    const queryDb = tx ?? db;
    const whereCondition = and(
      eq(currencyExchangeRates.fromCurrency, from),
      eq(currencyExchangeRates.toCurrency, to),
      sql`${currencyExchangeRates.effectiveDate} >= NOW() - INTERVAL '${sql.raw(String(maxDays))} days'`
    );

    const historyId = `exchange-rate-history-${from}-${to}`;

    if (!pagination) {
      const rows = await queryDb
        .select(exchangeRateHistoryFields)
        .from(currencyExchangeRates)
        .where(whereCondition)
        .orderBy(desc(currencyExchangeRates.effectiveDate))
        .limit(100);

      return _buildUnpaginatedResult(historyId, rows.map(mapExchangeRateHistoryRow));
    }

    const cap = Math.min(pagination.perPage, 100);
    const currentPage = pagination.currentPage;
    const offset = pagination.offset;

    const [dataRows, countResult] = await Promise.all([
      queryDb
        .select(exchangeRateHistoryFields)
        .from(currencyExchangeRates)
        .where(whereCondition)
        .orderBy(desc(currencyExchangeRates.effectiveDate))
        .limit(cap)
        .offset(offset),
      queryDb.select({ count: count() }).from(currencyExchangeRates).where(whereCondition),
    ]);

    const totalCount = countResult[0]?.count ?? 0;
    const lastPage = Math.max(1, Math.ceil(totalCount / cap));
    const rows = dataRows.map(mapExchangeRateHistoryRow);

    return {
      id: historyId,
      rows,
      totalCount,
      pageInfo: _buildPageInfo(rows.length, currentPage, offset, totalCount, cap, lastPage),
    };
  };

  /**
   * Creates an invoice with a mandatory exchange rate snapshot if currency != 'USD'.
   */
  export const createInvoice = async (
    input: InvoiceCreateInput,
    tErrors: ErrorsLabels,
    tx?: DBTransaction,
  ): Promise<Types.InvoiceSelectType> => {
    const runner = async (t: DBTransaction) =>
      createBillingEntity<Types.InvoiceSelectType>(t, invoices, input, tErrors);
    return tx ? runner(tx) : db.transaction(runner);
  };

  /**
   * Records a payment with an exchange rate snapshot.
   */
  export const recordPayment = async (
    input: PaymentRecordInput,
    tErrors: ErrorsLabels,
    tx?: DBTransaction,
  ): Promise<Types.PaymentSelectType> => {
    const runner = async (t: DBTransaction) =>
      createBillingEntity<Types.PaymentSelectType>(t, payments, input, tErrors);
    return tx ? runner(tx) : db.transaction(runner);
  };

  export const getPaymentsByInvoiceId = async (
    invoiceId: string,
    tx?: DBTransaction
  ): Promise<Types.PaymentSelectType[]> => {
    const t = tx ?? db;
    return t.select().from(payments).where(eq(payments.invoiceId, invoiceId));
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
    tErrors: ErrorsLabels,
    paidDate?: Date | null,
    expectedVersion?: number,
    tx?: DBTransaction,
  ): Promise<Types.InvoiceSelectType> => {
    const runner = async (t: DBTransaction) => {
      await acquireInvoiceLock(t, invoiceId);

      const results = await t.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
      if (results.length === 0) {
        throw new Error(tErrors.billing.invoiceNotFound(invoiceId) ?? `Invoice not found: ${invoiceId}`);
      }
      const current = results[0];

      if (expectedVersion !== undefined && current.version !== expectedVersion) {
        throw new Error(
          tErrors.billing.invoiceVersionMismatch({
            id: invoiceId,
            expectedVersion,
            gotVersion: current.version,
          }) ?? `Invoice version mismatch: expected ${expectedVersion}, got ${current.version}`
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

  // Drizzle's $inferSelect gives the runtime types for columns (string, nullable, etc.)
  type OverdueInvoiceRow = {
    invoiceId: string;
    parentId: string;
    amount: string;
    currency: CurrencyCode;
    dueDate: string;
  };

  type ParentUserRow = {
    parentId: string;
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
  };

  function createEmptySummary(totalOverdueInvoices: number): Types.UnpaidInvoicesSummaryResult {
    return {
      id: "unpaid-invoices-summary",
      totalOverdueInvoices,
      totalOverdueAmount: "0.00",
      overdueAmountsByCurrency: [],
      items: [],
    };
  }

  function groupAmountsByCurrency(
    rows: readonly { amount: string; currency: CurrencyCode }[],
    idPrefix: string
  ): Types.BillingCurrencyTotal[] {
    const byCurrency = new Map<CurrencyCode, number>();
    for (const row of rows) {
      const numericAmount = Number.parseFloat(row.amount);
      if (!Number.isFinite(numericAmount)) continue;
      byCurrency.set(row.currency, (byCurrency.get(row.currency) ?? 0) + numericAmount);
    }
    return [...byCurrency.entries()].map(([currency, amount]) => ({
      id: `${idPrefix}-${currency}`,
      currency,
      amount: amount.toFixed(2),
    }));
  }

  function _buildPageInfo(
    rowCount: number,
    currentPage: number,
    offset: number,
    totalCount: number,
    perPage: number,
    lastPage: number
  ): Types.PageInfo {
    return {
      count: rowCount,
      currentPage,
      firstItem: rowCount > 0 ? offset + 1 : null,
      lastItem: rowCount > 0 ? offset + rowCount : null,
      hasMorePages: currentPage < lastPage,
      lastPage,
      perPage,
      total: totalCount,
    };
  }

  function _buildUnpaginatedResult<TRow>(
    id: string,
    rows: TRow[]
  ): { id: string; rows: TRow[]; totalCount: number; pageInfo: null } {
    return { id, rows, totalCount: rows.length, pageInfo: null };
  }

  async function fetchOverdueInvoices(t: DBTransaction | typeof db): Promise<OverdueInvoiceRow[]> {
    return t
      .select({
        invoiceId: invoices.id,
        parentId: invoices.parentId,
        amount: invoices.amount,
        currency: invoices.currency,
        dueDate: invoices.dueDate,
      })
      .from(invoices)
      .where(and(eq(invoices.status, "UNPAID"), sql`${invoices.dueDate} < CURRENT_DATE`))
      .orderBy(invoices.dueDate)
      .limit(500);
  }

  async function fetchParentUsers(
    t: DBTransaction | typeof db,
    parentIds: string[]
  ): Promise<Map<string, ParentUserRow>> {
    const parentUsers = await t
      .select({
        parentId: parents.id,
        userId: parents.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(parents)
      .leftJoin(users, eq(parents.userId, users.id))
      .where(inArray(parents.id, parentIds));

    return new Map(parentUsers.map(p => [p.parentId, p]));
  }

  function groupInvoicesByParent(overdueInvoices: OverdueInvoiceRow[]): Map<string, OverdueInvoiceRow[]> {
    const grouped = new Map<string, OverdueInvoiceRow[]>();
    for (const inv of overdueInvoices) {
      const existing = grouped.get(inv.parentId) ?? [];
      existing.push(inv);
      grouped.set(inv.parentId, existing);
    }
    return grouped;
  }

  function buildSummaryItems(
    groupedByParent: Map<string, OverdueInvoiceRow[]>,
    parentMap: Map<string, ParentUserRow>
  ): Types.UnpaidInvoiceSummaryItem[] {
    const items: Types.UnpaidInvoiceSummaryItem[] = [];

    for (const [parentId, invs] of groupedByParent) {
      const parent = parentMap.get(parentId);
      if (!parent?.userId) continue;

      const amountsByCurrency = groupAmountsByCurrency(invs, `unpaid-${parentId}`).map(bucket => ({
        ...bucket,
        subjectUserId: parent.userId,
      }));
      const sortedInvs = [...invs].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      const primaryCurrency = amountsByCurrency[0]?.currency ?? sortedInvs[0]?.currency;
      const primaryAmount = amountsByCurrency.find(bucket => bucket.currency === primaryCurrency)?.amount ?? "0.00";

      items.push({
        id: parentId,
        userId: parent.userId,
        userName: parent.userName ?? "Unknown",
        userEmail: parent.userEmail ?? "",
        totalUnpaidAmount: primaryAmount,
        currency: primaryCurrency,
        overdueCount: invs.length,
        oldestDueDate: sortedInvs[0]?.dueDate ?? "",
        amountsByCurrency,
      });
    }

    return items;
  }

  export const getUnpaidInvoicesSummary = async (tx?: DBTransaction): Promise<Types.UnpaidInvoicesSummaryResult> => {
    const t = tx ?? db;

    const overdueInvoices = await fetchOverdueInvoices(t);

    if (overdueInvoices.length === 0) {
      return createEmptySummary(0);
    }

    const parentIds = [...new Set(overdueInvoices.map(inv => inv.parentId))];
    if (parentIds.length === 0) {
      return createEmptySummary(overdueInvoices.length);
    }

    const parentMap = await fetchParentUsers(t, parentIds);
    const groupedByParent = groupInvoicesByParent(overdueInvoices);
    const items = buildSummaryItems(groupedByParent, parentMap);
    const overdueAmountsByCurrency = groupAmountsByCurrency(overdueInvoices, "overdue-global");
    const primaryGlobalAmount = overdueAmountsByCurrency[0]?.amount ?? "0.00";

    return {
      id: "unpaid-invoices-summary",
      totalOverdueInvoices: overdueInvoices.length,
      totalOverdueAmount: primaryGlobalAmount,
      overdueAmountsByCurrency,
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
    parentId: invoices.parentId,
    parentUserId: parents.userId,
    hasPaymentProof: sql<boolean>`EXISTS (
      SELECT 1
      FROM invoice_files inf
      WHERE inf.invoice_id = ${invoices.id}
        AND inf.usage_type = 'payment_proof'
    )`.as("has_payment_proof"),
    hasRejectedSubmission: sql<boolean>`EXISTS (
      SELECT 1
      FROM (
        SELECT ips.status
        FROM invoice_payment_submissions ips
        WHERE ips.invoice_id = ${invoices.id}
        ORDER BY ips.submitted_at DESC
        LIMIT 1
      ) latest_submission
      WHERE latest_submission.status = 'rejected'
    )`.as("has_rejected_submission"),
  };

  function buildInvoiceSearchCondition(search: string | null | undefined): SQL | undefined {
    const normalized = search?.trim();
    if (!normalized) {
      return undefined;
    }
    const pattern = `%${normalized.toLowerCase()}%`;
    return or(
      sql`LOWER(${invoices.id}::text) LIKE ${pattern}`,
      sql`LOWER(COALESCE(${students.name}, '')::text) LIKE ${pattern}`,
      sql`LOWER(${invoices.amount}::text) LIKE ${pattern}`
    );
  }

  function mergeWhereConditions(...conditions: (SQL | undefined)[]): SQL | undefined {
    const merged = conditions.filter((condition): condition is SQL => condition !== undefined);
    if (merged.length === 0) {
      return undefined;
    }
    if (merged.length === 1) {
      return merged[0];
    }
    return and(...merged);
  }

  function mapInvoiceRow(r: {
    id: string;
    issueDate: string;
    dueDate: string;
    paidDate: string | null;
    amount: string;
    currency: CurrencyCode;
    status: string;
    invoiceType: string | null;
    studentId: string | null;
    studentName: string | null;
    parentId: string;
    parentUserId: string | null;
    hasPaymentProof: boolean;
    hasRejectedSubmission: boolean;
  }): Types.InvoiceHistoryRow {
    return {
      id: r.id,
      issueDate: r.issueDate,
      dueDate: r.dueDate,
      paidDate: r.paidDate ?? null,
      amount: r.amount,
      currency: r.currency,
      status: parseInvoiceStatus(r.status),
      invoiceType: parseInvoiceType(r.invoiceType),
      studentId: r.studentId ?? null,
      studentName: r.studentName ?? null,
      parentId: r.parentId,
      parentUserId: r.parentUserId ?? null,
      hasPaymentProof: r.hasPaymentProof,
      hasRejectedSubmission: r.hasRejectedSubmission,
    };
  }

  export const getInvoicesForParent = async (
    parentId: string,
    pagination: Types.PaginationArgs | null = null,
    search: string | null | undefined = null,
    tx?: DBTransaction
  ): Promise<Types.InvoiceHistoryPaginatedResult> => {
    const queryDb = tx ?? db;
    const whereCondition = mergeWhereConditions(
      and(eq(invoices.parentId, parentId), isNull(invoices.deletedAt)),
      buildInvoiceSearchCondition(search)
    );

    if (!pagination) {
      return fetchUnpaginatedInvoices(queryDb, whereCondition, `parent-invoice-history-${parentId}`);
    }

    return fetchInvoicesPaginatedData(queryDb, `parent-invoice-history-${parentId}`, whereCondition, pagination);
  };

  async function countInvoicesWithJoin(
    queryDb: DBTransaction | typeof db,
    whereCondition: SQL | undefined
  ): Promise<number> {
    const countResult = await queryDb
      .select({ count: count() })
      .from(invoices)
      .leftJoin(students, eq(invoices.studentId, students.id))
      .where(whereCondition);
    return countResult[0]?.count ?? 0;
  }

  async function fetchUnpaginatedInvoices(
    queryDb: DBTransaction | typeof db,
    whereCondition: SQL | undefined,
    resultId: string
  ): Promise<Types.InvoiceHistoryPaginatedResult> {
    const rows = await queryDb
      .select(invoiceBaseFields)
      .from(invoices)
      .leftJoin(students, eq(invoices.studentId, students.id))
      .leftJoin(parents, eq(invoices.parentId, parents.id))
      .where(whereCondition)
      .orderBy(desc(invoices.issueDate))
      .limit(200);

    return _buildUnpaginatedResult(resultId, rows.map(mapInvoiceRow));
  }

  async function fetchInvoicesPaginatedData(
    queryDb: DBTransaction | typeof db,
    resultId: string,
    whereCondition: SQL | undefined,
    pagination: Types.PaginationArgs
  ): Promise<Types.InvoiceHistoryPaginatedResult> {
    const perPage = pagination.perPage;
    const currentPage = pagination.currentPage;
    const offset = pagination.offset;

    const [dataRows, totalCount] = await Promise.all([
      queryDb
        .select(invoiceBaseFields)
        .from(invoices)
        .leftJoin(students, eq(invoices.studentId, students.id))
        .leftJoin(parents, eq(invoices.parentId, parents.id))
        .where(whereCondition)
        .orderBy(desc(invoices.issueDate))
        .limit(perPage)
        .offset(offset),
      countInvoicesWithJoin(queryDb, whereCondition),
    ]);

    const lastPage = Math.max(1, Math.ceil(totalCount / perPage));
    const rows: Types.InvoiceHistoryRow[] = dataRows.map(mapInvoiceRow);

    return {
      id: resultId,
      rows,
      totalCount,
      pageInfo: _buildPageInfo(rows.length, currentPage, offset, totalCount, perPage, lastPage),
    };
  }

  export const getAllInvoices = async (
    pagination: Types.PaginationArgs | null = null,
    search: string | null | undefined = null,
    tx?: DBTransaction
  ): Promise<Types.InvoiceHistoryPaginatedResult> => {
    const queryDb = tx ?? db;
    const whereCondition = mergeWhereConditions(isNull(invoices.deletedAt), buildInvoiceSearchCondition(search));

    if (!pagination) {
      return fetchUnpaginatedInvoices(queryDb, whereCondition, "admin-invoice-history");
    }

    return fetchInvoicesPaginatedData(queryDb, "admin-invoice-history", whereCondition, pagination);
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

    const unpaidByCurrency = await t
      .select({
        currency: invoices.currency,
        amount: sql<string>`COALESCE(SUM(${invoices.amount}), '0.00')`,
      })
      .from(invoices)
      .where(and(eq(invoices.status, "UNPAID"), isNull(invoices.deletedAt)))
      .groupBy(invoices.currency);

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

    const mtdByCurrency = await t
      .select({
        currency: invoices.currency,
        amount: sql<string>`COALESCE(SUM(${invoices.amount}), '0.00')`,
      })
      .from(invoices)
      .where(and(eq(invoices.status, "PAID"), isNull(invoices.deletedAt), sql`${invoices.paidDate} >= ${firstOfMonth}`))
      .groupBy(invoices.currency);

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
      outstandingByCurrency: unpaidByCurrency.map(row => ({
        id: `outstanding-${row.currency}`,
        currency: row.currency,
        amount: row.amount,
      })),
      mtdRevenueByCurrency: mtdByCurrency.map(row => ({
        id: `mtd-${row.currency}`,
        currency: row.currency,
        amount: row.amount,
      })),
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
      .orderBy(students.classesRemaining)
      .limit(200);

    return rows.map(r => ({
      id: r.id,
      studentName: r.studentName ?? "Unknown",
      parentEmail: r.parentEmail ?? "",
      planType: parseInvoiceType(r.planType),
      classesRemaining: r.classesRemaining,
      classesTotal: r.classesTotal,
      status: parseStudentStatus(r.status) ?? StudentStatus.REGULAR,
    }));
  };

  async function fetchUnpaidInvoiceSummary(t: DBTransaction | typeof db, parentId: string) {
    const unpaidResult = await t
      .select({
        outstandingBalance: sql<string>`COALESCE(SUM(${invoices.amount}), '0.00')`,
        nextDueDate: sql<string | null>`MIN(${invoices.dueDate})`,
      })
      .from(invoices)
      .where(and(eq(invoices.parentId, parentId), eq(invoices.status, "UNPAID"), isNull(invoices.deletedAt)));

    const unpaidByCurrency = await t
      .select({
        currency: invoices.currency,
        amount: sql<string>`COALESCE(SUM(${invoices.amount}), '0.00')`,
      })
      .from(invoices)
      .where(and(eq(invoices.parentId, parentId), eq(invoices.status, "UNPAID"), isNull(invoices.deletedAt)))
      .groupBy(invoices.currency);

    return { unpaidResult, unpaidByCurrency };
  }

  async function fetchPaidInvoiceSummary(t: DBTransaction | typeof db, parentId: string) {
    const paidResult = await t
      .select({
        paidThisTerm: sql<string>`COALESCE(SUM(${invoices.amount}), '0.00')`,
      })
      .from(invoices)
      .where(and(eq(invoices.parentId, parentId), eq(invoices.status, "PAID"), isNull(invoices.deletedAt)));

    const paidByCurrency = await t
      .select({
        currency: invoices.currency,
        amount: sql<string>`COALESCE(SUM(${invoices.amount}), '0.00')`,
      })
      .from(invoices)
      .where(and(eq(invoices.parentId, parentId), eq(invoices.status, "PAID"), isNull(invoices.deletedAt)))
      .groupBy(invoices.currency);

    return { paidResult, paidByCurrency };
  }

  async function fetchParentBillingExtras(t: DBTransaction | typeof db, parentId: string) {
    const activeStudentsResult = await t
      .select({ activeStudents: count() })
      .from(students)
      .where(and(eq(students.parentId, parentId), ne(students.status, StudentStatus.DEACTIVATED)));

    const [nextUnpaidRow] = await t
      .select({
        id: invoices.id,
        amount: invoices.amount,
        currency: invoices.currency,
        dueDate: invoices.dueDate,
        studentName: students.name,
      })
      .from(invoices)
      .leftJoin(students, eq(invoices.studentId, students.id))
      .where(and(eq(invoices.parentId, parentId), eq(invoices.status, "UNPAID"), isNull(invoices.deletedAt)))
      .orderBy(asc(invoices.dueDate))
      .limit(1);

    const [pendingCountResult] = await t
      .select({ pendingPaymentCount: count() })
      .from(invoices)
      .where(and(eq(invoices.parentId, parentId), eq(invoices.status, "PAYMENT_PENDING"), isNull(invoices.deletedAt)));

    return { activeStudentsResult, nextUnpaidRow, pendingCountResult };
  }

  export const getParentBillingSummary = async (
    parentId: string,
    tx?: DBTransaction
  ): Promise<Types.ParentBillingSummaryResult> => {
    const t = tx ?? db;

    const { unpaidResult, unpaidByCurrency } = await fetchUnpaidInvoiceSummary(t, parentId);
    const { paidResult, paidByCurrency } = await fetchPaidInvoiceSummary(t, parentId);
    const { activeStudentsResult, nextUnpaidRow, pendingCountResult } = await fetchParentBillingExtras(t, parentId);

    return {
      id: `parent-billing-summary-${parentId}`,
      outstandingBalance: unpaidResult[0]?.outstandingBalance ?? "0.00",
      paidThisTerm: paidResult[0]?.paidThisTerm ?? "0.00",
      nextDueDate: unpaidResult[0]?.nextDueDate ?? null,
      activeStudents: activeStudentsResult[0]?.activeStudents ?? 0,
      nextUnpaidInvoice: nextUnpaidRow
        ? {
            id: nextUnpaidRow.id,
            amount: nextUnpaidRow.amount,
            currency: nextUnpaidRow.currency,
            dueDate: nextUnpaidRow.dueDate,
            studentName: nextUnpaidRow.studentName ?? null,
          }
        : null,
      pendingPaymentCount: pendingCountResult?.pendingPaymentCount ?? 0,
      outstandingByCurrency: unpaidByCurrency.map(row => ({
        id: `outstanding-${row.currency}`,
        currency: row.currency,
        amount: row.amount,
      })),
      paidThisTermByCurrency: paidByCurrency.map(row => ({
        id: `paid-${row.currency}`,
        currency: row.currency,
        amount: row.amount,
      })),
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
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<Types.InvoiceSelectType> => {
    const runner = async (t: DBTransaction) => {
      await getExistingInvoiceOrThrow(t, invoiceId, tErrors);

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

  export const getInvoiceById = async (
    invoiceId: string,
    tx?: DBTransaction
  ): Promise<Types.InvoiceSelectType | null> => {
    const t = tx ?? db;
    const results = await t
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
    tx?: DBTransaction,
  ): Promise<Types.InvoiceSelectType> => {
    return updateInvoiceStatus(invoiceId, "PAYMENT_PENDING", tErrors, null, expectedVersion, tx, );
  };

  export const markInvoiceAsPaid = async (
    invoiceId: string,
    tErrors: ErrorsLabels,
    expectedVersion?: number,
    tx?: DBTransaction
  ): Promise<Types.InvoiceSelectType> => {
    const runner = async (t: DBTransaction) => {
      const current = await getExistingInvoiceOrThrow(t, invoiceId, tErrors);

      if (current.status !== "UNPAID" && current.status !== "PAYMENT_PENDING") {
        throw new Error(
          tErrors.billing.invoiceAlreadyPaid({ id: invoiceId, status: current.status }) ??
            `Invoice ${invoiceId} is already ${current.status.toLowerCase()}.`
        );
      }

      if (expectedVersion !== undefined && current.version !== expectedVersion) {
        throw new Error(
          tErrors.billing.invoiceVersionMismatch({
            id: invoiceId,
            expectedVersion,
            gotVersion: current.version,
          }) ?? `Invoice version mismatch: expected ${expectedVersion}, got ${current.version}`
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

  export const findInvoicesByIdempotencyKeys = async (
    keys: readonly string[],
    tx?: DBTransaction
  ): Promise<Types.InvoiceSelectType[]> => {
    if (keys.length === 0) return [];
    const t = tx ?? db;
    return t
      .select()
      .from(invoices)
      .where(inArray(invoices.idempotencyKey, [...keys]));
  };

  async function upsertMany<TInput, TOutput>(
    inputs: readonly TInput[],
    table: PgTable,
    conflictTarget: PgColumn,
    buildSetClause: (input: TInput) => Record<string, unknown>,
    tx?: DBTransaction
  ): Promise<TOutput[]> {
    if (inputs.length === 0) return [];
    const now = new Date();

    const runner = async (t: DBTransaction) => {
      const results: TOutput[] = [];
      for (const input of inputs) {
        const inserted = (await t
          .insert(table)
          .values({
            ...input,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: conflictTarget,
            set: buildSetClause(input),
          })
          .returning()) as TOutput[];
        if (inserted[0]) results.push(inserted[0]);
      }
      return results;
    };

    return tx ? runner(tx) : db.transaction(runner);
  }

  export const upsertManyInvoices = async (
    inputs: readonly InvoiceCreateInput[],
    tx?: DBTransaction
  ): Promise<Types.InvoiceSelectType[]> => {
    return upsertMany(
      inputs,
      invoices,
      invoices.idempotencyKey,
      input => ({
        status: input.status,
        paidDate: input.paidDate ?? null,
        updatedAt: new Date(),
      }),
      tx
    );
  };

  export const findPaymentsByIdempotencyKeys = async (
    keys: readonly string[],
    tx?: DBTransaction
  ): Promise<Types.PaymentSelectType[]> => {
    if (keys.length === 0) return [];
    const t = tx ?? db;
    return t
      .select()
      .from(payments)
      .where(inArray(payments.idempotencyKey, [...keys]));
  };

  export const upsertManyPayments = async (
    inputs: readonly PaymentRecordInput[],
    tx?: DBTransaction
  ): Promise<Types.PaymentSelectType[]> => {
    return upsertMany(
      inputs,
      payments,
      payments.idempotencyKey,
      () => ({
        updatedAt: new Date(),
      }),
      tx
    );
  };

  export const upsertManyExchangeRates = async (
    inputs: readonly CurrencyExchangeRateUpdateInput[],
    tx?: DBTransaction
  ): Promise<Types.CurrencyExchangeRateSelectType[]> => {
    if (inputs.length === 0) return [];
    const now = new Date();
    const t = tx ?? db;
    const results: Types.CurrencyExchangeRateSelectType[] = [];

    for (const input of inputs) {
      const [row] = await t
        .insert(currencyExchangeRates)
        .values({
          ...input,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [
            currencyExchangeRates.fromCurrency,
            currencyExchangeRates.toCurrency,
            currencyExchangeRates.effectiveDate,
          ],
          set: { rate: input.rate, updatedAt: now },
        })
        .returning();
      if (row) results.push(row);
    }

    return results;
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
    const t = tx ?? db;
    return t
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
