"use client";

import { AppSnackbar } from "@/frontend/common/components/ui/state/AppSnackbar";
import { ManualOverrideDialog } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/ManualOverrideDialog";
import type { ExchangeRatesViewModel } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/useExchangeRatesViewModel";
import { BillingImpersonationNotice } from "@/frontend/common/views/dashboard/billing/components/BillingImpersonationNotice";
import {
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
} from "@/frontend/mobile/components/ui";
import { MobileExchangeRatesContent } from "@/frontend/mobile/views/dashboard/admin/billing/exchange-rates/exchangeRatesContent.parts";

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
            <MobilePrimaryPageAction onClick={onRefresh} disabled={refreshing || billingActionsDisabled}>
              {refreshing ? labels.refreshing : labels.syncStatus.refresh}
            </MobilePrimaryPageAction>
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

        <AppSnackbar state={snackbarState} onClose={onSnackbarClose} />
      </MobileContentStack>
    </MobilePageContainer>
  );
}
