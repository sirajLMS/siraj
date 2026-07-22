"use client";

import { FilterListOutlined, IosShareOutlined } from "@mui/icons-material";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type {
  AcademicClassRow,
  AlertsMetric,
  ScheduleAlert,
  ScheduleAlertsLabels,
} from "@/frontend/common/views/dashboard/schedule/alerts/types";
import {
  MobileContentInset,
  MobileContentStack,
  MobileMetricCardGrid,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionTitleRow,
} from "@/frontend/mobile/components/ui";
import {
  AcademicScheduleCardListMobile,
  type AcademicScheduleCardListMobileLabels,
} from "@/frontend/mobile/views/dashboard/schedule/alerts/components/academicScheduleCardList.mobile";
import { InstitutionalReportCardMobile } from "@/frontend/mobile/views/dashboard/schedule/alerts/institutionalReportCard.mobile";
import { ScheduleAlertBannersMobile } from "@/frontend/mobile/views/dashboard/schedule/alerts/scheduleAlertBanners.mobile";

export interface ScheduleAlertsViewMobileProps {
  readonly alerts: readonly ScheduleAlert[];
  readonly metrics: readonly AlertsMetric[];
  readonly metricLabels: Record<string, { label: string; subLabel: string }>;
  readonly classes: readonly AcademicClassRow[];
  readonly totalClasses?: number;
  readonly currentPage: number;
  readonly pageSize: number;
  readonly labels: ScheduleAlertsLabels;
  readonly onLeave: (id: string) => void;
  readonly onViewClassAudit: (id: string) => void;
  readonly onPageChange: (page: number) => void;
  readonly loading?: boolean;
  readonly onDownloadReport: () => void;
  readonly onFilter: () => void;
  readonly onExport: () => void;
}

function MobileMetricsSection({
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
    () =>
      metrics.map(metric => {
        const metricLabel = metricLabels[metric.key];
        return {
          key: metric.key,
          count: metric.value,
          label: metricLabel.label,
          subLabel: metricLabel.subLabel,
          icon: metric.icon,
          labelKey: metric.labelKey,
        };
      }),
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

function MobileAlertsBody({
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
  cardListLabels,
}: {
  readonly loading: boolean | undefined;
  readonly labels: ScheduleAlertsLabels;
  readonly classes: readonly AcademicClassRow[];
  readonly totalClasses?: number;
  readonly currentPage: number;
  readonly pageSize: number;
  readonly onFilter: () => void;
  readonly onExport: () => void;
  readonly onLeave: (id: string) => void;
  readonly onViewClassAudit: (id: string) => void;
  readonly onPageChange: (page: number) => void;
  readonly cardListLabels: AcademicScheduleCardListMobileLabels;
}) {
  if (loading) {
    return (
      <Box
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 8,
          color: theme.palette.text.secondary,
        })}
      >
        <Typography variant="bodyLg">{labels.loading}</Typography>
      </Box>
    );
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
              sx={theme => ({
                width: 40,
                height: 40,
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.border.light}`,
                color: theme.palette.primary.main,
              })}
              aria-label={labels.filter}
            >
              <FilterListOutlined />
            </IconButton>
            <IconButton
              id="schedule-alerts-export-mobile"
              onClick={onExport}
              sx={theme => ({
                width: 40,
                height: 40,
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.border.light}`,
                color: theme.palette.primary.main,
              })}
              aria-label={labels.export}
            >
              <IosShareOutlined />
            </IconButton>
          </Box>
        }
      />
      <AcademicScheduleCardListMobile
        rows={classes}
        labels={cardListLabels}
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

export function ScheduleAlertsViewMobile({
  alerts,
  metrics,
  metricLabels,
  classes,
  totalClasses,
  currentPage,
  pageSize,
  labels,
  onLeave,
  onViewClassAudit,
  onPageChange,
  loading = false,
  onDownloadReport,
  onFilter,
  onExport,
}: Readonly<ScheduleAlertsViewMobileProps>) {
  const cardListLabels: AcademicScheduleCardListMobileLabels = {
    joinSession: labels.joinSession,
    leaveClass: labels.leaveClass,
    leaveDisabledReason: labels.leaveDisabledReason,
    viewClassAudit: labels.viewClassAudit,
    contactAdmin: labels.contactAdmin,
    active: labels.active,
    upcoming: labels.upcoming,
    missed: labels.missed,
    hold: labels.hold,
    endOfSchedule: labels.endOfSchedule,
  };

  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />

      <MobileContentStack gap={2} paddingBottom={4}>
        <ScheduleAlertBannersMobile alerts={alerts} labels={labels.alertMessages} />

        <MobileMetricsSection
          metrics={metrics}
          metricLabels={metricLabels}
          labels={labels}
          onDownloadReport={onDownloadReport}
        />

        <MobileAlertsBody
          loading={loading}
          labels={labels}
          classes={classes}
          totalClasses={totalClasses}
          currentPage={currentPage}
          pageSize={pageSize}
          onFilter={onFilter}
          onExport={onExport}
          onLeave={onLeave}
          onViewClassAudit={onViewClassAudit}
          onPageChange={onPageChange}
          cardListLabels={cardListLabels}
        />
      </MobileContentStack>
    </MobilePageContainer>
  );
}
