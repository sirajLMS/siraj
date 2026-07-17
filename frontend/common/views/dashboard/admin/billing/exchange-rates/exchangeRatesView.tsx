"use client";

import type { GridColDef } from "@mui/x-data-grid";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ExchangeRateRow } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesColumns";
import type { ExchangeRatesLabels } from "@/shared/locale";

export type ExchangeRatesSyncRun = {
  readonly finishedAt?: string | null;
  readonly startedAt?: string | null;
  readonly provider?: string | null;
  readonly pairsWritten?: number | string | null;
  readonly pairsFailed?: number | string | null;
  readonly status?: string | null;
  readonly errorMessage?: string | null;
};

export type ExchangeRatesSnackbarState = {
  readonly open: boolean;
  readonly message: string;
  readonly severity: "success" | "error";
};

export interface ExchangeRatesViewModel {
  readonly labels: ExchangeRatesLabels;
  readonly rates: readonly ExchangeRateRow[];
  readonly ratesLoading: boolean;
  readonly ratesColumns: readonly GridColDef<ExchangeRateRow>[];
  readonly availablePairs: ReadonlyArray<{ readonly from: CurrencyCode; readonly to: CurrencyCode }>;
  readonly syncRun: ExchangeRatesSyncRun | null;
  readonly syncLoading: boolean;
  readonly refreshing: boolean;
  readonly showStaleWarning: boolean;
  readonly billingActionsDisabled: boolean;
  readonly onRefresh: () => void;
  readonly onOpenManualOverride: () => void;
  readonly manualOverrideOpen: boolean;
  readonly onCloseManualOverride: () => void;
  readonly onSuccessManualOverride: () => void;
  readonly onErrorManualOverride: (message: string) => void;
  readonly showFeedback: (message: string, severity: "success" | "error") => void;
  readonly snackbarState: ExchangeRatesSnackbarState;
  readonly onSnackbarClose: () => void;
  readonly ratesError?: Error | null;
  readonly syncError?: Error | null;
  readonly refetchRates: () => void;
  readonly refetchSync: () => void;
}

const lazyViews = createLazyView<ExchangeRatesViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/admin/billing/exchange-rates/exchangeRates.mobile").then(m => ({
      default: m.ExchangeRatesMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/admin/billing/exchange-rates/exchangeRates.desktop").then(m => ({
      default: m.ExchangeRatesDesktopView,
    }))
);

export function ExchangeRatesView(props: Readonly<ExchangeRatesViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
