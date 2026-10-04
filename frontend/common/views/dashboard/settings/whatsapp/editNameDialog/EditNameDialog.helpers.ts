import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

type WhatsappValidationKey =
  | "validationDisplayNameRequired"
  | "validationDisplayNameTooLong"
  | "validationPurposeRequired"
  | "validationPurposeInvalid";

const VALIDATION_KEYS: ReadonlySet<string> = new Set([
  "validationDisplayNameRequired",
  "validationDisplayNameTooLong",
  "validationPurposeRequired",
  "validationPurposeInvalid",
]);

function isValidationKey(value: string): value is WhatsappValidationKey {
  return VALIDATION_KEYS.has(value);
}

/**
 * Maps a validator's returned translation key to its localized message, or
 * passes through free-form error text produced outside the locale namespace.
 */
export function resolveValidationError(key: string | null, labels: WhatsappLabels): string | null {
  if (key === null) {
    return null;
  }
  if (isValidationKey(key)) {
    return labels[key];
  }
  return key;
}
