/**
 * WhatsApp form validation functions.
 *
 * Each validator returns an i18n key name (as defined in `WhatsappLabels` in
 * `shared/locale/types/whatsapp`) when the input is invalid, or `null` when the
 * input is valid. The calling component resolves the key via the locale
 * translation function (`t.*`) to display the localized error message.
 *
 * Validators are pure functions — no side effects, no I/O.
 *
 * @module
 */

import type {
  AccessTokenFormValues,
  AccountCreateFormValues,
  AccountCredentialFormValues,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";

/** Maximum allowed length for display name. */
const DISPLAY_NAME_MAX_LENGTH = 100;

/** Minimum allowed length for access token (when provided). */
const ACCESS_TOKEN_MIN_LENGTH = 50;

/** Pattern for exactly 6 digits. */
const TWO_STEP_PIN_PATTERN = /^\d{6}$/;

/** Pattern for numeric-only strings. */
const NUMERIC_PATTERN = /^\d+$/;

/** Accepted routing purposes (mirrors the `WhatsappAccountPurpose` GraphQL enum values). */
const VALID_PURPOSES: ReadonlySet<string> = new Set(["GENERAL", "ADVERTISING", "STUDENTS"]);

/**
 * Validates the display name field of the create-account form.
 *
 * @returns `null` if valid, or a validation key string if invalid.
 */
export function validateDisplayName(value: string): string | null {
  if (value.trim().length === 0) {
    return "validationDisplayNameRequired";
  }
  if (value.length > DISPLAY_NAME_MAX_LENGTH) {
    return "validationDisplayNameTooLong";
  }
  return null;
}

/**
 * Validates the phone number ID field of the create-account form.
 *
 * @returns `null` if valid, or a validation key string if invalid.
 */
export function validatePhoneNumberId(value: string): string | null {
  if (value.trim().length === 0) {
    return "validationPhoneNumberIdRequired";
  }
  if (!NUMERIC_PATTERN.test(value)) {
    return "validationPhoneNumberIdNumeric";
  }
  return null;
}

/**
 * Validates the WABA ID field of the create-account form.
 *
 * @returns `null` if valid, or a validation key string if invalid.
 */
export function validateWabaId(value: string): string | null {
  if (value.trim().length === 0) {
    return "validationWabaIdRequired";
  }
  if (!NUMERIC_PATTERN.test(value)) {
    return "validationWabaIdNumeric";
  }
  return null;
}

/**
 * Validates the access token field of the access-token form.
 *
 * Access token is optional (empty is allowed), but if provided must be at
 * least 50 characters.
 *
 * @returns `null` if valid, or a validation key string if invalid.
 */
export function validateAccessToken(value: string): string | null {
  if (value.length === 0) {
    return null;
  }
  if (value.length < ACCESS_TOKEN_MIN_LENGTH) {
    return "validationAccessTokenTooShort";
  }
  return null;
}

/**
 * Validates the two-step PIN field of the credential form.
 *
 * The PIN must be exactly 6 digits.
 *
 * @returns `null` if valid, or a validation key string if invalid.
 */
export function validateTwoStepPin(value: string): string | null {
  if (!TWO_STEP_PIN_PATTERN.test(value)) {
    return "validationPinFormat";
  }
  return null;
}

/**
 * Validates the routing purpose field of the create/edit dialogs.
 *
 * The purpose is a select from the `WhatsappAccountPurpose` enum, so this
 * guards against an empty value or a non-member value (e.g. a tampered select).
 *
 * @returns `null` if valid, or a validation key string if invalid.
 */
export function validatePurpose(value: string): string | null {
  if (value.trim().length === 0) {
    return "validationPurposeRequired";
  }
  if (!VALID_PURPOSES.has(value)) {
    return "validationPurposeInvalid";
  }
  return null;
}

/** Validation result for the create-account form. */
export interface AccountCreateFormValidationResult {
  readonly displayName: string | null;
  readonly phoneNumberId: string | null;
  readonly wabaId: string | null;
  readonly purpose: string | null;
}

/**
 * Validates all fields of the create-account form.
 *
 * @returns An object with error keys for each field, or `null` for valid fields.
 */
export function validateAccountCreateForm(values: AccountCreateFormValues): AccountCreateFormValidationResult {
  return {
    displayName: validateDisplayName(values.displayName),
    phoneNumberId: validatePhoneNumberId(values.phoneNumberId),
    wabaId: validateWabaId(values.wabaId),
    purpose: validatePurpose(values.purpose),
  };
}

/** Validation result for the access-token form. */
export interface AccessTokenFormValidationResult {
  readonly accessToken: string | null;
}

/**
 * Validates all fields of the access-token form.
 *
 * @returns An object with the error key for the access token field, or `null`.
 */
export function validateAccessTokenForm(values: AccessTokenFormValues): AccessTokenFormValidationResult {
  return {
    accessToken: validateAccessToken(values.accessToken),
  };
}

/** Validation result for the credential form (two-step PIN). */
export interface AccountCredentialFormValidationResult {
  readonly twoStepPin: string | null;
}

/**
 * Validates all fields of the credential form (two-step PIN).
 *
 * @returns An object with the error key for the two-step PIN field, or `null`.
 */
export function validateCredentialForm(values: AccountCredentialFormValues): AccountCredentialFormValidationResult {
  return {
    twoStepPin: validateTwoStepPin(values.twoStepPin),
  };
}
