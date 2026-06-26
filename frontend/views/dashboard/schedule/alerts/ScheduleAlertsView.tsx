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
import type {
  AcademicClassRow,
  AlertsMetric,
  ScheduleAlert,
  ScheduleAlertType,
} from "./types";
import { AcademicScheduleCardList } from "./AcademicScheduleCardList";
import { AcademicScheduleDataGrid, type AcademicScheduleDataGridLabels } from "./AcademicScheduleDataGrid";
import { InstitutionalReportCard } from "./InstitutionalReportCard";
import { ScheduleAlertBanners } from "./ScheduleAlertBanners";

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
  readonly viewRecording: string;
  readonly showingOf: string;
  readonly active: string;
  readonly upcoming: string;
  readonly missed: string;
  readonly endOfSchedule: string;
  readonly noEntries: string;
}

interface ScheduleAlertsViewProps {
  readonly alerts: readonly ScheduleAlert[];
  readonly metrics: readonly AlertsMetric[];
  readonly metricLabels: Record<string, { label: string; subLabel: string }>;
  readonly classes: readonly AcademicClassRow[];
  readonly totalClasses: number;
  readonly currentPage: number;
  readonly pageSize: number;
  readonly labels: ScheduleAlertsLabels;
  readonly onJoin: (id: string) => void;
  readonly onLeave: (id: string) => void;
  readonly onPageChange: (page: number) => void;
  readonly onDownloadReport: () => void;
  readonly onFilter: () => void;
  readonly onExport: () => void;
}

type CardListLabels = {
  readonly joinSession: string;
  readonly leaveClass: string;
  readonly viewRecording: string;
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
  onFilter,
  onExport,
  onJoin,
  onLeave,
  cardListLabels,
}: {
  labels: ScheduleAlertsLabels;
  classes: readonly AcademicClassRow[];
  onFilter: () => void;
  onExport: () => void;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
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
      <AcademicScheduleCardList rows={classes} labels={cardListLabels} onJoin={onJoin} onLeave={onLeave} />
    </Box>
  );
};

const DesktopAlertsLayout = ({
  labels,
  classes,
  totalClasses,
  currentPage,
  pageSize,
  onFilter,
  onExport,
  onJoin,
  onLeave,
  onPageChange,
  gridLabels,
}: {
  labels: ScheduleAlertsLabels;
  classes: readonly AcademicClassRow[];
  totalClasses: number;
  currentPage: number;
  pageSize: number;
  onFilter: () => void;
  onExport: () => void;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
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
        totalClasses={totalClasses}
        currentPage={currentPage}
        pageSize={pageSize}
        labels={gridLabels}
        onJoin={onJoin}
        onLeave={onLeave}
        onPageChange={onPageChange}
      />
    </SectionPanel>
  );
};

export function ScheduleAlertsView({
  alerts,
  metrics,
  metricLabels,
  classes,
  totalClasses,
  currentPage,
  pageSize,
  labels,
  onJoin,
  onLeave,
  onPageChange,
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
    viewRecording: labels.viewRecording,
    active: labels.active,
    upcoming: labels.upcoming,
    missed: labels.missed,
    noEntries: labels.noEntries,
  };

  const cardListLabels: CardListLabels = {
    joinSession: labels.joinSession,
    leaveClass: labels.leaveClass,
    viewRecording: labels.viewRecording,
    active: labels.active,
    upcoming: labels.upcoming,
    missed: labels.missed,
    endOfSchedule: labels.endOfSchedule,
  };

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

      {isMobile ? (
        <MobileAlertsLayout
          labels={labels}
          classes={classes}
          onFilter={onFilter}
          onExport={onExport}
          onJoin={onJoin}
          onLeave={onLeave}
          cardListLabels={cardListLabels}
        />
      ) : (
        <DesktopAlertsLayout
          labels={labels}
          classes={classes}
          totalClasses={totalClasses}
          currentPage={currentPage}
          pageSize={pageSize}
          onFilter={onFilter}
          onExport={onExport}
          onJoin={onJoin}
          onLeave={onLeave}
          onPageChange={onPageChange}
          gridLabels={gridLabels}
        />
      )}
    </PageContainer>
  );
}
