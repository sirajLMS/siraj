import { CountryCode } from "@/backend/enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { SupportedCurrencyUpsertInput } from "@/backend/types/billing/currency.types";

type CurrencyCatalogSeed = {
  readonly code: CurrencyCode;
  readonly symbol: string;
  readonly countryCode: CountryCode;
  readonly decimals?: number;
};

export const CURRENCY_CATALOG_SEEDS: readonly CurrencyCatalogSeed[] = [
  { code: CurrencyCode.EGP, symbol: "E£", countryCode: CountryCode.EG },
  { code: CurrencyCode.SAR, symbol: "ر.س", countryCode: CountryCode.SA },
  { code: CurrencyCode.AED, symbol: "د.إ", countryCode: CountryCode.AE },
  { code: CurrencyCode.KWD, symbol: "د.ك", countryCode: CountryCode.KW, decimals: 3 },
  { code: CurrencyCode.QAR, symbol: "ر.ق", countryCode: CountryCode.QA },
  { code: CurrencyCode.BHD, symbol: "د.ب", countryCode: CountryCode.BH, decimals: 3 },
  { code: CurrencyCode.OMR, symbol: "ر.ع", countryCode: CountryCode.OM, decimals: 3 },
  { code: CurrencyCode.JOD, symbol: "د.أ", countryCode: CountryCode.JO, decimals: 3 },
  { code: CurrencyCode.IQD, symbol: "ع.د", countryCode: CountryCode.IQ, decimals: 3 },
  { code: CurrencyCode.YER, symbol: "ر.ي", countryCode: CountryCode.YE },
  { code: CurrencyCode.SYP, symbol: "ل.س", countryCode: CountryCode.SY },
  { code: CurrencyCode.LBP, symbol: "ل.ل", countryCode: CountryCode.LB },
  { code: CurrencyCode.ILS, symbol: "₪", countryCode: CountryCode.PS },
  { code: CurrencyCode.SDG, symbol: "ج.س", countryCode: CountryCode.SD },
  { code: CurrencyCode.LYD, symbol: "ل.د", countryCode: CountryCode.LY, decimals: 3 },
  { code: CurrencyCode.TND, symbol: "د.ت", countryCode: CountryCode.TN, decimals: 3 },
  { code: CurrencyCode.DZD, symbol: "د.ج", countryCode: CountryCode.DZ },
  { code: CurrencyCode.MAD, symbol: "د.م.", countryCode: CountryCode.MA },
  { code: CurrencyCode.MRU, symbol: "أ.م", countryCode: CountryCode.MR },
  { code: CurrencyCode.SOS, symbol: "Sh.So.", countryCode: CountryCode.SO },
  { code: CurrencyCode.DJF, symbol: "Fdj", countryCode: CountryCode.DJ, decimals: 0 },
  { code: CurrencyCode.KMF, symbol: "CF", countryCode: CountryCode.KM, decimals: 0 },
  { code: CurrencyCode.TRY, symbol: "₺", countryCode: CountryCode.TR },
  { code: CurrencyCode.USD, symbol: "$", countryCode: CountryCode.US },
  { code: CurrencyCode.EUR, symbol: "€", countryCode: CountryCode.DE },
  { code: CurrencyCode.GBP, symbol: "£", countryCode: CountryCode.GB },
  { code: CurrencyCode.CHF, symbol: "Fr", countryCode: CountryCode.CH },
  { code: CurrencyCode.CNY, symbol: "¥", countryCode: CountryCode.CN },
  { code: CurrencyCode.JPY, symbol: "¥", countryCode: CountryCode.JP, decimals: 0 },
  { code: CurrencyCode.INR, symbol: "₹", countryCode: CountryCode.IN },
  { code: CurrencyCode.CAD, symbol: "C$", countryCode: CountryCode.CA },
  { code: CurrencyCode.AUD, symbol: "A$", countryCode: CountryCode.AU },
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
