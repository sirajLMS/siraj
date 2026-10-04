import { count, desc, eq, or, type SQL, sql } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import { buildBillingPageInfo, buildUnpaginatedBillingResult } from "@/backend/db/repo/billing/billing-helpers";
import { invoices, parents, students } from "@/backend/db/schema";
import type * as Types from "@/backend/types";
import type { DBQueryExecutor, DBTransaction } from "@/backend/types";
import { escapeLikeWildcards } from "@/backend/utils";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import { parseInvoiceStatus, parseInvoiceType } from "@/shared/lib/enum";

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

/** Builds a case-insensitive LIKE condition over invoice id, student name and amount. */
export function buildInvoiceSearchCondition(search: string | null | undefined): SQL | undefined {
  const normalized = search?.trim();
  if (!normalized) {
    return undefined;
  }
  const escapedPattern = `%${escapeLikeWildcards(normalized).toLowerCase()}%`;
  return or(
    sql`LOWER(CAST(${invoices.id} AS TEXT)) LIKE ${escapedPattern}`,
    sql`LOWER(COALESCE(${students.name}, '')) LIKE ${escapedPattern}`,
    sql`LOWER(CAST(${invoices.amount} AS TEXT)) LIKE ${escapedPattern}`
  );
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

async function countInvoicesWithJoin(executor: DBQueryExecutor, whereCondition: SQL | undefined): Promise<number> {
  const countResult = await executor
    .select({ count: count() })
    .from(invoices)
    .leftJoin(students, eq(invoices.studentId, students.id))
    .where(whereCondition);
  return countResult[0]?.count ?? 0;
}

async function fetchUnpaginatedInvoices(
  executor: DBQueryExecutor,
  whereCondition: SQL | undefined,
  resultId: string
): Promise<Types.InvoiceHistoryPaginatedResult> {
  const rows = await executor
    .select(invoiceBaseFields)
    .from(invoices)
    .leftJoin(students, eq(invoices.studentId, students.id))
    .leftJoin(parents, eq(invoices.parentId, parents.id))
    .where(whereCondition)
    .orderBy(desc(invoices.issueDate))
    .limit(200);

  return buildUnpaginatedBillingResult(resultId, rows.map(mapInvoiceRow));
}

async function fetchInvoicesPaginatedData(
  executor: DBQueryExecutor,
  resultId: string,
  whereCondition: SQL | undefined,
  pagination: Types.PaginationArgs
): Promise<Types.InvoiceHistoryPaginatedResult> {
  const perPage = pagination.perPage;
  const currentPage = pagination.currentPage;
  const offset = pagination.offset;

  const [dataRows, totalCount] = await Promise.all([
    executor
      .select(invoiceBaseFields)
      .from(invoices)
      .leftJoin(students, eq(invoices.studentId, students.id))
      .leftJoin(parents, eq(invoices.parentId, parents.id))
      .where(whereCondition)
      .orderBy(desc(invoices.issueDate))
      .limit(perPage)
      .offset(offset),
    countInvoicesWithJoin(executor, whereCondition),
  ]);

  const lastPage = Math.max(1, Math.ceil(totalCount / perPage));
  const rows: Types.InvoiceHistoryRow[] = dataRows.map(mapInvoiceRow);

  return {
    id: resultId,
    rows,
    totalCount,
    pageInfo: buildBillingPageInfo(rows.length, currentPage, offset, totalCount, perPage, lastPage),
  };
}

/** Runs an invoice history query, capped when unpaginated or paged otherwise. */
export async function fetchInvoiceHistory(
  whereCondition: SQL | undefined,
  resultId: string,
  pagination: Types.PaginationArgs | null,
  tx?: DBTransaction
): Promise<Types.InvoiceHistoryPaginatedResult> {
  const q = queryDb(tx);
  if (!pagination) {
    return fetchUnpaginatedInvoices(q, whereCondition, resultId);
  }
  return fetchInvoicesPaginatedData(q, resultId, whereCondition, pagination);
}
