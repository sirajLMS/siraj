"use client";

import type { ParentDashboardLabels } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardLabels";
import type { ParentScheduleRow } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";
import type { SchedulePagination } from "@/frontend/common/views/dashboard/parent/dashboard/useParentDashboardViewModel";
import { MobileCardList, MobilePaginationControls } from "@/frontend/mobile/components/ui";
import { ParentScheduleCardMobile } from "@/frontend/mobile/views/dashboard/parent/dashboard/components/parentScheduleCard.mobile";

interface ParentScheduleListMobileProps {
  readonly rows: readonly ParentScheduleRow[];
  readonly labels: ParentDashboardLabels;
  readonly pagination?: SchedulePagination;
  readonly pageCount: number;
}

export function ParentScheduleListMobile({
  rows,
  labels,
  pagination,
  pageCount,
}: Readonly<ParentScheduleListMobileProps>) {
  return (
    <>
      <MobileCardList<ParentScheduleRow>
        rows={rows}
        emptyMessage={labels.schedule.noEntries}
        gap={2}
        layout="edge-to-edge"
        getKey={row => row.id}
        renderItem={row => <ParentScheduleCardMobile row={row} labels={labels} />}
      />
      {pagination && pagination.totalCount > 0 && pageCount > 1 ? (
        <MobilePaginationControls
          page={pagination.page}
          pageCount={pageCount}
          rowCount={pagination.totalCount}
          pageSize={pagination.pageSize}
          embedded
          onPageChange={pagination.onPageChange}
        />
      ) : null}
    </>
  );
}
