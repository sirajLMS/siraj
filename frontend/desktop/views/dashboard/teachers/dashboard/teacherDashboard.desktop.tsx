"use client";

import { Box } from "@mui/material";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { ManualClassEntryDialog } from "@/frontend/common/views/dashboard/teachers/dashboard/components/ManualClassEntryDialog";
import type { TeacherDashboardViewModel } from "@/frontend/common/views/dashboard/teachers/dashboard/useTeacherDashboardViewModel";
import { teacherDashboardPageContainerSx } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/teacherDashboardMobileLayout";
import { DesktopFormErrorSnackbar, DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { ParentSupportFabDesktop as ParentSupportFab } from "@/frontend/desktop/views/dashboard/parent/dashboard/components/parentSupportFab.desktop";
import { ActivationPolicyPanelDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/activationPolicyPanel.desktop";
import { ManualClassEntryStudentSelectDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/manualClassEntryStudentSelect.desktop";
import { MissedClassAlertBannerDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/missedClassAlertBanner.desktop";
import { StudentProgressFeedDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/studentProgressFeed.desktop";
import { TeacherDailyScheduleSectionDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/teacherDailyScheduleSection.desktop";

/**
 * Activation errors stay visible until the next activation attempt clears
 * them upstream; the shared snackbar shell requires a close callback.
 */
const keepErrorVisible = (): void => {};

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
  subjects,
  subjectsLoading,
  onManualEntryClose,
  onManualEntrySubmit,
}: Readonly<TeacherDashboardViewModel>) {
  return (
    <>
      {missedAlert && <MissedClassAlertBannerDesktop alert={missedAlert} labels={labels.alert} fixed />}

      <DesktopPageContainer sx={mergeSx(teacherDashboardPageContainerSx, missedAlert ? { pt: 10 } : undefined)}>
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

        <StudentProgressFeedDesktop
          items={progressFeed}
          title={labels.progressFeed.title}
          labels={labels.progressFeed}
        />

        <ActivationPolicyPanelDesktop
          labels={labels.policy}
          onDownloadHandbook={onDownloadHandbook}
          onContactCoordinator={onContactCoordinator}
          actionLabels={labels.actions}
        />

        <ParentSupportFab label={labels.support.liveSupport} onClick={onSupport} />

        <DesktopFormErrorSnackbar
          open={activationError !== null}
          message={activationError ?? ""}
          onClose={keepErrorVisible}
        />
      </DesktopPageContainer>

      <ManualClassEntryDialog
        open={manualEntryOpen}
        onClose={onManualEntryClose}
        onSubmit={onManualEntrySubmit}
        defaultActive={manualEntryDefaultActive}
        subjects={subjects}
        subjectsLoading={subjectsLoading}
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
