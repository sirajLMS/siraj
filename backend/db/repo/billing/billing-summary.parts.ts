import { and, asc, count, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import { formatBillingAmount, groupBillingAmountsByCurrency } from "@/backend/db/repo/billing/billing-helpers";
import { invoices, parents, students, users } from "@/backend/db/schema";
import { StudentStatus } from "@/backend/enum";
import type * as Types from "@/backend/types";
import type { DBTransaction, OverdueInvoiceRow, ParentUserRow } from "@/backend/types";
import { parseInvoiceType, parseStudentStatus } from "@/shared/lib/enum";

function createEmptySummary(totalOverdueInvoices: number): Types.UnpaidInvoicesSummaryResult {
  return {
    id: "unpaid-invoices-summary",
    totalOverdueInvoices,
    totalOverdueAmount: "0.00",
    overdueAmountsByCurrency: [],
    items: [],
  };
}

async function fetchOverdueInvoices(t?: DBTransaction): Promise<OverdueInvoiceRow[]> {
  const q = queryDb(t);
  const today = new Date().toISOString().split("T")[0];
  return q
    .select({
      invoiceId: invoices.id,
      parentId: invoices.parentId,
      amount: invoices.amount,
      currency: invoices.currency,
      dueDate: invoices.dueDate,
    })
    .from(invoices)
    .where(and(eq(invoices.status, "UNPAID"), sql`${invoices.dueDate} < ${today}`))
    .orderBy(invoices.dueDate)
    .limit(500);
}

async function fetchParentUsers(
  t: DBTransaction | undefined,
  parentIds: string[]
): Promise<Map<string, ParentUserRow>> {
  const q = queryDb(t);
  const parentUsers = await q
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

    const amountsByCurrency = groupBillingAmountsByCurrency(invs, `unpaid-${parentId}`).map(bucket =>
      Object.assign(bucket, { subjectUserId: parent.userId })
    );
    const sortedInvs = [...invs].toSorted((a, b) => a.dueDate.localeCompare(b.dueDate));
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

/** Aggregates overdue invoices by parent into the unpaid-invoices summary. */
export async function buildUnpaidInvoicesSummary(tx?: DBTransaction): Promise<Types.UnpaidInvoicesSummaryResult> {
  const overdueInvoices = await fetchOverdueInvoices(tx);

  if (overdueInvoices.length === 0) {
    return createEmptySummary(0);
  }

  const parentIds = [...new Set(overdueInvoices.map(inv => inv.parentId))];
  if (parentIds.length === 0) {
    return createEmptySummary(overdueInvoices.length);
  }

  const parentMap = await fetchParentUsers(tx, parentIds);
  const groupedByParent = groupInvoicesByParent(overdueInvoices);
  const items = buildSummaryItems(groupedByParent, parentMap);
  const overdueAmountsByCurrency = groupBillingAmountsByCurrency(overdueInvoices, "overdue-global");
  const primaryGlobalAmount = overdueAmountsByCurrency[0]?.amount ?? "0.00";

  return {
    id: "unpaid-invoices-summary",
    totalOverdueInvoices: overdueInvoices.length,
    totalOverdueAmount: primaryGlobalAmount,
    overdueAmountsByCurrency,
    items,
  };
}

/** Builds the admin dashboard billing aggregates (outstanding, MTD revenue, negatives). */
export async function buildAdminBillingSummary(tx?: DBTransaction): Promise<Types.AdminBillingSummaryResult> {
  const q = queryDb(tx);

  const unpaidResult = await q
    .select({
      totalOutstanding: sql<string>`COALESCE(SUM(CAST(${invoices.amount} AS DECIMAL)), '0.00')`,
      pendingCount: count(),
    })
    .from(invoices)
    .where(and(eq(invoices.status, "UNPAID"), isNull(invoices.deletedAt)));

  const unpaidByCurrency = await q
    .select({
      currency: invoices.currency,
      amount: sql<string>`COALESCE(SUM(CAST(${invoices.amount} AS DECIMAL)), '0.00')`,
    })
    .from(invoices)
    .where(and(eq(invoices.status, "UNPAID"), isNull(invoices.deletedAt)))
    .groupBy(invoices.currency);

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

  const mtdResult = await q
    .select({
      mtdRevenue: sql<string>`COALESCE(SUM(CAST(${invoices.amount} AS DECIMAL)), '0.00')`,
    })
    .from(invoices)
    .where(and(eq(invoices.status, "PAID"), isNull(invoices.deletedAt), sql`${invoices.paidDate} >= ${firstOfMonth}`));

  const mtdByCurrency = await q
    .select({
      currency: invoices.currency,
      amount: sql<string>`COALESCE(SUM(CAST(${invoices.amount} AS DECIMAL)), '0.00')`,
    })
    .from(invoices)
    .where(and(eq(invoices.status, "PAID"), isNull(invoices.deletedAt), sql`${invoices.paidDate} >= ${firstOfMonth}`))
    .groupBy(invoices.currency);

  const negBalanceResult = await q
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
}

/** Lists students with a low remaining-classes balance for the credit dashboard. */
export async function buildStudentsWithCreditStatus(tx?: DBTransaction): Promise<Types.StudentCreditRow[]> {
  const q = queryDb(tx);

  const rows = await q
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
}

async function fetchInvoiceAmountSummaryByStatus(
  t: DBTransaction | undefined,
  parentId: string,
  status: "UNPAID" | "PAID"
) {
  const q = queryDb(t);
  const whereCondition = and(eq(invoices.parentId, parentId), eq(invoices.status, status), isNull(invoices.deletedAt));

  const [aggregateResult, byCurrency] = await Promise.all([
    q
      .select({
        totalAmount: sql<string>`COALESCE(SUM(CAST(${invoices.amount} AS DECIMAL)), '0.00')`,
        nextDueDate: sql<string | null>`MIN(${invoices.dueDate})`,
      })
      .from(invoices)
      .where(whereCondition),
    q
      .select({
        currency: invoices.currency,
        amount: sql<string>`COALESCE(SUM(CAST(${invoices.amount} AS DECIMAL)), '0.00')`,
      })
      .from(invoices)
      .where(whereCondition)
      .groupBy(invoices.currency),
  ]);

  return { aggregateResult, byCurrency };
}

async function fetchParentBillingExtras(t: DBTransaction | undefined, parentId: string) {
  const q = queryDb(t);
  const activeStudentsResult = await q
    .select({ activeStudents: count() })
    .from(students)
    .where(and(eq(students.parentId, parentId), ne(students.status, StudentStatus.DEACTIVATED)));

  const [nextUnpaidRow] = await q
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

  const [pendingCountResult] = await q
    .select({ pendingPaymentCount: count() })
    .from(invoices)
    .where(and(eq(invoices.parentId, parentId), eq(invoices.status, "PAYMENT_PENDING"), isNull(invoices.deletedAt)));

  return { activeStudentsResult, nextUnpaidRow, pendingCountResult };
}

/** Builds a parent's billing summary (balances, next due invoice, active students). */
export async function buildParentBillingSummary(
  parentId: string,
  tx?: DBTransaction
): Promise<Types.ParentBillingSummaryResult> {
  const { aggregateResult: unpaidResult, byCurrency: unpaidByCurrency } = await fetchInvoiceAmountSummaryByStatus(
    tx,
    parentId,
    "UNPAID"
  );
  const { aggregateResult: paidResult, byCurrency: paidByCurrency } = await fetchInvoiceAmountSummaryByStatus(
    tx,
    parentId,
    "PAID"
  );
  const { activeStudentsResult, nextUnpaidRow, pendingCountResult } = await fetchParentBillingExtras(tx, parentId);

  return {
    id: `parent-billing-summary-${parentId}`,
    outstandingBalance: formatBillingAmount(unpaidResult[0]?.totalAmount),
    paidThisTerm: formatBillingAmount(paidResult[0]?.totalAmount),
    nextDueDate: unpaidResult[0]?.nextDueDate ?? null,
    activeStudents: activeStudentsResult[0]?.activeStudents ?? 0,
    nextUnpaidInvoice: nextUnpaidRow
      ? {
          id: nextUnpaidRow.id,
          amount: formatBillingAmount(nextUnpaidRow.amount),
          currency: nextUnpaidRow.currency,
          dueDate: nextUnpaidRow.dueDate,
          studentName: nextUnpaidRow.studentName ?? null,
        }
      : null,
    pendingPaymentCount: pendingCountResult?.pendingPaymentCount ?? 0,
    outstandingByCurrency: unpaidByCurrency.map(row => ({
      id: `outstanding-${row.currency}`,
      currency: row.currency,
      amount: formatBillingAmount(row.amount),
    })),
    paidThisTermByCurrency: paidByCurrency.map(row => ({
      id: `paid-${row.currency}`,
      currency: row.currency,
      amount: formatBillingAmount(row.amount),
    })),
  };
}
