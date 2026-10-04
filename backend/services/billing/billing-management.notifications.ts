import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { StudentRepository } from "@/backend/db/repo/students";
import { invoices } from "@/backend/db/schema";
import { logger } from "@/backend/lib";
import { resolveParentUserId } from "@/backend/services/billing/billing-management.helpers";
import { dispatchWithPreferences } from "@/backend/services/notification/notification-dispatch.helpers";
import {
  buildInvoiceGeneratedPayloads,
  buildInvoiceStatusChangedPayloads,
} from "@/backend/services/notification/notification-payloads.builders";
import type * as Types from "@/backend/types";

/**
 * Dispatch invoice-generated payloads to the parent non-blockingly: a
 * dispatch failure must not roll back the invoice creation.
 * The tray-summary sync (`NotificationSyncService.syncUnpaidNotifications`)
 * is preserved by the caller — this helper only emits the new dispatch.
 */
export async function dispatchInvoiceGenerated(
  parentUserId: string,
  invoice: Types.InvoiceSelectType,
  locale?: string
): Promise<void> {
  const payloads = buildInvoiceGeneratedPayloads(parentUserId, invoice, locale);
  await dispatchWithPreferences(payloads, [parentUserId], locale).catch(err => {
    logger.error("Invoice-generated notification dispatch failed", {
      invoiceId: invoice.id,
      parentUserId,
      err,
    });
  });
}

export async function dispatchInvoiceStatusChanged(
  parentUserId: string,
  action: "proofSubmitted" | "proofApproved" | "proofRejected" | "markedPaid",
  invoice: Types.InvoiceSelectType,
  locale?: string
): Promise<void> {
  const payloads = buildInvoiceStatusChangedPayloads(parentUserId, action, invoice, locale);
  await dispatchWithPreferences(payloads, [parentUserId], locale).catch(err => {
    logger.error("Invoice-status-changed notification dispatch failed", {
      invoiceId: invoice.id,
      parentUserId,
      action,
      err,
    });
  });
}

/**
 * Fan the `proofSubmitted` notification out to all staff reviewers.
 * Each reviewer receives a payload keyed to their own `userId` so
 * `dispatchWithPreferences` can apply per-user prefs. Dispatch
 * is non-blocking and logged on failure.
 */
export async function dispatchProofSubmittedToStaff(
  staffUserIds: string[],
  invoice: Types.InvoiceSelectType,
  locale?: string
): Promise<void> {
  if (staffUserIds.length === 0) return;
  const allPayloads: Types.CommunicationPayload[] = [];
  for (const staffUserId of staffUserIds) {
    const perUser = buildInvoiceStatusChangedPayloads(staffUserId, "proofSubmitted", invoice, locale);
    allPayloads.push(...perUser);
  }
  await dispatchWithPreferences(allPayloads, staffUserIds, locale).catch(err => {
    logger.error("proof-submitted staff notification dispatch failed", {
      invoiceId: invoice.id,
      staffCount: staffUserIds.length,
      err,
    });
  });
}

/**
 * Resolve the parent of a student, then dispatch `INVOICE_GENERATED`
 * payloads for each of the parent's currently-unpaid invoices
 * (real dispatch for `sendPaymentReminder`).
 *
 * The student→parent→user lookup chain is best-effort: if any link is
 * missing we log and return without dispatching (the caller in
 * `sendPaymentReminder` separately preserves the tray-summary sync).
 */
export async function dispatchUnpaidInvoicesForStudent(studentId: string, locale?: string): Promise<void> {
  const student = await StudentRepository.findById(studentId);
  if (!student) return;
  const parentId = student.parentId;
  if (!parentId) return;

  const parentUserId = await resolveParentUserId(parentId);
  if (!parentUserId) return;

  const unpaidInvoices = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.parentId, parentId), eq(invoices.status, "UNPAID"), isNull(invoices.deletedAt)));

  if (unpaidInvoices.length === 0) return;

  const allPayloads: Types.CommunicationPayload[] = [];
  for (const invoice of unpaidInvoices) {
    allPayloads.push(...buildInvoiceGeneratedPayloads(parentUserId, invoice, locale));
  }

  await dispatchWithPreferences(allPayloads, [parentUserId], locale).catch(err => {
    logger.error("Payment reminder notification dispatch failed", {
      studentId,
      parentUserId,
      invoiceCount: unpaidInvoices.length,
      err,
    });
  });
}
