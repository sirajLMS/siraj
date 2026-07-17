"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useEffect, useMemo, useState } from "react";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  latestExchangeRatesQueryDocument,
  latestFxSyncRunQueryDocument,
  refreshExchangeRatesMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useImpersonation } from "@/frontend/common/hooks/useImpersonation";
import { parseCurrencyCode } from "@/frontend/common/lib/currency";
import { shouldShowFxStaleBanner } from "@/frontend/common/lib/fx-stale";
import { logger } from "@/frontend/common/utils/logger";
import {
  buildExchangeRateColumns,
  type ExchangeRateRow,
} from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesColumns";
import type {
  ExchangeRatesSyncRun,
  ExchangeRatesViewModel,
} from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesView";
import { ExchangeRatesView } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesView";
import { type ExchangeRatesLabels, useAppTranslation } from "@/shared/locale";

type FeedbackFn = (message: string, severity: "success" | "error") => void;

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

export function ExchangeRatesContainer() {
  const t = useAppTranslation().dashboardTranslations.billing;
  const labels: ExchangeRatesLabels = t.exchangeRates;
  const { isImpersonating } = useImpersonation();
  const billingActionsDisabled = isImpersonating;

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

  const handleOpenManualOverride = () => {
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
  const availablePairs = useMemo(() => rates.map(rate => ({ from: rate.fromCurrency, to: rate.toCurrency })), [rates]);
  const columns = useMemo(() => buildExchangeRateColumns(labels.rateTable), [labels.rateTable]);
  const showStaleWarning = shouldShowFxStaleBanner(syncRun) && !refreshing;

  const viewModel: ExchangeRatesViewModel = {
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
    onRefresh: () => void refreshMutation({ variables: { force: false } }),
    onOpenManualOverride: handleOpenManualOverride,
    manualOverrideOpen,
    onCloseManualOverride: () => setManualOverrideOpen(false),
    onSuccessManualOverride: () => {
      showFeedback(labels.manualOverride.success, "success");
      void refetchRates();
    },
    onErrorManualOverride: message => showFeedback(message, "error"),
    showFeedback,
    snackbarState: { open: snackbarOpen, message: snackbarMessage, severity: snackbarSeverity },
    onSnackbarClose: () => setSnackbarOpen(false),
    ratesError: ratesError ?? null,
    syncError: syncError ?? null,
    refetchRates,
    refetchSync,
  };

  return <ExchangeRatesView {...viewModel} />;
}
