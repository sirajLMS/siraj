"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Box, Button, CircularProgress, Snackbar, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PageContainer, PageHeader, PrimaryPageAction, SectionPanel, StatusBadge } from "@/frontend/components/ui";
import { AppDataGrid } from "@/frontend/components/ui/dataGrid/AppDataGrid";
import { AppPermission, CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  latestExchangeRatesQueryDocument,
  latestFxSyncRunQueryDocument,
  refreshExchangeRatesMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import { useImpersonation } from "@/frontend/hooks/useImpersonation";
import { parseCurrencyCode } from "@/frontend/lib/currency";
import { shouldShowFxStaleBanner } from "@/frontend/lib/fx-stale";
import { logger } from "@/frontend/utils/logger";
import { ExchangeRateHistorySection } from "@/frontend/views/dashboard/admin/billing/exchange-rates/ExchangeRateHistorySection";
import {
  buildExchangeRateColumns,
  type ExchangeRateRow,
  formatExchangeRateTimestamp,
} from "@/frontend/views/dashboard/admin/billing/exchange-rates/exchangeRatesColumns";
import { ManualOverrideDialog } from "@/frontend/views/dashboard/admin/billing/exchange-rates/ManualOverrideDialog";
import { ProviderSettingsSection } from "@/frontend/views/dashboard/admin/billing/exchange-rates/ProviderSettingsSection";
import { BillingImpersonationNotice } from "@/frontend/views/dashboard/billing/components/BillingImpersonationNotice";
import type { ExchangeRatesLabels } from "@/shared/messages/types/dashboard/billing/exchange-rates";

function SyncStatusBadge({
  status,
  labels,
}: {
  readonly status: string | null | undefined;
  readonly labels: ExchangeRatesLabels["syncStatus"];
}) {
  const normalized = (status ?? "unknown").toLowerCase();
  const statusLabels: Record<string, string> = {
    success: labels.statusSuccess,
    running: labels.statusRunning,
    partial: labels.statusPartial,
    failed: labels.statusFailed,
    unknown: labels.statusUnknown,
  };

  return (
    <StatusBadge
      category="syncStatus"
      status={normalized}
      label={statusLabels[normalized] ?? labels.statusUnknown}
      size="small"
    />
  );
}

function ExchangeRatesSyncPanel({
  syncRun,
  syncLoading,
  labels,
}: Readonly<{
  syncRun: {
    finishedAt?: string | null;
    startedAt?: string | null;
    provider?: string | null;
    pairsWritten?: number | string | null;
    pairsFailed?: number | string | null;
    status?: string | null;
    errorMessage?: string | null;
  } | null;
  syncLoading: boolean;
  labels: ExchangeRatesLabels;
}>) {
  if (syncLoading) {
    return <CircularProgress size={24} />;
  }

  if (!syncRun) {
    return (
      <Typography variant="bodyMd" color="textSecondary">
        {labels.noSyncRuns}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
      <Box>
        <Typography variant="bodyMd" color="textSecondary">
          {labels.syncStatus.lastSync}
        </Typography>
        <Typography variant="bodyMd">{formatExchangeRateTimestamp(syncRun.finishedAt ?? syncRun.startedAt)}</Typography>
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
          {labels.status}
        </Typography>
        <SyncStatusBadge status={syncRun.status} labels={labels.syncStatus} />
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
  );
}

export function ExchangeRatesContainer() {
  const t = useTranslations("dashboard.billing");
  const labels = t.raw("exchangeRates") as ExchangeRatesLabels;
  const { isImpersonating } = useImpersonation();
  const billingActionsDisabled = isImpersonating;

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
  const [manualOverrideOpen, setManualOverrideOpen] = useState(false);

  const showFeedback = (message: string, severity: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  useEffect(() => {
    if (billingActionsDisabled) {
      setManualOverrideOpen(false);
    }
  }, [billingActionsDisabled]);

  const handleOpenManualOverride = () => {
    if (billingActionsDisabled) {
      return;
    }
    setManualOverrideOpen(true);
  };

  const {
    data: ratesData,
    loading: ratesLoading,
    refetch: refetchRates,
  } = useQuery(latestExchangeRatesQueryDocument, {
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
        showFeedback(labels.refreshSuccess, "success");
        void refetchSync();
        void refetchRates();
      } else {
        const errMsg = result.refreshExchangeRates?.errorMessage ?? labels.refreshFailed;
        showFeedback(errMsg, "error");
      }
    },
    onError: error => {
      logger.error("FX refresh failed", { error });
      showFeedback(labels.refreshFailed, "error");
    },
  });

  const syncRun = syncData?.latestFxSyncRun ?? null;
  const rates: ExchangeRateRow[] = (ratesData?.latestExchangeRates ?? [])
    .filter((rate): rate is NonNullable<typeof rate> => rate != null && rate.id != null)
    .map(rate => ({
      id: rate.id ?? "",
      fromCurrency: parseCurrencyCode(rate.fromCurrency) ?? CurrencyCode.Usd,
      toCurrency: parseCurrencyCode(rate.toCurrency) ?? CurrencyCode.Sar,
      rate: rate.rate ?? "0",
      source: rate.source ?? null,
      effectiveDate: rate.effectiveDate ?? "",
    }));

  const availablePairs = useMemo(() => rates.map(rate => ({ from: rate.fromCurrency, to: rate.toCurrency })), [rates]);

  const columns = useMemo(() => buildExchangeRateColumns(labels.rateTable), [labels.rateTable]);
  const showStaleWarning = shouldShowFxStaleBanner(syncRun) && !refreshing;

  return (
    <PageContainer>
      <BillingImpersonationNotice />
      <PageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        actions={
          <RequirePermission permissions={AppPermission.BillingRefreshExchangeRates}>
            <PrimaryPageAction
              onClick={() => void refreshMutation({ variables: { force: false } })}
              disabled={refreshing || billingActionsDisabled}
            >
              {refreshing ? labels.refreshing : labels.syncStatus.refresh}
            </PrimaryPageAction>
          </RequirePermission>
        }
      />

      <RequirePermission permissions={AppPermission.BillingViewExchangeRates}>
        {showStaleWarning ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {labels.staleWarning}
          </Alert>
        ) : null}

        <SectionPanel title={labels.syncStatus.title}>
          <ExchangeRatesSyncPanel syncRun={syncRun} syncLoading={syncLoading} labels={labels} />
        </SectionPanel>

        <ProviderSettingsSection
          labels={labels.providerSettings}
          onFeedback={showFeedback}
          actionsDisabled={billingActionsDisabled}
        />

        <SectionPanel title={labels.rateTable.title}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <RequirePermission permissions={AppPermission.BillingOverrideExchangeRates}>
              <Button variant="outlined" onClick={handleOpenManualOverride} disabled={billingActionsDisabled}>
                {labels.manualOverride.title}
              </Button>
            </RequirePermission>
          </Box>
          <AppDataGrid
            rows={rates}
            columns={columns}
            loading={ratesLoading}
            emptyMessage={labels.noRates}
            autoHeight
            disableColumnMenu
          />
        </SectionPanel>

        <SectionPanel title={labels.history.title}>
          <ExchangeRateHistorySection labels={labels} availablePairs={availablePairs} />
        </SectionPanel>
      </RequirePermission>

      <ManualOverrideDialog
        open={manualOverrideOpen && !billingActionsDisabled}
        labels={labels.manualOverride}
        onClose={() => setManualOverrideOpen(false)}
        onSuccess={() => {
          showFeedback(labels.manualOverride.success, "success");
          void refetchRates();
        }}
        onError={message => showFeedback(message, "error")}
      />

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
