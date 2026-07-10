"use client";

import { FileDownloadOutlined, FilterListOutlined, IosShareOutlined } from "@mui/icons-material";
import { Box, Grid, IconButton, type Theme, Typography, useMediaQuery } from "@mui/material";
import {
  ExportButton,
  FilterButton,
  MetricCard,
  PageContainer,
  PageHeader,
  SectionPanel,
} from "@/frontend/components/ui";
import { AcademicScheduleCardList } from "@/frontend/views/dashboard/schedule/alerts/AcademicScheduleCardList";
import {
  AcademicScheduleDataGrid,
  type AcademicScheduleDataGridLabels,
} from "@/frontend/views/dashboard/schedule/alerts/AcademicScheduleDataGrid";
import { InstitutionalReportCard } from "@/frontend/views/dashboard/schedule/alerts/InstitutionalReportCard";
import { ScheduleAlertBanners } from "@/frontend/views/dashboard/schedule/alerts/ScheduleAlertBanners";
import type {
  AcademicClassRow,
  AlertsMetric,
  ScheduleAlert,
  ScheduleAlertType,
} from "@/frontend/views/dashboard/schedule/alerts/types";

export interface ScheduleAlertsLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly alertMessages: Record<ScheduleAlertType, string>;
  readonly reportTitle: string;
  readonly reportDescription: string;
  readonly reportDescriptionMobile: string;
  readonly downloadPdf: string;
  readonly sectionTitle: string;
  readonly sectionSubtitle: string;
  readonly filter: string;
  readonly export: string;
  readonly className: string;
  readonly instructor: string;
  readonly time: string;
  readonly room: string;
  readonly status: string;
  readonly joinSession: string;
  readonly leaveClass: string;
  readonly viewClassAudit: string;
  readonly showingOf: string;
  readonly active: string;
  readonly upcoming: string;
  readonly missed: string;
  readonly endOfSchedule: string;
  readonly noEntries: string;
  readonly loading: string;
}

interface ScheduleAlertsViewProps {
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

type CardListLabels = {
  readonly joinSession: string;
  readonly leaveClass: string;
  readonly viewClassAudit: string;
  readonly active: string;
  readonly upcoming: string;
  readonly missed: string;
  readonly endOfSchedule: string;
};

const MetricsSection = ({
  metrics,
  metricLabels,
  labels,
  isMobile,
  onDownloadReport,
}: {
  metrics: readonly AlertsMetric[];
  metricLabels: Record<string, { label: string; subLabel: string }>;
  labels: ScheduleAlertsLabels;
  isMobile: boolean;
  onDownloadReport: () => void;
}) => {
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
          description={isMobile ? labels.reportDescriptionMobile : labels.reportDescription}
          downloadLabel={labels.downloadPdf}
          onDownload={onDownloadReport}
        />
      </Grid>
    </Grid>
  );
};

const MobileAlertsLayout = ({
  labels,
  classes,
  totalCount,
  currentPage,
  pageSize,
  onFilter,
  onExport,
  onLeave,
  onViewClassAudit,
  onPageChange,
  cardListLabels,
}: {
  labels: ScheduleAlertsLabels;
  classes: readonly AcademicClassRow[];
  totalCount?: number;
  currentPage: number;
  pageSize: number;
  onFilter: () => void;
  onExport: () => void;
  onLeave: (id: string) => void;
  onViewClassAudit: (id: string) => void;
  onPageChange: (page: number) => void;
  cardListLabels: CardListLabels;
}) => {
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main })}>
          {labels.sectionTitle}
        </Typography>
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
      </Box>
      <AcademicScheduleCardList
        rows={classes}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        labels={cardListLabels}
        onLeave={onLeave}
        onViewClassAudit={onViewClassAudit}
        onPageChange={onPageChange}
      />
    </Box>
  );
};

const DesktopAlertsLayout = ({
  labels,
  classes,
  totalClasses,
  currentPage,
  pageSize,
  loading,
  onFilter,
  onExport,
  onLeave,
  onViewClassAudit,
  onPageChange,
  gridLabels,
}: {
  labels: ScheduleAlertsLabels;
  classes: readonly AcademicClassRow[];
  totalClasses?: number;
  currentPage: number;
  pageSize: number;
  loading?: boolean;
  onFilter: () => void;
  onExport: () => void;
  onLeave: (id: string) => void;
  onViewClassAudit: (id: string) => void;
  onPageChange: (page: number) => void;
  gridLabels: AcademicScheduleDataGridLabels;
}) => {
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
};

interface ScheduleBodyProps {
  readonly loading: boolean | undefined;
  readonly isMobile: boolean;
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
  readonly cardListLabels: CardListLabels;
  readonly gridLabels: AcademicScheduleDataGridLabels;
}

function renderScheduleBody(props: ScheduleBodyProps) {
  if (props.loading) {
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
        <Typography variant="bodyLg">{props.labels.loading}</Typography>
      </Box>
    );
  }
  if (props.isMobile) {
    return (
      <MobileAlertsLayout
        labels={props.labels}
        classes={props.classes}
        totalCount={props.totalClasses}
        currentPage={props.currentPage}
        pageSize={props.pageSize}
        onFilter={props.onFilter}
        onExport={props.onExport}
        onLeave={props.onLeave}
        onViewClassAudit={props.onViewClassAudit}
        onPageChange={props.onPageChange}
        cardListLabels={props.cardListLabels}
      />
    );
  }
  return (
    <DesktopAlertsLayout
      labels={props.labels}
      classes={props.classes}
      totalClasses={props.totalClasses}
      currentPage={props.currentPage}
      pageSize={props.pageSize}
      onFilter={props.onFilter}
      onExport={props.onExport}
      onLeave={props.onLeave}
      onViewClassAudit={props.onViewClassAudit}
      onPageChange={props.onPageChange}
      gridLabels={props.gridLabels}
    />
  );
}

export function ScheduleAlertsView({
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
}: ScheduleAlertsViewProps) {
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  const gridLabels: AcademicScheduleDataGridLabels = {
    className: labels.className,
    instructor: labels.instructor,
    time: labels.time,
    room: labels.room,
    status: labels.status,
    joinSession: labels.joinSession,
    leaveClass: labels.leaveClass,
    viewClassAudit: labels.viewClassAudit,
    active: labels.active,
    upcoming: labels.upcoming,
    missed: labels.missed,
    noEntries: labels.noEntries,
  };

  const cardListLabels: CardListLabels = {
    joinSession: labels.joinSession,
    leaveClass: labels.leaveClass,
    viewClassAudit: labels.viewClassAudit,
    active: labels.active,
    upcoming: labels.upcoming,
    missed: labels.missed,
    endOfSchedule: labels.endOfSchedule,
  };

  const scheduleBody = renderScheduleBody({
    loading,
    isMobile,
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
    gridLabels,
  });

  return (
    <PageContainer>
      <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />

      <ScheduleAlertBanners alerts={alerts} labels={labels.alertMessages} />

      <MetricsSection
        metrics={metrics}
        metricLabels={metricLabels}
        labels={labels}
        isMobile={isMobile}
        onDownloadReport={onDownloadReport}
      />

      {scheduleBody}
    </PageContainer>
  );
}
