/**
 * ISO 4217 currency codes exposed via the `CurrencyCode` enum.
 *
 * The list covers:
 * - Every Arabic-speaking country (MENA + Horn of Africa + Comoros).
 * - Turkey (TRY) — a top destination for Egyptian learners.
 * - Major currencies for countries where Egyptians commonly study or
 *   learn the local language: USD, EUR, GBP, CHF, CNY, JPY, INR, CAD, AUD.
 *
 * Add new entries here, then run `bun run generate:gqlSchema && bun codegen`
 * so the codegen enum in `frontend/common/graphql/generated/gql/graphql-types.ts`
 * and the SDL block in `frontend/common/graphql/generated/schema.graphql` stay in
 * sync. The frontend currency lib (`frontend/lib/currency.ts`) and its
 * currency catalog must be updated in the same change to keep the option
 * list aligned with the enum (see `frontend/lib/currency.ts`).
 */
export enum CurrencyCode {
  /** Egyptian Pound */
  EGP = "EGP",
  /** Saudi Riyal */
  SAR = "SAR",
  /** UAE Dirham */
  AED = "AED",
  /** Kuwaiti Dinar */
  KWD = "KWD",
  /** Qatari Riyal */
  QAR = "QAR",
  /** Bahraini Dinar */
  BHD = "BHD",
  /** Omani Rial */
  OMR = "OMR",
  /** Jordanian Dinar */
  JOD = "JOD",
  /** Iraqi Dinar */
  IQD = "IQD",
  /** Yemeni Rial */
  YER = "YER",
  /** Syrian Pound */
  SYP = "SYP",
  /** Lebanese Pound */
  LBP = "LBP",
  /** Israeli Shekel (used by Palestine) */
  ILS = "ILS",
  /** Sudanese Pound */
  SDG = "SDG",
  /** Libyan Dinar */
  LYD = "LYD",
  /** Tunisian Dinar */
  TND = "TND",
  /** Algerian Dinar */
  DZD = "DZD",
  /** Moroccan Dirham */
  MAD = "MAD",
  /** Mauritanian Ouguiya */
  MRU = "MRU",
  /** Somali Shilling */
  SOS = "SOS",
  /** Djiboutian Franc */
  DJF = "DJF",
  /** Comorian Franc */
  KMF = "KMF",
  /** Turkish Lira */
  TRY = "TRY",
  /** US Dollar */
  USD = "USD",
  /** Euro */
  EUR = "EUR",
  /** Pound Sterling */
  GBP = "GBP",
  /** Swiss Franc */
  CHF = "CHF",
  /** Chinese Yuan */
  CNY = "CNY",
  /** Japanese Yen */
  JPY = "JPY",
  /** Indian Rupee */
  INR = "INR",
  /** Canadian Dollar */
  CAD = "CAD",
  /** Australian Dollar */
  AUD = "AUD",
}
