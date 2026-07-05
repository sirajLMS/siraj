import { createHash } from "node:crypto";
import { BillingRepository, ParentRepository } from "@/backend/db/repo";
import { ForbiddenError, NotFoundError } from "@/backend/lib/errors";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { NotificationSyncService } from "@/backend/services/system/notification-sync.service";
import type * as Types from "@/backend/types";
import type {
  CreateManualInvoiceInput,
  DeleteInvoiceResult,
  ManualInvoiceResult,
  MarkInvoicePaidResult,
  SendPaymentReminderResult,
} from "@/backend/types";
import { AppPermission, type InvoiceStatus, type InvoiceType } from "@/shared/lib/enum";

export type { CreateManualInvoiceInput } from "@/backend/types";

function deriveIdempotencyKey(input: {
  parentId: string;
  studentId?: string | null;
  amount: string;
  currency: string;
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

async function validateManualInvoiceInput(input: CreateManualInvoiceInput, locale?: string): Promise<void> {
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

function buildInvoiceInsertPayload(actorUserId: string, input: CreateManualInvoiceInput) {
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

function mapToManualInvoiceResult(created: Types.InvoiceSelectType): ManualInvoiceResult {
  return {
    id: created.id,
    parentId: created.parentId,
    studentId: created.studentId ?? null,
    amount: created.amount,
    currency: created.currency,
    status: created.status as InvoiceStatus,
    invoiceType: created.invoiceType as InvoiceType,
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

export namespace BillingManagementService {
  export async function createManualInvoice(
    actorUserId: string,
    input: CreateManualInvoiceInput,
    locale?: string
  ): Promise<ManualInvoiceResult> {
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

  export async function markInvoicePaid(
    actorUserId: string,
    invoiceId: string,
    expectedVersion?: number,
    locale?: string
  ): Promise<MarkInvoicePaidResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.BILLING_UPDATE_STATUS_PAID);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    try {
      const updated = await BillingRepository.markInvoiceAsPaid(invoiceId, expectedVersion, undefined, locale);

      logger.info("Invoice marked as paid", {
        actorUserId,
        invoiceId: updated.id,
        parentId: updated.parentId,
        paidDate: updated.paidDate,
      });

      const syncResult = await NotificationSyncService.syncUnpaidNotifications(locale).catch(err => {
        logger.error("Notification sync failed after markInvoicePaid", {
          invoiceId,
          err,
        });
        return null;
      });

      return {
        invoice: {
          id: updated.id,
          parentId: updated.parentId,
          status: updated.status as InvoiceStatus,
          paidDate: updated.paidDate ?? null,
          version: updated.version,
        },
        notificationSummaryUpdated: syncResult !== null,
      };
    } catch (error) {
      logger.error("Failed to mark invoice as paid", { actorUserId, invoiceId, error });
      throw error;
    }
  }

  export async function deleteInvoice(
    actorUserId: string,
    invoiceId: string,
    locale?: string
  ): Promise<DeleteInvoiceResult> {
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
    if (invoice.status === "PAID") {
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
          deletedAt: deleted.deletedAt ? deleted.deletedAt.toISOString() : null,
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
      if (!parent || parent.id !== invoice.parentId) {
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
  ): Promise<SendPaymentReminderResult> {
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
}
