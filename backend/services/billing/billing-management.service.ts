import { createHash } from "node:crypto";
import { db } from "@/backend/db/drizzleDb";
import type { DBTransaction } from "@/backend/db/db.types";
import { BillingRepository, ParentRepository, UserPaymentMethodRepository } from "@/backend/db/repo";
import { AppPermission, type CurrencyCode } from "@/backend/enum";
import { PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import { ForbiddenError, getBackendTranslations, logger, NotFoundError } from "@/backend/lib";
import { parseInvoiceStatus, parseInvoiceType } from "@/backend/lib/enum";
import { NotificationSyncService, PermissionsService } from "@/backend/services";
import { PaymentMethodService } from "@/backend/services/payment-method/payment-method.service";
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

async function validatePayinMethodForParent(
  userPaymentMethodId: string,
  parentId: string,
  tx: DBTransaction,
  locale?: string
): Promise<void> {
  const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
  const parent = await ParentRepository.getParentProfile(parentId, tx);
  if (!parent) {
    throw new NotFoundError("PARENT", tFunc("parentNotFound", { id: parentId }));
  }

  const method = await UserPaymentMethodRepository.getById(userPaymentMethodId, tx);
  if (!method) {
    throw new Error(
      tFunc("recordNotFound", { tableName: "user_payment_methods", entityId: userPaymentMethodId })
    );
  }

  if (method.userId !== parent.userId) {
    throw new Error(tFunc("insufficientPermissions"));
  }

  const direction = method.direction as PaymentDirection;
  if (direction !== PaymentDirection.PAYIN && direction !== PaymentDirection.BOTH) {
    throw new Error(tFunc("insufficientPermissions"));
  }
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

  export async function markInvoicePaid(
    actorUserId: string,
    invoiceId: string,
    userPaymentMethodId: string,
    expectedVersion?: number,
    locale?: string
  ): Promise<Types.MarkInvoicePaidResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.BILLING_UPDATE_STATUS_PAID);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    if (!userPaymentMethodId.trim()) {
      throw new Error(tFunc("noActiveBankingDetails", { id: "payin" }));
    }

    const existingInvoice = await BillingRepository.getInvoiceById(invoiceId);
    if (!existingInvoice) {
      throw new NotFoundError("INVOICE", tFunc("invoiceNotFound", { id: invoiceId }));
    }

    try {
      const updated = await db.transaction(async tx => {
        await validatePayinMethodForParent(userPaymentMethodId, existingInvoice.parentId, tx, locale);

        const invoice = await BillingRepository.markInvoiceAsPaid(invoiceId, expectedVersion, tx, locale);

        await PaymentMethodService.recordPayin(
          {
            invoiceId: invoice.id,
            amount: invoice.amount,
            currency: invoice.currency,
            paymentDate: new Date(),
            userPaymentMethodId,
            transactionId: null,
            gatewayResponse: null,
            exchangeRateSnapshot: invoice.exchangeRateSnapshot,
            exchangeRateSource: invoice.exchangeRateSource,
            idempotencyKey: `payin:${invoice.id}`,
          },
          tx,
          locale
        );

        return invoice;
      });

      logger.info("Invoice marked as paid", {
        actorUserId,
        invoiceId: updated.id,
        parentId: updated.parentId,
        paidDate: updated.paidDate,
        userPaymentMethodId,
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
          status: parseInvoiceStatus(updated.status),
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
}
