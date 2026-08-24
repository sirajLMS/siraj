import { compare, hash } from "bcryptjs";
import { getServerTranslations } from "@/shared/locale";

const SALT_ROUNDS = 12;

/**
 * Validate password strength/complexity.
 * Enforces: minimum 8 characters.
 * Returns i18n-friendly error messages for each failed rule.
 */
export async function validatePasswordStrength(password: string, locale?: string): Promise<void> {
  const { auth } = getServerTranslations(locale ?? "en").errorsTranslations;

  if (password.length < 8) {
    throw new Error(auth.passwordMinLength);
  }

  // Security enhancement: enforce password complexity requirements
  if (!/[A-Z]/.test(password)) {
    throw new Error(auth.passwordRequiresUppercase);
  }

  if (!/[a-z]/.test(password)) {
    throw new Error(auth.passwordRequiresLowercase);
  }

  if (!/\d/.test(password)) {
    throw new Error(auth.passwordRequiresDigit);
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    throw new Error(auth.passwordRequiresSpecialChar);
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
