"use client";

import { useMemo } from "react";
import type { ParentScheduleRow } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";
import type { ParentScheduleDataGridDesktopProps } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentScheduleComponents.types";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui";
import { buildParentScheduleColumns } from "@/frontend/desktop/views/dashboard/parent/dashboard/components/parentScheduleDataGrid.columns";
import { resolvePaginationOptions } from "@/frontend/desktop/views/dashboard/parent/dashboard/components/parentScheduleDataGrid.helpers";

export function ParentScheduleDataGridDesktop({
  rows,
  labels,
  onHistory,
  pagination,
}: Readonly<ParentScheduleDataGridDesktopProps>) {
  const columns = useMemo(() => buildParentScheduleColumns(labels, onHistory), [labels, onHistory]);

  return (
    <DesktopAppDataGrid<ParentScheduleRow>
      rows={rows}
      columns={columns}
      getRowId={row => row.id}
      autoHeight
      rowHeight={72}
      ariaLabel="parent-schedule-table"
      emptyMessage={labels.schedule.noEntries}
      getRowClassName={({ row }) => (row.isFrozen ? "parent-schedule-row-frozen" : "")}
      sx={{
        "& .parent-schedule-row-frozen": {
          backgroundColor: theme => theme.palette.errorContainer,
          "&:hover": {
            backgroundColor: theme => theme.palette.errorContainer,
          },
        },
      }}
      paginationOptions={resolvePaginationOptions(pagination, rows.length)}
    />
  );
}
