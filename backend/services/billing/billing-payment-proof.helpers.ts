import { BillingRepository, InvoicePaymentSubmissionRepository } from "@/backend/db/repo/billing";
import { ParentRepository } from "@/backend/db/repo/parents";
import { SignedUrlRepository } from "@/backend/db/repo/shared";
import { StorageDbRepository } from "@/backend/db/repo/storage";
import { InvoicePaymentSubmissionStatus } from "@/backend/enum/billing/billing.enum";
import { PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { ForbiddenError, NotFoundError } from "@/backend/lib";
import type * as Types from "@/backend/types";
import type { DBTransaction, PaymentProofSnapshot, PaymentProofTransactionSnapshot } from "@/backend/types";
import { INVOICE_FILE_USAGE } from "@/shared/constants/billing/invoice-file-usage";
import { isAllowedPaymentProofMimeType } from "@/shared/constants/billing/payment-proof";
import type { ErrorsLabels } from "@/shared/locale";
import { extToMime } from "@/shared/utils/storage.utils";

function inferMimeFromPath(path: string): string | null {
  const ext = path.split(".").pop()?.toLowerCase();
  if (!ext) {
    return null;
  }
  return extToMime[ext] ?? null;
}

function isInvoicePaymentSubmissionStatus(value: string): value is InvoicePaymentSubmissionStatus {
  return (Object.values(InvoicePaymentSubmissionStatus) as readonly string[]).includes(value);
}

export async function validateProofFile(
  proofFileId: string,
  invoiceId: string,
  actorUserId: string,
  tErrors: ErrorsLabels,
  tx: DBTransaction
): Promise<{ filePath: string; mimeType: string }> {
  const file = await StorageDbRepository.fileById(proofFileId);
  if (!file) {
    throw new NotFoundError("FILE", tErrors.file.fileNotFound);
  }

  // Upload provenance: the uploader bound to the file's signed-URL session must
  // be the actor, so a caller cannot settle an invoice with a file id minted by
  // someone else. Rows created before upload binding (uploadedByUserId null) or
  // without a session record are grandfathered: the check applies when provenance
  // data exists and is simply skipped when it does not.
  const uploadSession = await SignedUrlRepository.getLatestByFilePath(file.path, tx);
  if (uploadSession?.uploadedByUserId && uploadSession.uploadedByUserId !== actorUserId) {
    throw new ForbiddenError(tErrors.insufficientPermissions);
  }

  const mimeType = inferMimeFromPath(file.path);
  if (!mimeType || !isAllowedPaymentProofMimeType(mimeType)) {
    throw new Error(tErrors.file.invalidFileType);
  }

  const existingInvoiceFiles = await StorageDbRepository.getFilesForInvoice(
    invoiceId,
    INVOICE_FILE_USAGE.PAYMENT_PROOF,
    tx
  );
  const alreadyLinkedToInvoice = existingInvoiceFiles.some(linked => linked.fileId === proofFileId);
  if (!alreadyLinkedToInvoice) {
    const pending = await InvoicePaymentSubmissionRepository.getPendingByInvoiceId(invoiceId, tx);
    if (pending && pending.fileId !== proofFileId) {
      throw new Error(tErrors.file.invoicePaymentProofPending);
    }
  }

  return { filePath: file.path, mimeType };
}

export function buildProofSnapshot(
  proofFileId: string,
  filePath: string,
  mimeType: string,
  submittedByUserId: string,
  submittedAt: Date
): PaymentProofSnapshot {
  return {
    fileId: proofFileId,
    filePath,
    mimeType,
    submittedByUserId,
    submittedAt: submittedAt.toISOString(),
  };
}

function buildProofTransactionSnapshot(proof: PaymentProofSnapshot): PaymentProofTransactionSnapshot {
  return {
    type: PaymentMethodType.PROOF_UPLOAD,
    proof,
    snapshottedAt: proof.submittedAt,
  };
}

export async function recordProofPayment(
  invoice: Types.InvoiceSelectType,
  proof: PaymentProofSnapshot,
  tErrors: ErrorsLabels,
  tx: DBTransaction
): Promise<Types.PaymentSelectType> {
  const snapshot = buildProofTransactionSnapshot(proof);
  return BillingRepository.recordPayment(
    {
      invoiceId: invoice.id,
      amount: invoice.amount,
      currency: invoice.currency,
      paymentDate: new Date(),
      userPaymentMethodId: null,
      paymentMethodType: PaymentMethodType.PROOF_UPLOAD,
      paymentMethodSnapshot: snapshot,
      transactionId: null,
      gatewayResponse: null,
      exchangeRateSnapshot: invoice.exchangeRateSnapshot,
      exchangeRateSource: invoice.exchangeRateSource,
      idempotencyKey: `proof:${invoice.id}`,
    },
    tErrors,
    tx
  );
}

export async function assertInvoiceBelongsToParentUser(
  actorUserId: string,
  invoice: Types.InvoiceSelectType,
  tErrors: ErrorsLabels
): Promise<void> {
  const parent = await ParentRepository.findByUserId(actorUserId);
  const parentId = parent?.id;
  if (parentId !== invoice.parentId) {
    throw new Error(tErrors.insufficientPermissions);
  }
}

export async function linkProofToInvoice(invoiceId: string, proofFileId: string, tx: DBTransaction): Promise<void> {
  const existing = await StorageDbRepository.getFilesForInvoice(invoiceId, INVOICE_FILE_USAGE.PAYMENT_PROOF, tx);
  if (!existing.some(file => file.fileId === proofFileId)) {
    await StorageDbRepository.linkFileToInvoice(invoiceId, proofFileId, INVOICE_FILE_USAGE.PAYMENT_PROOF, tx);
  }
}

export async function mapSubmissionToReturnType(
  submission: Types.InvoicePaymentSubmissionSelectType,
  _tx?: DBTransaction
): Promise<Types.InvoicePaymentSubmissionReturnType> {
  const file = await StorageDbRepository.fileById(submission.fileId);
  const mimeType = file ? (inferMimeFromPath(file.path) ?? "application/octet-stream") : "application/octet-stream";
  return {
    id: submission.id,
    invoiceId: submission.invoiceId,
    fileId: submission.fileId,
    filePath: file?.path ?? "",
    mimeType,
    status: isInvoicePaymentSubmissionStatus(submission.status)
      ? submission.status
      : InvoicePaymentSubmissionStatus.PENDING,
    submittedByUserId: submission.submittedByUserId,
    submittedAt: submission.submittedAt.toISOString(),
    reviewedByUserId: submission.reviewedByUserId,
    reviewedAt: submission.reviewedAt ? submission.reviewedAt.toISOString() : null,
    rejectionReason: submission.rejectionReason,
  };
}
