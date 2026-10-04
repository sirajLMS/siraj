import type { TeacherDashboardViewModel } from "@/frontend/common/views/dashboard/teachers/dashboard/useTeacherDashboardViewModel";
import { buildHeaderActions } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildHeaderActions";
import { DesktopFormErrorSnackbar, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { ParentSupportFabDesktop as ParentSupportFab } from "@/frontend/desktop/views/dashboard/parent/dashboard/components/parentSupportFab.desktop";
import { ActivationPolicyPanelDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/activationPolicyPanel.desktop";
import { ManualClassEntryDialogDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/manualClassEntryDialog.desktop";
import { ManualClassEntryStudentSelectDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/manualClassEntryStudentSelect.desktop";
import { StudentProgressFeedDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/studentProgressFeed.desktop";
import { TeacherDailyScheduleSectionDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/teacherDailyScheduleSection.desktop";

const metricGridBreakpoints = { xs: 6, sm: 6, md: 3 } as const;

export function TeacherDashboardHeaderSection({
  userName,
  metricItems,
  labels,
  lastUpdated,
  canManualEntry,
  canPrintSchedule,
  canActivate,
  onPrintSchedule,
  onManualEntry,
  onNewSession,
}: Readonly<TeacherDashboardViewModel>) {
  const headerActions = buildHeaderActions({
    labels,
    canManualEntry,
    canPrintSchedule,
    canActivate,
    onPrintSchedule,
    onManualEntry,
    onNewSession,
  });

  return (
    <>
      <DesktopPageHeader title={labels.activeWelcome.title(userName)} subtitle={lastUpdated} actions={headerActions} />

      <DesktopMetricCardGrid metrics={metricItems} size={metricGridBreakpoints} />
    </>
  );
}

export function TeacherDashboardScheduleSection({
  scheduleRows,
  labels,
  dateValue,
  onDateChange,
  canActivate,
  loading,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Readonly<TeacherDashboardViewModel>) {
  return (
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
  );
}

/**
 * Activation errors stay visible until the next activation attempt clears
 * them upstream; the shared snackbar shell requires a close callback.
 */
const keepErrorVisible = (): void => {};

export function TeacherDashboardLowerSections({
  progressFeed,
  labels,
  onDownloadHandbook,
  onContactCoordinator,
  onSupport,
  activationError,
}: Readonly<TeacherDashboardViewModel>) {
  return (
    <>
      <StudentProgressFeedDesktop items={progressFeed} title={labels.progressFeed.title} labels={labels.progressFeed} />

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
    </>
  );
}

export function TeacherDashboardManualEntrySection({
  manualEntryOpen,
  manualEntryDefaultActive,
  teacherId,
  subjects,
  subjectsLoading,
  labels,
  onManualEntryClose,
  onManualEntrySubmit,
}: Readonly<TeacherDashboardViewModel>) {
  return (
    <ManualClassEntryDialogDesktop
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
  );
}
