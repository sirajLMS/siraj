import { BillingRepository, InvoicePaymentSubmissionRepository } from "@/backend/db/repo/billing";
import { AppPermission, InvoicePaymentSubmissionStatus } from "@/backend/enum";
import { logger } from "@/backend/lib";
import {
  finalizeInvoicePaid,
  resolveParentUserId,
  resolveUsersWithPermission,
} from "@/backend/services/billing/billing-management.helpers";
import {
  dispatchInvoiceStatusChanged,
  dispatchProofSubmittedToStaff,
} from "@/backend/services/billing/billing-management.notifications";
import { linkProofToInvoice, validateProofFile } from "@/backend/services/billing/billing-payment-proof.helpers";
import type * as Types from "@/backend/types";
import type { DBTransaction } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export function buildSubmitPaymentProofTxn(
  actorUserId: string,
  invoiceId: string,
  proofFileId: string,
  expectedVersion?: number
): (tx: DBTransaction, tErrors: ErrorsLabels) => Promise<Types.InvoiceSelectType> {
  return async (tx, txErrors) => {
    const { filePath, mimeType } = await validateProofFile(proofFileId, invoiceId, actorUserId, txErrors, tx);
    await linkProofToInvoice(invoiceId, proofFileId, tx);

    const submittedAt = new Date();
    await InvoicePaymentSubmissionRepository.createSubmission(
      {
        invoiceId,
        fileId: proofFileId,
        submittedByUserId: actorUserId,
        submittedAt,
        status: InvoicePaymentSubmissionStatus.PENDING,
        reviewedByUserId: null,
        reviewedAt: null,
        rejectionReason: null,
      },
      tx
    );

    const invoice = await BillingRepository.setInvoicePaymentPending(invoiceId, txErrors, expectedVersion, tx);
    logger.info("Payment proof submitted", {
      actorUserId,
      invoiceId,
      proofFileId,
      filePath,
      mimeType,
    });
    return invoice;
  };
}

export function buildApprovePaymentProofTxn(
  actorUserId: string,
  invoiceId: string,
  pending: Types.InvoicePaymentSubmissionSelectType,
  expectedVersion?: number
): (tx: DBTransaction, tErrors: ErrorsLabels) => Promise<Types.InvoiceSelectType> {
  return async (tx, txErrors) => {
    const invoice = await finalizeInvoicePaid(
      actorUserId,
      invoiceId,
      pending.fileId,
      pending.submittedByUserId,
      expectedVersion,
      tx,
      txErrors
    );
    await InvoicePaymentSubmissionRepository.updateSubmissionStatus(
      pending.id,
      InvoicePaymentSubmissionStatus.APPROVED,
      actorUserId,
      null,
      txErrors,
      tx
    );
    return invoice;
  };
}

export function buildRejectPaymentProofTxn(
  actorUserId: string,
  invoiceId: string,
  rejectionReason: string | null,
  expectedVersion?: number
): (tx: DBTransaction, tErrors: ErrorsLabels) => Promise<Types.InvoiceSelectType> {
  return async (tx, txErrors) => {
    await InvoicePaymentSubmissionRepository.rejectPendingForInvoice(
      invoiceId,
      actorUserId,
      rejectionReason,
      txErrors,
      tx
    );
    return BillingRepository.updateInvoiceStatus(invoiceId, "UNPAID", txErrors, null, expectedVersion, tx);
  };
}

export function buildMarkInvoicePaidTxn(
  actorUserId: string,
  invoiceId: string,
  proofFileId: string,
  expectedVersion?: number
): (tx: DBTransaction, tErrors: ErrorsLabels) => Promise<Types.InvoiceSelectType> {
  return async (tx, txErrors) =>
    finalizeInvoicePaid(actorUserId, invoiceId, proofFileId, actorUserId, expectedVersion, tx, txErrors);
}

export function buildProofSubmittedStaffDispatcher(
  locale?: string
): (updatedInvoice: Types.InvoiceSelectType) => Promise<void> {
  return async updated => {
    const staffUserIds = await resolveUsersWithPermission(AppPermission.BILLING_UPDATE_STATUS_PAID);
    await dispatchProofSubmittedToStaff(staffUserIds, updated, locale);
  };
}

export function buildParentStatusDispatcher(
  action: "proofApproved" | "proofRejected" | "markedPaid",
  locale?: string
): (updatedInvoice: Types.InvoiceSelectType) => Promise<void> {
  return async updated => {
    const parentUserId = await resolveParentUserId(updated.parentId);
    if (parentUserId) {
      await dispatchInvoiceStatusChanged(parentUserId, action, updated, locale);
    }
  };
}
