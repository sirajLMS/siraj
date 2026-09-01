import { eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { queryDb } from "@/backend/db";
import { invoices, parents, payments, students, users } from "@/backend/db/schema";
import type * as Types from "@/backend/types";
import type { DBTransaction } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Extra plumbing used by AccountingPaymentService that belongs in the repo
 * layer (kept out of the main repository file so its namespace stays focused).
 */
export namespace AccountingPaymentSupport {
  /**
   * Resolves the notification recipients for a student's hour ledger:
   * the student's own login user plus the linked parent user (nullable).
   */
  export const resolveHourLedgerRecipients = async (
    studentId: string,
    tx?: DBTransaction
  ): Promise<{ studentUserId: string | null; parentUserId: string | null }> => {
    const parentUsers = alias(users, "acct_parent_recipients");
    const q = queryDb(tx);
    const [row] = await q
      .select({ studentUserId: students.userId, parentUserId: parentUsers.id })
      .from(students)
      .leftJoin(parents, eq(parents.id, students.parentId))
      .leftJoin(parentUsers, eq(parentUsers.id, parents.userId))
      .where(eq(students.id, studentId))
      .limit(1);
    return {
      studentUserId: row?.studentUserId ?? null,
      parentUserId: row?.parentUserId ?? null,
    };
  };

  /** Existence + parent-link probe used before opening the payment tx. */
  export const findStudentById = async (
    studentId: string,
    tx?: DBTransaction
  ): Promise<{ id: string; parentId: string | null } | null> => {
    const q = queryDb(tx);
    const [row] = await q
      .select({ id: students.id, parentId: students.parentId })
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);
    return row ?? null;
  };
  export const findByIdempotencyKeys = async (
    keys: string[],
    tx?: DBTransaction
  ): Promise<Types.AccountingPaymentSelectType[]> => {
    if (keys.length === 0) return [];
    const q = queryDb(tx);
    return q
      .select()
      .from(payments)
      .where(inArray(payments.idempotencyKey, [...keys]));
  };

  export const findInvoiceById = async (
    invoiceId: string,
    tx?: DBTransaction
  ): Promise<Types.InvoiceSelectType | null> => {
    const q = queryDb(tx);
    const [row] = await q.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
    return row ?? null;
  };

  export const findInvoiceByIdempotencyKey = async (
    key: string,
    tx?: DBTransaction
  ): Promise<Types.InvoiceSelectType | null> => {
    const q = queryDb(tx);
    const [row] = await q.select().from(invoices).where(eq(invoices.idempotencyKey, key)).limit(1);
    return row ?? null;
  };

  /** Creates the CREDIT_HOURS_PACKAGE parent invoice inside the caller's tx. */
  export const createInvoice = async (
    tx: DBTransaction,
    input: {
      parentId: string;
      studentId: string | null;
      issueDate: string;
      dueDate: string;
      paidDate: string | null;
      amount: string;
      currency: CurrencyCode;
      status: "UNPAID" | "PAID" | "PAYMENT_PENDING" | "CANCELLED";
      invoiceType: string;
      createdByUserId: string | null;
      idempotencyKey: string;
    }
  ): Promise<Types.InvoiceSelectType> => {
    const now = new Date();
    const [row] = await tx
      .insert(invoices)
      .values({
        parentId: input.parentId,
        studentId: input.studentId,
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        paidDate: input.paidDate,
        amount: input.amount,
        currency: input.currency,
        status: input.status as Types.InvoiceSelectType["status"],
        invoiceType: input.invoiceType,
        creditHours: null,
        version: 0,
        exchangeRateSnapshot: null,
        exchangeRateSource: null,
        createdByUserId: input.createdByUserId,
        emailSentAt: null,
        idempotencyKey: input.idempotencyKey,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      })
      .returning();
    if (!row) throw new Error("accounting invoice insert returned no rows");
    return row;
  };

  /** Updates invoice paid-fields + version inside the tx; ConflictError-free (service maps). */
  export const updateInvoicePaidFields = async (
    tx: DBTransaction,
    invoiceId: string,
    patch: { status: string; paidDate: string | null },
    expectedVersion?: number
  ): Promise<Types.InvoiceSelectType | null> => {
    if (expectedVersion !== undefined) {
      const current = await findInvoiceById(invoiceId, tx);
      if (current && current.version !== expectedVersion) {
        throw new Error(
          `invoice version mismatch for ${invoiceId}: expected ${expectedVersion}, got ${current.version}`
        );
      }
    }
    const [row] = await tx
      .update(invoices)
      .set({
        status: patch.status,
        paidDate: patch.paidDate,
        updatedAt: new Date(),
        version: sql`${invoices.version} + 1`,
      })
      .where(eq(invoices.id, invoiceId))
      .returning();
    return row ?? null;
  };

  /** Keeps invoices.credit_hours denormalized snapshot in sync after edits. */
  export const updateInvoiceCreditHours = async (
    tx: DBTransaction,
    invoiceId: string,
    creditHours: string | null
  ): Promise<void> => {
    await tx.update(invoices).set({ creditHours, updatedAt: new Date() }).where(eq(invoices.id, invoiceId));
  };
}
