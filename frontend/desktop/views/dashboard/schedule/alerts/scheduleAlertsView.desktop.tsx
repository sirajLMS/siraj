"use client";

import { FileDownloadOutlined, FilterListOutlined } from "@mui/icons-material";
import { Grid } from "@mui/material";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { ScheduleAlertsViewCommonProps } from "@/frontend/common/views/dashboard/schedule/alerts/__shared__/scheduleAlertsViewSharedProps";
import { buildAlertMetricItems } from "@/frontend/common/views/dashboard/schedule/alerts/components/__shared__/buildAlertMetricItems";
import {
  ScheduleAlertsLoadingIndicator,
  type ScheduleAlertsViewSharedProps,
} from "@/frontend/common/views/dashboard/schedule/alerts/components/__shared__/scheduleAlertsViewShared";
import type { AlertsMetric, ScheduleAlertsLabels } from "@/frontend/common/views/dashboard/schedule/alerts/types";
import {
  DesktopExportButton,
  DesktopFilterButton,
  DesktopPageContainer,
  DesktopPageHeader,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import {
  AcademicScheduleDataGridDesktop,
  type AcademicScheduleDataGridDesktopLabels,
} from "@/frontend/desktop/views/dashboard/schedule/alerts/components/academicScheduleDataGrid.desktop";
import { InstitutionalReportCardDesktop } from "@/frontend/desktop/views/dashboard/schedule/alerts/institutionalReportCard.desktop";
import { ScheduleAlertBannersDesktop } from "@/frontend/desktop/views/dashboard/schedule/alerts/scheduleAlertBanners.desktop";

export type ScheduleAlertsViewDesktopProps = ScheduleAlertsViewSharedProps;

function DesktopMetricsSection({
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
  const metricItems: MetricItem[] = buildAlertMetricItems(metrics, metricLabels);

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <DesktopMetricCardGrid metrics={metricItems} size={{ xs: 6, md: 3 }} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <InstitutionalReportCardDesktop
          title={labels.reportTitle}
          description={labels.reportDescription}
          downloadLabel={labels.downloadPdf}
          onDownload={onDownloadReport}
        />
      </Grid>
    </Grid>
  );
}

function DesktopAlertsBody({
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
}: ScheduleAlertsViewCommonProps<AcademicScheduleDataGridDesktopLabels>) {
  if (loading) {
    return <ScheduleAlertsLoadingIndicator loading={labels.loading} />;
  }
  return (
    <DesktopSectionPanel
      contentPadding={false}
      title={labels.sectionTitle}
      subTitle={labels.sectionSubtitle}
      actions={
        <>
          <DesktopFilterButton id="schedule-alerts-filter" startIcon={<FilterListOutlined />} onClick={onFilter}>
            {labels.filter}
          </DesktopFilterButton>
          <DesktopExportButton id="schedule-alerts-export" startIcon={<FileDownloadOutlined />} onClick={onExport}>
            {labels.export}
          </DesktopExportButton>
        </>
      }
    >
      <AcademicScheduleDataGridDesktop
        rows={classes}
        page={currentPage}
        pageSize={pageSize}
        totalClasses={totalClasses}
        labels={contentLabels}
        onLeave={onLeave}
        onViewClassAudit={onViewClassAudit}
        onPageChange={onPageChange}
        loading={loading}
      />
    </DesktopSectionPanel>
  );
}

export function ScheduleAlertsViewDesktop({
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
}: Readonly<ScheduleAlertsViewDesktopProps>) {
  const gridLabels: AcademicScheduleDataGridDesktopLabels = {
    className: labels.className,
    instructor: labels.instructor,
    time: labels.time,
    room: labels.room,
    status: labels.status,
    joinSession: labels.joinSession,
    leaveClass: labels.leaveClass,
    leaveDisabledReason: labels.leaveDisabledReason,
    viewClassAudit: labels.viewClassAudit,
    contactAdmin: labels.contactAdmin,
    active: labels.active,
    upcoming: labels.upcoming,
    missed: labels.missed,
    hold: labels.hold,
    noEntries: labels.noEntries,
  };

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />

      <ScheduleAlertBannersDesktop alerts={alerts} labels={labels.alertMessages} />

      <DesktopMetricsSection
        metrics={metrics}
        metricLabels={metricLabels}
        labels={labels}
        onDownloadReport={onDownloadReport}
      />

      <DesktopAlertsBody
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
        contentLabels={gridLabels}
      />
    </DesktopPageContainer>
  );
}
