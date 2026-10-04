import { BillingRepository, InvoicePaymentSubmissionRepository } from "@/backend/db/repo/billing";
import { AppPermission } from "@/backend/enum";
import { assertUuidShape, logger, NotFoundError } from "@/backend/lib";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import {
  assertInvoiceBillingAccess,
  buildInvoiceInsertPayload,
  fetchInvoicePendingReview,
  finalizePaymentStatusChangeWithDispatch,
  mapToManualInvoiceResult,
  requirePermission,
  resolveParentUserId,
  syncNotificationAfterCreate,
  syncNotificationsAfterDelete,
  validateManualInvoiceInput,
} from "@/backend/services/billing/billing-management.helpers";
import {
  dispatchInvoiceGenerated,
  dispatchUnpaidInvoicesForStudent,
} from "@/backend/services/billing/billing-management.notifications";
import {
  buildApprovePaymentProofTxn,
  buildMarkInvoicePaidTxn,
  buildParentStatusDispatcher,
  buildProofSubmittedStaffDispatcher,
  buildRejectPaymentProofTxn,
  buildSubmitPaymentProofTxn,
} from "@/backend/services/billing/billing-management.parts";
import {
  assertInvoiceBelongsToParentUser,
  mapSubmissionToReturnType,
} from "@/backend/services/billing/billing-payment-proof.helpers";
import { NotificationSyncService } from "@/backend/services/system/notification-sync.service";
import type * as Types from "@/backend/types";
import type { DBTransaction, UserPermissionContext } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Fetch an invoice and require it to exist and be still unpaid, throwing
 * localized errors otherwise. An optional extra assertion (e.g. parent
 * ownership) runs after the fetch but before the unpaid-status check.
 */
async function requireUnpaidInvoice(
  invoiceId: string,
  tErrors: ErrorsLabels,
  extraAssert?: (invoice: Types.InvoiceSelectType) => Promise<void>
): Promise<Types.InvoiceSelectType> {
  const existingInvoice = await BillingRepository.getInvoiceById(invoiceId);
  if (!existingInvoice) {
    throw new NotFoundError("INVOICE", tErrors.billing.invoiceNotFound(invoiceId));
  }

  if (extraAssert) {
    await extraAssert(existingInvoice);
  }

  if (existingInvoice.status !== "UNPAID") {
    throw new Error(tErrors.billing.invoiceAlreadyPaid({ id: invoiceId, status: existingInvoice.status }));
  }

  return existingInvoice;
}

export namespace BillingManagementService {
  export async function createManualInvoice(
    actorUserId: string,
    input: Types.CreateManualInvoiceInput,
    tErrors: ErrorsLabels,
    locale?: string
  ): Promise<Types.ManualInvoiceResult> {
    await requirePermission(actorUserId, AppPermission.BILLING_CREATE_INVOICE, tErrors);
    await validateManualInvoiceInput(input, tErrors);

    try {
      const created = await BillingRepository.createInvoice(buildInvoiceInsertPayload(actorUserId, input), tErrors);

      const billingMonths = input.billingMonths;
      if (billingMonths?.length) {
        await BillingRepository.createInvoiceCoverageMonths(created.id, billingMonths);
      }

      await syncNotificationAfterCreate(created.id, input.sendEmail);

      const parentUserId = await resolveParentUserId(created.parentId);
      if (parentUserId) {
        await dispatchInvoiceGenerated(parentUserId, created, locale);
      }

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
    tErrors: ErrorsLabels,
    expectedVersion?: number,
    locale?: string
  ): Promise<Types.MarkInvoicePaidReturnType> {
    await requirePermission(actorUserId, AppPermission.BILLING_SUBMIT_PAYMENT_PROOF, tErrors);

    await requireUnpaidInvoice(invoiceId, tErrors, invoice =>
      assertInvoiceBelongsToParentUser(actorUserId, invoice, tErrors)
    );

    return finalizePaymentStatusChangeWithDispatch(
      "Failed to submit payment proof",
      actorUserId,
      invoiceId,
      buildSubmitPaymentProofTxn(actorUserId, invoiceId, proofFileId, expectedVersion),
      tErrors,
      buildProofSubmittedStaffDispatcher(locale),
      locale
    );
  }

  export async function approvePaymentProof(
    actorUserId: string,
    invoiceId: string,
    tErrors: ErrorsLabels,
    expectedVersion?: number,
    locale?: string
  ): Promise<Types.MarkInvoicePaidReturnType> {
    await requirePermission(actorUserId, AppPermission.BILLING_UPDATE_STATUS_PAID, tErrors);

    await fetchInvoicePendingReview(invoiceId, tErrors);

    const pending = await InvoicePaymentSubmissionRepository.getPendingByInvoiceId(invoiceId);
    if (!pending) {
      throw new Error(tErrors.billing.invoicePaymentProofNotFound(invoiceId));
    }

    return finalizePaymentStatusChangeWithDispatch(
      "Failed to approve payment proof",
      actorUserId,
      invoiceId,
      buildApprovePaymentProofTxn(actorUserId, invoiceId, pending, expectedVersion),
      tErrors,
      buildParentStatusDispatcher("proofApproved", locale),
      locale
    );
  }

  export async function rejectPaymentProof(
    actorUserId: string,
    invoiceId: string,
    tErrors: ErrorsLabels,
    rejectionReason?: string | null,
    expectedVersion?: number,
    locale?: string
  ): Promise<Types.MarkInvoicePaidReturnType> {
    await requirePermission(actorUserId, AppPermission.BILLING_UPDATE_STATUS_PAID, tErrors);

    await fetchInvoicePendingReview(invoiceId, tErrors);

    return finalizePaymentStatusChangeWithDispatch(
      "Failed to reject payment proof",
      actorUserId,
      invoiceId,
      buildRejectPaymentProofTxn(actorUserId, invoiceId, rejectionReason ?? null, expectedVersion),
      tErrors,
      buildParentStatusDispatcher("proofRejected", locale),
      locale
    );
  }

  export async function getInvoicePaymentSubmission(
    actorUserId: string,
    invoiceId: string,
    tErrors: ErrorsLabels
  ): Promise<Types.InvoicePaymentSubmissionReturnType | null> {
    await verifyInvoiceAccess(actorUserId, invoiceId, null, tErrors);
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
    tErrors: ErrorsLabels,
    expectedVersion?: number,
    locale?: string
  ): Promise<Types.MarkInvoicePaidReturnType> {
    await requirePermission(actorUserId, AppPermission.BILLING_UPDATE_STATUS_PAID, tErrors);

    if (!proofFileId.trim()) {
      throw new Error(tErrors.billing.paymentProofRequired);
    }

    await requireUnpaidInvoice(invoiceId, tErrors);

    return finalizePaymentStatusChangeWithDispatch(
      "Failed to mark invoice as paid",
      actorUserId,
      invoiceId,
      buildMarkInvoicePaidTxn(actorUserId, invoiceId, proofFileId, expectedVersion),
      tErrors,
      buildParentStatusDispatcher("markedPaid", locale),
      locale
    );
  }

  export async function deleteInvoice(
    actorUserId: string,
    invoiceId: string,
    tErrors: ErrorsLabels
  ): Promise<Types.DeleteInvoiceReturnType> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.BILLING_DELETE_INVOICE);
    if (!hasPermission) {
      throw new Error(tErrors.insufficientPermissions);
    }

    const invoice = await BillingRepository.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new NotFoundError("INVOICE", tErrors.billing.invoiceNotFound(invoiceId));
    }
    if (invoice.status === "PAID" || invoice.status === "PAYMENT_PENDING") {
      throw new Error(tErrors.billing.cannotDeletePaidInvoice(invoiceId));
    }

    try {
      const deleted = await BillingRepository.deleteInvoice(invoiceId, tErrors);

      logger.info("Invoice deleted", {
        actorUserId,
        invoiceId: deleted.id,
        parentId: deleted.parentId,
        deletedAt: deleted.deletedAt,
      });

      const syncResult = await syncNotificationsAfterDelete(invoiceId);

      return {
        id: deleted.id,
        parentId: deleted.parentId,
        version: deleted.version,
        notificationSummaryUpdated: syncResult,
      };
    } catch (error) {
      logger.error("Failed to delete invoice", { actorUserId, invoiceId, error });
      throw error;
    }
  }

  export async function verifyInvoiceAccess(
    actorUserId: string,
    invoiceId: string,
    context: UserPermissionContext | null,
    tErrors: ErrorsLabels
  ): Promise<Types.InvoiceSelectType> {
    assertUuidShape(invoiceId, () => new NotFoundError("INVOICE", tErrors.billing.invoiceNotFound(invoiceId)));
    const invoice = await BillingRepository.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new NotFoundError("INVOICE", tErrors.billing.invoiceNotFound(invoiceId));
    }

    const effectiveContext = context ?? (await PermissionsService.getUserContext(actorUserId));
    await assertInvoiceBillingAccess(actorUserId, effectiveContext, invoice, tErrors);

    return invoice;
  }

  export async function sendPaymentReminder(
    actorUserId: string,
    studentId: string,
    tErrors: ErrorsLabels,
    locale?: string
  ): Promise<Types.SendPaymentReminderResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.BILLING_UPDATE_STATUS_PAID);
    if (!hasPermission) {
      throw new Error(tErrors.insufficientPermissions);
    }

    try {
      // Tray-summary sync is preserved alongside the real dispatch below.
      const syncResult = await NotificationSyncService.syncUnpaidNotifications(locale).catch(err => {
        logger.error("Notification sync failed during sendPaymentReminder", { studentId, err });
        return null;
      });

      // Real dispatch: renotify the parent of each unpaid invoice of the
      // student's parent using `INVOICE_GENERATED` (the existing event for
      // this purpose — switching to INVOICE_STATUS_CHANGED was rejected).
      await dispatchUnpaidInvoicesForStudent(studentId, locale).catch(err => {
        logger.error("Payment reminder dispatch failed", { studentId, err });
      });

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
    inputs: readonly Types.ManualInvoiceInsertType[],
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
