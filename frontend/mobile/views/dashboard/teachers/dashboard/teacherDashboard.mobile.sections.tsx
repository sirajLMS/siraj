"use client";

import type { ReactNode } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { TeacherScheduleRow } from "@/frontend/common/stores/teacherDashboardTypes";
import type { TeacherDashboardViewModel } from "@/frontend/common/views/dashboard/teachers/dashboard/useTeacherDashboardViewModel";
import {
  MobileCardList,
  MobileContentInset,
  MobilePrimaryPageAction,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { DateNavigatorMobile } from "@/frontend/mobile/components/ui/filter";
import { ActivationPolicyPanelMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/activationPolicyPanel.mobile";
import { StudentProgressFeedMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/studentProgressFeed.mobile";
import { TeacherScheduleCardMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/teacherScheduleCard.mobile";

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
  readonly onPageChange?: (page: number) => void;
}

export function MobileScheduleSection({
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
  onPageChange,
}: MobileScheduleSectionProps) {
  const schedulePanelActions = onViewAll ? (
    <MobilePrimaryPageAction variant="text" onClick={onViewAll} sx={{ minWidth: "auto", px: 0 }}>
      {labels.schedule.viewAll}
    </MobilePrimaryPageAction>
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
      <MobileContentInset>
        <DateNavigatorMobile
          dateValue={dateValue}
          todayLabel={labels.dateFilter.today}
          previousDayLabel={labels.dateFilter.previousDay}
          nextDayLabel={labels.dateFilter.nextDay}
          dateLabel={labels.dateFilter.dateLabel}
          onDateChange={onDateChange}
        />
      </MobileContentInset>

      <MobileSectionPanel
        title={labels.schedule.titleToday}
        edgeToEdge
        contentInset={false}
        actions={schedulePanelActions}
      >
        <MobileCardList<TeacherScheduleRow>
          rows={scheduleRows}
          loading={loading}
          emptyMessage={labels.schedule.noEntries}
          gap={2}
          layout="edge-to-edge"
          getKey={row => row.id}
          renderItem={renderItem}
          paginationOptions={
            totalCount !== undefined && onPageChange
              ? buildServerPaginationOptions({
                  page,
                  pageSize,
                  totalCount,
                  onPageChange,
                })
              : { mode: "client" }
          }
        />
      </MobileSectionPanel>
    </>
  );
}

interface MobileFooterProps {
  readonly progressFeed: TeacherDashboardViewModel["progressFeed"];
  readonly labels: TeacherDashboardViewModel["labels"];
  readonly onDownloadHandbook: () => void;
  readonly onContactCoordinator: () => void;
}

export function MobileFooter({ progressFeed, labels, onDownloadHandbook, onContactCoordinator }: MobileFooterProps) {
  return (
    <>
      <MobileContentInset>
        <StudentProgressFeedMobile
          items={progressFeed}
          title={labels.progressFeed.title}
          labels={labels.progressFeed}
        />
      </MobileContentInset>

      <MobileContentInset>
        <ActivationPolicyPanelMobile
          labels={labels.policy}
          compact
          onDownloadHandbook={onDownloadHandbook}
          onContactCoordinator={onContactCoordinator}
          actionLabels={labels.actions}
        />
      </MobileContentInset>
    </>
  );
}
