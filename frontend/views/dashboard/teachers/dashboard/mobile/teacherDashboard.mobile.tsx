"use client";

import { CalendarMonthOutlined } from "@mui/icons-material";
import { Alert, Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import {
  DateNavigator,
  MobileCardList,
  MobileContentStack,
  PageContainer,
  PaginationControls,
  PrimaryPageAction,
  SectionPanel,
} from "@/frontend/components/ui";
import type { TeacherScheduleRow } from "@/frontend/stores/teacherDashboardTypes";
import { mergeSx } from "@/frontend/utils/sx/mergeSx";
import { DashboardMetricsSection } from "@/frontend/views/dashboard/components/DashboardMetricsSection";
import { ActivationPolicyPanel } from "@/frontend/views/dashboard/teachers/dashboard/components/ActivationPolicyPanel";
import { StudentProgressFeed } from "@/frontend/views/dashboard/teachers/dashboard/components/StudentProgressFeed";
import { TeacherScheduleCardMobile } from "@/frontend/views/dashboard/teachers/dashboard/mobile/components/teacherScheduleCard.mobile";
import { MissedClassAlertBanner } from "@/frontend/views/dashboard/teachers/dashboard/shared/missedClassAlertBanner";
import type { TeacherDashboardViewModel } from "@/frontend/views/dashboard/teachers/dashboard/useTeacherDashboardViewModel";
import {
  teacherDashboardContentPaddingSx,
  teacherDashboardPageContainerSx,
} from "@/frontend/views/dashboard/teachers/dashboard/utils/teacherDashboardMobileLayout";

interface MobileWelcomeHeaderProps {
  readonly userName: string;
  readonly welcomeMobileSummary: string;
  readonly welcomeTitleTemplate: string;
}

function MobileWelcomeHeader({ userName, welcomeMobileSummary, welcomeTitleTemplate }: MobileWelcomeHeaderProps) {
  return (
    <Stack sx={mergeSx(teacherDashboardContentPaddingSx, { gap: 1 })}>
      <Typography sx={theme => ({ typography: "headlineMd", color: theme.palette.primary.main })}>
        {welcomeTitleTemplate.replace("{name}", userName)}
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
        <StudentProgressFeed items={progressFeed} title={labels.progressFeed.title} labels={labels.progressFeed} />
      </Box>

      <Box sx={teacherDashboardContentPaddingSx}>
        <ActivationPolicyPanel
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
          <MissedClassAlertBanner alert={missedAlert} labels={labels.alert} />
        </Box>
      )}

      <PageContainer sx={teacherDashboardPageContainerSx}>
        {activationError && (
          <Alert severity="error" sx={teacherDashboardContentPaddingSx}>
            {activationError}
          </Alert>
        )}

        <MobileContentStack>
          <MobileWelcomeHeader
            userName={userName}
            welcomeMobileSummary={welcomeMobileSummary}
            welcomeTitleTemplate={labels.activeWelcome.title}
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
      </PageContainer>
    </>
  );
}
