import type { AccountStatus } from "@/backend/enum";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

export interface ManagerProfileUpdateInput {
  readonly phone?: string | null;
  readonly phoneIsSet?: boolean;
  readonly status?: AccountStatus | null;
  readonly statusIsSet?: boolean;
  readonly hourlyRate?: string | null;
  readonly hourlyRateIsSet?: boolean;
  readonly rateCurrency?: CurrencyCode | null;
  readonly rateCurrencyIsSet?: boolean;
}
