export { PaymentMethodType, PaymentDirection } from "@/shared/constants/billing.enum";

/** Backend-only identifier kind for payment-method lookups (no shared equivalent). */
export enum IdentifierKind {
  EMAIL = "EMAIL",
  HANDLE = "HANDLE",
  EMAIL_OR_HANDLE = "EMAIL_OR_HANDLE",
}
