import type { supportedCurrencies } from "@/backend/db/schema";
import type { CountryCode } from "@/backend/enum";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

export type SupportedCurrencySelectType = typeof supportedCurrencies.$inferSelect;

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
  readonly isActive?: boolean | null;
}
