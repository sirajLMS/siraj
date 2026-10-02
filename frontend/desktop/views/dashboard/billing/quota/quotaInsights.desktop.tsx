"use client";

import { DownloadOutlined } from "@mui/icons-material";
import { Box, Skeleton } from "@mui/material";
import type { ReactElement } from "react";
import type { QuotaInsightsViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaInsightsViewModel";
import { buildQuotaInsightsMetrics } from "@/frontend/common/views/dashboard/billing/quota/utils";
import { DesktopExportButton } from "@/frontend/desktop/components/ui/button";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid/DesktopMetricCardGrid";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopErrorState, DesktopLoadingState } from "@/frontend/desktop/components/ui/state";
import { QuotaInsightsChartsDesktop } from "@/frontend/desktop/views/dashboard/billing/quota/components/QuotaInsightsChartsDesktop";

function renderChartContent(
  loading: boolean,
  quotasLength: number,
  chartData: QuotaInsightsViewModel["chartData"],
  metrics: QuotaInsightsViewModel["metrics"],
  labels: QuotaInsightsViewModel["labels"]
): ReactElement {
  if (loading) {
    return (
      <Box aria-busy="true" sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Skeleton variant="rounded" sx={{ width: "100%", maxWidth: 600, height: 300 }} />
        <Skeleton variant="rounded" sx={{ width: "100%", maxWidth: 300, height: 300 }} />
        <Skeleton variant="rounded" sx={{ width: "100%", maxWidth: 300, height: 300 }} />
      </Box>
    );
  }
  if (quotasLength === 0) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Box sx={theme => ({ color: theme.palette.text.secondary })}>{labels.emptyInsightsMessage}</Box>
      </Box>
    );
  }
  return <QuotaInsightsChartsDesktop chartData={chartData} metrics={metrics} labels={labels} />;
}

export function QuotaInsightsDesktopView(vm: Readonly<QuotaInsightsViewModel>): ReactElement {
  const { labels, loading, error, metrics, chartData, exportCsv } = vm;

  if (error) {
    return <DesktopErrorState message={labels.errors.loadFailed} />;
  }

  if (loading && vm.quotas.length === 0) {
    return (
      <Box aria-busy="true">
        <DesktopLoadingState />
      </Box>
    );
  }

  return (
    <Box
      aria-busy={loading}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      {/* Metric Cards */}
      <DesktopMetricCardGrid metrics={buildQuotaInsightsMetrics(vm)} />

      {/* Charts */}
      <DesktopSectionPanel
        title={labels.insightsTitle}
        actions={
          <DesktopExportButton startIcon={<DownloadOutlined />} onClick={exportCsv}>
            {labels.actions.exportCsv}
          </DesktopExportButton>
        }
      >
        {renderChartContent(loading, vm.quotas.length, chartData, metrics, labels)}
      </DesktopSectionPanel>
    </Box>
  );
}
