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

  if (password.length < 8) {
    throw new Error(auth.passwordMinLength);
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
