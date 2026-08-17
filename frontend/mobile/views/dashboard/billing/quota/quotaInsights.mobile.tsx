"use client";

import { DownloadOutlined, FilterListOutlined } from "@mui/icons-material";
import { Box, Collapse, Fade, IconButton, Skeleton } from "@mui/material";
import { type ReactElement, useState } from "react";
import type { QuotaInsightsViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaInsightsViewModel";
import {
  buildQuotaInsightsMetrics,
  quotaInsightsBreadcrumbs,
} from "@/frontend/common/views/dashboard/billing/quota/utils";
import { MobileExportButton, MobileFilterButton } from "@/frontend/mobile/components/ui/button";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui/card/MobileMetricCardGrid";
import { MobileContentStack } from "@/frontend/mobile/components/ui/container/MobileContentStack";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container/MobileSectionPanel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui/container/page";
import { MobileErrorState, MobileLoadingState } from "@/frontend/mobile/components/ui/state";
import { QuotaInsightsChartsMobile } from "@/frontend/mobile/views/dashboard/billing/quota/components/QuotaInsightsChartsMobile";

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
        <MobilePageHeader title={labels.insightsTitle} breadcrumbs={quotaInsightsBreadcrumbs(labels)} />
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
            breadcrumbs={quotaInsightsBreadcrumbs(labels)}
            actions={
              <MobileExportButton startIcon={<DownloadOutlined />} onClick={exportCsv}>
                {labels.actions.create}
              </MobileExportButton>
            }
          />

          <Box aria-busy={loading}>
            <MobileMetricCardGrid metrics={buildQuotaInsightsMetrics(vm)} />

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
