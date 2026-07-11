import { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { type CurrencyOption, staticCurrencyCatalog } from "@/frontend/lib/static-currency-catalog";
import { useCurrencyStore } from "@/frontend/stores/currencyStore";

const GLOBE_EMOJI = "🌐";

export type { CurrencyOption };

/**
 * Curated currency catalog aligned with the backend `CurrencyCode` enum.
 *
 * Each entry is keyed by the codegen enum value so the list stays
 * type-checked against the GraphQL schema. Keep this list in sync with
 * `backend/enum/currency.enum.ts` whenever the enum changes.
 */
export const currencies: readonly CurrencyOption[] = staticCurrencyCatalog;

/** Find a currency catalog entry by its ISO 4217 code. */
export function getCurrencyByCode(code: CurrencyCode | string): CurrencyOption | undefined {
  const catalog = useCurrencyStore.getState().options;
  return (
    catalog.find(currency => currency.code === code) ?? staticCurrencyCatalog.find(currency => currency.code === code)
  );
}

/** Resolve the flag emoji for a currency, falling back to a globe. */
export function getCurrencyFlag(code: CurrencyCode | string): string {
  return getCurrencyByCode(code)?.flagEmoji ?? GLOBE_EMOJI;
}

/** Resolve the symbol glyph for a currency, falling back to the code itself. */
export function getCurrencySymbol(code: CurrencyCode | string): string {
  return getCurrencyByCode(code)?.symbol ?? (code as string);
}

/** ISO 4217 minor-unit decimals for currencies that differ from the default (2). */
const CURRENCY_DECIMALS: Partial<Record<CurrencyCode, number>> = {
  [CurrencyCode.Jpy]: 0,
  [CurrencyCode.Djf]: 0,
  [CurrencyCode.Kmf]: 0,
  [CurrencyCode.Kwd]: 3,
  [CurrencyCode.Bhd]: 3,
  [CurrencyCode.Omr]: 3,
  [CurrencyCode.Jod]: 3,
  [CurrencyCode.Iqd]: 3,
  [CurrencyCode.Lyd]: 3,
  [CurrencyCode.Tnd]: 3,
};

function isCurrencyCode(code: string): code is CurrencyCode {
  return (Object.values(CurrencyCode) as readonly string[]).includes(code);
}

export function parseCurrencyCode(value: string | null | undefined): CurrencyCode | null {
  if (value === null || value === undefined) {
    return null;
  }
  return isCurrencyCode(value) ? value : null;
}

/** ISO 4217 minor-unit decimals; default 2 when not listed. */
export function getCurrencyDecimals(code: CurrencyCode | string): number {
  if (!isCurrencyCode(code)) {
    return 2;
  }
  return CURRENCY_DECIMALS[code] ?? 2;
}

export function formatLockedAmount(amount: string, currency: CurrencyCode, locale = "en"): string {
  const decimals = getCurrencyDecimals(currency);
  const numeric = Number.parseFloat(amount);
  if (!Number.isFinite(numeric)) {
    return amount;
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numeric);
}

/**
 * Resolve a localized currency display name via `Intl.DisplayNames`.
 *
 * Falls back to the raw ISO 4217 code when the runtime does not support
 * currency display names or the code is unknown — matches the
 * `getCountryDisplayName` fallback pattern in `frontend/lib/locale/country`.
 */
export function getCurrencyDisplayName(code: CurrencyCode | string, locale?: string): string {
  try {
    const displayNames = new Intl.DisplayNames([locale ?? "en"], { type: "currency" });
    return displayNames.of(code as string) ?? (code as string);
  } catch {
    return code as string;
  }
}

/**
 * Build the full option list for the currency Autocomplete.
 *
 * The order mirrors the catalog definition (Arabic world first, then
 * major international currencies) rather than sorting alphabetically —
 * kept stable so the picker's preferred entries stay at the top.
 */
export function getCurrencyOptions(): readonly CurrencyOption[] {
  return useCurrencyStore.getState().options;
}

/**
 * Build the label shown inside the Autocomplete input for a selected
 * currency: `"<localized name> (<ISO code>)"`. Mirrors the
 * `getCountryOptionLabel` pattern from `CountryOptionRow`.
 */
export function getCurrencyOptionLabel(code: CurrencyCode | string, locale?: string): string {
  const name = getCurrencyDisplayName(code, locale);
  return `${name} (${code as string})`;
}
