export const ALLOWED_PAYMENT_PROOF_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;

export type PaymentProofMimeType = (typeof ALLOWED_PAYMENT_PROOF_MIME_TYPES)[number];

export const PAYMENT_PROOF_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";

export function isAllowedPaymentProofMimeType(mimeType: string): mimeType is PaymentProofMimeType {
  return (ALLOWED_PAYMENT_PROOF_MIME_TYPES as readonly string[]).includes(mimeType);
}
