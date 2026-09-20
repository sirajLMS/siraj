/**
 * Runtime validation for CurrencyCode enum values.
 * Provides both type guards and Zod schemas for validating currency codes
 * throughout the backend.
 */

import { CurrencyCode } from "@/shared/constants/currency.enum";

/** Pre-built Set for O(1) CurrencyCode enum validation avoiding Object.values allocations. */
const CURRENCY_CODE_VALUES = new Set<string>(Object.values(CurrencyCode));

/**
 * Type guard to check if a value is a valid CurrencyCode.
 * @param value The value to check
 * @returns true if the value is a valid CurrencyCode, false otherwise
 */
function isCurrencyCode(value: unknown): value is CurrencyCode {
  if (typeof value !== "string") return false;
  return CURRENCY_CODE_VALUES.has(value);
}

/**
 * Safe parse function for CurrencyCode.
 * @param value The value to parse
 * @returns CurrencyCode if valid, null if invalid
 */
export function safeParseCurrencyCode(value: unknown): CurrencyCode | null {
  return isCurrencyCode(value) ? value : null;
}
