"use client";

import { Alert, Box, Button, CircularProgress, Snackbar, Typography } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { formatExchangeRateTimestamp } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesColumns";
import type {
  ExchangeRatesSnackbarState,
  ExchangeRatesSyncRun,
  ExchangeRatesViewModel,
} from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesView";
import { ManualOverrideDialog } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/ManualOverrideDialog";
import { ProviderSettingsSection } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/ProviderSettingsSection";
import { BillingImpersonationNotice } from "@/frontend/common/views/dashboard/billing/components/BillingImpersonationNotice";
import {
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

export function ExchangeRatesMobileView({
  labels,
  rates,
  ratesLoading,
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
  snackbarState,
  onSnackbarClose,
  ratesError,
  syncError,
  refetchRates,
  refetchSync,
}: Readonly<ExchangeRatesViewModel>) {
  return (
    <MobilePageContainer>
      <BillingImpersonationNotice />
      <MobilePageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        edgeToEdge={false}
        actions={
          <RequirePermission permissions={AppPermission.BillingRefreshExchangeRates}>
            <Button variant="contained" onClick={onRefresh} disabled={refreshing || billingActionsDisabled}>
              {refreshing ? labels.refreshing : labels.syncStatus.refresh}
            </Button>
          </RequirePermission>
        }
      />
      <MobileContentStack gap={3} paddingBottom={4}>
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

          <MobileSectionPanel title={labels.syncStatus.title}>
            <MobileSyncPanel syncRun={syncRun} syncLoading={syncLoading} labels={labels} />
          </MobileSectionPanel>

          <ProviderSettingsSection
            labels={labels.providerSettings}
            onFeedback={(_message, _severity) => onSuccessManualOverride()}
            actionsDisabled={billingActionsDisabled}
          />

          <MobileSectionPanel title={labels.rateTable.title}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <RequirePermission permissions={AppPermission.BillingOverrideExchangeRates}>
                <Button variant="outlined" onClick={onOpenManualOverride} disabled={billingActionsDisabled}>
                  {labels.manualOverride.title}
                </Button>
              </RequirePermission>
            </Box>
            {ratesLoading && rates.length === 0 ? (
              <Typography sx={theme => ({ color: theme.palette.text.secondary, py: 2 })}>{labels.noRates}</Typography>
            ) : rates.length === 0 ? (
              <Typography sx={theme => ({ color: theme.palette.text.secondary, py: 2 })}>{labels.noRates}</Typography>
            ) : (
              rates.map(row => (
                <Box
                  key={row.id}
                  sx={{
                    py: 1.5,
                    borderBottom: theme => `1px solid ${theme.palette.outlineVariant}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.25,
                  }}
                >
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
              ))
            )}
          </MobileSectionPanel>

          <MobileSectionPanel title={labels.history.title}>
            <ExchangeRateHistorySectionMobile labels={labels} availablePairs={availablePairs} />
          </MobileSectionPanel>
        </RequirePermission>

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
