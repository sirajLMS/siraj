"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Box, Button, CircularProgress, Snackbar, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import {
  PageContainer,
  PageHeader,
  PrimaryPageAction,
  SectionPanel,
  StatusBadge,
} from "@/frontend/common/components/ui";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { AppPermission, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  latestExchangeRatesQueryDocument,
  latestFxSyncRunQueryDocument,
  refreshExchangeRatesMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useImpersonation } from "@/frontend/common/hooks/useImpersonation";
import { parseCurrencyCode } from "@/frontend/common/lib/currency";
import { shouldShowFxStaleBanner } from "@/frontend/common/lib/fx-stale";
import { logger } from "@/frontend/common/utils/logger";
import { ExchangeRateHistorySection } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/ExchangeRateHistorySection";
import {
  buildExchangeRateColumns,
  type ExchangeRateRow,
  formatExchangeRateTimestamp,
} from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesColumns";
import { ManualOverrideDialog } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/ManualOverrideDialog";
import { ProviderSettingsSection } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/ProviderSettingsSection";
import { BillingImpersonationNotice } from "@/frontend/common/views/dashboard/billing/components/BillingImpersonationNotice";
import { useAppTranslation } from "@/shared/locale/client";
import type { ExchangeRatesLabels } from "@/shared/locale/types/dashboard/billing/exchangeRates";

type SyncRun = {
  readonly finishedAt?: string | null;
  readonly startedAt?: string | null;
  readonly provider?: string | null;
  readonly pairsWritten?: number | string | null;
  readonly pairsFailed?: number | string | null;
  readonly status?: string | null;
  readonly errorMessage?: string | null;
};

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

type FeedbackFn = (message: string, severity: "success" | "error") => void;

type SnackbarState = {
  readonly open: boolean;
  readonly message: string;
  readonly severity: "success" | "error";
};

function ExchangeRatesSnackbar({ state, onClose }: Readonly<{ state: SnackbarState; onClose: () => void }>) {
  return (
    <Snackbar
      open={state.open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert severity={state.severity} onClose={onClose} variant="filled">
        {state.message}
      </Alert>
    </Snackbar>
  );
}

function ExchangeRatesViewContent({
  labels,
  rates,
  ratesLoading,
  ratesColumns,
  availablePairs,
  syncRun,
  syncLoading,
  refreshing,
  showStaleWarning,
  billingActionsDisabled,
  onRefresh,
  onOpenManualOverride,
  manualOverrideOpen,
  onCloseManualOverride,
  onSuccessManualOverride,
  onErrorManualOverride,
  showFeedback,
  snackbarState,
  onSnackbarClose,
  ratesError,
  syncError,
  refetchRates,
  refetchSync,
}: Readonly<{
  labels: ExchangeRatesLabels;
  rates: ExchangeRateRow[];
  ratesLoading: boolean;
  ratesColumns: GridColDef<ExchangeRateRow>[];
  availablePairs: { from: CurrencyCode; to: CurrencyCode }[];
  syncRun: SyncRun | null;
  syncLoading: boolean;
  refreshing: boolean;
  showStaleWarning: boolean;
  billingActionsDisabled: boolean;
  onRefresh: () => void;
  onOpenManualOverride: () => void;
  manualOverrideOpen: boolean;
  onCloseManualOverride: () => void;
  onSuccessManualOverride: () => void;
  onErrorManualOverride: (message: string) => void;
  showFeedback: FeedbackFn;
  snackbarState: SnackbarState;
  onSnackbarClose: () => void;
  ratesError?: Error | null;
  syncError?: Error | null;
  refetchRates: () => void;
  refetchSync: () => void;
}>) {
  return (
    <PageContainer>
      <BillingImpersonationNotice />
      <PageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        actions={
          <RequirePermission permissions={AppPermission.BillingRefreshExchangeRates}>
            <PrimaryPageAction onClick={onRefresh} disabled={refreshing || billingActionsDisabled}>
              {refreshing ? labels.refreshing : labels.syncStatus.refresh}
            </PrimaryPageAction>
          </RequirePermission>
        }
      />

      <RequirePermission permissions={AppPermission.BillingViewExchangeRates}>
        {ratesError ? (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => void refetchRates()}>
                {labels.errors.retry}
              </Button>
            }
          >
            {labels.errors.loadFailed}
          </Alert>
        ) : null}
        {syncError ? (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => void refetchSync()}>
                {labels.errors.retry}
              </Button>
            }
          >
            {labels.errors.loadFailed}
          </Alert>
        ) : null}
        {showStaleWarning ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {labels.staleWarning}
          </Alert>
        ) : null}

        <SectionPanel title={labels.syncStatus.title}>
          <ExchangeRatesSyncPanel syncRun={syncRun} syncLoading={syncLoading} labels={labels} />
        </SectionPanel>

        <ProviderSettingsSection
          labels={labels.providerSettings}
          onFeedback={showFeedback}
          actionsDisabled={billingActionsDisabled}
        />

        <SectionPanel title={labels.rateTable.title}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <RequirePermission permissions={AppPermission.BillingOverrideExchangeRates}>
              <Button variant="outlined" onClick={onOpenManualOverride} disabled={billingActionsDisabled}>
                {labels.manualOverride.title}
              </Button>
            </RequirePermission>
          </Box>
          <AppDataGrid
            rows={rates}
            columns={ratesColumns}
            loading={ratesLoading}
            emptyMessage={labels.noRates}
            autoHeight
            disableColumnMenu
          />
        </SectionPanel>

        <SectionPanel title={labels.history.title}>
          <ExchangeRateHistorySection labels={labels} availablePairs={availablePairs} />
        </SectionPanel>
      </RequirePermission>

      <ManualOverrideDialog
        open={manualOverrideOpen && !billingActionsDisabled}
        labels={labels.manualOverride}
        onClose={onCloseManualOverride}
        onSuccess={onSuccessManualOverride}
        onError={onErrorManualOverride}
      />

      <ExchangeRatesSnackbar state={snackbarState} onClose={onSnackbarClose} />
    </PageContainer>
  );
}

function SyncStatusBadge({
  status,
  labels,
}: {
  readonly status: string | null | undefined;
  readonly labels: ExchangeRatesLabels["syncStatus"];
}) {
  const normalized = (status ?? "unknown").toLowerCase();
  const statusLabels: Record<string, string> = {
    success: labels.statusSuccess,
    running: labels.statusRunning,
    partial: labels.statusPartial,
    failed: labels.statusFailed,
    unknown: labels.statusUnknown,
  };

  return (
    <StatusBadge
      category="syncStatus"
      status={normalized}
      label={statusLabels[normalized] ?? labels.statusUnknown}
      size="small"
    />
  );
}

function ExchangeRatesSyncPanel({
  syncRun,
  syncLoading,
  labels,
}: Readonly<{
  syncRun: SyncRun | null;
  syncLoading: boolean;
  labels: ExchangeRatesLabels;
}>) {
  if (syncLoading) {
    return <CircularProgress size={24} />;
  }

  if (!syncRun) {
    return (
      <Typography variant="bodyMd" color="textSecondary">
        {labels.noSyncRuns}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
      <Box>
        <Typography variant="bodyMd" color="textSecondary">
          {labels.syncStatus.lastSync}
        </Typography>
        <Typography variant="bodyMd">{formatExchangeRateTimestamp(syncRun.finishedAt ?? syncRun.startedAt)}</Typography>
      </Box>
      <Box>
        <Typography variant="bodyMd" color="textSecondary">
          {labels.syncStatus.provider}
        </Typography>
        <Typography variant="bodyMd">{syncRun.provider}</Typography>
      </Box>
      <Box>
        <Typography variant="bodyMd" color="textSecondary">
          {labels.syncStatus.pairsWritten}
        </Typography>
        <Typography variant="bodyMd">{syncRun.pairsWritten}</Typography>
      </Box>
      <Box>
        <Typography variant="bodyMd" color="textSecondary">
          {labels.syncStatus.pairsFailed}
        </Typography>
        <Typography variant="bodyMd">{syncRun.pairsFailed}</Typography>
      </Box>
      <Box sx={{ gridColumn: { sm: "span 2" } }}>
        <Typography variant="bodyMd" color="textSecondary">
          {labels.status}
        </Typography>
        <SyncStatusBadge status={syncRun.status} labels={labels.syncStatus} />
      </Box>
      {syncRun.errorMessage ? (
        <Box sx={{ gridColumn: { sm: "span 2" } }}>
          <Typography variant="bodyMd" color="error">
            {labels.syncStatus.errorMessage}
          </Typography>
          <Typography variant="bodyMd" color="error">
            {syncRun.errorMessage}
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}

export function ExchangeRatesContainer() {
  const t = useAppTranslation("dashboard.billing");
  const labels = t.exchangeRates;
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

  const syncRun: SyncRun | null = syncData?.latestFxSyncRun ?? null;
  const rates = useMemo(() => mapExchangeRatesToRows(ratesData?.latestExchangeRates), [ratesData?.latestExchangeRates]);
  const availablePairs = useMemo(() => rates.map(rate => ({ from: rate.fromCurrency, to: rate.toCurrency })), [rates]);
  const columns = useMemo(() => buildExchangeRateColumns(labels.rateTable), [labels.rateTable]);
  const showStaleWarning = shouldShowFxStaleBanner(syncRun) && !refreshing;

  return (
    <ExchangeRatesViewContent
      labels={labels}
      rates={rates}
      ratesLoading={ratesLoading}
      ratesColumns={columns}
      availablePairs={availablePairs}
      syncRun={syncRun}
      syncLoading={syncLoading}
      refreshing={refreshing}
      showStaleWarning={showStaleWarning}
      billingActionsDisabled={billingActionsDisabled}
      onRefresh={() => void refreshMutation({ variables: { force: false } })}
      onOpenManualOverride={handleOpenManualOverride}
      manualOverrideOpen={manualOverrideOpen}
      onCloseManualOverride={() => setManualOverrideOpen(false)}
      onSuccessManualOverride={() => {
        showFeedback(labels.manualOverride.success, "success");
        void refetchRates();
      }}
      onErrorManualOverride={message => showFeedback(message, "error")}
      showFeedback={showFeedback}
      snackbarState={{ open: snackbarOpen, message: snackbarMessage, severity: snackbarSeverity }}
      onSnackbarClose={() => setSnackbarOpen(false)}
      ratesError={ratesError}
      syncError={syncError}
      refetchRates={refetchRates}
      refetchSync={refetchSync}
    />
  );
}
