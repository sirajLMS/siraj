"use client";

import { AppSnackbar } from "@/frontend/common/components/ui/state/AppSnackbar";
import { ExchangeRatesSyncPanelShared } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/__shared__/exchangeRatesSyncShared";
import { ManualOverrideDialog } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/ManualOverrideDialog";
import { ProviderSettingsSection } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/ProviderSettingsSection";
import type { ExchangeRatesViewModel } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/useExchangeRatesViewModel";
import { BillingImpersonationNotice } from "@/frontend/common/views/dashboard/billing/components/BillingImpersonationNotice";
import {
  DesktopPageContainer,
  DesktopPageHeader,
  DesktopPrimaryPageAction,
  DesktopSectionPanel,
  DesktopStatusBadge,
} from "@/frontend/desktop/components/ui";
import { ExchangeRateHistorySectionDesktop } from "@/frontend/desktop/views/dashboard/admin/billing/exchange-rates/components/exchangeRateHistorySection.desktop";
import {
  RatesErrorAlert,
  RateTableContent,
  StaleWarningAlert,
} from "@/frontend/desktop/views/dashboard/admin/billing/exchange-rates/exchangeRates.desktop.parts";

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
            <DesktopPrimaryPageAction onClick={onRefresh} disabled={refreshing || billingActionsDisabled}>
              {refreshing ? labels.refreshing : labels.syncStatus.refresh}
            </DesktopPrimaryPageAction>
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
