import { decryptField, encryptField } from "@/backend/lib/field-encryption";
import type { BankTransferDetails, PaymentMethodDetails } from "@/backend/types/billing/payment-method.types";

// Sensitive bank routing fields inside `BankTransferDetails` JSONB that must be
// encrypted at rest (AES-256-GCM via `field-encryption`). `beneficiaryName` and
// `bankName` are left plaintext — they are display labels, not credentials.
const SENSITIVE_BANK_FIELDS = ["iban", "accountNumber", "routingNumber", "swiftBic"] as const;

type SensitiveBankField = (typeof SENSITIVE_BANK_FIELDS)[number];

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type MutableBankTransferDetails = Mutable<BankTransferDetails> & Partial<Record<SensitiveBankField, string>>;

/**
 * Encrypt the sensitive routing fields of a `BankTransferDetails` object
 * (copy-on-write). Returns a new object; the input is not mutated. The service
 * must call this before persisting `details` JSONB into `user_payment_methods`
 * or into a `payment_method_snapshot`.
 */
export function encryptBankTransferDetails(details: BankTransferDetails): BankTransferDetails {
  const encrypted: MutableBankTransferDetails = { ...details };
  for (const field of SENSITIVE_BANK_FIELDS) {
    const value = details[field];
    if (typeof value === "string" && value.length > 0) {
      encrypted[field] = encryptField(value);
    }
  }
  return encrypted;
}

/**
 * Decrypt the sensitive routing fields of a `BankTransferDetails` object
 * (copy-on-write). Returns a new object; the input is not mutated. On a
 * decryption failure (corrupt ciphertext / wrong key) the field falls back to
 * the stored value rather than surfacing ciphertext — see `decryptField`.
 */
export function decryptBankTransferDetails(details: BankTransferDetails): BankTransferDetails {
  const decrypted: MutableBankTransferDetails = { ...details };
  for (const field of SENSITIVE_BANK_FIELDS) {
    const value = details[field];
    if (typeof value === "string" && value.length > 0) {
      const plain = decryptField(value);
      decrypted[field] = plain ?? value;
    }
  }
  return decrypted;
}

/**
 * No-op passthrough for non-bank `PaymentMethodDetails`. Only `BANK_TRANSFER`
 * carries sensitive nested fields today; every other type is safe to persist
 * as-is. The caller (service) knows the row `type` and dispatches to
 * `encryptBankTransferDetails` / `decryptBankTransferDetails` directly when
 * the type is `BANK_TRANSFER`. This stub exists to document the contract and
 * keep a single import surface for future per-type encryptors.
 */
export function encryptPaymentMethodDetails(details: PaymentMethodDetails): PaymentMethodDetails {
  return details;
}

export function decryptPaymentMethodDetails(details: PaymentMethodDetails): PaymentMethodDetails {
  return details;
}
