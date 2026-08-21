import { InvoiceStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { AdminInvoiceStatus } from "@/shared/types/billing-view";

export type ParentInvoiceDisplayStatus = InvoiceStatus | "OVERDUE";

export function isPayableUnpaidStatus(status: AdminInvoiceStatus | ParentInvoiceDisplayStatus): boolean {
  return status === InvoiceStatus.Unpaid || status === "OVERDUE" || status === "PENDING";
}

export function isDeletableInvoiceStatus(status: AdminInvoiceStatus | ParentInvoiceDisplayStatus): boolean {
  return status !== InvoiceStatus.Paid && status !== InvoiceStatus.PaymentPending;
}

export function shouldShowViewRejection(
  status: AdminInvoiceStatus | ParentInvoiceDisplayStatus,
  hasRejectedSubmission: boolean
): boolean {
  return isPayableUnpaidStatus(status) && hasRejectedSubmission;
}

export function deriveParentInvoiceDisplayStatus(
  gqlStatus: string | null | undefined,
  dueDateIso: string | null | undefined
): ParentInvoiceDisplayStatus {
  if (gqlStatus === InvoiceStatus.Paid) return InvoiceStatus.Paid;
  if (gqlStatus === InvoiceStatus.PaymentPending) return InvoiceStatus.PaymentPending;
  if (gqlStatus === InvoiceStatus.Cancelled) return InvoiceStatus.Cancelled;
  if (gqlStatus === InvoiceStatus.Unpaid) {
    if (dueDateIso && new Date(dueDateIso) < new Date()) return "OVERDUE";
    return InvoiceStatus.Unpaid;
  }
  return InvoiceStatus.Unpaid;
}

export function deriveAdminInvoiceDisplayStatus(
  gqlStatus: string | null,
  dueDateIso: string | null
): AdminInvoiceStatus {
  if (gqlStatus === InvoiceStatus.Paid) return InvoiceStatus.Paid;
  if (gqlStatus === InvoiceStatus.PaymentPending) return InvoiceStatus.PaymentPending;
  if (gqlStatus === InvoiceStatus.Cancelled) return InvoiceStatus.Cancelled;
  if (gqlStatus === InvoiceStatus.Unpaid) {
    if (dueDateIso && new Date(dueDateIso) < new Date()) return "OVERDUE";
    return InvoiceStatus.Unpaid;
  }
  if (dueDateIso && new Date(dueDateIso) < new Date()) return "OVERDUE";
  return "PENDING";
}
