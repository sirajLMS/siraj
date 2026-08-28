import { compare, hash } from "bcryptjs";
import { getServerTranslations } from "@/shared/locale";

const SALT_ROUNDS = 12;

/**
 * Maximum password length allowed to prevent CPU-exhaustion DoS attacks
 * during bcrypt hashing operations.
 */
export const PASSWORD_MAX_LENGTH = 128;

/**
 * Validate password strength/complexity.
 * Enforces: minimum 12 characters, maximum 128 characters, AND at least 2 of
 * {lowercase, uppercase, digit, symbol}. Throws localized Error messages for each failed rule.
 */
export async function validatePasswordStrength(password: string, locale?: string): Promise<void> {
  const { auth } = getServerTranslations(locale ?? "en").errorsTranslations;

  // Security guard (DoS prevention): reject excessively long password strings
  // before passing them to CPU-intensive bcrypt hashing algorithms.
  if (password.length > PASSWORD_MAX_LENGTH) {
    throw new Error(`Password exceeds maximum allowed length of ${PASSWORD_MAX_LENGTH} characters.`);
  }

  if (password.length < 12) {
    throw new Error(auth.passwordMinLength);
  }

  // M5: require at least 2 of 4 character classes so trivially simple passwords
  // (e.g. "aaaaaaaaaaaa") are rejected even when long enough.
  const classes =
    (/[a-z]/.test(password) ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/\d/.test(password) ? 1 : 0) +
    (/[^a-zA-Z0-9]/.test(password) ? 1 : 0);
  if (classes < 2) {
    throw new Error(auth.passwordWeakComplexity);
  }
}

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return compare(plainPassword, hashedPassword);
}
