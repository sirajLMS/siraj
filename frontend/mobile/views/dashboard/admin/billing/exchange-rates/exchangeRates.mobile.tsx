"use client";

import { Alert, Box, Button, Typography } from "@mui/material";
import { AppSnackbar } from "@/frontend/common/components/ui/state/AppSnackbar";
import { ExchangeRatesSyncPanelShared } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/__shared__/exchangeRatesSyncShared";
import { formatExchangeRateTimestamp } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesColumns";
import { ManualOverrideDialog } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/ManualOverrideDialog";
import { ProviderSettingsSection } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/ProviderSettingsSection";
import type { ExchangeRatesViewModel } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/useExchangeRatesViewModel";
import { BillingImpersonationNotice } from "@/frontend/common/views/dashboard/billing/components/BillingImpersonationNotice";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
  MobileSectionPanel,
  MobileStatusBadge,
} from "@/frontend/mobile/components/ui";
import { ExchangeRateHistorySectionMobile } from "@/frontend/mobile/views/dashboard/admin/billing/exchange-rates/components/exchangeRateHistorySection.mobile";

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
        <Button color="inherit" size="small" onClick={onRetry}>
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
