"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useEffect, useMemo, useState } from "react";
import { AppPermission, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  latestExchangeRatesQueryDocument,
  latestFxSyncRunQueryDocument,
  refreshExchangeRatesMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useImpersonation } from "@/frontend/common/hooks/useImpersonation";
import { parseCurrencyCode } from "@/frontend/common/lib/currency";
import { shouldShowFxStaleBanner } from "@/frontend/common/lib/fx-stale";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import {
  buildExchangeRateColumns,
  type ExchangeRateRow,
} from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesColumns";
import {
  type UseExchangeRateHistoryViewModel,
  useExchangeRateHistoryViewModel,
} from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/hooks";
import { type ExchangeRatesLabels, useAppTranslation } from "@/shared/locale";

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

export type ExchangeRatesSnackbarState = {
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
  // NEW FOR PLAN v5: canRefresh — surfaced from RequirePermission(BillingRefreshExchangeRates)
  // gate so the tier view can conditionally render the refresh action without a tier-side
  // permission wrapper (specs §3 N3 — RequirePermission moved to Container).
  readonly canRefresh: boolean;
  // NEW FOR PLAN v5: canOverride — surfaced from RequirePermission(BillingOverrideExchangeRates)
  // gate so the tier view can conditionally render the manual-override action without a
  // tier-side permission wrapper (specs §3 N3).
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
  // NEW FOR PLAN v5: historyViewModel — composed by the parent ViewModel so the tier
  // ExchangeRateHistorySection sub-component does not call useExchangeRateHistoryViewModel
  // itself (specs §3 N26 — tier views must receive view models as props, not call hooks).
  readonly historyViewModel: UseExchangeRateHistoryViewModel;
}

export type UseExchangeRatesViewModelProps = Record<string, never>;

function mapExchangeRatesToRows(
  rates:
    | readonly {
        readonly id?: string | null;
        readonly fromCurrency?: string | null;
        readonly toCurrency?: string | null;
        readonly rate?: string | null;
        readonly source?: string | null;
        readonly effectiveDate?: string | null;
      }[]
    | null
    | undefined
): ExchangeRateRow[] {
  return (rates ?? [])
    .filter((rate): rate is NonNullable<typeof rate> => rate != null && rate.id != null)
    .map(rate => ({
      id: rate.id ?? "",
      fromCurrency: parseCurrencyCode(rate.fromCurrency) ?? CurrencyCode.Usd,
      toCurrency: parseCurrencyCode(rate.toCurrency) ?? CurrencyCode.Sar,
      rate: rate.rate ?? "0",
      source: rate.source ?? null,
      effectiveDate: rate.effectiveDate ?? "",
    }));
}

export function useExchangeRatesViewModel(_props: Readonly<UseExchangeRatesViewModelProps>): ExchangeRatesViewModel {
  const t = useAppTranslation().dashboardTranslations.billing;
  const labels: ExchangeRatesLabels = t.exchangeRates;
  const { isImpersonating } = useImpersonation();
  const billingActionsDisabled = isImpersonating;
  // NEW FOR PLAN v5: read hasPermission from userStore so we can surface granular permission
  // flags (canRefresh / canOverride) to the tier view, removing the tier-side RequirePermission
  // wrapper (specs §3 N3 — permission gating lives in Container/ViewModel, never in tier).
  const hasPermission = useUserStore(state => state.hasPermission);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
  const [manualOverrideOpen, setManualOverrideOpen] = useState(false);

  const showFeedback: FeedbackFn = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  useEffect(() => {
    if (billingActionsDisabled) {
      setManualOverrideOpen(false);
    }
  }, [billingActionsDisabled]);

  const onOpenManualOverride = () => {
    if (!billingActionsDisabled) {
      setManualOverrideOpen(true);
    }
  };

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

  const [refreshMutation, { loading: refreshing }] = useMutation(refreshExchangeRatesMutationDocument, {
    onCompleted: result => {
      if (result.refreshExchangeRates?.success) {
        showFeedback(labels.refreshSuccess, "success");
        void refetchSync();
        void refetchRates();
      } else {
        showFeedback(result.refreshExchangeRates?.errorMessage ?? labels.refreshFailed, "error");
      }
    },
    onError: error => {
      logger.error("FX refresh failed", { error });
      showFeedback(labels.refreshFailed, "error");
    },
  });

  const syncRun: ExchangeRatesSyncRun | null = syncData?.latestFxSyncRun ?? null;
  const rates = useMemo(() => mapExchangeRatesToRows(ratesData?.latestExchangeRates), [ratesData?.latestExchangeRates]);
  const availablePairs = useMemo(
    () =>
      rates.map(rate => ({ from: rate.fromCurrency, to: rate.toCurrency })) as ReadonlyArray<{
        readonly from: CurrencyCode;
        readonly to: CurrencyCode;
      }>,
    [rates]
  );
  const columns = useMemo(() => buildExchangeRateColumns(labels.rateTable), [labels.rateTable]);
  const showStaleWarning = shouldShowFxStaleBanner(syncRun) && !refreshing;

  // NEW FOR PLAN v5: compose the history sub-view-model here so the tier
  // ExchangeRateHistorySection.{mobile,desktop}.tsx receives it as a prop
  // (specs §3 N26 — tier views must not call *ViewModel hooks directly).
  const historyViewModel = useExchangeRateHistoryViewModel({ availablePairs });

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
    // NEW FOR PLAN v5: canRefresh — surfaced from userStore.hasPermission(BillingRefreshExchangeRates)
    // so the tier can render the refresh button conditionally without RequirePermission in tier.
    canRefresh: hasPermission(AppPermission.BillingRefreshExchangeRates),
    // NEW FOR PLAN v5: canOverride — surfaced from userStore.hasPermission(BillingOverrideExchangeRates)
    // so the tier can render the manual-override button conditionally without RequirePermission in tier.
    canOverride: hasPermission(AppPermission.BillingOverrideExchangeRates),
    onRefresh: () => void refreshMutation({ variables: { force: false } }),
    onOpenManualOverride,
    manualOverrideOpen,
    onCloseManualOverride: () => setManualOverrideOpen(false),
    onSuccessManualOverride: () => {
      showFeedback(labels.manualOverride.success, "success");
      void refetchRates();
    },
    onErrorManualOverride: (message: string) => showFeedback(message, "error"),
    showFeedback,
    snackbarState: { open: snackbarOpen, message: snackbarMessage, severity: snackbarSeverity },
    onSnackbarClose: () => setSnackbarOpen(false),
    ratesError: ratesError ?? null,
    syncError: syncError ?? null,
    refetchRates,
    refetchSync,
    historyViewModel,
  };
}
