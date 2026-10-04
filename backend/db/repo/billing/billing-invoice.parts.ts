import { and, eq, isNull, type SQL, sql } from "drizzle-orm";
import { resolveExchangeRateSnapshot } from "@/backend/db/repo/billing/billing-exchange-rate.parts";
import { upsertManyWithRunner } from "@/backend/db/repo/billing/billing-helpers";
import { acquireAdvisoryLock } from "@/backend/db/repo/shared";
import { invoices, payments } from "@/backend/db/schema";
import type * as Types from "@/backend/types";
import type { DBTransaction, ManualInvoiceInsertType, PaymentRecordInput } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

async function acquireInvoiceLock(tx: DBTransaction, invoiceId: string): Promise<void> {
  await acquireAdvisoryLock(tx, `invoice_${invoiceId}`);
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

/**
 * Inserts a billing entity (invoice or payment) with a resolved FX snapshot.
 */
export async function createBillingEntity(
  t: DBTransaction,
  table: typeof invoices,
  input: ManualInvoiceInsertType,
  tErrors: ErrorsLabels
): Promise<Types.InvoiceSelectType>;
export async function createBillingEntity(
  t: DBTransaction,
  table: typeof payments,
  input: PaymentRecordInput,
  tErrors: ErrorsLabels
): Promise<Types.PaymentSelectType>;
export async function createBillingEntity(
  t: DBTransaction,
  table: typeof invoices | typeof payments,
  input: ManualInvoiceInsertType | PaymentRecordInput,
  tErrors: ErrorsLabels
): Promise<Types.InvoiceSelectType | Types.PaymentSelectType> {
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

  if (results.length === 0) {
    throw new Error(tErrors.billing.invoiceNotFound("create"));
  }
  return results[0];
}

/** Updates invoice status with optimistic locking inside a caller transaction. */
export async function updateInvoiceStatusInTx(
  t: DBTransaction,
  invoiceId: string,
  newStatus: string,
  tErrors: ErrorsLabels,
  paidDate?: Date | null,
  expectedVersion?: number
): Promise<Types.InvoiceSelectType> {
  await acquireInvoiceLock(t, invoiceId);

  const results = await t.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (results.length === 0 || results[0].deletedAt !== null) {
    throw new Error(tErrors.billing.invoiceNotFound(invoiceId));
  }
  const current = results[0];

  if (expectedVersion !== undefined && current.version !== expectedVersion) {
    throw new Error(
      tErrors.billing.invoiceVersionMismatch({
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
}

/** Soft-deletes an invoice and bumps its optimistic-lock version. */
export async function deleteInvoiceInTx(
  t: DBTransaction,
  invoiceId: string,
  tErrors: ErrorsLabels
): Promise<Types.InvoiceSelectType> {
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
}

/** Upserts invoice rows by idempotency key in a caller transaction or a new one. */
export async function upsertInvoiceRows(
  tx: DBTransaction | undefined,
  inputs: readonly ManualInvoiceInsertType[]
): Promise<Types.InvoiceSelectType[]> {
  const now = new Date();

  return upsertManyWithRunner(tx, t =>
    Promise.all(
      inputs.map(input =>
        t
          .insert(invoices)
          .values({
            ...input,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: invoices.idempotencyKey,
            set: {
              status: input.status,
              paidDate: input.paidDate ?? null,
              updatedAt: new Date(),
            },
          })
          .returning()
      )
    )
  );
}

/** Upserts payment rows by idempotency key in a caller transaction or a new one. */
export async function upsertPaymentRows(
  tx: DBTransaction | undefined,
  inputs: readonly PaymentRecordInput[]
): Promise<Types.PaymentSelectType[]> {
  const now = new Date();

  return upsertManyWithRunner(tx, t =>
    Promise.all(
      inputs.map(input =>
        t
          .insert(payments)
          .values({
            ...input,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: payments.idempotencyKey,
            set: {
              updatedAt: new Date(),
            },
          })
          .returning()
      )
    )
  );
}
