"use client";

import { CalendarMonthOutlined } from "@mui/icons-material";
import { Alert, Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { DateNavigator, PaginationControls, PrimaryPageAction, SectionPanel } from "@/frontend/common/components/ui";
import type { TeacherScheduleRow } from "@/frontend/common/stores/teacherDashboardTypes";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { DashboardMetricsSection } from "@/frontend/common/views/dashboard/components/DashboardMetricsSection";
import type { TeacherDashboardViewModel } from "@/frontend/common/views/dashboard/teachers/dashboard/useTeacherDashboardViewModel";
import {
  teacherDashboardContentPaddingSx,
  teacherDashboardPageContainerSx,
} from "@/frontend/common/views/dashboard/teachers/dashboard/utils/teacherDashboardMobileLayout";
import { MobileCardList, MobileContentStack, MobilePageContainer } from "@/frontend/mobile/components/ui";
import { ActivationPolicyPanelMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/activationPolicyPanel.mobile";
import { MissedClassAlertBannerMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/missedClassAlertBanner.mobile";
import { StudentProgressFeedMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/studentProgressFeed.mobile";
import { TeacherScheduleCardMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/teacherScheduleCard.mobile";

interface MobileWelcomeHeaderProps {
  readonly userName: string;
  readonly welcomeMobileSummary: string;
  readonly welcomeTitle: (name: string) => string;
}

function MobileWelcomeHeader({ userName, welcomeMobileSummary, welcomeTitle }: MobileWelcomeHeaderProps) {
  return (
    <Stack sx={mergeSx(teacherDashboardContentPaddingSx, { gap: 1 })}>
      <Typography sx={theme => ({ typography: "headlineMd", color: theme.palette.primary.main })}>
        {welcomeTitle(userName)}
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
        <Typography sx={{ typography: "bodyMd" }}>{welcomeMobileSummary}</Typography>
      </Box>
    </Stack>
  );
}

interface MobileScheduleSectionProps {
  readonly scheduleRows: readonly TeacherScheduleRow[];
  readonly labels: TeacherDashboardViewModel["labels"];
  readonly canActivate: boolean;
  readonly loading?: boolean;
  readonly dateValue: string;
  readonly onDateChange: (date: string) => void;
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

  const renderItem = (row: TeacherScheduleRow): ReactNode => (
    <TeacherScheduleCardMobile
      row={row}
      labels={labels}
      canActivate={canActivate}
      onActivate={onActivate}
      onStartSession={onStartSession}
      onMarkAbsent={onMarkAbsent}
      onRequestLeave={onRequestLeave}
    />
  );

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
        <MobileCardList<TeacherScheduleRow>
          rows={scheduleRows}
          loading={loading}
          emptyMessage={labels.schedule.noEntries}
          gap={2}
          layout="edge-to-edge"
          getKey={row => row.id}
          renderItem={renderItem}
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

interface MobileFooterProps {
  readonly progressFeed: TeacherDashboardViewModel["progressFeed"];
  readonly labels: TeacherDashboardViewModel["labels"];
  readonly onDownloadHandbook: () => void;
  readonly onContactCoordinator: () => void;
}

function MobileFooter({ progressFeed, labels, onDownloadHandbook, onContactCoordinator }: MobileFooterProps) {
  return (
    <>
      <Box sx={teacherDashboardContentPaddingSx}>
        <StudentProgressFeedMobile
          items={progressFeed}
          title={labels.progressFeed.title}
          labels={labels.progressFeed}
        />
      </Box>

      <Box sx={teacherDashboardContentPaddingSx}>
        <ActivationPolicyPanelMobile
          labels={labels.policy}
          compact
          onDownloadHandbook={onDownloadHandbook}
          onContactCoordinator={onContactCoordinator}
          actionLabels={labels.actions}
        />
      </Box>
    </>
  );
}

export function TeacherDashboardMobileView({
  userName,
  metricItems,
  scheduleRows,
  progressFeed,
  missedAlert,
  labels,
  lastUpdated,
  activationError,
  canActivate,
  loading,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
  onViewAll,
  onDownloadHandbook,
  onContactCoordinator,
  dateValue,
  onDateChange,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
  pageCount,
  welcomeMobileSummary,
}: Readonly<TeacherDashboardViewModel>) {
  return (
    <>
      {missedAlert && (
        <Box sx={teacherDashboardContentPaddingSx}>
          <MissedClassAlertBannerMobile alert={missedAlert} labels={labels.alert} />
        </Box>
      )}

      <MobilePageContainer sx={teacherDashboardPageContainerSx}>
        {activationError && (
          <Alert severity="error" sx={teacherDashboardContentPaddingSx}>
            {activationError}
          </Alert>
        )}

        <MobileContentStack>
          <MobileWelcomeHeader
            userName={userName}
            welcomeMobileSummary={welcomeMobileSummary}
            welcomeTitle={labels.activeWelcome.title}
          />

          <DashboardMetricsSection
            title={labels.pageTitle}
            lastUpdated={lastUpdated}
            metrics={metricItems}
            gridSize={{ xs: 6, sm: 6, md: 3 }}
          />

          <MobileScheduleSection
            scheduleRows={scheduleRows}
            labels={labels}
            canActivate={canActivate}
            loading={loading}
            dateValue={dateValue}
            onDateChange={onDateChange}
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

          <MobileFooter
            progressFeed={progressFeed}
            labels={labels}
            onDownloadHandbook={onDownloadHandbook}
            onContactCoordinator={onContactCoordinator}
          />
        </MobileContentStack>
      </MobilePageContainer>
    </>
  );
}
