"use client";

import { useMemo } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { AcademicClassRow } from "@/frontend/common/views/dashboard/schedule/alerts/types";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui";
import { buildAcademicScheduleColumns } from "@/frontend/desktop/views/dashboard/schedule/alerts/components/academicScheduleDataGrid.columns";
import type { AcademicScheduleDataGridDesktopProps } from "@/frontend/desktop/views/dashboard/schedule/alerts/components/academicScheduleDataGrid.types";

export type { AcademicScheduleDataGridDesktopLabels } from "@/frontend/desktop/views/dashboard/schedule/alerts/components/academicScheduleDataGrid.types";

export function AcademicScheduleDataGridDesktop({
  rows,
  page = 0,
  pageSize = 10,
  totalClasses,
  labels,
  onLeave,
  onViewClassAudit,
  onPageChange,
  loading = false,
}: AcademicScheduleDataGridDesktopProps) {
  const columns = useMemo(
    () => buildAcademicScheduleColumns(labels, onLeave, onViewClassAudit),
    [labels, onLeave, onViewClassAudit]
  );

  const isServerPagination = totalClasses !== undefined && onPageChange !== undefined;

  return (
    <DesktopAppDataGrid<AcademicClassRow>
      rows={rows}
      columns={columns}
      loading={loading}
      getRowId={row => row.id}
      autoHeight
      rowHeight={100}
      ariaLabel="academic-schedule-table"
      emptyMessage={labels.noEntries}
      paginationOptions={
        isServerPagination
          ? buildServerPaginationOptions({
              page,
              pageSize,
              totalCount: totalClasses,
              onPageChange,
              pageSizeOptions: [pageSize],
            })
          : { mode: "client" }
      }
    />
  );
}
