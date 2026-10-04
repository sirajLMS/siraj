"use client";

import { FileDownloadOutlined, FilterListOutlined } from "@mui/icons-material";
import { Grid } from "@mui/material";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { ScheduleAlertsViewCommonProps } from "@/frontend/common/views/dashboard/schedule/alerts/__shared__/scheduleAlertsViewSharedProps";
import { buildAlertMetricItems } from "@/frontend/common/views/dashboard/schedule/alerts/components/__shared__/buildAlertMetricItems";
import { ScheduleAlertsLoadingIndicator } from "@/frontend/common/views/dashboard/schedule/alerts/components/__shared__/scheduleAlertsViewShared";
import type { AlertsMetric, ScheduleAlertsLabels } from "@/frontend/common/views/dashboard/schedule/alerts/types";
import { DesktopExportButton, DesktopFilterButton, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import {
  AcademicScheduleDataGridDesktop,
  type AcademicScheduleDataGridDesktopLabels,
} from "@/frontend/desktop/views/dashboard/schedule/alerts/components/academicScheduleDataGrid.desktop";
import { InstitutionalReportCardDesktop } from "@/frontend/desktop/views/dashboard/schedule/alerts/institutionalReportCard.desktop";

export function DesktopMetricsSection({
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

export function DesktopAlertsBody({
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
