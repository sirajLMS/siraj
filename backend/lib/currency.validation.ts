/**
 * Runtime validation for CurrencyCode enum values.
 * Provides both type guards and Zod schemas for validating currency codes
 * throughout the backend.
 */

import { z } from "zod";
import { CurrencyCode } from "@/backend/enum";

/**
 * Type guard to check if a value is a valid CurrencyCode.
 * @param value The value to check
 * @returns true if the value is a valid CurrencyCode, false otherwise
 */
export function isCurrencyCode(value: unknown): value is CurrencyCode {
  if (typeof value !== "string") return false;
  return Object.values(CurrencyCode).includes(value as CurrencyCode);
}

/**
 * Zod schema for CurrencyCode validation.
 * Use this for form data, input validation, etc.
 */
export const currencyCodeSchema = z.nativeEnum(CurrencyCode);

/**
 * Safe parse function for CurrencyCode.
 * @param value The value to parse
 * @returns CurrencyCode if valid, null if invalid
 */
export function safeParseCurrencyCode(value: unknown): CurrencyCode | null {
  return isCurrencyCode(value) ? value : null;
}
