"use client";

import { CalendarMonthOutlined } from "@mui/icons-material";
import { Alert, Box, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import {
  DateNavigator,
  PageContainer,
  PageHeader,
  PaginationControls,
  PrimaryPageAction,
  SectionPanel,
  StatusBadge,
} from "@/frontend/components/ui";
import { mergeSx } from "@/frontend/components/ui/mergeSx";
import type {
  MissedClassAlert,
  StudentProgressFeedItem,
  TeacherDashboardMetrics,
  TeacherScheduleRow,
} from "@/frontend/stores/teacherDashboardTypes";
import { ParentSupportFab } from "@/frontend/views/dashboard/parents/dashboard/components/ParentSupportFab";
import { ActivationPolicyPanel } from "./components/ActivationPolicyPanel";
import { MissedClassAlertBanner } from "./components/MissedClassAlertBanner";
import { StudentProgressFeed } from "./components/StudentProgressFeed";
import { TeacherActiveMetricsRow } from "./components/TeacherActiveMetricsRow";
import { TeacherDashboardMetricsSection } from "./components/TeacherDashboardMetricsSection";
import { TeacherScheduleCardList } from "./components/TeacherScheduleCardList";
import { TeacherScheduleDataGrid } from "./components/TeacherScheduleDataGrid";
import type { TeacherDashboardViewLabels } from "./types/teacherDashboardLabels";
import { buildTeacherActiveMetricItems } from "./utils/buildTeacherDashboardMetrics";
import {
  teacherDashboardContentPaddingSx,
  teacherDashboardPageContainerSx,
} from "./utils/teacherDashboardMobileLayout";

interface TeacherDashboardViewProps {
  readonly userName: string;
  readonly metrics: TeacherDashboardMetrics;
  readonly scheduleRows: readonly TeacherScheduleRow[];
  readonly progressFeed: readonly StudentProgressFeedItem[];
  readonly missedAlert: MissedClassAlert | null;
  readonly scheduleDateLabel: string;
  readonly welcomeDateSummary: string;
  readonly labels: TeacherDashboardViewLabels;
  readonly lastUpdated: string;
  readonly activationError: string | null;
  readonly canActivate: boolean;
  readonly canManualEntry: boolean;
  readonly canPrintSchedule: boolean;
  readonly onPrintSchedule: () => void;
  readonly onManualEntry: () => void;
  readonly onNewSession: () => void;
  readonly onJoinVideo: (id: string) => void;
  readonly onActivate?: (id: string) => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
  readonly onViewAll?: () => void;
  readonly onDownloadHandbook: () => void;
  readonly onContactCoordinator: () => void;
  readonly onSupport: () => void;
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

export function TeacherDashboardView({
  userName,
  metrics,
  scheduleRows,
  progressFeed,
  missedAlert,
  scheduleDateLabel,
  welcomeDateSummary,
  labels,
  lastUpdated,
  activationError,
  canActivate,
  onJoinVideo,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
  onViewAll,
  onDownloadHandbook,
  onContactCoordinator,
  onSupport,
  dateValue,
  onDateChange,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
}: Readonly<TeacherDashboardViewProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const welcomeSubtitle = formatWelcomeSubtitle(labels.activeWelcome.subtitle, welcomeDateSummary, scheduleRows.length);

  const pageCount = totalCount !== undefined && pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;
  const schedulePanelActions = isMobile ? (
    <PrimaryPageAction variant="text" onClick={onViewAll} sx={{ minWidth: "auto", px: 0 }}>
      {labels.schedule.viewAll}
    </PrimaryPageAction>
  ) : (
    <StatusBadge category="session" status="pending" label={labels.todayChip} />
  );

  return (
    <>
      {missedAlert && !isMobile && <MissedClassAlertBanner alert={missedAlert} labels={labels.alert} fixed />}

      <PageContainer sx={mergeSx(teacherDashboardPageContainerSx, missedAlert && !isMobile ? { pt: 10 } : undefined)}>
        {activationError && (
          <Alert severity="error" sx={teacherDashboardContentPaddingSx}>
            {activationError}
          </Alert>
        )}

        {missedAlert && isMobile && (
          <Box sx={teacherDashboardContentPaddingSx}>
            <MissedClassAlertBanner alert={missedAlert} labels={labels.alert} />
          </Box>
        )}

        {isMobile ? (
          <Stack sx={mergeSx(teacherDashboardContentPaddingSx, { gap: 1 })}>
            <Typography sx={theme => ({ typography: "headlineMd", color: theme.palette.primary.main })}>
              {labels.activeWelcome.title.replace("{name}", userName)}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: theme => theme.palette.text.secondary,
              }}
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
          </Stack>
        ) : (
          <PageHeader title={labels.activeWelcome.title.replace("{name}", userName)} subtitle={welcomeSubtitle} />
        )}

        {isMobile ? (
          <TeacherDashboardMetricsSection
            title={labels.pageTitle}
            lastUpdated={lastUpdated}
            metrics={buildTeacherActiveMetricItems(metrics, labels.activeMetrics)}
          />
        ) : (
          <TeacherActiveMetricsRow metrics={metrics} labels={labels.activeMetrics} />
        )}

        <Box sx={isMobile ? teacherDashboardContentPaddingSx : undefined}>
          <DateNavigator
            dateValue={dateValue}
            todayLabel={labels.dateFilter.today}
            previousDayLabel={labels.dateFilter.previousDay}
            nextDayLabel={labels.dateFilter.nextDay}
            dateLabel={labels.dateFilter.dateLabel}
            onDateChange={onDateChange}
          />
        </Box>

        <SectionPanel
          title={isMobile ? labels.schedule.titleToday : labels.schedule.title}
          subTitle={isMobile ? undefined : scheduleDateLabel}
          edgeToEdge={isMobile}
          actions={schedulePanelActions}
        >
          {isMobile ? (
            <TeacherScheduleCardList
              rows={scheduleRows}
              labels={labels}
              canActivate={canActivate}
              emptyMessage={labels.schedule.noEntries}
              onJoinVideo={onJoinVideo}
              onActivate={onActivate}
              onStartSession={onStartSession}
              onMarkAbsent={onMarkAbsent}
              onRequestLeave={onRequestLeave}
            />
          ) : (
            <TeacherScheduleDataGrid
              rows={scheduleRows}
              labels={labels}
              instanceStatusLabels={labels.instanceStatusLabels}
              canActivate={canActivate}
              emptyMessage={labels.schedule.noEntries}
              onJoinVideo={onJoinVideo}
              onActivate={onActivate}
              onStartSession={onStartSession}
              onMarkAbsent={onMarkAbsent}
              onRequestLeave={onRequestLeave}
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={onPageChange}
            />
          )}
        </SectionPanel>

        {isMobile && totalCount !== undefined && onPageChange && pageCount > 1 && (
          <PaginationControls
            page={page}
            pageCount={pageCount}
            rowCount={totalCount}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        )}

        <Box sx={teacherDashboardContentPaddingSx}>
          <StudentProgressFeed items={progressFeed} title={labels.progressFeed.title} />
        </Box>

        <Box sx={isMobile ? teacherDashboardContentPaddingSx : undefined}>
          <ActivationPolicyPanel
            labels={labels.policy}
            compact={isMobile}
            onDownloadHandbook={onDownloadHandbook}
            onContactCoordinator={onContactCoordinator}
            actionLabels={labels.actions}
          />
        </Box>

        {!isMobile && <ParentSupportFab label={labels.support.liveSupport} onClick={onSupport} />}
      </PageContainer>
    </>
  );
}
