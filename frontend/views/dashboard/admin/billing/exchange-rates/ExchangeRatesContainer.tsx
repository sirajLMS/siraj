"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Box, CircularProgress, Snackbar, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PageContainer, PageHeader, PrimaryPageAction, SectionPanel, StatusBadge } from "@/frontend/components/ui";
import { AppDataGrid } from "@/frontend/components/ui/dataGrid/AppDataGrid";
import { CurrencyDisplay } from "@/frontend/components/ui/display/currencyDisplay/CurrencyDisplay";
import { AppPermission, CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  latestExchangeRatesQueryDocument,
  latestFxSyncRunQueryDocument,
  refreshExchangeRatesMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import { logger } from "@/frontend/utils/logger";

type ExchangeRateRow = {
  readonly id: string;
  readonly fromCurrency: CurrencyCode;
  readonly toCurrency: CurrencyCode;
  readonly rate: string;
  readonly source: string | null;
  readonly effectiveDate: string;
};

function formatTimestamp(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SyncStatusBadge({
  status,
  labels,
}: {
  readonly status: string | null | undefined;
  readonly labels: { success: string; running: string; partial: string; failed: string; unknown: string };
}) {
  const normalized = (status ?? "unknown").toLowerCase();
  const labelKey = normalized as keyof typeof labels;
  return (
    <StatusBadge
      category="syncStatus"
      status={normalized}
      label={labels[labelKey] ?? labels.unknown}
      size="small"
    />
  );
}

function buildLabels(t: ReturnType<typeof useTranslations>) {
  return {
    pageTitle: t("exchangeRates.pageTitle", { defaultValue: "Exchange Rates" }),
    pageSubtitle: t("exchangeRates.pageSubtitle", { defaultValue: "Latest currency exchange rates and sync status" }),
    syncStatus: {
      title: t("exchangeRates.syncStatus.title", { defaultValue: "Sync Status" }),
      refresh: t("exchangeRates.syncStatus.refresh", { defaultValue: "Refresh Rates" }),
      lastSync: t("exchangeRates.syncStatus.lastSync", { defaultValue: "Last Sync" }),
      provider: t("exchangeRates.syncStatus.provider", { defaultValue: "Provider" }),
      pairsWritten: t("exchangeRates.syncStatus.pairsWritten", { defaultValue: "Pairs Written" }),
      pairsFailed: t("exchangeRates.syncStatus.pairsFailed", { defaultValue: "Pairs Failed" }),
      errorMessage: t("exchangeRates.syncStatus.errorMessage", { defaultValue: "Error" }),
      statusLabels: {
        success: t("exchangeRates.syncStatus.statusSuccess", { defaultValue: "Success" }),
        running: t("exchangeRates.syncStatus.statusRunning", { defaultValue: "Running" }),
        partial: t("exchangeRates.syncStatus.statusPartial", { defaultValue: "Partial" }),
        failed: t("exchangeRates.syncStatus.statusFailed", { defaultValue: "Failed" }),
        unknown: t("exchangeRates.syncStatus.statusUnknown", { defaultValue: "Unknown" }),
      },
    },
    rateTable: {
      title: t("exchangeRates.rateTable.title", { defaultValue: "Latest Rates" }),
      fromCurrency: t("exchangeRates.rateTable.fromCurrency", { defaultValue: "From" }),
      toCurrency: t("exchangeRates.rateTable.toCurrency", { defaultValue: "To" }),
      rate: t("exchangeRates.rateTable.rate", { defaultValue: "Rate" }),
      source: t("exchangeRates.rateTable.source", { defaultValue: "Source" }),
      effectiveDate: t("exchangeRates.rateTable.effectiveDate", { defaultValue: "Effective Date" }),
    },
    common: {
      refreshing: t("exchangeRates.refreshing", { defaultValue: "Refreshing rates…" }),
      refreshSuccess: t("exchangeRates.refreshSuccess", { defaultValue: "Rates refreshed successfully" }),
      refreshFailed: t("exchangeRates.refreshFailed", { defaultValue: "Refresh failed" }),
      noRates: t("exchangeRates.noRates", { defaultValue: "No exchange rates available" }),
      noSyncRuns: t("exchangeRates.noSyncRuns", { defaultValue: "No sync runs yet" }),
    },
  };
}

export function ExchangeRatesContainer() {
  const t = useTranslations("dashboard.billing");
  const labels = buildLabels(t);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const showFeedback = (message: string, severity: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const { data: ratesData, loading: ratesLoading } = useQuery(latestExchangeRatesQueryDocument, {
    variables: { paginationArgs: null },
    fetchPolicy: "cache-and-network",
  });

  const {
    data: syncData,
    loading: syncLoading,
    refetch: refetchSync,
  } = useQuery(latestFxSyncRunQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const [refreshMutation, { loading: refreshing }] = useMutation(refreshExchangeRatesMutationDocument, {
    onCompleted: result => {
      if (result.refreshExchangeRates?.success) {
        showFeedback(labels.common.refreshSuccess, "success");
        void refetchSync();
      } else {
        const errMsg = result.refreshExchangeRates?.errorMessage ?? labels.common.refreshFailed;
        showFeedback(errMsg, "error");
      }
    },
    onError: error => {
      logger.error("FX refresh failed", { error });
      showFeedback(labels.common.refreshFailed, "error");
    },
  });

  const handleRefresh = () => {
    void refreshMutation({ variables: { force: false } });
  };

  const syncRun = syncData?.latestFxSyncRun ?? null;
  const rates: ExchangeRateRow[] = (ratesData?.latestExchangeRates ?? [])
    .filter((rate): rate is NonNullable<typeof rate> => rate != null && rate.id != null)
    .map(rate => ({
      id: rate.id ?? "",
      fromCurrency: (rate.fromCurrency ?? CurrencyCode.Usd) as CurrencyCode,
      toCurrency: (rate.toCurrency ?? CurrencyCode.Sar) as CurrencyCode,
      rate: rate.rate ?? "0",
      source: rate.source ?? null,
      effectiveDate: rate.effectiveDate ?? "",
    }));

  const columns = useMemo<GridColDef<ExchangeRateRow>[]>(
    () => [
      {
        field: "fromCurrency",
        headerName: labels.rateTable.fromCurrency,
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => <CurrencyDisplay code={row.fromCurrency} showLabel showSymbol />,
      },
      {
        field: "toCurrency",
        headerName: labels.rateTable.toCurrency,
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => <CurrencyDisplay code={row.toCurrency} showLabel showSymbol />,
      },
      {
        field: "rate",
        headerName: labels.rateTable.rate,
        width: 120,
        align: "right",
        headerAlign: "right",
      },
      {
        field: "source",
        headerName: labels.rateTable.source,
        flex: 1,
        minWidth: 140,
        valueFormatter: value => value || "—",
      },
      {
        field: "effectiveDate",
        headerName: labels.rateTable.effectiveDate,
        flex: 1.2,
        minWidth: 180,
        valueFormatter: value => formatTimestamp(String(value ?? "")),
      },
    ],
    [labels.rateTable]
  );

  return (
    <PageContainer>
      <PageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        actions={
          <RequirePermission permissions={AppPermission.BillingRefreshExchangeRates}>
            <PrimaryPageAction onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? labels.common.refreshing : labels.syncStatus.refresh}
            </PrimaryPageAction>
          </RequirePermission>
        }
      />

      <RequirePermission permissions={AppPermission.BillingViewExchangeRates}>
        <SectionPanel title={labels.syncStatus.title}>
          {syncLoading ? (
            <CircularProgress size={24} />
          ) : syncRun ? (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <Box>
                <Typography variant="bodyMd" color="textSecondary">
                  {labels.syncStatus.lastSync}
                </Typography>
                <Typography variant="bodyMd">{formatTimestamp(syncRun.finishedAt ?? syncRun.startedAt)}</Typography>
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
                  {t("status", { defaultValue: "Status" })}
                </Typography>
                <SyncStatusBadge status={syncRun.status} labels={labels.syncStatus.statusLabels} />
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
          ) : (
            <Typography variant="bodyMd" color="textSecondary">
              {labels.common.noSyncRuns}
            </Typography>
          )}
        </SectionPanel>

        <SectionPanel title={labels.rateTable.title}>
          <AppDataGrid
            rows={rates}
            columns={columns}
            loading={ratesLoading}
            emptyMessage={labels.common.noRates}
            autoHeight
            disableColumnMenu
          />
        </SectionPanel>
      </RequirePermission>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)} variant="filled">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
}
