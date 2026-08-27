import { CurrencyCode } from "@/shared/constants/currency.enum";

const SHARED_CURRENCY_VALUES = new Set<string>(Object.values(CurrencyCode));

/**
 * Runtime type-guard for currency strings arriving from untyped surfaces
 * (GraphQL codegen unions, form payloads, JSON caches). Narrowing through a
 * declared predicate keeps call sites free of unsafe type assertions.
 */
export function isSharedCurrency(value: string): value is CurrencyCode {
  return SHARED_CURRENCY_VALUES.has(value);
}
