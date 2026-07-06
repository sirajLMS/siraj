"use client";

import { AddOutlined, CalendarMonthOutlined } from "@mui/icons-material";
import { Alert, Box, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import {
  DateNavigator,
  PageContainer,
  PageHeader,
  PaginationControls,
  PrimaryPageAction,
  SectionPanel,
} from "@/frontend/components/ui";
import { mergeSx } from "@/frontend/components/ui/mergeSx";
import type {
  StudentProgressFeedItem,
  TeacherDashboardMetrics,
  TeacherScheduleRow,
} from "@/frontend/stores/teacherDashboardTypes";
import { ActiveMobileScheduleCard } from "./components/ActiveMobileScheduleCard";
import { StudentProgressFeed } from "./components/StudentProgressFeed";
import { TeacherActiveMetricsRow } from "./components/TeacherActiveMetricsRow";
import { TeacherActiveScheduleDataGrid } from "./components/TeacherActiveScheduleDataGrid";
import { TeacherDashboardMetricsSection } from "./components/TeacherDashboardMetricsSection";
import type { TeacherDashboardLabels } from "./types/teacherDashboardLabels";
import { buildTeacherActiveMetricItems } from "./utils/buildTeacherDashboardMetrics";
import {
  teacherDashboardContentPaddingSx,
  teacherDashboardPageContainerSx,
} from "./utils/teacherDashboardMobileLayout";

interface TeacherDashboardActiveViewProps {
  readonly userName: string;
  readonly metrics: TeacherDashboardMetrics;
  readonly scheduleRows: readonly TeacherScheduleRow[];
  readonly progressFeed: readonly StudentProgressFeedItem[];
  readonly welcomeDateSummary: string;
  readonly sessionsScheduledToday: number;
  readonly labels: TeacherDashboardLabels;
  readonly lastUpdated: string;
  readonly onActivate?: (id: string) => void;
  readonly onNewSession: () => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
  readonly onViewAll?: () => void;
  readonly activationError?: string | null;
  readonly dateValue: string;
  readonly onDateChange: (date: string) => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

function formatWelcomeSubtitle(template: string, date: string, count: number): string {
  return template.replace("{date}", date).replace("{count}", String(count));
}

function formatActiveSessionsSummary(template: string, date: string, count: number): string {
  return template.replace("{date}", date).replace("{count}", String(count));
}

function MobileScheduleSection({
  scheduleRows,
  labels,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
  onViewAll,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: {
  readonly scheduleRows: readonly TeacherScheduleRow[];
  readonly labels: TeacherDashboardLabels;
  readonly onActivate?: (id: string) => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
  readonly onViewAll?: () => void;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}) {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={mergeSx(teacherDashboardContentPaddingSx, { display: "flex", justifyContent: "space-between", mb: 2 })}>
        <Typography sx={{ typography: "titleLg", color: theme => theme.palette.primary.main }}>
          {labels.schedule.titleToday}
        </Typography>
        <PrimaryPageAction variant="text" onClick={onViewAll} sx={{ minWidth: "auto", px: 0 }}>
          {labels.schedule.viewAll}
        </PrimaryPageAction>
      </Box>
      <Stack spacing={2}>
        {scheduleRows.map(row => (
          <ActiveMobileScheduleCard
            key={row.id}
            row={row}
            labels={labels}
            onActivate={onActivate}
            onStartSession={onStartSession}
            onMarkAbsent={onMarkAbsent}
            onRequestLeave={onRequestLeave}
          />
        ))}
      </Stack>
      {totalCount !== undefined && onPageChange && pageSize > 0 && Math.ceil(totalCount / pageSize) > 1 && (
        <PaginationControls
          page={page}
          pageCount={Math.ceil(totalCount / pageSize)}
          rowCount={totalCount}
          pageSize={pageSize}
          embedded
          onPageChange={onPageChange}
        />
      )}
    </Box>
  );
}

function DashboardMobileView({
  activationError,
  labels,
  userName,
  welcomeDateSummary,
  sessionsScheduledToday: _sessionsScheduledToday,
  metrics,
  dateValue,
  onDateChange,
  lastUpdated,
  scheduleRows,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
  onViewAll,
  progressFeed,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Readonly<TeacherDashboardActiveViewProps>) {
  return (
    <PageContainer sx={teacherDashboardPageContainerSx}>
      {activationError && (
        <Alert severity="error" sx={mergeSx(teacherDashboardContentPaddingSx, { mb: 3 })}>
          {activationError}
        </Alert>
      )}
      <Box sx={mergeSx(teacherDashboardContentPaddingSx, { mb: 3 })}>
        <Typography sx={{ typography: "labelUppercase", color: theme => theme.palette.text.secondary }}>
          {labels.activeWelcome.overviewLabel}
        </Typography>
        <Typography sx={theme => ({ typography: "headlineMd", color: theme.palette.primary.main, mt: 0.5 })}>
          {labels.activeWelcome.title.replace("{name}", userName)}
        </Typography>
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1, color: theme => theme.palette.text.secondary }}
        >
          <CalendarMonthOutlined sx={{ fontSize: 18 }} />
          <Typography sx={{ typography: "bodyMd" }}>
            {formatActiveSessionsSummary(
              labels.activeWelcome.mobileSummary,
              welcomeDateSummary,
              metrics.activeSessions ?? 0
            )}
          </Typography>
        </Box>
      </Box>

      <Box sx={mergeSx(teacherDashboardContentPaddingSx, { mb: 3 })}>
        <DateNavigator
          dateValue={dateValue}
          todayLabel={labels.dateFilter.today}
          previousDayLabel={labels.dateFilter.previousDay}
          nextDayLabel={labels.dateFilter.nextDay}
          dateLabel={labels.dateFilter.dateLabel}
          onDateChange={onDateChange}
        />
      </Box>

      <TeacherDashboardMetricsSection
        title={labels.pageTitle}
        lastUpdated={lastUpdated}
        metrics={buildTeacherActiveMetricItems(metrics, labels.activeMetrics)}
      />

      <MobileScheduleSection
        scheduleRows={scheduleRows}
        labels={labels}
        onActivate={onActivate}
        onStartSession={onStartSession}
        onMarkAbsent={onMarkAbsent}
        onRequestLeave={onRequestLeave}
        onViewAll={onViewAll}
        page={page ?? 0}
        pageSize={pageSize ?? 10}
        totalCount={totalCount}
        onPageChange={onPageChange}
      />

      <Box sx={teacherDashboardContentPaddingSx}>
        <StudentProgressFeed items={progressFeed} title={labels.progressFeed.title} />
      </Box>
    </PageContainer>
  );
}

function DashboardDesktopView({
  activationError,
  labels,
  userName,
  welcomeSubtitle,
  onNewSession,
  dateValue,
  onDateChange,
  metrics,
  scheduleRows,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Readonly<TeacherDashboardActiveViewProps> & { readonly welcomeSubtitle: string }) {
  return (
    <PageContainer>
      {activationError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {activationError}
        </Alert>
      )}
      <PageHeader
        title={labels.activeWelcome.title.replace("{name}", userName)}
        subtitle={welcomeSubtitle}
        actions={
          <PrimaryPageAction startIcon={<AddOutlined />} onClick={onNewSession}>
            {labels.actions.newSession}
          </PrimaryPageAction>
        }
      />

      <Box sx={{ mb: 3 }}>
        <DateNavigator
          dateValue={dateValue}
          todayLabel={labels.dateFilter.today}
          previousDayLabel={labels.dateFilter.previousDay}
          nextDayLabel={labels.dateFilter.nextDay}
          dateLabel={labels.dateFilter.dateLabel}
          onDateChange={onDateChange}
        />
      </Box>

      <Box sx={{ mb: 4 }}>
        <TeacherActiveMetricsRow metrics={metrics} labels={labels.activeMetrics} isMobile={false} />
      </Box>

      <SectionPanel title={labels.schedule.titleToday}>
        <TeacherActiveScheduleDataGrid
          rows={scheduleRows}
          labels={labels}
          onActivate={onActivate}
          onStartSession={onStartSession}
          onMarkAbsent={onMarkAbsent}
          onRequestLeave={onRequestLeave}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
        />
      </SectionPanel>
    </PageContainer>
  );
}

export function TeacherDashboardActiveView(props: Readonly<TeacherDashboardActiveViewProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const welcomeSubtitle = formatWelcomeSubtitle(
    props.labels.activeWelcome.subtitle,
    props.welcomeDateSummary,
    props.sessionsScheduledToday
  );

  if (isMobile) {
    return <DashboardMobileView {...props} />;
  }

  return <DashboardDesktopView {...props} welcomeSubtitle={welcomeSubtitle} />;
}
