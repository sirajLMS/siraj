export { InvoiceStatus, InvoiceType } from "@/shared/constants/billing.enum";

/** Backend-only submission status for invoice payment proofs (no shared equivalent). */
export enum InvoicePaymentSubmissionStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}
