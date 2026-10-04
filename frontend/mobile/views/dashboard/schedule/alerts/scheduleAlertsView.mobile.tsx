"use client";

import type { ScheduleAlertsViewSharedProps } from "@/frontend/common/views/dashboard/schedule/alerts/components/__shared__/scheduleAlertsViewShared";
import type { ScheduleAlertsLabels } from "@/frontend/common/views/dashboard/schedule/alerts/types";
import { MobileContentStack, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import type { AcademicScheduleCardListMobileLabels } from "@/frontend/mobile/views/dashboard/schedule/alerts/components/academicScheduleCardList.mobile";
import { ScheduleAlertBannersMobile } from "@/frontend/mobile/views/dashboard/schedule/alerts/scheduleAlertBanners.mobile";
import {
  MobileAlertsBody,
  MobileMetricsSection,
} from "@/frontend/mobile/views/dashboard/schedule/alerts/scheduleAlertsView.parts";

export type ScheduleAlertsViewMobileProps = ScheduleAlertsViewSharedProps;

function buildCardListLabels(labels: ScheduleAlertsLabels): AcademicScheduleCardListMobileLabels {
  return {
    joinSession: labels.joinSession,
    leaveClass: labels.leaveClass,
    leaveDisabledReason: labels.leaveDisabledReason,
    viewClassAudit: labels.viewClassAudit,
    contactAdmin: labels.contactAdmin,
    active: labels.active,
    upcoming: labels.upcoming,
    missed: labels.missed,
    hold: labels.hold,
    endOfSchedule: labels.endOfSchedule,
  };
}

export function ScheduleAlertsViewMobile({
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
}: Readonly<ScheduleAlertsViewMobileProps>) {
  const cardListLabels = buildCardListLabels(labels);

  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />

      <MobileContentStack gap={2} paddingBottom={4}>
        <ScheduleAlertBannersMobile alerts={alerts} labels={labels.alertMessages} />

        <MobileMetricsSection
          metrics={metrics}
          metricLabels={metricLabels}
          labels={labels}
          onDownloadReport={onDownloadReport}
        />

        <MobileAlertsBody
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
          contentLabels={cardListLabels}
        />
      </MobileContentStack>
    </MobilePageContainer>
  );
}
