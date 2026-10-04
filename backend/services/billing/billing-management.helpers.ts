import { createHash } from "node:crypto";
import { db } from "@/backend/db/drizzleDb";
import { BillingRepository } from "@/backend/db/repo/billing";
import { ParentRepository } from "@/backend/db/repo/parents";
import { PermissionManagementRepository } from "@/backend/db/repo/permissions";
import { AppPermission } from "@/backend/enum";
import { ForbiddenError, logger, NotFoundError } from "@/backend/lib";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import {
  buildProofSnapshot,
  linkProofToInvoice,
  recordProofPayment,
  validateProofFile,
} from "@/backend/services/billing/billing-payment-proof.helpers";
import { NotificationSyncService } from "@/backend/services/system/notification-sync.service";
import type * as Types from "@/backend/types";
import type { DBTransaction, UserPermissionContext } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import { parseInvoiceStatus, parseInvoiceType } from "@/shared/lib/enum";
import type { ErrorsLabels } from "@/shared/locale";

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

export async function requirePermission(
  actorUserId: string,
  permission: AppPermission,
  tErrors: ErrorsLabels
): Promise<void> {
  const hasPermission = await PermissionsService.hasPermission(actorUserId, permission);
  if (!hasPermission) {
    throw new Error(tErrors.insufficientPermissions);
  }
}

export async function validateManualInvoiceInput(
  input: Types.CreateManualInvoiceInput,
  tErrors: ErrorsLabels
): Promise<void> {
  if (!input.parentId || input.parentId.trim().length === 0) {
    throw new Error(tErrors.billing.invalidParentId);
  }

  const amountNum = Number.parseFloat(input.amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    throw new Error(tErrors.billing.invalidInvoiceAmount);
  }
}

export function buildInvoiceInsertPayload(actorUserId: string, input: Types.CreateManualInvoiceInput) {
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

export function mapToManualInvoiceResult(created: Types.InvoiceSelectType): Types.ManualInvoiceResult {
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

export async function syncNotificationAfterCreate(
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

export async function syncNotificationsAfterDelete(invoiceId: string): Promise<boolean> {
  const syncResult = await NotificationSyncService.syncUnpaidNotifications().catch(err => {
    logger.error("Notification sync failed after deleteInvoice", { invoiceId, err });
    return null;
  });
  return syncResult !== null;
}

/**
 * Resolve the `users.id` for a parent row. Used as the notification
 * recipient when an invoice event targets the parent.
 * Returns `null` if the parent row is missing — the caller skips dispatch.
 */
export async function resolveParentUserId(parentId: string): Promise<string | null> {
  const parent = await ParentRepository.getParentProfile(parentId);
  return parent?.userId ?? null;
}

/**
 * Resolve userIds of all staff currently holding the given permission via
 * their group memberships (super-admins are folded in). Exhausts the
 * `user_permission_groups → group_permissions → permissions` join in one
 * query. The `BILLING_UPDATE_STATUS_PAID` permission gates proof review,
 * so its holders are the staff reviewers notified on `submitPaymentProof`.
 *
 * Returns an empty array on any fetch error so the caller can early-return
 * (no staff reviewers = no dispatch).
 */
export async function resolveUsersWithPermission(permissionKey: AppPermission): Promise<string[]> {
  try {
    return await PermissionManagementRepository.listUserIdsWithPermission(permissionKey);
  } catch (error) {
    logger.error("resolveUsersWithPermission: lookup failed", { permissionKey, error });
    return [];
  }
}

/**
 * Wraps payment status finalization so the caller can fire a
 * non-blocking notification dispatch AFTER the transaction commits but
 * BEFORE the result is returned. The dispatch is best-effort: it catches
 * and logs its own errors, never throwing back into the mutation path
 * (dispatch failure must not fail the mutation).
 *
 * Returns the unchanged {@link Types.MarkInvoicePaidReturnType} so callers can
 * forward it transparently.
 */
export async function finalizePaymentStatusChangeWithDispatch(
  errorLabel: string,
  actorUserId: string,
  invoiceId: string,
  txnWork: (tx: DBTransaction, tErrors: ErrorsLabels) => Promise<Types.InvoiceSelectType>,
  tErrors: ErrorsLabels,
  postCommitDispatch: (updatedInvoice: Types.InvoiceSelectType) => Promise<void>,
  locale?: string
): Promise<Types.MarkInvoicePaidReturnType> {
  try {
    const updated = await db.transaction(tx => txnWork(tx, tErrors));
    const notificationSummaryUpdated = await syncNotificationsAfterPaymentChange(locale);

    await postCommitDispatch(updated).catch(err => {
      logger.error(`${errorLabel}: post-commit dispatch failed`, { actorUserId, invoiceId, err });
    });

    return mapMarkPaidResult(updated, notificationSummaryUpdated);
  } catch (error) {
    logger.error(errorLabel, { actorUserId, invoiceId, error });
    throw error;
  }
}

function mapMarkPaidResult(
  invoice: Types.InvoiceSelectType,
  notificationSummaryUpdated: boolean
): Types.MarkInvoicePaidReturnType {
  return {
    id: invoice.id,
    parentId: invoice.parentId,
    status: parseInvoiceStatus(invoice.status),
    paidDate: invoice.paidDate ?? null,
    version: invoice.version,
    notificationSummaryUpdated,
  };
}

export async function fetchInvoicePendingReview(
  invoiceId: string,
  tErrors: ErrorsLabels
): Promise<Types.InvoiceSelectType> {
  const existingInvoice = await BillingRepository.getInvoiceById(invoiceId);
  if (!existingInvoice) {
    throw new NotFoundError("INVOICE", tErrors.billing.invoiceNotFound(invoiceId));
  }

  if (existingInvoice.status !== "PAYMENT_PENDING") {
    throw new Error(tErrors.billing.invoiceNotPendingReview(invoiceId));
  }

  return existingInvoice;
}

/**
 * Allow access when the caller holds a billing-wide permission or
 * super-admin role; otherwise fall back to the parent owning the invoice.
 */
export async function assertInvoiceBillingAccess(
  actorUserId: string,
  effectiveContext: UserPermissionContext,
  invoice: Types.InvoiceSelectType,
  tErrors: ErrorsLabels
): Promise<void> {
  const hasBillingAccess =
    effectiveContext.isSuperAdmin ||
    effectiveContext.permissions.includes(AppPermission.INVOICES_LIST) ||
    effectiveContext.permissions.includes(AppPermission.BILLING_VIEW_UNPAID_INVOICES);

  if (hasBillingAccess) return;

  const parent = await ParentRepository.findByUserId(actorUserId);
  if (parent?.id !== invoice.parentId) {
    throw new ForbiddenError(tErrors.insufficientPermissions);
  }
}

export async function finalizeInvoicePaid(
  actorUserId: string,
  invoiceId: string,
  proofFileId: string,
  submittedByUserId: string,
  expectedVersion: number | undefined,
  tx: DBTransaction,
  tErrors: ErrorsLabels
): Promise<Types.InvoiceSelectType> {
  const existingInvoice = await BillingRepository.getInvoiceById(invoiceId, tx);
  if (!existingInvoice) {
    throw new NotFoundError("INVOICE", tErrors.billing.invoiceNotFound(invoiceId));
  }

  if (existingInvoice.status !== "UNPAID" && existingInvoice.status !== "PAYMENT_PENDING") {
    throw new Error(tErrors.billing.invoiceAlreadyPaid({ id: invoiceId, status: existingInvoice.status }));
  }

  const { filePath, mimeType } = await validateProofFile(proofFileId, invoiceId, submittedByUserId, tErrors, tx);
  await linkProofToInvoice(invoiceId, proofFileId, tx);

  const submittedAt = new Date();
  const proof = buildProofSnapshot(proofFileId, filePath, mimeType, submittedByUserId, submittedAt);
  const invoice = await BillingRepository.markInvoiceAsPaid(invoiceId, tErrors, expectedVersion, tx);
  await recordProofPayment(invoice, proof, tErrors, tx);

  logger.info("Invoice marked as paid with proof", {
    actorUserId,
    invoiceId: invoice.id,
    parentId: invoice.parentId,
    proofFileId,
  });

  return invoice;
}
