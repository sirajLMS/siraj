"use client";

import { FileDownloadOutlined, FilterListOutlined } from "@mui/icons-material";
import { Box, Grid, Typography } from "@mui/material";
import { ExportButton, FilterButton, PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import { MetricCard } from "@/frontend/components/ui/card/MetricCard";
import {
  AcademicScheduleDataGrid,
  type AcademicScheduleDataGridLabels,
} from "@/frontend/views/dashboard/schedule/alerts/AcademicScheduleDataGrid";
import { InstitutionalReportCard } from "@/frontend/views/dashboard/schedule/alerts/InstitutionalReportCard";
import { ScheduleAlertBanners } from "@/frontend/views/dashboard/schedule/alerts/ScheduleAlertBanners";
import type { ScheduleAlertsLabels } from "@/frontend/views/dashboard/schedule/alerts/ScheduleAlertsView";
import type { AcademicClassRow, AlertsMetric, ScheduleAlert } from "@/frontend/views/dashboard/schedule/alerts/types";

export interface ScheduleAlertsViewDesktopProps {
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
  return (
    <Grid container spacing={2}>
      {metrics.map(metric => {
        const metricLabel = metricLabels[metric.key];
        return (
          <Grid key={metric.key} size={{ xs: 6, md: 3 }}>
            <MetricCard
              icon={metric.icon}
              label={metricLabel.label}
              value={metric.value}
              subLabel={metricLabel.subLabel}
              variant="compact"
            />
          </Grid>
        );
      })}
      <Grid size={{ xs: 12, md: 6 }}>
        <InstitutionalReportCard
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
  gridLabels,
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
  readonly gridLabels: AcademicScheduleDataGridLabels;
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
    <SectionPanel
      title={labels.sectionTitle}
      subTitle={labels.sectionSubtitle}
      actions={
        <>
          <FilterButton id="schedule-alerts-filter" startIcon={<FilterListOutlined />} onClick={onFilter}>
            {labels.filter}
          </FilterButton>
          <ExportButton id="schedule-alerts-export" startIcon={<FileDownloadOutlined />} onClick={onExport}>
            {labels.export}
          </ExportButton>
        </>
      }
    >
      <AcademicScheduleDataGrid
        rows={classes}
        page={currentPage}
        pageSize={pageSize}
        totalClasses={totalClasses}
        labels={gridLabels}
        onLeave={onLeave}
        onViewClassAudit={onViewClassAudit}
        onPageChange={onPageChange}
        loading={loading}
      />
    </SectionPanel>
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
  const gridLabels: AcademicScheduleDataGridLabels = {
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
    <PageContainer>
      <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />

      <ScheduleAlertBanners alerts={alerts} labels={labels.alertMessages} />

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
        gridLabels={gridLabels}
      />
    </PageContainer>
  );
}
