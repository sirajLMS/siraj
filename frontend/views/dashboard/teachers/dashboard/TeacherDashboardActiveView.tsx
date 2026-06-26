"use client";

import { AddOutlined, CalendarMonthOutlined } from "@mui/icons-material";
import { Alert, Box, Paper, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import {
  DateNavigator,
  PageContainer,
  PageHeader,
  PaginationControls,
  PrimaryPageAction,
  SectionPanel,
} from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import type {
  StudentProgressFeedItem,
  TeacherDashboardMetrics,
  TeacherScheduleRow,
} from "@/frontend/stores/teacherDashboardTypes";
import { SessionActivateButton } from "./components/SessionActivateButton";
import { StudentProgressFeed } from "./components/StudentProgressFeed";
import { TeacherActiveMetricsRow } from "./components/TeacherActiveMetricsRow";
import { TeacherActiveScheduleDataGrid } from "./components/TeacherActiveScheduleDataGrid";
import { TeacherActiveSessionControls } from "./components/TeacherActiveSessionControls";
import type { TeacherDashboardLabels } from "./types/teacherDashboardLabels";

interface TeacherDashboardActiveViewProps {
  readonly userName: string;
  readonly metrics: TeacherDashboardMetrics;
  readonly scheduleRows: readonly TeacherScheduleRow[];
  readonly progressFeed: readonly StudentProgressFeedItem[];
  readonly welcomeDateSummary: string;
  readonly sessionsScheduledToday: number;
  readonly labels: TeacherDashboardLabels;
  readonly onActivate?: (id: string) => void;
  readonly onNewSession: () => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
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

function ActiveMobileScheduleCard({
  row,
  labels,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
}: {
  readonly row: TeacherScheduleRow;
  readonly labels: TeacherDashboardLabels;
  readonly onActivate?: (id: string) => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
}) {
  const isLive = row.isLive === true;

  return (
    <Paper
      variant="outlined"
      sx={theme => ({
        p: 2.5,
        borderColor: isLive ? theme.palette.header : theme.palette.border.light,
        borderLeftWidth: isLive ? 4 : 1,
        boxShadow: isLive ? theme.palette.shadow.card : undefined,
      })}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box>
          {isLive && (
            <Typography
              sx={{ typography: "labelUppercase", color: theme => theme.palette.error.main, fontWeight: 700 }}
            >
              {labels.activeControls.liveNow}
            </Typography>
          )}
          <Typography sx={{ typography: "titleLg" }}>{row.courseTitle ?? row.classId}</Typography>
          {row.locationLabel && (
            <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
              {row.locationLabel}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography sx={{ typography: "bodyLg", fontWeight: 700 }}>{row.timeRange}</Typography>
          {row.durationMinutes && (
            <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
              {labels.schedule.durationValue.replace("{minutes}", String(row.durationMinutes))}
            </Typography>
          )}
        </Box>
      </Box>

      {isLive ? (
        <Box sx={{ pt: 2, borderTop: theme => `1px solid ${theme.palette.border.light}` }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
              {labels.activeControls.sessionControls}
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TeacherActiveSessionControls
                labels={labels.activeControls}
                onStart={() => onStartSession?.(row.id)}
                onMarkAbsent={() => onMarkAbsent?.(row.id)}
                onRequestLeave={() => onRequestLeave?.(row.id)}
              />
            </Box>
          </Box>
        </Box>
      ) : (
        <Box sx={{ width: "100%" }}>
          <RequirePermission permissions={[AppPermission.SessionActivateClass]}>
            <SessionActivateButton
              disabled={!row.activateEnabled}
              isConnecting={row.status === "connecting"}
              activateLabel={labels.actions.activateSession}
              connectingLabel={labels.actions.connecting}
              onActivate={() => onActivate?.(row.id)}
            />
          </RequirePermission>
        </Box>
      )}
    </Paper>
  );
}

export function TeacherDashboardActiveView({
  userName,
  metrics,
  scheduleRows,
  progressFeed,
  welcomeDateSummary,
  sessionsScheduledToday,
  labels,
  onActivate,
  onNewSession,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
  activationError,
  dateValue,
  onDateChange,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
}: Readonly<TeacherDashboardActiveViewProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const welcomeSubtitle = formatWelcomeSubtitle(
    labels.activeWelcome.subtitle,
    welcomeDateSummary,
    sessionsScheduledToday
  );

  if (isMobile) {
    return (
      <PageContainer>
        {activationError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {activationError}
          </Alert>
        )}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ typography: "labelUppercase", color: theme => theme.palette.text.secondary }}>
            {labels.activeWelcome.overviewLabel}
          </Typography>
          <Typography sx={{ typography: "headlineMd", color: theme.palette.primary.main, mt: 0.5 }}>
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
          <TeacherActiveMetricsRow metrics={metrics} labels={labels.activeMetrics} isMobile={true} />
        </Box>

        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography sx={{ typography: "titleLg", color: theme.palette.primary.main }}>
              {labels.schedule.titleToday}
            </Typography>
            <Typography sx={{ typography: "labelUppercase", color: theme.palette.primary.main, fontWeight: 700 }}>
              {labels.schedule.viewAll}
            </Typography>
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

        <StudentProgressFeed items={progressFeed} title={labels.progressFeed.title} />
      </PageContainer>
    );
  }

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
