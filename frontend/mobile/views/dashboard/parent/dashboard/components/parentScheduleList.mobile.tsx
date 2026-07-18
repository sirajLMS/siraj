"use client";

import type { ParentScheduleRow } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";
import type { ParentScheduleListMobileProps } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentScheduleComponents.types";
import { MobileCardList, MobilePaginationControls } from "@/frontend/mobile/components/ui";
import { ParentScheduleCardMobile } from "@/frontend/mobile/views/dashboard/parent/dashboard/components/parentScheduleCard.mobile";

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
