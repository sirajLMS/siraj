"use client";

import type { ScheduleAlertsViewSharedProps } from "@/frontend/common/views/dashboard/schedule/alerts/components/__shared__/scheduleAlertsViewShared";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import type { AcademicScheduleDataGridDesktopLabels } from "@/frontend/desktop/views/dashboard/schedule/alerts/components/academicScheduleDataGrid.desktop";
import { ScheduleAlertBannersDesktop } from "@/frontend/desktop/views/dashboard/schedule/alerts/scheduleAlertBanners.desktop";
import {
  DesktopAlertsBody,
  DesktopMetricsSection,
} from "@/frontend/desktop/views/dashboard/schedule/alerts/scheduleAlertsView.desktop.parts";

export type ScheduleAlertsViewDesktopProps = ScheduleAlertsViewSharedProps;

export function ScheduleAlertsViewDesktop({
  alerts,
  metrics,
  metricLabels,
  classes,
  totalClasses,
  currentPage,
  pageSize,
  labels,
  onLeave,
  onViewClassAudit,
  onPageChange,
  loading = false,
  onDownloadReport,
  onFilter,
  onExport,
}: Readonly<ScheduleAlertsViewDesktopProps>) {
  const gridLabels: AcademicScheduleDataGridDesktopLabels = {
    className: labels.className,
    instructor: labels.instructor,
    time: labels.time,
    room: labels.room,
    status: labels.status,
    joinSession: labels.joinSession,
    leaveClass: labels.leaveClass,
    leaveDisabledReason: labels.leaveDisabledReason,
    viewClassAudit: labels.viewClassAudit,
    contactAdmin: labels.contactAdmin,
    active: labels.active,
    upcoming: labels.upcoming,
    missed: labels.missed,
    hold: labels.hold,
    noEntries: labels.noEntries,
  };

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />

      <ScheduleAlertBannersDesktop alerts={alerts} labels={labels.alertMessages} />

      <DesktopMetricsSection
        metrics={metrics}
        metricLabels={metricLabels}
        labels={labels}
        onDownloadReport={onDownloadReport}
      />

      <DesktopAlertsBody
        loading={loading}
        labels={labels}
        classes={classes}
        totalClasses={totalClasses}
        currentPage={currentPage}
        pageSize={pageSize}
        onFilter={onFilter}
        onExport={onExport}
        onLeave={onLeave}
        onViewClassAudit={onViewClassAudit}
        onPageChange={onPageChange}
        contentLabels={gridLabels}
      />
    </DesktopPageContainer>
  );
}
