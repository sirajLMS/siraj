import { z } from "zod";

/**
 * Unified password-field Zod schema (frontend).
 *
 * Consolidates the previously inconsistent password validation across the
 * codebase (login used `min(6)`, onboarding/create-user used `min(8)`) into a
 * single helper that:
 *   - accepts strings (the user requirement — no coercion surprises);
 *   - enforces the same policy as the backend `validatePasswordStrength`
 *     (`backend/lib/auth/password.ts`, M5): minimum 12 characters AND at least
 *     2 of {lowercase, uppercase, digit, symbol}.
 *
 * Usage:
 *   ```ts
 *   password: createPasswordFieldSchema({
 *     required: labels.passwordRequired,
 *     minLength: tErrors.auth.passwordMinLength,
 *     weakComplexity: tErrors.auth.passwordWeakComplexity,
 *   }),
 *   ```
 *
 * The three message strings are passed in by each caller so the schema stays
 * locale-aware (different forms source their labels from different i18n
 * namespaces — `auth.*`, `dashboard.*.onboarding.*`, `profile.*`, etc.) while
 * the validation RULES are identical everywhere.
 *
 * NOTE: this is a STRING schema (not a refined object). Callers that need a
 * `confirmPassword` equality check should add a `superRefine` on the parent
 * object; this helper only validates a single password field's strength.
 */

export interface PasswordFieldMessages {
  /** Shown when the field is empty (length 0). */
  required: string;
  /** Shown when length < 12. */
  minLength: string;
  /** Shown when fewer than 2 character classes are present. */
  weakComplexity: string;
}

/** Minimum password length — matches backend M5 policy. */
export const PASSWORD_MIN_LENGTH = 12;

/**
 * Count the character classes present in a password: lowercase, uppercase,
 * digit, symbol. The backend requires at least 2 of 4.
 */
export function countPasswordClasses(password: string): number {
  return (
    (/[a-z]/.test(password) ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/\d/.test(password) ? 1 : 0) +
    (/[^a-zA-Z0-9]/.test(password) ? 1 : 0)
  );
}

/**
 * Builds the unified password-field Zod schema. The schema accepts strings and
 * enforces: non-empty, ≥ 12 chars, ≥ 2 character classes.
 *
 * Errors are emitted in source order: required → minLength → weakComplexity.
 * Zod stops at the first failing check in a `.min(...).refine(...)` chain.
 */
export function createPasswordFieldSchema(messages: PasswordFieldMessages): z.ZodString {
  return z
    .string({ message: messages.required })
    .min(1, messages.required)
    .min(PASSWORD_MIN_LENGTH, messages.minLength)
    .refine(pwd => countPasswordClasses(pwd) >= 2, { message: messages.weakComplexity });
}

/**
 * Lenient variant for LOGIN-only flows where we do NOT want to reject existing
 * users whose passwords predate the M5 12-char policy (they must still be able
 * to log in to trigger a password reset). Enforces only non-empty + min 1.
 *
 * Use this ONLY for the login form. New-password flows (create user,
 * onboarding, change-password, reset-password) MUST use the strict
 * `createPasswordFieldSchema`.
 */
export function createLoginPasswordFieldSchema(messages: { required: string }): z.ZodString {
  return z.string({ message: messages.required }).min(1, messages.required);
}
