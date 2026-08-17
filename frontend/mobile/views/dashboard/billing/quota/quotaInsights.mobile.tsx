"use client";

import {
  DownloadOutlined,
  EventBusyOutlined,
  FilterListOutlined,
  Inventory2Outlined,
  NumbersOutlined,
} from "@mui/icons-material";
import { Box, Collapse, Fade, IconButton, Skeleton } from "@mui/material";
import { type ReactElement, useState } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { QuotaInsightsViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaInsightsViewModel";
import { MobileExportButton, MobileFilterButton } from "@/frontend/mobile/components/ui/button";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui/card/MobileMetricCardGrid";
import { MobileContentStack } from "@/frontend/mobile/components/ui/container/MobileContentStack";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container/MobileSectionPanel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui/container/page";
import { MobileErrorState, MobileLoadingState } from "@/frontend/mobile/components/ui/state";
import { QuotaInsightsChartsMobile } from "@/frontend/mobile/views/dashboard/billing/quota/components/QuotaInsightsChartsMobile";

function buildMobileMetrics(vm: QuotaInsightsViewModel): readonly MetricItem[] {
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

function mobileBreadcrumbs(t: { readonly insights: string }) {
  return [
    { label: "Quotas", href: "/quotas" },
    { label: t.insights, current: true },
  ];
}

function renderMobileChartContent(
  loading: boolean,
  quotasLength: number,
  chartData: QuotaInsightsViewModel["chartData"],
  metrics: QuotaInsightsViewModel["metrics"],
  labels: QuotaInsightsViewModel["labels"]
): ReactElement {
  if (loading) {
    return (
      <MobileContentStack aria-busy="true">
        <Skeleton variant="rounded" sx={{ width: "100%", height: 240 }} />
        <Skeleton variant="rounded" sx={{ width: "100%", height: 240 }} />
        <Skeleton variant="rounded" sx={{ width: "100%", height: 240 }} />
      </MobileContentStack>
    );
  }
  if (quotasLength === 0) {
    return (
      <MobileSectionPanel>
        <Box sx={{ py: 4, textAlign: "center" }}>
          <Box sx={theme => ({ color: theme.palette.text.secondary })}>{labels.emptyInsightsMessage}</Box>
        </Box>
      </MobileSectionPanel>
    );
  }
  return (
    <MobileContentStack>
      <QuotaInsightsChartsMobile chartData={chartData} metrics={metrics} labels={labels} />
    </MobileContentStack>
  );
}

export function QuotaInsightsMobileView(vm: Readonly<QuotaInsightsViewModel>): ReactElement {
  const { labels, loading, error, metrics, chartData, exportCsv } = vm;
  const [filtersOpen, setFiltersOpen] = useState(false);

  if (error) {
    return <MobileErrorState message={labels.errors.createFailed} />;
  }

  if (loading && vm.quotas.length === 0) {
    return (
      <MobilePageContainer>
        <MobilePageHeader title={labels.insightsTitle} breadcrumbs={mobileBreadcrumbs(labels)} />
        <Box aria-busy="true">
          <MobileLoadingState />
        </Box>
      </MobilePageContainer>
    );
  }

  return (
    <Fade in timeout={300}>
      <div>
        <MobilePageContainer>
          <MobilePageHeader
            title={labels.insightsTitle}
            breadcrumbs={mobileBreadcrumbs(labels)}
            actions={
              <MobileExportButton startIcon={<DownloadOutlined />} onClick={exportCsv}>
                {labels.actions.create}
              </MobileExportButton>
            }
          />

          <Box aria-busy={loading}>
            <MobileMetricCardGrid metrics={buildMobileMetrics(vm)} />

            {/* Collapsible Filters */}
            <MobileSectionPanel
              title={labels.insightsDateRangeLabel}
              actions={
                <IconButton
                  size="small"
                  aria-label={labels.insightsDateRangeLabel}
                  onClick={() => setFiltersOpen(v => !v)}
                >
                  <FilterListOutlined />
                </IconButton>
              }
            >
              <Collapse in={filtersOpen}>
                <MobileContentStack gap={1.5}>
                  <MobileFilterButton>{labels.insightsKindLabel}</MobileFilterButton>
                  <MobileFilterButton>{labels.insightsStatusLabel}</MobileFilterButton>
                  <MobileFilterButton>{labels.insightsStudentLabel}</MobileFilterButton>
                </MobileContentStack>
              </Collapse>
            </MobileSectionPanel>
          </Box>

          {/* Charts */}
          {renderMobileChartContent(loading, vm.quotas.length, chartData, metrics, labels)}
        </MobilePageContainer>
      </div>
    </Fade>
  );
}
