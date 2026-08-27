import { createHash } from "node:crypto";
import { and, desc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { type QueryDbHandle, queryDb, queryWithPagination } from "@/backend/db";
import { invoices, packagePlans, parents, payments, students, users } from "@/backend/db/schema";
import { PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import type * as Types from "@/backend/types";
import type { DBTransaction, PaginationArgs } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

type PaymentFilter = Types.AccountingPaymentFilter;

const buildFilterConditions = (filter: PaymentFilter) => {
  const conditions = [];
  if (filter.studentId) conditions.push(eq(invoices.studentId, filter.studentId));
  if (filter.parentId) conditions.push(eq(students.parentId, filter.parentId));
  if (filter.fromDate) conditions.push(gte(payments.paymentDate, new Date(`${filter.fromDate}T00:00:00.000Z`)));
  if (filter.toDate) {
    // Inclusive upper bound — end-of-day of the requested ISO date.
    conditions.push(lte(payments.paymentDate, new Date(`${filter.toDate}T23:59:59.999Z`)));
  }
  if (filter.unpaidOnly) conditions.push(eq(payments.isPaidStatusOn, false));
  return conditions;
};

export namespace AccountingPaymentRepository {
  export const create = async (
    tx: DBTransaction,
    input: {
      invoiceId: string;
      amount: string;
      currency: CurrencyCode;
      paymentDate: Date;
      packagePlanId?: string | null;
      paymentGateway: Types.AccountingPaymentReturnType["paymentGateway"];
      creditHours: string | null;
      isPaidStatusOn: boolean;
      paymentNote: string | null;
      idempotencyKey: string;
    }
  ): Promise<Types.AccountingPaymentSelectType> => {
    const now = new Date();
    const [row] = await tx
      .insert(payments)
      .values({
        invoiceId: input.invoiceId,
        amount: input.amount,
        currency: input.currency,
        paymentDate: input.paymentDate,
        userPaymentMethodId: null,
        // Accounting payments are recorded by staff: always a recorded pay-in.
        paymentMethodType: PaymentMethodType.CASH,
        paymentMethodSnapshot: {
          userPaymentMethodId: null,
          type: PaymentMethodType.CASH,
          direction: PaymentDirection.PAYIN,
          label: input.paymentGateway,
          details: { note: input.paymentNote ?? undefined },
          catalog: null,
          snapshottedAt: now.toISOString(),
        },
        transactionId: null,
        packagePlanId: input.packagePlanId ?? null,
        paymentGateway: input.paymentGateway,
        creditHours: input.creditHours,
        isPaidStatusOn: input.isPaidStatusOn,
        paymentNote: input.paymentNote,
        gatewayResponse: null,
        refundedAmount: "0.00",
        exchangeRateSnapshot: null,
        exchangeRateSource: null,
        idempotencyKey: input.idempotencyKey,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!row) throw new Error("accounting payment insert returned no rows");
    return row;
  };

  /** Shared joined column selection (payments + display names + invoice status). */
  const joinedSelection = (parentUsers: ReturnType<typeof alias>) => ({
    id: payments.id,
    invoiceId: payments.invoiceId,
    amount: payments.amount,
    currency: payments.currency,
    paymentDate: payments.paymentDate,
    createdAt: payments.createdAt,
    updatedAt: payments.updatedAt,
    packagePlanId: payments.packagePlanId,
    packageCodename: packagePlans.codename,
    packageName: packagePlans.displayName,
    transactionId: payments.transactionId,
    paymentGateway: payments.paymentGateway,
    creditHours: payments.creditHours,
    isPaidStatusOn: payments.isPaidStatusOn,
    paymentNote: payments.paymentNote,
    studentId: students.id,
    studentName: students.name,
    parentId: parents.id,
    parentName: parentUsers.name,
    invoiceStatus: invoices.status,
  });

  /** Shared payments⋈invoices⋈students⋈parents⋈plans join used by all readers. */
  const joinedRowsQuery = (q: QueryDbHandle | DBTransaction, parentUsers: ReturnType<typeof alias>) =>
    q
      .select(joinedSelection(parentUsers))
      .from(payments)
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(students, eq(invoices.studentId, students.id))
      .leftJoin(parents, eq(students.parentId, parents.id))
      .leftJoin(parentUsers, eq(parents.userId, parentUsers.id))
      .leftJoin(packagePlans, eq(payments.packagePlanId, packagePlans.id));

  export const findById = async (id: string, tx?: DBTransaction): Promise<Types.AccountingPaymentReturnType | null> => {
    const parentUsers = alias(users, "acct_parent_users_detail");
    const q = queryDb(tx);
    const [row] = await joinedRowsQuery(q, parentUsers).where(eq(payments.id, id)).limit(1);
    return row ?? null;
  };

  export const listPaginated = async (
    filter: PaymentFilter,
    paginationArgs: PaginationArgs | null,
    tx?: DBTransaction
  ): Promise<Types.AccountingPaymentReturnType[]> => {
    const parentUsers = alias(users, "acct_parent_users_list");
    const q = queryDb(tx);
    let baseQuery = joinedRowsQuery(q, parentUsers).$dynamic();

    const conditions = buildFilterConditions(filter);
    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions));
    }
    return queryWithPagination(baseQuery.orderBy(desc(payments.createdAt)), paginationArgs);
  };

  export const countForFilter = async (filter: PaymentFilter, tx?: DBTransaction): Promise<number> => {
    const q = queryDb(tx);
    const rows = await q
      .select({ value: sql`count(*)`.mapWith(Number) })
      .from(payments)
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(students, eq(invoices.studentId, students.id))
      .where(and(...buildFilterConditions(filter)));
    return rows[0]?.value ?? 0;
  };

  /** Payments on the same invoice still flagged paid, excluding one row (EC-3). */
  export const findPaidSiblingsByInvoice = async (
    tx: DBTransaction,
    invoiceId: string,
    excludePaymentId: string
  ): Promise<Types.AccountingPaymentSelectType[]> =>
    queryDb(tx)
      .select()
      .from(payments)
      .where(
        and(eq(payments.invoiceId, invoiceId), eq(payments.isPaidStatusOn, true), ne(payments.id, excludePaymentId))
      );

  export const findByIds = async (ids: string[], tx?: DBTransaction): Promise<Types.AccountingPaymentSelectType[]> => {
    if (ids.length === 0) return [];
    const q = queryDb(tx);
    return q
      .select()
      .from(payments)
      .where(inArray(payments.id, [...ids]));
  };

  export const update = async (
    tx: DBTransaction,
    id: string,
    patch: {
      paymentGateway?: Types.AccountingPaymentReturnType["paymentGateway"];
      paymentNote?: string | null;
      creditHours?: string | null;
      isPaidStatusOn?: boolean;
    }
  ): Promise<Types.AccountingPaymentSelectType | null> => {
    const [row] = await tx
      .update(payments)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return row ?? null;
  };

  /**
   * Deterministic SHA-256 over `studentId|packagePlanId|amount|currency|
   * paymentDate|gateway` — empty string stands in for a NULL plan (EC-18).
   */
  export const generateIdempotencyKey = (input: {
    studentId: string;
    packagePlanId?: string | null;
    amount: number | string;
    currency: string;
    paymentDate: Date;
    paymentGateway: string;
  }): string => {
    const content = JSON.stringify([
      input.studentId,
      input.packagePlanId ?? "",
      String(input.amount),
      input.currency,
      input.paymentDate instanceof Date ? input.paymentDate.toISOString() : String(input.paymentDate),
      input.paymentGateway,
    ]);
    return `acctpay-${createHash("sha256").update(content).digest("hex")}`;
  };
}
