"use client";

import { Alert, Box } from "@mui/material";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { ParentSupportFab } from "@/frontend/common/views/dashboard/parent/dashboard/components/ParentSupportFab";
import { ManualClassEntryDialog } from "@/frontend/common/views/dashboard/teachers/dashboard/components/ManualClassEntryDialog";
import type { TeacherDashboardViewModel } from "@/frontend/common/views/dashboard/teachers/dashboard/useTeacherDashboardViewModel";
import {
  teacherDashboardContentPaddingSx,
  teacherDashboardPageContainerSx,
} from "@/frontend/common/views/dashboard/teachers/dashboard/utils/teacherDashboardMobileLayout";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { ActivationPolicyPanelDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/activationPolicyPanel.desktop";
import { ManualClassEntryStudentSelectDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/manualClassEntryStudentSelect.desktop";
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
  manualEntryOpen,
  manualEntryDefaultActive,
  teacherId,
  onManualEntryClose,
  onManualEntrySubmit,
}: Readonly<TeacherDashboardViewModel>) {
  return (
    <>
      {missedAlert && <MissedClassAlertBannerDesktop alert={missedAlert} labels={labels.alert} fixed />}

      <DesktopPageContainer sx={mergeSx(teacherDashboardPageContainerSx, missedAlert ? { pt: 10 } : undefined)}>
        {activationError && (
          <Alert severity="error" sx={teacherDashboardContentPaddingSx}>
            {activationError}
          </Alert>
        )}

        <DesktopPageHeader title={labels.activeWelcome.title(userName)} subtitle={lastUpdated} />

        <Box sx={{ mb: 3 }}>
          <DesktopMetricCardGrid metrics={metricItems} size={{ xs: 6, sm: 6, md: 3 }} />
        </Box>

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
      </DesktopPageContainer>

      <ManualClassEntryDialog
        open={manualEntryOpen}
        onClose={onManualEntryClose}
        onSubmit={onManualEntrySubmit}
        defaultActive={manualEntryDefaultActive}
        labels={labels.manualClassEntry}
        studentSelect={
          <ManualClassEntryStudentSelectDesktop
            teacherId={teacherId}
            open={manualEntryOpen}
            studentLabel={labels.manualClassEntry.studentLabel}
          />
        }
      />
    </>
  );
}
