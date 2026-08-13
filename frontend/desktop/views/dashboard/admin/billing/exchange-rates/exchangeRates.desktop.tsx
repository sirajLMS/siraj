"use client";

import { Alert, Box, Button } from "@mui/material";
import { AppSnackbar } from "@/frontend/common/components/ui/state/AppSnackbar";
import { ExchangeRatesSyncPanelShared } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/__shared__/exchangeRatesSyncShared";
import type {
  buildExchangeRateColumns,
  ExchangeRateRow,
} from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesColumns";
import { ManualOverrideDialog } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/ManualOverrideDialog";
import { ProviderSettingsSection } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/ProviderSettingsSection";
import type { ExchangeRatesViewModel } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/useExchangeRatesViewModel";
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

function RatesErrorAlert({
  error,
  onRetry,
  loadFailed,
}: Readonly<{ error: Error | null | undefined; onRetry: () => void; loadFailed: string }>) {
  if (!error) return null;
  return (
    <Alert
      severity="warning"
      sx={{ mb: 2 }}
      action={
        <Button color="inherit" size="small" onClick={onRetry}>
          {loadFailed}
        </Button>
      }
    >
      {loadFailed}
    </Alert>
  );
}

function StaleWarningAlert({ show, message }: Readonly<{ show: boolean; message: string }>) {
  if (!show) return null;
  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      {message}
    </Alert>
  );
}

function RateTableContent({
  canOverride,
  billingActionsDisabled,
  manualOverrideTitle,
  onOpenManualOverride,
  rates,
  ratesColumns,
  ratesLoading,
  noRatesMessage,
}: Readonly<{
  canOverride: boolean;
  billingActionsDisabled: boolean;
  manualOverrideTitle: string;
  onOpenManualOverride: () => void;
  rates: readonly ExchangeRateRow[];
  ratesColumns: ReturnType<typeof buildExchangeRateColumns>;
  ratesLoading: boolean;
  noRatesMessage: string;
}>) {
  return (
    <>
      <Box sx={{ ...desktopSectionContentInsetSx, display: "flex", justifyContent: "flex-end", pb: 0 }}>
        {canOverride ? (
          <Button variant="outlined" onClick={onOpenManualOverride} disabled={billingActionsDisabled}>
            {manualOverrideTitle}
          </Button>
        ) : null}
      </Box>
      <DesktopAppDataGrid
        rows={rates}
        columns={ratesColumns}
        loading={ratesLoading}
        emptyMessage={noRatesMessage}
        autoHeight
        disableColumnMenu
        paginationOptions={{ mode: "client" }}
      />
    </>
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

      <RatesErrorAlert error={ratesError} onRetry={() => refetchRates()} loadFailed={labels.errors.loadFailed} />
      <RatesErrorAlert error={syncError} onRetry={() => refetchSync()} loadFailed={labels.errors.loadFailed} />
      <StaleWarningAlert show={showStaleWarning} message={labels.staleWarning} />

      <DesktopSectionPanel title={labels.syncStatus.title}>
        <ExchangeRatesSyncPanelShared
          syncRun={syncRun}
          syncLoading={syncLoading}
          labels={labels}
          config={{
            StatusBadge: DesktopStatusBadge,
            layout: "grid",
            errorColorSx: theme => ({ color: theme.palette.error.main }),
          }}
        />
      </DesktopSectionPanel>

      <ProviderSettingsSection
        labels={labels.providerSettings}
        onFeedback={onSuccessManualOverride}
        actionsDisabled={billingActionsDisabled}
      />

      <DesktopSectionPanel contentPadding={false} title={labels.rateTable.title}>
        <RateTableContent
          canOverride={canOverride}
          billingActionsDisabled={billingActionsDisabled}
          manualOverrideTitle={labels.manualOverride.title}
          onOpenManualOverride={onOpenManualOverride}
          rates={rates}
          ratesColumns={ratesColumns}
          ratesLoading={ratesLoading}
          noRatesMessage={labels.noRates}
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

      <AppSnackbar state={snackbarState} onClose={onSnackbarClose} />
    </DesktopPageContainer>
  );
}
