"use client";

import { ExchangeRatesSyncPanelShared } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/__shared__/exchangeRatesSyncShared";
import { ProviderSettingsSection } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/ProviderSettingsSection";
import type { ExchangeRatesViewModel } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/useExchangeRatesViewModel";
import { MobileSectionPanel, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { ExchangeRateHistorySectionMobile } from "@/frontend/mobile/views/dashboard/admin/billing/exchange-rates/components/exchangeRateHistorySection.mobile";
import {
  MobileExchangeRatesAlerts,
  MobileRateTablePanel,
} from "@/frontend/mobile/views/dashboard/admin/billing/exchange-rates/exchangeRates.parts";

interface MobileExchangeRatesContentProps {
  readonly labels: ExchangeRatesViewModel["labels"];
  readonly rates: ExchangeRatesViewModel["rates"];
  readonly ratesLoading: boolean;
  readonly syncRun: ExchangeRatesViewModel["syncRun"];
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

export function MobileExchangeRatesContent({
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
        <ExchangeRatesSyncPanelShared
          syncRun={syncRun}
          syncLoading={syncLoading}
          labels={labels}
          config={{
            StatusBadge: MobileStatusBadge,
            layout: "column",
            errorColorSx: theme => ({ color: theme.palette.error.main }),
            secondaryTextSx: theme => ({ color: theme.palette.text.secondary }),
          }}
        />
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
