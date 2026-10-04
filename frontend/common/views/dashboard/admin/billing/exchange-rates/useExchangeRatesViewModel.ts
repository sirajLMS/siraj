"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { AppPermission, type CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  latestExchangeRatesQueryDocument,
  latestFxSyncRunQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useImpersonation } from "@/frontend/common/hooks/useImpersonation";
import { shouldShowFxStaleBanner } from "@/frontend/common/lib/fx-stale";
import { useUserStore } from "@/frontend/common/stores/userStore";
import {
  buildExchangeRateColumns,
  type ExchangeRateRow,
} from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesColumns";
import {
  type UseExchangeRateHistoryViewModel,
  useExchangeRateHistoryViewModel,
} from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/hooks";
import {
  buildAvailablePairs,
  mapExchangeRatesToRows,
} from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/useExchangeRatesViewModel.helpers";
import {
  useManualOverrideControls,
  useRefreshExchangeRatesMutation,
  useSnackbarFeedback,
} from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/useExchangeRatesViewModel.hooks";
import { type ExchangeRatesLabels, Translation, useAppTranslation } from "@/shared/locale";

type FeedbackFn = (message: string, severity: "success" | "error") => void;

export type ExchangeRatesSyncRun = {
  readonly finishedAt?: string | null;
  readonly startedAt?: string | null;
  readonly provider?: string | null;
  readonly pairsWritten?: number | string | null;
  readonly pairsFailed?: number | string | null;
  readonly status?: string | null;
  readonly errorMessage?: string | null;
};

type ExchangeRatesSnackbarState = {
  readonly open: boolean;
  readonly message: string;
  readonly severity: "success" | "error";
};

export interface ExchangeRatesViewModel {
  readonly labels: ExchangeRatesLabels;
  readonly rates: readonly ExchangeRateRow[];
  readonly ratesLoading: boolean;
  readonly ratesColumns: ReturnType<typeof buildExchangeRateColumns>;
  readonly availablePairs: ReadonlyArray<{ readonly from: CurrencyCode; readonly to: CurrencyCode }>;
  readonly syncRun: ExchangeRatesSyncRun | null;
  readonly syncLoading: boolean;
  readonly refreshing: boolean;
  readonly showStaleWarning: boolean;
  readonly billingActionsDisabled: boolean;
  readonly canRefresh: boolean;
  readonly canOverride: boolean;
  readonly onRefresh: () => void;
  readonly onOpenManualOverride: () => void;
  readonly manualOverrideOpen: boolean;
  readonly onCloseManualOverride: () => void;
  readonly onSuccessManualOverride: () => void;
  readonly onErrorManualOverride: (message: string) => void;
  readonly showFeedback: FeedbackFn;
  readonly snackbarState: ExchangeRatesSnackbarState;
  readonly onSnackbarClose: () => void;
  readonly ratesError?: Error | null;
  readonly syncError?: Error | null;
  readonly refetchRates: () => void;
  readonly refetchSync: () => void;
  readonly historyViewModel: UseExchangeRateHistoryViewModel;
}

export type UseExchangeRatesViewModelProps = Record<string, never>;

export function useExchangeRatesViewModel(_props: Readonly<UseExchangeRatesViewModelProps>): ExchangeRatesViewModel {
  const labels = useAppTranslation(Translation.Dashboard.BillingExchangeRates);
  const { isImpersonating } = useImpersonation();
  const billingActionsDisabled = isImpersonating;
  const hasPermission = useUserStore(state => state.hasPermission);

  const { showFeedback, snackbarState, onSnackbarClose } = useSnackbarFeedback();

  const {
    data: ratesData,
    loading: ratesLoading,
    error: ratesError,
    refetch: refetchRates,
  } = useQuery(latestExchangeRatesQueryDocument, {
    variables: { paginationArgs: null },
    fetchPolicy: "cache-and-network",
  });

  const {
    data: syncData,
    loading: syncLoading,
    error: syncError,
    refetch: refetchSync,
  } = useQuery(latestFxSyncRunQueryDocument, { fetchPolicy: "cache-and-network" });

  const { refreshMutation, refreshing } = useRefreshExchangeRatesMutation({
    labels,
    refetchRates,
    refetchSync,
    showFeedback,
  });

  const syncRun: ExchangeRatesSyncRun | null = syncData?.latestFxSyncRun ?? null;
  const rates = useMemo(() => mapExchangeRatesToRows(ratesData?.latestExchangeRates), [ratesData?.latestExchangeRates]);
  const availablePairs = useMemo(() => buildAvailablePairs(rates), [rates]);
  const columns = useMemo(() => buildExchangeRateColumns(labels.rateTable), [labels.rateTable]);
  const showStaleWarning = shouldShowFxStaleBanner(syncRun) && !refreshing;

  const historyViewModel = useExchangeRateHistoryViewModel({ availablePairs });

  const {
    manualOverrideOpen,
    onOpenManualOverride,
    onCloseManualOverride,
    onSuccessManualOverride,
    onErrorManualOverride,
  } = useManualOverrideControls({ billingActionsDisabled, showFeedback, labels, refetchRates });

  return {
    labels,
    rates,
    ratesLoading,
    ratesColumns: columns,
    availablePairs,
    syncRun,
    syncLoading,
    refreshing,
    showStaleWarning,
    billingActionsDisabled,
    canRefresh: hasPermission(AppPermission.BillingRefreshExchangeRates),
    canOverride: hasPermission(AppPermission.BillingOverrideExchangeRates),
    onRefresh: () => void refreshMutation({ variables: { force: false } }),
    onOpenManualOverride,
    manualOverrideOpen,
    onCloseManualOverride,
    onSuccessManualOverride,
    onErrorManualOverride,
    showFeedback,
    snackbarState,
    onSnackbarClose,
    ratesError: ratesError ?? null,
    syncError: syncError ?? null,
    refetchRates,
    refetchSync,
    historyViewModel,
  };
}
