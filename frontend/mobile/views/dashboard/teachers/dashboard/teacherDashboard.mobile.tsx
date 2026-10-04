"use client";

import type { TeacherDashboardViewModel } from "@/frontend/common/views/dashboard/teachers/dashboard/useTeacherDashboardViewModel";
import { buildHeaderActions } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildHeaderActions";
import { teacherDashboardPageContainerSx } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/teacherDashboardMobileLayout";
import {
  MobileContentStack,
  MobileMetricCardGrid,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import {
  MobileFooter,
  MobileScheduleSection,
} from "@/frontend/mobile/views/dashboard/teachers/dashboard/teacherDashboard.mobile.sections";
import {
  DashboardBanners,
  ManualEntryDialogSlot,
  WelcomeSummaryRow,
} from "@/frontend/mobile/views/dashboard/teachers/dashboard/teacherDashboard.mobile.slots";

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
  welcomeMobileSummary,
  manualEntryOpen,
  manualEntryDefaultActive,
  teacherId,
  subjects,
  subjectsLoading,
  onManualEntryClose,
  onManualEntrySubmit,
  canManualEntry,
  canPrintSchedule,
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
      <DashboardBanners missedAlert={missedAlert} labels={labels} activationError={activationError} />

      <MobilePageContainer sx={teacherDashboardPageContainerSx}>
        <MobileContentStack>
          <MobilePageHeader
            title={labels.activeWelcome.title(userName)}
            subtitle={lastUpdated}
            actions={headerActions}
          />

          <WelcomeSummaryRow summary={welcomeMobileSummary} />

          <MobileMetricCardGrid metrics={metricItems} />

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

      <ManualEntryDialogSlot
        open={manualEntryOpen}
        defaultActive={manualEntryDefaultActive}
        teacherId={teacherId}
        subjects={subjects}
        subjectsLoading={subjectsLoading}
        labels={labels.manualClassEntry}
        onClose={onManualEntryClose}
        onSubmit={onManualEntrySubmit}
      />
    </>
  );
}
