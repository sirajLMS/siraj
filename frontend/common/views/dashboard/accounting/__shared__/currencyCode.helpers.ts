import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";

const VALID_CURRENCY_CODES = new Set<string>(Object.values(CurrencyCode));

function isCurrencyCodeValue(value: string): value is CurrencyCode {
  return VALID_CURRENCY_CODES.has(value);
}

/** Resolves a raw wire string to its matching CurrencyCode member (undefined when unknown). */
export function asCurrencyCode(value: string | null): CurrencyCode | undefined {
  return value !== null && isCurrencyCodeValue(value) ? value : undefined;
}
