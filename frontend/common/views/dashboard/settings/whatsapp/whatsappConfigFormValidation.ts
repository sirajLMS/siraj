/**
 * Validation functions for the WhatsApp Cloud API configuration form.
 *
 * Mirrors the pure-validators pattern of `whatsappFormValidation.ts`: each
 * validator returns an i18n key name (as defined in `WhatsappLabels` in
 * `shared/locale/types/whatsapp`) when the input is invalid, or `null` when
 * the input is valid.
 *
 * Every configuration field is optional (an empty input is valid — it either
 * preserves the stored value or, for visible fields, clears it on save), so
 * these validators only reject malformed non-empty values.
 *
 * @module
 */

import type { WhatsappConfigValidationKey } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappConfigView.types";

/** Pattern for numeric-only Meta identifiers. */
const NUMERIC_PATTERN = /^\d+$/;

/**
 * Validates the Meta App ID field. Numeric when provided.
 *
 * @returns `null` if valid, or a validation key string if invalid.
 */
export function validateWhatsappAppId(value: string): WhatsappConfigValidationKey | null {
  if (value.length === 0) {
    return null;
  }
  if (!NUMERIC_PATTERN.test(value)) {
    return "validationAppIdNumeric";
  }
  return null;
}

/**
 * Validates the Phone Number ID field. Numeric when provided.
 *
 * @returns `null` if valid, or a validation key string if invalid.
 */
export function validateWhatsappPhoneNumberId(value: string): WhatsappConfigValidationKey | null {
  if (value.length === 0) {
    return null;
  }
  if (!NUMERIC_PATTERN.test(value)) {
    return "validationPhoneNumberIdNumeric";
  }
  return null;
}

/**
 * Validates the WABA ID field. Numeric when provided.
 *
 * @returns `null` if valid, or a validation key string if invalid.
 */
export function validateWhatsappWabaId(value: string): WhatsappConfigValidationKey | null {
  if (value.length === 0) {
    return null;
  }
  if (!NUMERIC_PATTERN.test(value)) {
    return "validationWabaIdNumeric";
  }
  return null;
}
