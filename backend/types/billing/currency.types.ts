import type { supportedCurrencies } from "@/backend/db/schema";
import type { CountryCode, CurrencyCode } from "@/backend/enum";

export type SupportedCurrencySelectType = typeof supportedCurrencies.$inferSelect;
export type SupportedCurrencyInsertType = typeof supportedCurrencies.$inferInsert;

export interface SupportedCurrencyReturnType {
  readonly code: CurrencyCode;
  readonly symbol: string;
  readonly countryCode: CountryCode | null;
  readonly decimals: number | null;
  readonly sortOrder: number;
  readonly isActive: boolean;
}

export interface SupportedCurrencyUpsertInput {
  readonly code: CurrencyCode;
  readonly symbol: string;
  readonly countryCode?: CountryCode | null;
  readonly decimals?: number | null;
  readonly sortOrder?: number;
  readonly isActive?: boolean;
}
