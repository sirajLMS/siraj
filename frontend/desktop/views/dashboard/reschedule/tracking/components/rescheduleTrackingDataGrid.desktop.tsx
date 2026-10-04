"use client";

import { useMemo } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type {
  RescheduleTrackingDataGridProps,
  TrackingRow,
} from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import { buildRescheduleTrackingDataGridColumns } from "@/frontend/desktop/views/dashboard/reschedule/tracking/components/rescheduleTrackingDataGridColumns.desktop";

export function RescheduleTrackingDataGridDesktop({
  rows,
  headers,
  labels,
  onApprove,
  onReject,
  onView,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
  loading = false,
}: RescheduleTrackingDataGridProps) {
  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid — the columns array contains
  // renderCell closures that capture labels/locale/handlers; without memo
  // every render produces a new column-array identity and forces the data
  // grid to re-mount its virtualized row slices. Memoizing preserves JSX
  // identity ONLY; no data derivation happens here.
  const columns = useMemo(
    () => buildRescheduleTrackingDataGridColumns({ headers, labels, onApprove, onReject, onView }),
    [headers, labels, onApprove, onReject, onView]
  );

  const isServerPagination = totalCount !== undefined && onPageChange !== undefined;

  return (
    <DesktopAppDataGrid<TrackingRow>
      rows={rows}
      columns={columns}
      loading={loading}
      getRowId={row => row.id ?? ""}
      autoHeight
      ariaLabel="reschedule-tracking-table"
      emptyMessage={labels.noEntries}
      rowHeight={80}
      paginationOptions={
        isServerPagination
          ? buildServerPaginationOptions({
              page,
              pageSize,
              totalCount,
              onPageChange,
              pageSizeOptions: [pageSize],
            })
          : { mode: "client" }
      }
    />
  );
}
