"use client";

import { Alert, Box, Button, CircularProgress, Snackbar, Typography } from "@mui/material";
import { formatExchangeRateTimestamp } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesColumns";
import { ManualOverrideDialog } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/ManualOverrideDialog";
import { ProviderSettingsSection } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/ProviderSettingsSection";
import type {
  ExchangeRatesSnackbarState,
  ExchangeRatesSyncRun,
  ExchangeRatesViewModel,
} from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/useExchangeRatesViewModel";
import { BillingImpersonationNotice } from "@/frontend/common/views/dashboard/billing/components/BillingImpersonationNotice";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
  MobileStatusBadge,
} from "@/frontend/mobile/components/ui";
import { ExchangeRateHistorySectionMobile } from "@/frontend/mobile/views/dashboard/admin/billing/exchange-rates/components/exchangeRateHistorySection.mobile";

function SyncStatusLabel({
  status,
  statusLabels,
}: {
  readonly status: string | null | undefined;
  readonly statusLabels: ExchangeRatesViewModel["labels"]["syncStatus"];
}) {
  const normalized = (status ?? "unknown").toLowerCase();
  const statusLabelsMap: Record<string, string> = {
    success: statusLabels.statusSuccess,
    running: statusLabels.statusRunning,
    partial: statusLabels.statusPartial,
    failed: statusLabels.statusFailed,
    unknown: statusLabels.statusUnknown,
  };

  return (
    <MobileStatusBadge
      category="syncStatus"
      status={normalized}
      label={statusLabelsMap[normalized] ?? statusLabels.statusUnknown}
      size="small"
    />
  );
}

function MobileSyncPanel({
  syncRun,
  syncLoading,
  labels,
}: Readonly<{
  readonly syncRun: ExchangeRatesSyncRun | null;
  readonly syncLoading: boolean;
  readonly labels: ExchangeRatesViewModel["labels"];
}>) {
  if (syncLoading) {
    return <CircularProgress size={24} />;
  }

  if (!syncRun) {
    return (
      <Typography sx={theme => ({ color: theme.palette.text.secondary })} variant="bodyMd">
        {labels.noSyncRuns}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
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
      <Box>
        <Typography variant="bodyMd" color="textSecondary">
          {labels.status}
        </Typography>
        <SyncStatusLabel status={syncRun.status} statusLabels={labels.syncStatus} />
      </Box>
      {syncRun.errorMessage ? (
        <Box>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.error.main })}>
            {labels.syncStatus.errorMessage}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.error.main })}>
            {syncRun.errorMessage}
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}

function MobileSnackbar({
  state,
  onClose,
}: Readonly<{ readonly state: ExchangeRatesSnackbarState; readonly onClose: () => void }>) {
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

type ExchangeRatesRateRow = ExchangeRatesViewModel["rates"][number];

function MobileRateRow({ row }: Readonly<{ readonly row: ExchangeRatesRateRow }>) {
  return (
    <MobileCardListItem variant="edge-to-edge">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography sx={{ fontWeight: 700 }}>
            {row.fromCurrency} → {row.toCurrency}
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>{row.rate}</Typography>
        </Box>
        <Typography variant="bodyMd" color="textSecondary">
          {row.source ?? "—"}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {formatExchangeRateTimestamp(row.effectiveDate)}
        </Typography>
      </Box>
    </MobileCardListItem>
  );
}

function MobileRatesList({
  labels,
  rates,
  ratesLoading,
}: Readonly<{
  readonly labels: ExchangeRatesViewModel["labels"];
  readonly rates: ExchangeRatesViewModel["rates"];
  readonly ratesLoading: boolean;
}>) {
  if (ratesLoading && rates.length === 0) {
    return <Typography sx={theme => ({ color: theme.palette.text.secondary, py: 2 })}>{labels.noRates}</Typography>;
  }
  return (
    <MobileCardList
      rows={rates}
      loading={ratesLoading}
      emptyMessage={labels.noRates}
      getKey={row => row.id}
      paginationOptions={{ mode: "client" }}
      layout="edge-to-edge"
      renderItem={row => <MobileRateRow row={row} />}
    />
  );
}

function MobileRateTablePanel({
  labels,
  rates,
  ratesLoading,
  canOverride,
  onOpenManualOverride,
  billingActionsDisabled,
}: Readonly<{
  readonly labels: ExchangeRatesViewModel["labels"];
  readonly rates: ExchangeRatesViewModel["rates"];
  readonly ratesLoading: boolean;
  readonly canOverride: boolean;
  readonly onOpenManualOverride: () => void;
  readonly billingActionsDisabled: boolean;
}>) {
  return (
    <MobileSectionPanel title={labels.rateTable.title}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        {canOverride ? (
          <Button variant="outlined" onClick={onOpenManualOverride} disabled={billingActionsDisabled}>
            {labels.manualOverride.title}
          </Button>
        ) : null}
      </Box>
      <MobileRatesList labels={labels} rates={rates} ratesLoading={ratesLoading} />
    </MobileSectionPanel>
  );
}

function MobileLoadFailedAlert({
  labels,
  onRetry,
}: Readonly<{ readonly labels: ExchangeRatesViewModel["labels"]; readonly onRetry: () => void }>) {
  return (
    <Alert
      severity="warning"
      sx={{ mb: 2 }}
      action={
        <Button color="inherit" size="small" onClick={() => void onRetry()}>
          {labels.errors.retry}
        </Button>
      }
    >
      {labels.errors.loadFailed}
    </Alert>
  );
}

function MobileExchangeRatesAlerts({
  labels,
  showStaleWarning,
  ratesError,
  syncError,
  refetchRates,
  refetchSync,
}: Readonly<{
  readonly labels: ExchangeRatesViewModel["labels"];
  readonly showStaleWarning: boolean;
  readonly ratesError: Error | null | undefined;
  readonly syncError: Error | null | undefined;
  readonly refetchRates: () => void;
  readonly refetchSync: () => void;
}>) {
  return (
    <>
      {ratesError ? <MobileLoadFailedAlert labels={labels} onRetry={refetchRates} /> : null}
      {syncError ? <MobileLoadFailedAlert labels={labels} onRetry={refetchSync} /> : null}
      {showStaleWarning ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {labels.staleWarning}
        </Alert>
      ) : null}
    </>
  );
}

interface MobileExchangeRatesContentProps {
  readonly labels: ExchangeRatesViewModel["labels"];
  readonly rates: ExchangeRatesViewModel["rates"];
  readonly ratesLoading: boolean;
  readonly syncRun: ExchangeRatesSyncRun | null;
  readonly syncLoading: boolean;
  readonly showStaleWarning: boolean;
  readonly billingActionsDisabled: boolean;
  readonly canOverride: boolean;
  readonly onOpenManualOverride: () => void;
  readonly ratesError: Error | null | undefined;
  readonly syncError: Error | null | undefined;
  readonly refetchRates: () => void;
  readonly refetchSync: () => void;
  readonly historyViewModel: ExchangeRatesViewModel["historyViewModel"];
}

function MobileExchangeRatesContent({
  labels,
  rates,
  ratesLoading,
  syncRun,
  syncLoading,
  showStaleWarning,
  billingActionsDisabled,
  canOverride,
  onOpenManualOverride,
  ratesError,
  syncError,
  refetchRates,
  refetchSync,
  historyViewModel,
}: Readonly<MobileExchangeRatesContentProps>) {
  return (
    <>
      <MobileExchangeRatesAlerts
        labels={labels}
        showStaleWarning={showStaleWarning}
        ratesError={ratesError}
        syncError={syncError}
        refetchRates={refetchRates}
        refetchSync={refetchSync}
      />

      <MobileSectionPanel title={labels.syncStatus.title}>
        <MobileSyncPanel syncRun={syncRun} syncLoading={syncLoading} labels={labels} />
      </MobileSectionPanel>

      <ProviderSettingsSection
        labels={labels.providerSettings}
        onFeedback={(_message, _severity) => undefined}
        actionsDisabled={billingActionsDisabled}
      />

      <MobileRateTablePanel
        labels={labels}
        rates={rates}
        ratesLoading={ratesLoading}
        canOverride={canOverride}
        onOpenManualOverride={onOpenManualOverride}
        billingActionsDisabled={billingActionsDisabled}
      />

      <MobileSectionPanel title={labels.history.title}>
        <ExchangeRateHistorySectionMobile labels={labels} historyViewModel={historyViewModel} />
      </MobileSectionPanel>
    </>
  );
}

export function ExchangeRatesMobileView({
  labels,
  rates,
  ratesLoading,
  availablePairs: _availablePairs,
  syncRun,
  syncLoading,
  refreshing,
  showStaleWarning,
  billingActionsDisabled,
  canRefresh,
  canOverride,
  onRefresh,
  onOpenManualOverride,
  manualOverrideOpen,
  onCloseManualOverride,
  onSuccessManualOverride,
  onErrorManualOverride,
  snackbarState,
  onSnackbarClose,
  ratesError,
  syncError,
  refetchRates,
  refetchSync,
  historyViewModel,
}: Readonly<ExchangeRatesViewModel>) {
  return (
    <MobilePageContainer>
      <BillingImpersonationNotice />
      <MobilePageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        edgeToEdge={false}
        actions={
          canRefresh ? (
            <Button variant="contained" onClick={onRefresh} disabled={refreshing || billingActionsDisabled}>
              {refreshing ? labels.refreshing : labels.syncStatus.refresh}
            </Button>
          ) : null
        }
      />
      <MobileContentStack gap={3} paddingBottom={4}>
        <MobileExchangeRatesContent
          labels={labels}
          rates={rates}
          ratesLoading={ratesLoading}
          syncRun={syncRun}
          syncLoading={syncLoading}
          showStaleWarning={showStaleWarning}
          billingActionsDisabled={billingActionsDisabled}
          canOverride={canOverride}
          onOpenManualOverride={onOpenManualOverride}
          ratesError={ratesError}
          syncError={syncError}
          refetchRates={refetchRates}
          refetchSync={refetchSync}
          historyViewModel={historyViewModel}
        />

        <ManualOverrideDialog
          open={manualOverrideOpen && !billingActionsDisabled}
          labels={labels.manualOverride}
          onClose={onCloseManualOverride}
          onSuccess={onSuccessManualOverride}
          onError={onErrorManualOverride}
        />

        <MobileSnackbar state={snackbarState} onClose={onSnackbarClose} />
      </MobileContentStack>
    </MobilePageContainer>
  );
}
