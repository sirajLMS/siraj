import { and, desc, eq, inArray } from "drizzle-orm";
import { db, invoicePaymentSubmissions } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import type * as Types from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace InvoicePaymentSubmissionRepository {
  export async function createSubmission(
    input: Types.InvoicePaymentSubmissionInsertType,
    tx?: DBTransaction
  ): Promise<Types.InvoicePaymentSubmissionSelectType> {
    const queryDb = tx ?? db;
    const [row] = await queryDb.insert(invoicePaymentSubmissions).values(input).returning();
    return row;
  }

  export async function getPendingByInvoiceId(
    invoiceId: string,
    tx?: DBTransaction
  ): Promise<Types.InvoicePaymentSubmissionSelectType | null> {
    const queryDb = tx ?? db;
    const rows = await queryDb
      .select()
      .from(invoicePaymentSubmissions)
      .where(and(eq(invoicePaymentSubmissions.invoiceId, invoiceId), eq(invoicePaymentSubmissions.status, "pending")))
      .orderBy(desc(invoicePaymentSubmissions.submittedAt))
      .limit(1);
    return rows[0] ?? null;
  }

  export async function getLatestByInvoiceId(
    invoiceId: string,
    tx?: DBTransaction
  ): Promise<Types.InvoicePaymentSubmissionSelectType | null> {
    const queryDb = tx ?? db;
    const rows = await queryDb
      .select()
      .from(invoicePaymentSubmissions)
      .where(eq(invoicePaymentSubmissions.invoiceId, invoiceId))
      .orderBy(desc(invoicePaymentSubmissions.submittedAt))
      .limit(1);
    return rows[0] ?? null;
  }

  export async function updateSubmissionStatus(
    submissionId: string,
    status: Types.InvoicePaymentSubmissionStatus,
    reviewedByUserId: string,
    rejectionReason: string | null,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<Types.InvoicePaymentSubmissionSelectType> {
    const queryDb = tx ?? db;
    const now = new Date();
    const [row] = await queryDb
      .update(invoicePaymentSubmissions)
      .set({
        status,
        reviewedByUserId,
        reviewedAt: now,
        rejectionReason,
        updatedAt: now,
      })
      .where(eq(invoicePaymentSubmissions.id, submissionId))
      .returning();

    if (!row) {
      throw new Error(
        tErrors.file.recordNotFound({ tableName: "invoice_payment_submissions", entityId: submissionId })
      );
    }

    return row;
  }

  export async function rejectPendingForInvoice(
    invoiceId: string,
    reviewedByUserId: string,
    rejectionReason: string | null,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<Types.InvoicePaymentSubmissionSelectType | null> {
    const pending = await getPendingByInvoiceId(invoiceId, tx);
    if (!pending) {
      return null;
    }
    return updateSubmissionStatus(pending.id, "rejected", reviewedByUserId, rejectionReason, tErrors, tx);
  }

  export async function findByInvoiceIds(
    invoiceIds: readonly string[],
    tx?: DBTransaction
  ): Promise<Types.InvoicePaymentSubmissionSelectType[]> {
    if (invoiceIds.length === 0) return [];
    const queryDb = tx ?? db;
    return queryDb
      .select()
      .from(invoicePaymentSubmissions)
      .where(inArray(invoicePaymentSubmissions.invoiceId, [...invoiceIds]));
  }

  export async function createMany(
    inputs: readonly Types.InvoicePaymentSubmissionInsertType[],
    tx?: DBTransaction
  ): Promise<Types.InvoicePaymentSubmissionSelectType[]> {
    if (inputs.length === 0) return [];
    const results: Types.InvoicePaymentSubmissionSelectType[] = [];

    for (const input of inputs) {
      const existing = await getLatestByInvoiceId(input.invoiceId, tx);
      if (existing) {
        results.push(existing);
        continue;
      }
      results.push(await createSubmission(input, tx));
    }

    return results;
  }
}
