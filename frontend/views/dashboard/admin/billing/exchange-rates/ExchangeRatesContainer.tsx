"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Box, Button, Chip, CircularProgress, Snackbar, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  latestExchangeRatesQueryDocument,
  latestFxSyncRunQueryDocument,
  refreshExchangeRatesMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import { logger } from "@/frontend/utils/logger";

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

function SyncStatusChip({
  status,
  labels,
}: {
  readonly status: string | null | undefined;
  readonly labels: { success: string; running: string; partial: string; failed: string; unknown: string };
}) {
  const labelKey = (status ?? "unknown").toLowerCase() as keyof typeof labels;
  const color: "success" | "warning" | "error" | "default" =
    status === "success" ? "success" : status === "running" ? "warning" : status === "failed" ? "error" : "default";
  return <Chip label={labels[labelKey] ?? labels.unknown} color={color} size="small" />;
}

function ExchangeRateSyncStatusCard({
  labels,
  children,
}: {
  readonly labels: {
    title: string;
    refresh: string;
    lastSync: string;
    provider: string;
    pairsWritten: string;
    pairsFailed: string;
    errorMessage: string;
    statusLabels: { success: string; running: string; partial: string; failed: string; unknown: string };
  };
  readonly children: React.ReactNode;
}) {
  return (
    <SectionPanel title={labels.title}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>{children}</Box>
    </SectionPanel>
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
  const rates: readonly {
    readonly id: string;
    readonly fromCurrency: string;
    readonly toCurrency: string;
    readonly rate: string;
    readonly source: string | null;
    readonly effectiveDate: string;
  }[] = (ratesData?.latestExchangeRates ?? []).map(rate => ({
    id: rate?.id ?? "",
    fromCurrency: (rate?.fromCurrency as string) ?? "",
    toCurrency: (rate?.toCurrency as string) ?? "",
    rate: (rate?.rate as string) ?? "0",
    source: rate?.source ?? null,
    effectiveDate: (rate?.effectiveDate as string) ?? "",
  }));

  return (
    <PageContainer>
      <PageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        actions={
          <RequirePermission permissions={AppPermission.BillingRefreshExchangeRates}>
            <Button
              variant="contained"
              onClick={handleRefresh}
              disabled={refreshing}
              startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {labels.syncStatus.refresh}
            </Button>
          </RequirePermission>
        }
      />

      <RequirePermission permissions={AppPermission.BillingViewExchangeRates}>
        <ExchangeRateSyncStatusCard labels={labels.syncStatus}>
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
                <SyncStatusChip status={syncRun.status} labels={labels.syncStatus.statusLabels} />
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
        </ExchangeRateSyncStatusCard>

        <SectionPanel title={labels.rateTable.title}>
          {ratesLoading ? (
            <CircularProgress size={24} />
          ) : rates.length === 0 ? (
            <Typography variant="bodyMd" color="textSecondary">
              {labels.common.noRates}
            </Typography>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 12px" }}>{labels.rateTable.fromCurrency}</th>
                    <th style={{ textAlign: "left", padding: "8px 12px" }}>{labels.rateTable.toCurrency}</th>
                    <th style={{ textAlign: "right", padding: "8px 12px" }}>{labels.rateTable.rate}</th>
                    <th style={{ textAlign: "left", padding: "8px 12px" }}>{labels.rateTable.source}</th>
                    <th style={{ textAlign: "left", padding: "8px 12px" }}>{labels.rateTable.effectiveDate}</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map(rate => (
                    <tr key={rate.id} style={{ borderTop: "1px solid", borderColor: "divider" }}>
                      <td style={{ padding: "8px 12px" }}>{rate.fromCurrency}</td>
                      <td style={{ padding: "8px 12px" }}>{rate.toCurrency}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>{rate.rate}</td>
                      <td style={{ padding: "8px 12px" }}>{rate.source ?? "—"}</td>
                      <td style={{ padding: "8px 12px" }}>{formatTimestamp(rate.effectiveDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
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
