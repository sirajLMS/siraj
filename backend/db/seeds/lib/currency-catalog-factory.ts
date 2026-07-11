import { CurrencyCode } from "@/backend/enum";
import type { CountryCode } from "@/backend/enum";
import type { SupportedCurrencyUpsertInput } from "@/backend/types/billing/currency.types";

type CurrencyCatalogSeed = {
  readonly code: CurrencyCode;
  readonly symbol: string;
  readonly countryCode: CountryCode;
  readonly decimals?: number;
};

export const CURRENCY_CATALOG_SEEDS: readonly CurrencyCatalogSeed[] = [
  { code: CurrencyCode.EGP, symbol: "E£", countryCode: "EG" as CountryCode },
  { code: CurrencyCode.SAR, symbol: "ر.س", countryCode: "SA" as CountryCode },
  { code: CurrencyCode.AED, symbol: "د.إ", countryCode: "AE" as CountryCode },
  { code: CurrencyCode.KWD, symbol: "د.ك", countryCode: "KW" as CountryCode, decimals: 3 },
  { code: CurrencyCode.QAR, symbol: "ر.ق", countryCode: "QA" as CountryCode },
  { code: CurrencyCode.BHD, symbol: "د.ب", countryCode: "BH" as CountryCode, decimals: 3 },
  { code: CurrencyCode.OMR, symbol: "ر.ع", countryCode: "OM" as CountryCode, decimals: 3 },
  { code: CurrencyCode.JOD, symbol: "د.أ", countryCode: "JO" as CountryCode, decimals: 3 },
  { code: CurrencyCode.IQD, symbol: "ع.د", countryCode: "IQ" as CountryCode, decimals: 3 },
  { code: CurrencyCode.YER, symbol: "ر.ي", countryCode: "YE" as CountryCode },
  { code: CurrencyCode.SYP, symbol: "ل.س", countryCode: "SY" as CountryCode },
  { code: CurrencyCode.LBP, symbol: "ل.ل", countryCode: "LB" as CountryCode },
  { code: CurrencyCode.ILS, symbol: "₪", countryCode: "PS" as CountryCode },
  { code: CurrencyCode.SDG, symbol: "ج.س", countryCode: "SD" as CountryCode },
  { code: CurrencyCode.LYD, symbol: "ل.د", countryCode: "LY" as CountryCode, decimals: 3 },
  { code: CurrencyCode.TND, symbol: "د.ت", countryCode: "TN" as CountryCode, decimals: 3 },
  { code: CurrencyCode.DZD, symbol: "د.ج", countryCode: "DZ" as CountryCode },
  { code: CurrencyCode.MAD, symbol: "د.م.", countryCode: "MA" as CountryCode },
  { code: CurrencyCode.MRU, symbol: "أ.م", countryCode: "MR" as CountryCode },
  { code: CurrencyCode.SOS, symbol: "Sh.So.", countryCode: "SO" as CountryCode },
  { code: CurrencyCode.DJF, symbol: "Fdj", countryCode: "DJ" as CountryCode, decimals: 0 },
  { code: CurrencyCode.KMF, symbol: "CF", countryCode: "KM" as CountryCode, decimals: 0 },
  { code: CurrencyCode.TRY, symbol: "₺", countryCode: "TR" as CountryCode },
  { code: CurrencyCode.USD, symbol: "$", countryCode: "US" as CountryCode },
  { code: CurrencyCode.EUR, symbol: "€", countryCode: "DE" as CountryCode },
  { code: CurrencyCode.GBP, symbol: "£", countryCode: "GB" as CountryCode },
  { code: CurrencyCode.CHF, symbol: "Fr", countryCode: "CH" as CountryCode },
  { code: CurrencyCode.CNY, symbol: "¥", countryCode: "CN" as CountryCode },
  { code: CurrencyCode.JPY, symbol: "¥", countryCode: "JP" as CountryCode, decimals: 0 },
  { code: CurrencyCode.INR, symbol: "₹", countryCode: "IN" as CountryCode },
  { code: CurrencyCode.CAD, symbol: "C$", countryCode: "CA" as CountryCode },
  { code: CurrencyCode.AUD, symbol: "A$", countryCode: "AU" as CountryCode },
];

export function toSupportedCurrencyUpsertInputs(): SupportedCurrencyUpsertInput[] {
  return CURRENCY_CATALOG_SEEDS.map((seed, index) => ({
    code: seed.code,
    symbol: seed.symbol,
    countryCode: seed.countryCode,
    decimals: seed.decimals ?? null,
    sortOrder: index,
    isActive: true,
  }));
}
