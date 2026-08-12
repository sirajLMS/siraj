"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import type { ComponentType } from "react";
import type { StatusBadgeSharedProps } from "@/frontend/common/components/ui/badge/types/statusBadgeShared.types";
import { AppSnackbar } from "@/frontend/common/components/ui/state/AppSnackbar";
import { formatExchangeRateTimestamp } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesColumns";
import type {
  ExchangeRatesSyncRun,
  ExchangeRatesViewModel,
} from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/useExchangeRatesViewModel";

export const ExchangeRatesSnackbarShared = AppSnackbar;

export interface ExchangeRatesSyncConfig {
  readonly StatusBadge: ComponentType<Readonly<StatusBadgeSharedProps>>;
  readonly layout: "grid" | "column";
  readonly errorColorSx: (theme: { readonly palette: { readonly error: { readonly main: string } } }) => {
    readonly color: string;
  };
  readonly secondaryTextSx?: (theme: { readonly palette: { readonly text: { readonly secondary: string } } }) => {
    readonly color: string;
  };
}

function buildStatusLabels(labels: ExchangeRatesViewModel["labels"]["syncStatus"]): Record<string, string> {
  return {
    success: labels.statusSuccess,
    running: labels.statusRunning,
    partial: labels.statusPartial,
    failed: labels.statusFailed,
    unknown: labels.statusUnknown,
  };
}

export function ExchangeRatesSyncPanelShared({
  syncRun,
  syncLoading,
  labels,
  config,
}: Readonly<{
  readonly syncRun: ExchangeRatesSyncRun | null;
  readonly syncLoading: boolean;
  readonly labels: ExchangeRatesViewModel["labels"];
  readonly config: Readonly<ExchangeRatesSyncConfig>;
}>) {
  if (syncLoading) {
    return <CircularProgress size={24} />;
  }

  if (!syncRun) {
    if (config.secondaryTextSx) {
      return (
        <Typography variant="bodyMd" sx={config.secondaryTextSx}>
          {labels.noSyncRuns}
        </Typography>
      );
    }
    return (
      <Typography variant="bodyMd" color="textSecondary">
        {labels.noSyncRuns}
      </Typography>
    );
  }

  const { StatusBadge, layout, errorColorSx } = config;
  const isGrid = layout === "grid";
  const statusLabels = buildStatusLabels(labels.syncStatus);
  const normalized = (syncRun.status ?? "unknown").toLowerCase();

  return (
    <Box
      sx={
        isGrid
          ? { display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }
          : { display: "flex", flexDirection: "column", gap: 1 }
      }
    >
      <Box sx={isGrid ? undefined : {}}>
        <Typography variant="bodyMd" color="textSecondary">
          {labels.syncStatus.lastSync}
        </Typography>
        <Typography variant="bodyMd">{formatExchangeRateTimestamp(syncRun.finishedAt ?? syncRun.startedAt)}</Typography>
      </Box>
      <Box sx={isGrid ? undefined : {}}>
        <Typography variant="bodyMd" color="textSecondary">
          {labels.syncStatus.provider}
        </Typography>
        <Typography variant="bodyMd">{syncRun.provider}</Typography>
      </Box>
      <Box sx={isGrid ? undefined : {}}>
        <Typography variant="bodyMd" color="textSecondary">
          {labels.syncStatus.pairsWritten}
        </Typography>
        <Typography variant="bodyMd">{syncRun.pairsWritten}</Typography>
      </Box>
      <Box sx={isGrid ? undefined : {}}>
        <Typography variant="bodyMd" color="textSecondary">
          {labels.syncStatus.pairsFailed}
        </Typography>
        <Typography variant="bodyMd">{syncRun.pairsFailed}</Typography>
      </Box>
      <Box sx={isGrid ? { gridColumn: { sm: "span 2" } } : undefined}>
        <Typography variant="bodyMd" color="textSecondary">
          {labels.status}
        </Typography>
        <StatusBadge
          category="syncStatus"
          status={normalized}
          label={statusLabels[normalized] ?? labels.syncStatus.statusUnknown}
          size="small"
        />
      </Box>
      {syncRun.errorMessage ? (
        <Box sx={isGrid ? { gridColumn: { sm: "span 2" } } : undefined}>
          <Typography variant="bodyMd" sx={errorColorSx}>
            {labels.syncStatus.errorMessage}
          </Typography>
          <Typography variant="bodyMd" sx={errorColorSx}>
            {syncRun.errorMessage}
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}
