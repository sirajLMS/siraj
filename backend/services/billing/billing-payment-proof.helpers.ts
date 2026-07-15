import type { DBTransaction } from "@/backend/db/db.types";
import {
  BillingRepository,
  InvoicePaymentSubmissionRepository,
  ParentRepository,
  StorageDbRepository,
} from "@/backend/db/repo";
import { PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { NotFoundError } from "@/backend/lib";
import type * as Types from "@/backend/types";
import type {
  PaymentProofSnapshot,
  PaymentProofTransactionSnapshot,
} from "@/backend/types/billing/payment-method.types";
import { INVOICE_FILE_USAGE } from "@/shared/constants/billing/invoice-file-usage";
import { isAllowedPaymentProofMimeType } from "@/shared/constants/billing/payment-proof";
import type { ErrorsLabels } from "@/shared/locale/types/errors";
import { extToMime } from "@/shared/utils/storage.utils";

function inferMimeFromPath(path: string): string | null {
  const ext = path.split(".").pop()?.toLowerCase();
  if (!ext) {
    return null;
  }
  return extToMime[ext] ?? null;
}

export async function validateProofFile(
  proofFileId: string,
  invoiceId: string,
  tx: DBTransaction
): Promise<{ filePath: string; mimeType: string }> {
  const file = await StorageDbRepository.fileById(proofFileId);
  if (!file) {
    throw new NotFoundError("FILE", "Storage file not found");
  }

  const mimeType = inferMimeFromPath(file.path);
  if (!mimeType || !isAllowedPaymentProofMimeType(mimeType)) {
    throw new Error("Invalid file type");
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
      throw new Error("A payment proof is already pending review for this invoice.");
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

export function buildProofTransactionSnapshot(proof: PaymentProofSnapshot): PaymentProofTransactionSnapshot {
  return {
    type: PaymentMethodType.PROOF_UPLOAD,
    proof,
    snapshottedAt: proof.submittedAt,
  };
}

export async function recordProofPayment(
  invoice: Types.InvoiceSelectType,
  proof: PaymentProofSnapshot,
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
    tx
  );
}

export async function assertInvoiceBelongsToParentUser(
  actorUserId: string,
  invoice: Types.InvoiceSelectType,
  tErrors: ErrorsLabels
): Promise<void> {
  const parent = await ParentRepository.findByUserId(actorUserId);
  if (!parent || parent.id !== invoice.parentId) {
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
    status: submission.status,
    submittedByUserId: submission.submittedByUserId,
    submittedAt: submission.submittedAt.toISOString(),
    reviewedByUserId: submission.reviewedByUserId,
    reviewedAt: submission.reviewedAt ? submission.reviewedAt.toISOString() : null,
    rejectionReason: submission.rejectionReason,
  };
}
