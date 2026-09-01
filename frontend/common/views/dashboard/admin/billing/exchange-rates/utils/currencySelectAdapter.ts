import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/common/lib/currency";

/**
 * Resolve a canonical {@link CurrencyOption} catalog entry from a wire
 * `CurrencyCode`. Returns null when the code is outside the curated catalog so
 * the currency picker renders empty instead of crashing.
 */
export function currencyCodeToOption(code: CurrencyCode | null | undefined): CurrencyOption | null {
  if (!code) {
    return null;
  }
  return getCurrencyByCode(code) ?? null;
}

/** Extract the wire `CurrencyCode` carried by a picker-selected {@link CurrencyOption}. */
export function currencyOptionToCode(option: CurrencyOption): CurrencyCode {
  return option.code;
}
