import { decryptField, encryptField } from "@/backend/lib/field-encryption";
import type { BankTransferDetails } from "@/backend/types";

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
 * decryption failure (corrupt ciphertext / key rotation) the field is dropped
 * so callers mask or omit it — the stored ciphertext is never surfaced as the
 * field's value.
 */
export function decryptBankTransferDetails(details: BankTransferDetails): BankTransferDetails {
  const decrypted: MutableBankTransferDetails = { ...details };
  for (const field of SENSITIVE_BANK_FIELDS) {
    const value = details[field];
    if (typeof value === "string" && value.length > 0) {
      const plain = decryptField(value);
      if (plain === null) {
        delete decrypted[field];
        continue;
      }
      decrypted[field] = plain;
    }
  }
  return decrypted;
}
