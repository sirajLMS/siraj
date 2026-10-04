"use client";

import { FilterListOutlined, IosShareOutlined } from "@mui/icons-material";
import { Box, IconButton, Stack, type Theme, Typography } from "@mui/material";
import { useMemo } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { ScheduleAlertsViewCommonProps } from "@/frontend/common/views/dashboard/schedule/alerts/__shared__/scheduleAlertsViewSharedProps";
import { buildAlertMetricItems } from "@/frontend/common/views/dashboard/schedule/alerts/components/__shared__/buildAlertMetricItems";
import { ScheduleAlertsLoadingIndicator } from "@/frontend/common/views/dashboard/schedule/alerts/components/__shared__/scheduleAlertsViewShared";
import type { AlertsMetric, ScheduleAlertsLabels } from "@/frontend/common/views/dashboard/schedule/alerts/types";
import { MobileContentInset, MobileMetricCardGrid, MobileSectionTitleRow } from "@/frontend/mobile/components/ui";
import {
  AcademicScheduleCardListMobile,
  type AcademicScheduleCardListMobileLabels,
} from "@/frontend/mobile/views/dashboard/schedule/alerts/components/academicScheduleCardList.mobile";
import { InstitutionalReportCardMobile } from "@/frontend/mobile/views/dashboard/schedule/alerts/institutionalReportCard.mobile";

const headerActionSx = (theme: Theme) => ({
  width: 40,
  height: 40,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.border.light}`,
  color: theme.palette.primary.main,
});

export function MobileMetricsSection({
  metrics,
  metricLabels,
  labels,
  onDownloadReport,
}: {
  readonly metrics: readonly AlertsMetric[];
  readonly metricLabels: Record<string, { label: string; subLabel: string }>;
  readonly labels: ScheduleAlertsLabels;
  readonly onDownloadReport: () => void;
}) {
  const metricItems: readonly MetricItem[] = useMemo(
    () => buildAlertMetricItems(metrics, metricLabels),
    [metricLabels, metrics]
  );

  return (
    <Stack spacing={2}>
      <MobileMetricCardGrid metrics={metricItems} />
      <MobileContentInset>
        <InstitutionalReportCardMobile
          title={labels.reportTitle}
          description={labels.reportDescriptionMobile}
          downloadLabel={labels.downloadPdf}
          onDownload={onDownloadReport}
        />
      </MobileContentInset>
    </Stack>
  );
}

export function MobileAlertsBody({
  loading,
  labels,
  classes,
  totalClasses,
  currentPage,
  pageSize,
  onFilter,
  onExport,
  onLeave,
  onViewClassAudit,
  onPageChange,
  contentLabels,
}: ScheduleAlertsViewCommonProps<AcademicScheduleCardListMobileLabels>) {
  if (loading) {
    return <ScheduleAlertsLoadingIndicator loading={labels.loading} />;
  }
  return (
    <Box>
      <MobileSectionTitleRow
        title={
          <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main })}>
            {labels.sectionTitle}
          </Typography>
        }
        actions={
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton
              id="schedule-alerts-filter-mobile"
              onClick={onFilter}
              sx={headerActionSx}
              aria-label={labels.filter}
            >
              <FilterListOutlined />
            </IconButton>
            <IconButton
              id="schedule-alerts-export-mobile"
              onClick={onExport}
              sx={headerActionSx}
              aria-label={labels.export}
            >
              <IosShareOutlined />
            </IconButton>
          </Box>
        }
      />
      <AcademicScheduleCardListMobile
        rows={classes}
        labels={contentLabels}
        paginationOptions={buildServerPaginationOptions({
          page: currentPage,
          pageSize,
          totalCount: totalClasses ?? 0,
          onPageChange,
        })}
        onLeave={onLeave}
        onViewClassAudit={onViewClassAudit}
      />
    </Box>
  );
}
