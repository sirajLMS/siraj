import { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { countryCodeToEmoji } from "@/frontend/lib/locale";

const GLOBE_EMOJI = "🌐";

/**
 * Catalog entry for a currency option.
 *
 * `code` is the codegen {@link CurrencyCode} enum value (the GraphQL wire
 * format). `symbol` is the ISO 4217 glyph used for compact display.
 * `countryCode` is a representative ISO 3166-1 alpha-2 issuer used to
 * resolve the flag emoji via the shared `countryCodeToEmoji` helper.
 */
export type CurrencyOption = {
  readonly code: CurrencyCode;
  readonly symbol: string;
  readonly countryCode: string;
  readonly flagEmoji: string;
};

/**
 * Curated currency catalog aligned with the backend `CurrencyCode` enum.
 *
 * Each entry is keyed by the codegen enum value so the list stays
 * type-checked against the GraphQL schema. Keep this list in sync with
 * `backend/enum/currency.enum.ts` whenever the enum changes.
 */
export const currencies: readonly CurrencyOption[] = [
  { code: CurrencyCode.Egp, symbol: "E£", countryCode: "EG", flagEmoji: countryCodeToEmoji("EG") },
  { code: CurrencyCode.Sar, symbol: "ر.س", countryCode: "SA", flagEmoji: countryCodeToEmoji("SA") },
  { code: CurrencyCode.Aed, symbol: "د.إ", countryCode: "AE", flagEmoji: countryCodeToEmoji("AE") },
  { code: CurrencyCode.Kwd, symbol: "د.ك", countryCode: "KW", flagEmoji: countryCodeToEmoji("KW") },
  { code: CurrencyCode.Qar, symbol: "ر.ق", countryCode: "QA", flagEmoji: countryCodeToEmoji("QA") },
  { code: CurrencyCode.Bhd, symbol: "د.ب", countryCode: "BH", flagEmoji: countryCodeToEmoji("BH") },
  { code: CurrencyCode.Omr, symbol: "ر.ع", countryCode: "OM", flagEmoji: countryCodeToEmoji("OM") },
  { code: CurrencyCode.Jod, symbol: "د.أ", countryCode: "JO", flagEmoji: countryCodeToEmoji("JO") },
  { code: CurrencyCode.Iqd, symbol: "ع.د", countryCode: "IQ", flagEmoji: countryCodeToEmoji("IQ") },
  { code: CurrencyCode.Yer, symbol: "ر.ي", countryCode: "YE", flagEmoji: countryCodeToEmoji("YE") },
  { code: CurrencyCode.Syp, symbol: "ل.س", countryCode: "SY", flagEmoji: countryCodeToEmoji("SY") },
  { code: CurrencyCode.Lbp, symbol: "ل.ل", countryCode: "LB", flagEmoji: countryCodeToEmoji("LB") },
  { code: CurrencyCode.Ils, symbol: "₪", countryCode: "PS", flagEmoji: countryCodeToEmoji("PS") },
  { code: CurrencyCode.Sdg, symbol: "ج.س", countryCode: "SD", flagEmoji: countryCodeToEmoji("SD") },
  { code: CurrencyCode.Lyd, symbol: "ل.د", countryCode: "LY", flagEmoji: countryCodeToEmoji("LY") },
  { code: CurrencyCode.Tnd, symbol: "د.ت", countryCode: "TN", flagEmoji: countryCodeToEmoji("TN") },
  { code: CurrencyCode.Dzd, symbol: "د.ج", countryCode: "DZ", flagEmoji: countryCodeToEmoji("DZ") },
  { code: CurrencyCode.Mad, symbol: "د.م.", countryCode: "MA", flagEmoji: countryCodeToEmoji("MA") },
  { code: CurrencyCode.Mru, symbol: "أ.م", countryCode: "MR", flagEmoji: countryCodeToEmoji("MR") },
  { code: CurrencyCode.Sos, symbol: "Sh.So.", countryCode: "SO", flagEmoji: countryCodeToEmoji("SO") },
  { code: CurrencyCode.Djf, symbol: "Fdj", countryCode: "DJ", flagEmoji: countryCodeToEmoji("DJ") },
  { code: CurrencyCode.Kmf, symbol: "CF", countryCode: "KM", flagEmoji: countryCodeToEmoji("KM") },
  { code: CurrencyCode.Try, symbol: "₺", countryCode: "TR", flagEmoji: countryCodeToEmoji("TR") },
  { code: CurrencyCode.Usd, symbol: "$", countryCode: "US", flagEmoji: countryCodeToEmoji("US") },
  { code: CurrencyCode.Eur, symbol: "€", countryCode: "DE", flagEmoji: countryCodeToEmoji("DE") },
  { code: CurrencyCode.Gbp, symbol: "£", countryCode: "GB", flagEmoji: countryCodeToEmoji("GB") },
  { code: CurrencyCode.Chf, symbol: "Fr", countryCode: "CH", flagEmoji: countryCodeToEmoji("CH") },
  { code: CurrencyCode.Cny, symbol: "¥", countryCode: "CN", flagEmoji: countryCodeToEmoji("CN") },
  { code: CurrencyCode.Jpy, symbol: "¥", countryCode: "JP", flagEmoji: countryCodeToEmoji("JP") },
  { code: CurrencyCode.Inr, symbol: "₹", countryCode: "IN", flagEmoji: countryCodeToEmoji("IN") },
  { code: CurrencyCode.Cad, symbol: "C$", countryCode: "CA", flagEmoji: countryCodeToEmoji("CA") },
  { code: CurrencyCode.Aud, symbol: "A$", countryCode: "AU", flagEmoji: countryCodeToEmoji("AU") },
];

/** Find a currency catalog entry by its ISO 4217 code. */
export function getCurrencyByCode(code: CurrencyCode | string): CurrencyOption | undefined {
  return currencies.find(currency => currency.code === code);
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

/** ISO 4217 minor-unit decimals; default 2 when not listed. */
export function getCurrencyDecimals(code: CurrencyCode | string): number {
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
  return currencies;
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
