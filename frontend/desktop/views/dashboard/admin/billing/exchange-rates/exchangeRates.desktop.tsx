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
  DesktopAppDataGrid,
  DesktopPageContainer,
  DesktopPageHeader,
  DesktopSectionPanel,
  DesktopStatusBadge,
  desktopSectionContentInsetSx,
} from "@/frontend/desktop/components/ui";
import { ExchangeRateHistorySectionDesktop } from "@/frontend/desktop/views/dashboard/admin/billing/exchange-rates/components/exchangeRateHistorySection.desktop";

function SyncStatusBadgeDesktop({
  status,
  labels,
}: {
  readonly status: string | null | undefined;
  readonly labels: ExchangeRatesViewModel["labels"]["syncStatus"];
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
    <DesktopStatusBadge
      category="syncStatus"
      status={normalized}
      label={statusLabels[normalized] ?? labels.statusUnknown}
      size="small"
    />
  );
}

function DesktopSyncPanel({
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
        <SyncStatusBadgeDesktop status={syncRun.status} labels={labels.syncStatus} />
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

function DesktopSnackbar({
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

export function ExchangeRatesDesktopView({
  labels,
  rates,
  ratesColumns,
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
    <DesktopPageContainer>
      <BillingImpersonationNotice />
      <DesktopPageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        actions={
          canRefresh ? (
            <Button variant="contained" onClick={onRefresh} disabled={refreshing || billingActionsDisabled}>
              {refreshing ? labels.refreshing : labels.syncStatus.refresh}
            </Button>
          ) : null
        }
      />

      {ratesError ? (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetchRates()}>
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
            <Button color="inherit" size="small" onClick={() => refetchSync()}>
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

      <DesktopSectionPanel title={labels.syncStatus.title}>
        <DesktopSyncPanel syncRun={syncRun} syncLoading={syncLoading} labels={labels} />
      </DesktopSectionPanel>

      <ProviderSettingsSection
        labels={labels.providerSettings}
        onFeedback={onSuccessManualOverride}
        actionsDisabled={billingActionsDisabled}
      />

      <DesktopSectionPanel contentPadding={false} title={labels.rateTable.title}>
        <Box sx={{ ...desktopSectionContentInsetSx, display: "flex", justifyContent: "flex-end", pb: 0 }}>
          {canOverride ? (
            <Button variant="outlined" onClick={onOpenManualOverride} disabled={billingActionsDisabled}>
              {labels.manualOverride.title}
            </Button>
          ) : null}
        </Box>
        <DesktopAppDataGrid
          rows={rates}
          columns={ratesColumns}
          loading={ratesLoading}
          emptyMessage={labels.noRates}
          autoHeight
          disableColumnMenu
          paginationOptions={{ mode: "client" }}
        />
      </DesktopSectionPanel>

      <DesktopSectionPanel contentPadding={false} title={labels.history.title}>
        <ExchangeRateHistorySectionDesktop labels={labels} historyViewModel={historyViewModel} />
      </DesktopSectionPanel>

      <ManualOverrideDialog
        open={manualOverrideOpen && !billingActionsDisabled}
        labels={labels.manualOverride}
        onClose={onCloseManualOverride}
        onSuccess={onSuccessManualOverride}
        onError={onErrorManualOverride}
      />

      <DesktopSnackbar state={snackbarState} onClose={onSnackbarClose} />
    </DesktopPageContainer>
  );
}
