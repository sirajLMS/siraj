"use client";

import {
  DownloadOutlined,
  EventBusyOutlined,
  FilterListOutlined,
  Inventory2Outlined,
  NumbersOutlined,
} from "@mui/icons-material";
import { Box, Fade, Skeleton, Stack } from "@mui/material";
import type { ReactElement } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { QuotaInsightsViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaInsightsViewModel";
import { DesktopExportButton, DesktopFilterButton } from "@/frontend/desktop/components/ui/button";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid/DesktopMetricCardGrid";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { DesktopErrorState, DesktopLoadingState } from "@/frontend/desktop/components/ui/state";
import { QuotaInsightsChartsDesktop } from "@/frontend/desktop/views/dashboard/billing/quota/components/QuotaInsightsChartsDesktop";

function buildDesktopMetrics(vm: QuotaInsightsViewModel): readonly MetricItem[] {
  const { metrics, labels } = vm;
  return [
    {
      key: "activeQuotas",
      count: metrics.activeQuotasCount,
      labelKey: "quota.activeQuotas",
      label: labels.activeQuotasCount(metrics.activeQuotasCount),
      icon: Inventory2Outlined,
      variant: "default",
    },
    {
      key: "totalRemaining",
      count: metrics.totalClassesRemaining,
      labelKey: "quota.remaining",
      label: labels.totalClassesRemaining(metrics.totalClassesRemaining),
      icon: NumbersOutlined,
      variant: "highlight",
    },
    {
      key: "totalReserved",
      count: metrics.totalReserved,
      labelKey: "quota.reserved",
      label: labels.fields.reservedClasses,
      icon: Inventory2Outlined,
      variant: "default",
    },
    {
      key: "pendingBacklog",
      count: metrics.pendingBacklogCount,
      labelKey: "quota.pendingBacklog",
      label: labels.charts.pendingCredits,
      icon: EventBusyOutlined,
      variant: metrics.pendingBacklogCount > 0 ? "danger" : "default",
    },
  ];
}

function desktopBreadcrumbs(t: { readonly insights: string }) {
  return [
    { label: "Quotas", href: "/quotas" },
    { label: t.insights, current: true },
  ];
}

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
    return <DesktopErrorState message={labels.errors.createFailed} />;
  }

  if (loading && vm.quotas.length === 0) {
    return (
      <DesktopPageContainer>
        <DesktopPageHeader title={labels.insightsTitle} breadcrumbs={desktopBreadcrumbs(labels)} />
        <Box aria-busy="true">
          <DesktopLoadingState />
        </Box>
      </DesktopPageContainer>
    );
  }

  return (
    <Fade in timeout={300}>
      <div>
        <DesktopPageContainer>
          <DesktopPageHeader
            title={labels.insightsTitle}
            breadcrumbs={desktopBreadcrumbs(labels)}
            actions={
              <DesktopExportButton startIcon={<DownloadOutlined />} onClick={exportCsv}>
                {labels.actions.create}
              </DesktopExportButton>
            }
          />

          <Box aria-busy={loading}>
            {/* Metric Cards */}
            <DesktopMetricCardGrid metrics={buildDesktopMetrics(vm)} />

            {/* Filter Bar */}
            <Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
              <DesktopFilterButton startIcon={<FilterListOutlined />}>
                {labels.insightsDateRangeLabel}
              </DesktopFilterButton>
              <DesktopFilterButton>{labels.insightsKindLabel}</DesktopFilterButton>
              <DesktopFilterButton>{labels.insightsStatusLabel}</DesktopFilterButton>
              <DesktopFilterButton>{labels.insightsStudentLabel}</DesktopFilterButton>
            </Stack>
          </Box>

          {/* Charts */}
          <DesktopSectionPanel title={labels.insightsTitle}>
            {renderChartContent(loading, vm.quotas.length, chartData, metrics, labels)}
          </DesktopSectionPanel>
        </DesktopPageContainer>
      </div>
    </Fade>
  );
}
