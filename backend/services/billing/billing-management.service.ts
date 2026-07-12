import { createHash } from "node:crypto";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { BillingRepository, InvoicePaymentSubmissionRepository, ParentRepository } from "@/backend/db/repo";
import { AppPermission, type CurrencyCode } from "@/backend/enum";
import { ForbiddenError, getBackendTranslations, logger, NotFoundError } from "@/backend/lib";
import { parseInvoiceStatus, parseInvoiceType } from "@/backend/lib/enum";
import { NotificationSyncService, PermissionsService } from "@/backend/services";
import {
  assertInvoiceBelongsToParentUser,
  buildProofSnapshot,
  linkProofToInvoice,
  mapSubmissionToReturnType,
  recordProofPayment,
  validateProofFile,
} from "@/backend/services/billing/billing-payment-proof.helpers";
import type * as Types from "@/backend/types";

function deriveIdempotencyKey(input: {
  parentId: string;
  studentId?: string | null;
  amount: string;
  currency: CurrencyCode;
  invoiceType: string;
}): string {
  const parts = [input.parentId, input.studentId ?? "", input.amount, input.currency, input.invoiceType];
  return createHash("sha256").update(parts.join(":")).digest("hex");
}

async function requirePermission(actorUserId: string, permission: AppPermission, locale?: string): Promise<void> {
  const hasPermission = await PermissionsService.hasPermission(actorUserId, permission);
  if (!hasPermission) {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(tFunc("insufficientPermissions"));
  }
}

async function validateManualInvoiceInput(input: Types.CreateManualInvoiceInput, locale?: string): Promise<void> {
  if (!input.parentId || input.parentId.trim().length === 0) {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(tFunc("invalidParentId"));
  }

  const amountNum = Number.parseFloat(input.amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(tFunc("invalidInvoiceAmount"));
  }
}

function buildInvoiceInsertPayload(actorUserId: string, input: Types.CreateManualInvoiceInput) {
  return {
    parentId: input.parentId,
    studentId: input.studentId ?? null,
    amount: input.amount,
    currency: input.currency,
    status: "UNPAID" as const,
    invoiceType: input.invoiceType,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    exchangeRateSnapshot: input.exchangeRateSnapshot ?? null,
    exchangeRateSource: input.exchangeRateSource ?? null,
    createdByUserId: actorUserId,
    idempotencyKey: input.idempotencyKey ?? deriveIdempotencyKey(input),
  };
}

function mapToManualInvoiceResult(created: Types.InvoiceSelectType): Types.ManualInvoiceResult {
  return {
    id: created.id,
    parentId: created.parentId,
    studentId: created.studentId ?? null,
    amount: created.amount,
    currency: created.currency,
    status: parseInvoiceStatus(created.status),
    invoiceType: parseInvoiceType(created.invoiceType),
    issueDate: created.issueDate,
    dueDate: created.dueDate,
    paidDate: created.paidDate ?? null,
    version: created.version,
    createdAt: created.createdAt,
  };
}

async function syncNotificationAfterCreate(
  invoiceId: string,
  sendEmail: boolean | null | undefined,
  locale?: string
): Promise<void> {
  if (!sendEmail) return;
  try {
    await NotificationSyncService.syncUnpaidNotifications(locale);
  } catch (err) {
    logger.error("Failed to send invoice email notification", { invoiceId, err });
  }
}

async function syncNotificationsAfterPaymentChange(locale?: string): Promise<boolean> {
  const syncResult = await NotificationSyncService.syncUnpaidNotifications(locale).catch(err => {
    logger.error("Notification sync failed after payment change", { err });
    return null;
  });
  return syncResult !== null;
}

async function finalizePaymentStatusChange(
  errorLabel: string,
  actorUserId: string,
  invoiceId: string,
  locale: string | undefined,
  txnWork: (tx: DBTransaction) => Promise<Types.InvoiceSelectType>
): Promise<Types.MarkInvoicePaidResult> {
  try {
    const updated = await db.transaction(txnWork);
    const notificationSummaryUpdated = await syncNotificationsAfterPaymentChange(locale);
    return mapMarkPaidResult(updated, notificationSummaryUpdated);
  } catch (error) {
    logger.error(errorLabel, { actorUserId, invoiceId, error });
    throw error;
  }
}

function mapMarkPaidResult(
  invoice: Types.InvoiceSelectType,
  notificationSummaryUpdated: boolean
): Types.MarkInvoicePaidResult {
  return {
    invoice: {
      id: invoice.id,
      parentId: invoice.parentId,
      status: parseInvoiceStatus(invoice.status),
      paidDate: invoice.paidDate ?? null,
      version: invoice.version,
    },
    notificationSummaryUpdated,
  };
}

async function fetchInvoicePendingReview(invoiceId: string, locale?: string): Promise<Types.InvoiceSelectType> {
  const existingInvoice = await BillingRepository.getInvoiceById(invoiceId);
  if (!existingInvoice) {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new NotFoundError("INVOICE", tFunc("invoiceNotFound", { id: invoiceId }));
  }

  if (existingInvoice.status !== "PAYMENT_PENDING") {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(tFunc("invoiceNotPendingReview", { id: invoiceId }));
  }

  return existingInvoice;
}

async function finalizeInvoicePaid(
  actorUserId: string,
  invoiceId: string,
  proofFileId: string,
  submittedByUserId: string,
  expectedVersion: number | undefined,
  tx: DBTransaction,
  locale?: string
): Promise<Types.InvoiceSelectType> {
  const existingInvoice = await BillingRepository.getInvoiceById(invoiceId, tx);
  if (!existingInvoice) {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new NotFoundError("INVOICE", tFunc("invoiceNotFound", { id: invoiceId }));
  }

  const { filePath, mimeType } = await validateProofFile(proofFileId, invoiceId, tx, locale);
  await linkProofToInvoice(invoiceId, proofFileId, tx);

  const submittedAt = new Date();
  const proof = buildProofSnapshot(proofFileId, filePath, mimeType, submittedByUserId, submittedAt);
  const invoice = await BillingRepository.markInvoiceAsPaid(invoiceId, expectedVersion, tx, locale);
  await recordProofPayment(invoice, proof, tx, locale);

  logger.info("Invoice marked as paid with proof", {
    actorUserId,
    invoiceId: invoice.id,
    parentId: invoice.parentId,
    proofFileId,
  });

  return invoice;
}

export namespace BillingManagementService {
  export async function createManualInvoice(
    actorUserId: string,
    input: Types.CreateManualInvoiceInput,
    locale?: string
  ): Promise<Types.ManualInvoiceResult> {
    await requirePermission(actorUserId, AppPermission.BILLING_CREATE_INVOICE, locale);
    await validateManualInvoiceInput(input, locale);

    try {
      const created = await BillingRepository.createInvoice(
        buildInvoiceInsertPayload(actorUserId, input),
        undefined,
        locale
      );

      if (input.billingMonths && input.billingMonths.length > 0) {
        await BillingRepository.createInvoiceCoverageMonths(created.id, input.billingMonths);
      }

      await syncNotificationAfterCreate(created.id, input.sendEmail, locale);

      logger.info("Manual invoice created", { actorUserId, invoiceId: created.id });

      return mapToManualInvoiceResult(created);
    } catch (error) {
      logger.error("Failed to create manual invoice", { actorUserId, error });
      throw error;
    }
  }

  export async function submitPaymentProof(
    actorUserId: string,
    invoiceId: string,
    proofFileId: string,
    expectedVersion?: number,
    locale?: string
  ): Promise<Types.MarkInvoicePaidResult> {
    await requirePermission(actorUserId, AppPermission.BILLING_SUBMIT_PAYMENT_PROOF, locale);

    const existingInvoice = await BillingRepository.getInvoiceById(invoiceId);
    if (!existingInvoice) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new NotFoundError("INVOICE", tFunc("invoiceNotFound", { id: invoiceId }));
    }

    await assertInvoiceBelongsToParentUser(actorUserId, existingInvoice, locale);

    if (existingInvoice.status !== "UNPAID") {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("invoiceAlreadyPaid", { id: invoiceId, status: existingInvoice.status }));
    }

    return finalizePaymentStatusChange("Failed to submit payment proof", actorUserId, invoiceId, locale, async tx => {
      const { filePath, mimeType } = await validateProofFile(proofFileId, invoiceId, tx, locale);
      await linkProofToInvoice(invoiceId, proofFileId, tx);

      const submittedAt = new Date();
      await InvoicePaymentSubmissionRepository.createSubmission(
        {
          invoiceId,
          fileId: proofFileId,
          submittedByUserId: actorUserId,
          submittedAt,
          status: "pending",
          reviewedByUserId: null,
          reviewedAt: null,
          rejectionReason: null,
        },
        tx
      );

      const invoice = await BillingRepository.setInvoicePaymentPending(invoiceId, expectedVersion, tx, locale);
      logger.info("Payment proof submitted", {
        actorUserId,
        invoiceId,
        proofFileId,
        filePath,
        mimeType,
      });
      return invoice;
    });
  }

  export async function approvePaymentProof(
    actorUserId: string,
    invoiceId: string,
    expectedVersion?: number,
    locale?: string
  ): Promise<Types.MarkInvoicePaidResult> {
    await requirePermission(actorUserId, AppPermission.BILLING_UPDATE_STATUS_PAID, locale);

    await fetchInvoicePendingReview(invoiceId, locale);

    const pending = await InvoicePaymentSubmissionRepository.getPendingByInvoiceId(invoiceId);
    if (!pending) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("invoicePaymentProofNotFound", { id: invoiceId }));
    }

    return finalizePaymentStatusChange("Failed to approve payment proof", actorUserId, invoiceId, locale, async tx => {
      const invoice = await finalizeInvoicePaid(
        actorUserId,
        invoiceId,
        pending.fileId,
        pending.submittedByUserId,
        expectedVersion,
        tx,
        locale
      );
      await InvoicePaymentSubmissionRepository.updateSubmissionStatus(
        pending.id,
        "approved",
        actorUserId,
        null,
        tx,
        locale
      );
      return invoice;
    });
  }

  export async function rejectPaymentProof(
    actorUserId: string,
    invoiceId: string,
    rejectionReason?: string | null,
    expectedVersion?: number,
    locale?: string
  ): Promise<Types.MarkInvoicePaidResult> {
    await requirePermission(actorUserId, AppPermission.BILLING_UPDATE_STATUS_PAID, locale);

    await fetchInvoicePendingReview(invoiceId, locale);

    return finalizePaymentStatusChange("Failed to reject payment proof", actorUserId, invoiceId, locale, async tx => {
      await InvoicePaymentSubmissionRepository.rejectPendingForInvoice(
        invoiceId,
        actorUserId,
        rejectionReason ?? null,
        tx,
        locale
      );
      return BillingRepository.updateInvoiceStatus(invoiceId, "UNPAID", null, expectedVersion, tx, locale);
    });
  }

  export async function getInvoicePaymentSubmission(
    actorUserId: string,
    invoiceId: string,
    locale?: string
  ): Promise<Types.InvoicePaymentSubmissionReturnType | null> {
    await verifyInvoiceAccess(actorUserId, invoiceId, null, locale);
    const submission = await InvoicePaymentSubmissionRepository.getLatestByInvoiceId(invoiceId);
    if (!submission) {
      return null;
    }
    return mapSubmissionToReturnType(submission);
  }

  export async function markInvoicePaid(
    actorUserId: string,
    invoiceId: string,
    proofFileId: string,
    expectedVersion?: number,
    locale?: string
  ): Promise<Types.MarkInvoicePaidResult> {
    await requirePermission(actorUserId, AppPermission.BILLING_UPDATE_STATUS_PAID, locale);

    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    if (!proofFileId.trim()) {
      throw new Error(tFunc("paymentProofRequired"));
    }

    const existingInvoice = await BillingRepository.getInvoiceById(invoiceId);
    if (!existingInvoice) {
      throw new NotFoundError("INVOICE", tFunc("invoiceNotFound", { id: invoiceId }));
    }

    if (existingInvoice.status !== "UNPAID") {
      throw new Error(tFunc("invoiceAlreadyPaid", { id: invoiceId, status: existingInvoice.status }));
    }

    return finalizePaymentStatusChange("Failed to mark invoice as paid", actorUserId, invoiceId, locale, tx =>
      finalizeInvoicePaid(actorUserId, invoiceId, proofFileId, actorUserId, expectedVersion, tx, locale)
    );
  }

  export async function deleteInvoice(
    actorUserId: string,
    invoiceId: string,
    locale?: string
  ): Promise<Types.DeleteInvoiceResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.BILLING_DELETE_INVOICE);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const invoice = await BillingRepository.getInvoiceById(invoiceId);
    if (!invoice) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new NotFoundError("INVOICE", tFunc("invoiceNotFound", { id: invoiceId }));
    }
    if (invoice.status === "PAID" || invoice.status === "PAYMENT_PENDING") {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("cannotDeletePaidInvoice", { id: invoiceId }));
    }

    try {
      const deleted = await BillingRepository.deleteInvoice(invoiceId, undefined, locale);

      logger.info("Invoice deleted", {
        actorUserId,
        invoiceId: deleted.id,
        parentId: deleted.parentId,
        deletedAt: deleted.deletedAt,
      });

      const syncResult = await NotificationSyncService.syncUnpaidNotifications(locale).catch(err => {
        logger.error("Notification sync failed after deleteInvoice", { invoiceId, err });
        return null;
      });

      return {
        invoice: {
          id: deleted.id,
          parentId: deleted.parentId,
          deletedAt: deleted.deletedAt?.toISOString() ?? null,
          version: deleted.version,
        },
        notificationSummaryUpdated: syncResult !== null,
      };
    } catch (error) {
      logger.error("Failed to delete invoice", { actorUserId, invoiceId, error });
      throw error;
    }
  }

  export async function verifyInvoiceAccess(
    actorUserId: string,
    invoiceId: string,
    context: { isSuperAdmin?: boolean; permissions?: string[] } | null,
    locale?: string
  ): Promise<Types.InvoiceSelectType> {
    const invoice = await BillingRepository.getInvoiceById(invoiceId);
    if (!invoice) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new NotFoundError("INVOICE", tFunc("invoiceNotFound", { id: invoiceId }));
    }

    const hasBillingAccess =
      context?.isSuperAdmin ||
      context?.permissions?.includes(AppPermission.INVOICES_LIST) ||
      context?.permissions?.includes(AppPermission.BILLING_VIEW_UNPAID_INVOICES);

    if (!hasBillingAccess) {
      const parent = await ParentRepository.findByUserId(actorUserId);
      if (parent?.id !== invoice.parentId) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new ForbiddenError(tFunc("insufficientPermissions"));
      }
    }

    return invoice;
  }

  export async function sendPaymentReminder(
    actorUserId: string,
    studentId: string,
    locale?: string
  ): Promise<Types.SendPaymentReminderResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.BILLING_UPDATE_STATUS_PAID);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    try {
      const syncResult = await NotificationSyncService.syncUnpaidNotifications(locale);

      logger.info("Payment reminder sent", {
        actorUserId,
        studentId,
      });

      return {
        id: `reminder-${studentId}`,
        success: syncResult !== null,
      };
    } catch (error) {
      logger.error("Failed to send payment reminder", { actorUserId, studentId, error });
      throw error;
    }
  }

  // ─── Bootstrap / Seeder Operations (no auth) ──────────────────────────────

  export async function findInvoicesByIdempotencyKeys(
    keys: readonly string[],
    tx?: DBTransaction
  ): Promise<Types.InvoiceSelectType[]> {
    return BillingRepository.findInvoicesByIdempotencyKeys(keys, tx);
  }

  export async function createManyManualInvoices(
    inputs: readonly Types.ManualInvoiceInsertInput[],
    tx?: DBTransaction
  ): Promise<Types.InvoiceSelectType[]> {
    return BillingRepository.upsertManyInvoices(inputs, tx);
  }

  export async function findInvoiceCoverageMonthsByInvoiceIds(
    invoiceIds: readonly string[],
    tx?: DBTransaction
  ): Promise<Types.InvoiceCoverageMonthSelectType[]> {
    return BillingRepository.findInvoiceCoverageMonthsByInvoiceIds(invoiceIds, tx);
  }

  export async function createManyInvoiceCoverageMonths(
    inputs: readonly Types.InvoiceCoverageMonthInput[],
    tx?: DBTransaction
  ): Promise<Types.InvoiceCoverageMonthSelectType[]> {
    return BillingRepository.createManyInvoiceCoverageMonths(inputs, tx);
  }

  export async function findInvoicePaymentSubmissionsByInvoiceIds(
    invoiceIds: readonly string[],
    tx?: DBTransaction
  ): Promise<Types.InvoicePaymentSubmissionSelectType[]> {
    return InvoicePaymentSubmissionRepository.findByInvoiceIds(invoiceIds, tx);
  }

  export async function createManyInvoicePaymentSubmissions(
    inputs: readonly Types.InvoicePaymentSubmissionInsertType[],
    tx?: DBTransaction
  ): Promise<Types.InvoicePaymentSubmissionSelectType[]> {
    return InvoicePaymentSubmissionRepository.createMany(inputs, tx);
  }
}
