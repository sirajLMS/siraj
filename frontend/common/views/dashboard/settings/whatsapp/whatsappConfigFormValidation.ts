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

import type {
  WhatsappConfigFormField,
  WhatsappConfigFormValues,
  WhatsappConfigValidationKey,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappConfigView.types";

/** Pattern for numeric-only Meta identifiers. */
const NUMERIC_PATTERN = /^\d+$/;

/**
 * Runtime-checked key guard: `WHATSAPP_CONFIG_FIELD_MAX_LENGTHS` is pinned by
 * its own `satisfies Record<WhatsappConfigFormField, number>` to have exactly
 * the `WhatsappConfigFormField` keys, so every own enumerable key of the
 * record IS a form field. Iterating `Object.keys` through this guard (instead
 * of an unsafe assertion) keeps the loop type-safe and can never drift from
 * the caps record — the keys come from the record itself.
 */
function isWhatsappConfigFormField(key: string): key is WhatsappConfigFormField {
  return Object.hasOwn(WHATSAPP_CONFIG_FIELD_MAX_LENGTHS, key);
}

/**
 * Client-side mirror of the server's per-field input caps (the backend
 * constant `WHATSAPP_CONFIG_FIELD_MAX_LENGTHS` in
 * `backend/lib/whatsapp-constants.ts`: visible fields mirror the column
 * widths, encrypted fields are capped at 512). Frontend code must not import
 * backend modules, so the caps are replicated here — keep the two in sync.
 */
export const WHATSAPP_CONFIG_FIELD_MAX_LENGTHS = {
  appId: 64,
  appSecret: 512,
  verifyToken: 255,
  phoneNumberId: 64,
  wabaId: 64,
  accessToken: 512,
  esConfigId: 64,
} as const satisfies Record<WhatsappConfigFormField, number>;

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

/**
 * Mirrors the server-side per-field length caps: every field whose value
 * exceeds the mirrored maximum is reported, so an over-length submission is
 * blocked before it ever reaches the backend validation.
 *
 * @returns One entry per field whose value is over-length (empty values are
 *   never reported — they mean preserve/clear, not "too long").
 */
export function validateWhatsappConfigMaxLengths(
  values: WhatsappConfigFormValues
): Partial<Record<WhatsappConfigFormField, WhatsappConfigValidationKey>> {
  const errors: Partial<Record<WhatsappConfigFormField, WhatsappConfigValidationKey>> = {};
  for (const field of Object.keys(WHATSAPP_CONFIG_FIELD_MAX_LENGTHS).filter(isWhatsappConfigFormField)) {
    if (values[field].length > WHATSAPP_CONFIG_FIELD_MAX_LENGTHS[field]) {
      errors[field] = "validationMaxLength";
    }
  }
  return errors;
}
