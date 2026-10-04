"use client";

import { Alert, Box, Button, Typography } from "@mui/material";
import { formatExchangeRateTimestamp } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesColumns";
import type { ExchangeRatesViewModel } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/useExchangeRatesViewModel";
import { MobileCardList, MobileCardListItem, MobileSectionPanel } from "@/frontend/mobile/components/ui";

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
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {row.source ?? "—"}
        </Typography>
        <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
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

export function MobileRateTablePanel({
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

export function MobileExchangeRatesAlerts({
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
