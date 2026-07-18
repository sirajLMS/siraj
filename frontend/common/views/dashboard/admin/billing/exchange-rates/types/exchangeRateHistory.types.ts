// NEW FOR PLAN v5: Unified Props + history-row type for the
// ExchangeRateHistorySection card-list (mobile) / data-grid (desktop) pair.
// Previously each tier declared its own *MobileProps/*DesktopProps inline
// duplicate — collapsed to a single shared type per specs.md §4.1 Class B.
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ExchangeRateRow } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesColumns";
import type { ExchangeRatesLabels } from "@/shared/locale";

export interface ExchangeRateHistoryProps {
  readonly labels: ExchangeRatesLabels;
  readonly availablePairs: ReadonlyArray<{ readonly from: CurrencyCode; readonly to: CurrencyCode }>;
}

export type ExchangeRateHistoryRow = ExchangeRateRow;

export const EXCHANGE_RATE_HISTORY_DAY_OPTIONS = [7, 30, 90] as const;

export type ExchangeRateHistoryMaxDays = (typeof EXCHANGE_RATE_HISTORY_DAY_OPTIONS)[number];
