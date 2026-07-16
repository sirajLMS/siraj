import bcrypt from "bcryptjs";
import { getServerTranslations } from "@/shared/locale";

const SALT_ROUNDS = 12;

/**
 * Validate password strength/complexity.
 * Enforces: min 8 chars, uppercase, lowercase, digit, special character.
 * Returns i18n-friendly error messages for each failed rule.
 */
export async function validatePasswordStrength(password: string, locale?: string): Promise<void> {
  const { auth } = getServerTranslations(locale ?? "en").errorsTranslations;
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push(auth.passwordMinLength);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push(auth.passwordRequiresUppercase);
  }
  if (!/[a-z]/.test(password)) {
    errors.push(auth.passwordRequiresLowercase);
  }
  if (!/\d/.test(password)) {
    errors.push(auth.passwordRequiresDigit);
  }
  if (!/[!@#$%^&*()_+\-=[\]{}|;:',.<>?/]/.test(password)) {
    errors.push(auth.passwordRequiresSpecialChar);
  }

  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }
}

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
