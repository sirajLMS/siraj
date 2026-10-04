import { createHash } from "node:crypto";
import { db } from "@/backend/db/drizzleDb";
import {
  AccountingPaymentRepository,
  AccountingPaymentSupport,
  CreditRepository,
  PackagePlanRepository,
} from "@/backend/db/repo/billing";
import { acquireAdvisoryLock } from "@/backend/db/repo/shared";
import { StudentRepository } from "@/backend/db/repo/students";
import { ConflictError, logger, NotFoundError } from "@/backend/lib";
import { SystemSettingsService } from "@/backend/services/system/system-settings.service";
import type {
  AccountingPaymentReturnType,
  AccountingPaymentSubmitInput,
  AccountingPaymentTogglePaidInput,
  DBTransaction,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/** Server-side bounds mirrored from the GraphQL input `@constraint` metadata. */
export const MAX_PAYMENT_AMOUNT = 99_999_999;
export const MAX_PAYMENT_CREDIT_HOURS = 100_000;

const isoDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

/** Deterministic invoice idempotency key (content-addressed, replay-safe). */
function deriveInvoiceIdempotencyKey(input: AccountingPaymentSubmitInput): string {
  const content = JSON.stringify([
    input.studentId,
    input.packagePlanId ?? "",
    String(input.amount),
    input.currency,
    isoDateOnly(input.paymentDate),
  ]);
  return `acctinv-${createHash("sha256").update(content).digest("hex")}`;
}

/** Re-validates the plan row inside the tx (EC-2 archival race window). */
async function revalidatePackageInsideTx(planId: string | null | undefined, tErrors: ErrorsLabels, tx: DBTransaction) {
  if (!planId) return null;
  const plan = await PackagePlanRepository.findById(planId, tx);
  if (!plan?.active || plan.deletedAt !== null) {
    throw new NotFoundError("PACKAGE_PLAN", tErrors.package.planArchived(planId ?? ""));
  }
  return plan;
}

export async function runRecordPaymentTransaction(
  actorUserId: string,
  input: AccountingPaymentSubmitInput,
  tErrors: ErrorsLabels,
  idempotencyKey: string,
  parentId: string
): Promise<AccountingPaymentReturnType> {
  return db.transaction(async tx => {
    // EC-13/EC-15/EC-16: serialize every balance-affecting op per student.
    await acquireAdvisoryLock(tx, `student_${input.studentId}`);
    await revalidatePackageInsideTx(input.packagePlanId, tErrors, tx);

    // US-2.1 AC#4 — duplicates RETURN the existing row (no ConflictError).
    const existing = await AccountingPaymentSupport.findByIdempotencyKeys([idempotencyKey], tx);
    if (existing.length > 0 && existing[0]) {
      const joined = await AccountingPaymentRepository.findById(existing[0].id, tx);
      if (joined) return joined;
    }

    // Gateway-varied submissions share one content-derived invoice
    // (deriveInvoiceIdempotencyKey excludes the gateway): reuse it instead
    // of racing into the unique index; fresh content creates its own.
    let invoice = await AccountingPaymentSupport.findInvoiceByIdempotencyKey(deriveInvoiceIdempotencyKey(input), tx);
    invoice ??= await AccountingPaymentSupport.createInvoice(tx, {
      parentId,
      studentId: input.studentId,
      issueDate: isoDateOnly(input.paymentDate),
      dueDate: isoDateOnly(input.paymentDate),
      paidDate: input.isPaidStatusOn ? isoDateOnly(input.paymentDate) : null,
      amount: String(input.amount),
      currency: input.currency,
      status: input.isPaidStatusOn ? "PAID" : "UNPAID",
      invoiceType: "CREDIT_HOURS_PACKAGE",
      createdByUserId: actorUserId,
      idempotencyKey: deriveInvoiceIdempotencyKey(input),
    });

    const payment = await AccountingPaymentRepository.create(tx, {
      invoiceId: invoice.id,
      amount: String(input.amount),
      currency: input.currency,
      paymentDate: input.paymentDate,
      packagePlanId: input.packagePlanId ?? null,
      paymentGateway: input.paymentGateway,
      creditHours: String(input.creditHours),
      isPaidStatusOn: Boolean(input.isPaidStatusOn),
      paymentNote: input.paymentNote ?? null,
      idempotencyKey,
    });

    // Hour ledger row + live balance bump inside the same tx.
    await CreditRepository.createHourPurchase(tx, {
      studentId: input.studentId,
      hours: input.creditHours,
      sourcePaymentId: payment.id,
      creditedByUserId: actorUserId,
      notes: input.paymentNote ?? null,
      idempotencyKey: `${idempotencyKey}:ledger-hour-purchase`,
    });
    await StudentRepository.addCreditHours(input.studentId, tErrors, input.creditHours, undefined, tx);

    logger.info("Accounting payment recorded", {
      actorUserId,
      studentId: input.studentId,
      paymentId: payment.id,
      invoiceId: invoice.id,
      creditHours: input.creditHours,
      gateway: input.paymentGateway,
    });

    const joined = await AccountingPaymentRepository.findById(payment.id, tx);
    if (!joined) throw new Error("accounting payment post-read failed");
    return joined;
  });
}

export async function runTogglePaidStatusTransaction(
  input: AccountingPaymentTogglePaidInput,
  tErrors: ErrorsLabels,
  current: AccountingPaymentReturnType
): Promise<AccountingPaymentReturnType> {
  return db.transaction(async tx => {
    // EC-14: serialize invoice status mutations per invoice BEFORE reading it.
    await acquireAdvisoryLock(tx, `invoice_${current.invoiceId}`);

    const invoice = await AccountingPaymentSupport.findInvoiceById(current.invoiceId, tx);
    if (!invoice) throw new NotFoundError("PAYMENT", tErrors.billing.invoiceNotFound(current.invoiceId));

    // `!= null` (not `!== undefined`): GraphQL codegen requires the KEY in
    // Exact variable objects, so clients pass explicit null to SKIP the lock.
    if (input.expectedInvoiceVersion != null && invoice.version !== input.expectedInvoiceVersion) {
      throw new ConflictError(
        tErrors.billing.invoiceVersionMismatch({
          id: invoice.id,
          expectedVersion: input.expectedInvoiceVersion,
          gotVersion: invoice.version,
        })
      );
    }

    const setting = await SystemSettingsService.getSettingByKey("accounting_paid_toggle_auto_flips_invoice", tx);
    const autoFlip = setting ? setting.value !== "false" : true;

    await AccountingPaymentRepository.update(tx, current.id, { isPaidStatusOn: input.isPaidStatusOn });

    if (autoFlip) {
      if (input.isPaidStatusOn) {
        await AccountingPaymentSupport.updateInvoicePaidFields(
          tx,
          current.invoiceId,
          { status: "PAID", paidDate: isoDateOnly(current.paymentDate) },
          invoice.version
        );
      } else {
        // EC-3: drop to UNPAID only when no other paid sibling remains.
        const siblings = await AccountingPaymentRepository.findPaidSiblingsByInvoice(tx, current.invoiceId, current.id);
        if (siblings.length === 0) {
          await AccountingPaymentSupport.updateInvoicePaidFields(
            tx,
            current.invoiceId,
            { status: "UNPAID", paidDate: null },
            invoice.version
          );
        }
      }
    }

    const joined = await AccountingPaymentRepository.findById(current.id, tx);
    if (!joined) throw new Error("accounting payment post-toggle read failed");
    return joined;
  });
}
