"use client";

import type { ParentScheduleRow } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";
import type { ParentDashboardViewModel } from "@/frontend/common/views/dashboard/parent/dashboard/useParentDashboardViewModel";
import {
  MobileContentStack,
  MobilePageContainer,
  MobilePrimaryPageAction,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { AcademicProgressSummaryMobile } from "@/frontend/mobile/views/dashboard/parent/dashboard/components/academicProgressSummary.mobile";
import { ParentDashboardMetricsRowMobile } from "@/frontend/mobile/views/dashboard/parent/dashboard/components/parentDashboardMetrics.mobile";
import { ParentScheduleListMobile } from "@/frontend/mobile/views/dashboard/parent/dashboard/components/parentScheduleList.mobile";
import { ParentWelcomeHeroMobile } from "@/frontend/mobile/views/dashboard/parent/dashboard/components/parentWelcomeHero.mobile";

interface MobileScheduleSectionProps {
  readonly scheduleRows: readonly ParentScheduleRow[];
  readonly labels: ParentDashboardViewModel["labels"];
  readonly onViewAll: () => void;
  readonly schedulePagination?: ParentDashboardViewModel["schedulePagination"];
  readonly pageCount: number;
}

function MobileScheduleSection({
  scheduleRows,
  labels,
  onViewAll,
  schedulePagination,
  pageCount,
}: MobileScheduleSectionProps) {
  return (
    <MobileSectionPanel
      title={labels.schedule.titleMobile}
      actions={
        <MobilePrimaryPageAction variant="text" onClick={onViewAll} sx={{ minWidth: "auto", px: 0 }}>
          {labels.schedule.viewAll}
        </MobilePrimaryPageAction>
      }
    >
      <ParentScheduleListMobile
        rows={scheduleRows}
        labels={labels}
        pagination={schedulePagination}
        pageCount={pageCount}
      />
    </MobileSectionPanel>
  );
}

export function ParentDashboardMobileView({
  userName,
  metrics,
  scheduleRows,
  studentProgress,
  schedulePagination,
  labels,
  onViewAll,
  onDownloadReport,
  pageCount,
}: Readonly<ParentDashboardViewModel>) {
  return (
    <MobilePageContainer>
      <MobileContentStack>
        <ParentWelcomeHeroMobile
          userName={userName}
          welcomeBackLabel={labels.welcomeBack}
          pendingMessagesLabel={labels.pendingMessages}
          pendingMessagesCount={metrics.pendingMessages}
        />

        <ParentDashboardMetricsRowMobile metrics={metrics} labels={labels.metrics} />

        <MobileScheduleSection
          scheduleRows={scheduleRows}
          labels={labels}
          onViewAll={onViewAll}
          schedulePagination={schedulePagination}
          pageCount={pageCount}
        />

        <AcademicProgressSummaryMobile
          studentProgress={studentProgress}
          labels={labels.progress}
          onDownloadReport={onDownloadReport}
        />
      </MobileContentStack>
    </MobilePageContainer>
  );
}
