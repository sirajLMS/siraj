"use client";

import { Alert, Box } from "@mui/material";
import { PageContainer, PageHeader } from "@/frontend/common/components/ui";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { DashboardMetricsSection } from "@/frontend/common/views/dashboard/components/DashboardMetricsSection";
import { ParentSupportFab } from "@/frontend/common/views/dashboard/parent/dashboard/components/ParentSupportFab";
import type { TeacherDashboardViewModel } from "@/frontend/common/views/dashboard/teachers/dashboard/useTeacherDashboardViewModel";
import {
  teacherDashboardContentPaddingSx,
  teacherDashboardPageContainerSx,
} from "@/frontend/common/views/dashboard/teachers/dashboard/utils/teacherDashboardMobileLayout";
import { ActivationPolicyPanelDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/activationPolicyPanel.desktop";
import { MissedClassAlertBannerDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/missedClassAlertBanner.desktop";
import { StudentProgressFeedDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/studentProgressFeed.desktop";
import { TeacherDailyScheduleSectionDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/teacherDailyScheduleSection.desktop";

export function TeacherDashboardDesktopView({
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
  onDownloadHandbook,
  onContactCoordinator,
  onSupport,
  dateValue,
  onDateChange,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
}: Readonly<TeacherDashboardViewModel>) {
  return (
    <>
      {missedAlert && <MissedClassAlertBannerDesktop alert={missedAlert} labels={labels.alert} fixed />}

      <PageContainer sx={mergeSx(teacherDashboardPageContainerSx, missedAlert ? { pt: 10 } : undefined)}>
        {activationError && (
          <Alert severity="error" sx={teacherDashboardContentPaddingSx}>
            {activationError}
          </Alert>
        )}

        <PageHeader title={labels.activeWelcome.title(userName)} />

        <DashboardMetricsSection
          title={labels.pageTitle}
          lastUpdated={lastUpdated}
          metrics={metricItems}
          gridSize={{ xs: 6, sm: 6, md: 3 }}
        />

        <TeacherDailyScheduleSectionDesktop
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
          onActivate={onActivate}
          onStartSession={onStartSession}
          onMarkAbsent={onMarkAbsent}
          onRequestLeave={onRequestLeave}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
        />

        <Box sx={teacherDashboardContentPaddingSx}>
          <StudentProgressFeedDesktop
            items={progressFeed}
            title={labels.progressFeed.title}
            labels={labels.progressFeed}
          />
        </Box>

        <ActivationPolicyPanelDesktop
          labels={labels.policy}
          onDownloadHandbook={onDownloadHandbook}
          onContactCoordinator={onContactCoordinator}
          actionLabels={labels.actions}
        />

        <ParentSupportFab label={labels.support.liveSupport} onClick={onSupport} />
      </PageContainer>
    </>
  );
}
