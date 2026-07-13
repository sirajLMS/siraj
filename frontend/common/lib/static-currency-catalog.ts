import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { countryCodeToEmoji } from "@/frontend/common/lib/locale";

export type CurrencyOption = {
  readonly code: CurrencyCode;
  readonly symbol: string;
  readonly countryCode: string;
  readonly flagEmoji: string;
};

/** Static fallback catalog — keep in sync with backend seed data. */
export const staticCurrencyCatalog: readonly CurrencyOption[] = [
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
