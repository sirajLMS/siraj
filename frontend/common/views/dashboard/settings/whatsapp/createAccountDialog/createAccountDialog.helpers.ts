import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

type WhatsappValidationKey =
  | "validationDisplayNameRequired"
  | "validationDisplayNameTooLong"
  | "validationPhoneNumberIdRequired"
  | "validationPhoneNumberIdNumeric"
  | "validationWabaIdRequired"
  | "validationWabaIdNumeric"
  | "validationPurposeRequired"
  | "validationPurposeInvalid";

const VALIDATION_KEYS: ReadonlySet<string> = new Set([
  "validationDisplayNameRequired",
  "validationDisplayNameTooLong",
  "validationPhoneNumberIdRequired",
  "validationPhoneNumberIdNumeric",
  "validationWabaIdRequired",
  "validationWabaIdNumeric",
  "validationPurposeRequired",
  "validationPurposeInvalid",
]);

type PurposeDescriptionKey =
  | "purposeOptionGeneralDescription"
  | "purposeOptionStudentsDescription"
  | "purposeOptionAdvertisingDescription";

const PURPOSE_DESCRIPTION_KEYS: Readonly<Record<string, PurposeDescriptionKey>> = {
  GENERAL: "purposeOptionGeneralDescription",
  STUDENTS: "purposeOptionStudentsDescription",
  ADVERTISING: "purposeOptionAdvertisingDescription",
};

/** Helper copy shown under the purpose select; unknown purposes have no description. */
export function resolvePurposeDescription(purpose: string, labels: WhatsappLabels): string | null {
  if (!(purpose in PURPOSE_DESCRIPTION_KEYS)) {
    return null;
  }
  return labels[PURPOSE_DESCRIPTION_KEYS[purpose]];
}

function isValidationKey(value: string): value is WhatsappValidationKey {
  return VALIDATION_KEYS.has(value);
}

/**
 * Maps a validator outcome to user-facing copy: known i18n validation keys
 * resolve to their localized message, anything else is treated as an
 * already-localized message.
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
