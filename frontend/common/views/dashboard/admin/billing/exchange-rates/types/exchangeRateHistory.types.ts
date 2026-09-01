// NEW FOR PLAN v5: Unified Props + history-row type for the
// ExchangeRateHistorySection card-list (mobile) / data-grid (desktop) pair.
// Previously each tier declared its own *MobileProps/*DesktopProps inline
// duplicate — collapsed to a single shared type per specs.md §4.1 Class B.

import type { UseExchangeRateHistoryViewModel } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/hooks";
import type { ExchangeRatesLabels } from "@/shared/locale";

// NEW FOR PLAN v5: the tier section receives its ViewModel from the parent as a prop
// (specs §3 N26 + §6.1 — tier views get the view model passed down, never call the hook).
export interface ExchangeRateHistoryProps {
  readonly labels: ExchangeRatesLabels;
  readonly historyViewModel: UseExchangeRateHistoryViewModel;
}

export const EXCHANGE_RATE_HISTORY_DAY_OPTIONS = [7, 30, 90] as const;

export type ExchangeRateHistoryMaxDays = (typeof EXCHANGE_RATE_HISTORY_DAY_OPTIONS)[number];
