import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type {
  ParentBookingStatus,
  ParentScheduleRow,
} from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";
import type { SchedulePagination } from "@/frontend/common/views/dashboard/parent/dashboard/useParentDashboardViewModel";

export const centeredCellSx = {
  display: "flex",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  alignItems: "center",
} as const;

export function resolveBookingBadge(status: ParentBookingStatus): {
  category: "session" | "trackingStatus";
  status: string;
} {
  if (status === "rescheduled") {
    return { category: "trackingStatus", status: "rescheduled" };
  }
  return { category: "session", status: "confirmed" };
}

export function formatRowNumber(value: number): string {
  return String(value).padStart(2, "0");
}

export function resolveMeetingUrlStatus(row: ParentScheduleRow): string | null {
  if (row.isFrozen) return "failed";
  if (!row.videoEnabled && !row.meetingJoinUrl) return null;
  if (row.meetingJoinUrl !== null && row.meetingJoinUrl !== undefined) return "generated";
  return "pending";
}

export function resolvePaginationOptions(
  pagination: SchedulePagination | undefined,
  rowsLength: number
): ReturnType<typeof buildServerPaginationOptions> | false | { mode: "client" } {
  let result: ReturnType<typeof buildServerPaginationOptions> | false | { mode: "client" };
  if (pagination !== undefined) {
    result = buildServerPaginationOptions({
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalCount: pagination.totalCount,
      onPageChange: pagination.onPageChange,
      pageSizeOptions: [pagination.pageSize],
    });
  } else if (rowsLength <= 10) {
    result = false;
  } else {
    result = { mode: "client" };
  }
  return result;
}
