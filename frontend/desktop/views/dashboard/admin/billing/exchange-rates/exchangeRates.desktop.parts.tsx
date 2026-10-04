"use client";

import { Alert, Box, Button } from "@mui/material";
import type {
  buildExchangeRateColumns,
  ExchangeRateRow,
} from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesColumns";
import {
  DesktopAppDataGrid,
  DesktopFilterButton,
  desktopSectionContentInsetSx,
} from "@/frontend/desktop/components/ui";

/** Retryable warning banner shown when the rates or sync query fails. */
export function RatesErrorAlert({
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

/** Warning banner shown when the latest sync is older than the staleness threshold. */
export function StaleWarningAlert({ show, message }: Readonly<{ show: boolean; message: string }>) {
  if (!show) return null;
  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      {message}
    </Alert>
  );
}

/** Manual-override toolbar plus the exchange rates DataGrid. */
export function RateTableContent({
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
          <DesktopFilterButton onClick={onOpenManualOverride} disabled={billingActionsDisabled}>
            {manualOverrideTitle}
          </DesktopFilterButton>
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
