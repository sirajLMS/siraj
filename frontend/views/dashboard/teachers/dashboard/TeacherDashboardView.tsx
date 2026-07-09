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
} from "@/frontend/components/ui";
import type {
  MissedClassAlert,
  StudentProgressFeedItem,
  TeacherScheduleRow,
} from "@/frontend/stores/teacherDashboardTypes";
import { mergeSx } from "@/frontend/utils/sx/mergeSx";
import { DashboardMetricsSection } from "@/frontend/views/dashboard/components/DashboardMetricsSection";
import { ParentSupportFab } from "@/frontend/views/dashboard/parent/dashboard/components/ParentSupportFab";
import { ActivationPolicyPanel } from "@/frontend/views/dashboard/teachers/dashboard/components/ActivationPolicyPanel";
import { MissedClassAlertBanner } from "@/frontend/views/dashboard/teachers/dashboard/components/MissedClassAlertBanner";
import { StudentProgressFeed } from "@/frontend/views/dashboard/teachers/dashboard/components/StudentProgressFeed";
import { TeacherDailyScheduleSection } from "@/frontend/views/dashboard/teachers/dashboard/components/TeacherDailyScheduleSection";
import { TeacherScheduleCardList } from "@/frontend/views/dashboard/teachers/dashboard/components/TeacherScheduleCardList";
import type { TeacherDashboardViewLabels } from "@/frontend/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
import {
  teacherDashboardContentPaddingSx,
  teacherDashboardPageContainerSx,
} from "@/frontend/views/dashboard/teachers/dashboard/utils/teacherDashboardMobileLayout";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";

interface TeacherDashboardViewProps {
  readonly userName: string;
  readonly metricItems: readonly MetricItem[];
  readonly scheduleRows: readonly TeacherScheduleRow[];
  readonly progressFeed: readonly StudentProgressFeedItem[];
  readonly missedAlert: MissedClassAlert | null;
  readonly welcomeDateSummary: string;
  readonly activeSessionsCount: number;
  readonly labels: TeacherDashboardViewLabels;
  readonly lastUpdated: string;
  readonly activationError: string | null;
  readonly canActivate: boolean;
  readonly canManualEntry: boolean;
  readonly canPrintSchedule: boolean;
  readonly loading?: boolean;
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

function formatActiveSessionsSummary(template: string, date: string, count: number): string {
  return template.replace("{date}", date).replace("{count}", String(count));
}

interface MobileWelcomeHeaderProps {
  readonly userName: string;
  readonly welcomeDateSummary: string;
  readonly activeSessionsCount: number;
  readonly labels: TeacherDashboardViewLabels;
}

function MobileWelcomeHeader({ userName, welcomeDateSummary, activeSessionsCount, labels }: MobileWelcomeHeaderProps) {
  return (
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
          {formatActiveSessionsSummary(labels.activeWelcome.mobileSummary, welcomeDateSummary, activeSessionsCount)}
        </Typography>
      </Box>
    </Stack>
  );
}

interface MobileScheduleSectionProps {
  readonly scheduleRows: readonly TeacherScheduleRow[];
  readonly labels: TeacherDashboardViewLabels;
  readonly canActivate: boolean;
  readonly loading?: boolean;
  readonly dateValue: string;
  readonly onDateChange: (date: string) => void;
  readonly onJoinVideo: (id: string) => void;
  readonly onActivate?: (id: string) => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
  readonly onViewAll?: () => void;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount?: number;
  readonly pageCount: number;
  readonly onPageChange?: (page: number) => void;
}

function MobileScheduleSection({
  scheduleRows,
  labels,
  canActivate,
  loading,
  dateValue,
  onDateChange,
  onJoinVideo,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
  onViewAll,
  page,
  pageSize,
  totalCount,
  pageCount,
  onPageChange,
}: MobileScheduleSectionProps) {
  const schedulePanelActions = onViewAll ? (
    <PrimaryPageAction variant="text" onClick={onViewAll} sx={{ minWidth: "auto", px: 0 }}>
      {labels.schedule.viewAll}
    </PrimaryPageAction>
  ) : undefined;

  return (
    <>
      <Box sx={teacherDashboardContentPaddingSx}>
        <DateNavigator
          dateValue={dateValue}
          todayLabel={labels.dateFilter.today}
          previousDayLabel={labels.dateFilter.previousDay}
          nextDayLabel={labels.dateFilter.nextDay}
          dateLabel={labels.dateFilter.dateLabel}
          onDateChange={onDateChange}
        />
      </Box>

      <SectionPanel title={labels.schedule.titleToday} edgeToEdge actions={schedulePanelActions}>
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
          loading={loading}
        />
      </SectionPanel>

      {totalCount !== undefined && onPageChange && pageCount > 1 && (
        <PaginationControls
          page={page}
          pageCount={pageCount}
          rowCount={totalCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
}

interface DashboardFooterProps {
  readonly progressFeed: readonly StudentProgressFeedItem[];
  readonly labels: TeacherDashboardViewLabels;
  readonly isMobile: boolean;
  readonly onDownloadHandbook: () => void;
  readonly onContactCoordinator: () => void;
  readonly onSupport: () => void;
}

function DashboardFooter({
  progressFeed,
  labels,
  isMobile,
  onDownloadHandbook,
  onContactCoordinator,
  onSupport,
}: DashboardFooterProps) {
  return (
    <>
      <Box sx={teacherDashboardContentPaddingSx}>
        <StudentProgressFeed items={progressFeed} title={labels.progressFeed.title} labels={labels.progressFeed} />
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
    </>
  );
}

export function TeacherDashboardView({
  userName,
  metricItems,
  scheduleRows,
  progressFeed,
  missedAlert,
  welcomeDateSummary,
  activeSessionsCount,
  labels,
  lastUpdated,
  activationError,
  canActivate,
  loading,
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

  const pageCount = totalCount !== undefined && pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;

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
          <MobileWelcomeHeader
            userName={userName}
            welcomeDateSummary={welcomeDateSummary}
            activeSessionsCount={activeSessionsCount}
            labels={labels}
          />
        ) : (
          <PageHeader title={labels.activeWelcome.title.replace("{name}", userName)} />
        )}

        <DashboardMetricsSection
          title={labels.pageTitle}
          lastUpdated={lastUpdated}
          metrics={metricItems}
          gridSize={{ xs: 6, sm: 6, md: 3 }}
        />

        {isMobile ? (
          <MobileScheduleSection
            scheduleRows={scheduleRows}
            labels={labels}
            canActivate={canActivate}
            loading={loading}
            dateValue={dateValue}
            onDateChange={onDateChange}
            onJoinVideo={onJoinVideo}
            onActivate={onActivate}
            onStartSession={onStartSession}
            onMarkAbsent={onMarkAbsent}
            onRequestLeave={onRequestLeave}
            onViewAll={onViewAll}
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            pageCount={pageCount}
            onPageChange={onPageChange}
          />
        ) : (
          <TeacherDailyScheduleSection
            title={labels.schedule.title}
            dateValue={dateValue}
            todayLabel={labels.dateFilter.today}
            previousDayLabel={labels.dateFilter.previousDay}
            nextDayLabel={labels.dateFilter.nextDay}
            dateLabel={labels.dateFilter.dateLabel}
            onDateChange={onDateChange}
            rows={scheduleRows}
            labels={labels}
            instanceStatusLabels={labels.instanceStatusLabels}
            canActivate={canActivate}
            loading={loading}
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

        <DashboardFooter
          progressFeed={progressFeed}
          labels={labels}
          isMobile={isMobile}
          onDownloadHandbook={onDownloadHandbook}
          onContactCoordinator={onContactCoordinator}
          onSupport={onSupport}
        />
      </PageContainer>
    </>
  );
}
