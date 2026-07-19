"use client";

import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { ParentScheduleRow } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";
import type { ParentScheduleListMobileProps } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentScheduleComponents.types";
import { MobileCardList } from "@/frontend/mobile/components/ui";
import { ParentScheduleCardMobile } from "@/frontend/mobile/views/dashboard/parent/dashboard/components/parentScheduleCard.mobile";

export function ParentScheduleListMobile({ rows, labels, pagination }: Readonly<ParentScheduleListMobileProps>) {
  return (
    <MobileCardList<ParentScheduleRow>
      rows={rows}
      emptyMessage={labels.schedule.noEntries}
      gap={2}
      layout="edge-to-edge"
      getKey={row => row.id}
      renderItem={row => <ParentScheduleCardMobile row={row} labels={labels} />}
      paginationOptions={
        pagination
          ? buildServerPaginationOptions({
              page: pagination.page,
              pageSize: pagination.pageSize,
              totalCount: pagination.totalCount,
              onPageChange: pagination.onPageChange,
            })
          : { mode: "client" }
      }
    />
  );
}
