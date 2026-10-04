"use client";

import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { TeacherScheduleRow } from "@/frontend/common/stores/teacherDashboardTypes";
import type { TeacherScheduleDataGridProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import { buildColumns } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/teacherScheduleDataGridColumns.desktop";

type TeacherScheduleDataGridDesktopProps = TeacherScheduleDataGridProps;

/**
 * Desktop variant of the teacher-schedule data grid.
 * The grid (and its student/status/actions render-cell helpers) only make
 * sense in the desktop layout — the mobile layout uses a vertical card list.
 */
export function TeacherScheduleDataGridDesktop({
  rows,
  labels,
  instanceStatusLabels,
  canActivate,
  emptyMessage,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
  loading = false,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
}: Readonly<TeacherScheduleDataGridDesktopProps>) {
  const columns = useMemo<GridColDef<TeacherScheduleRow>[]>(
    () =>
      buildColumns(labels, instanceStatusLabels, canActivate, onActivate, onStartSession, onMarkAbsent, onRequestLeave),
    [canActivate, instanceStatusLabels, labels, onActivate, onMarkAbsent, onRequestLeave, onStartSession]
  );

  const isServerPagination = totalCount !== undefined && onPageChange !== undefined;

  return (
    <DesktopAppDataGrid<TeacherScheduleRow>
      rows={rows}
      columns={columns}
      getRowId={row => row.id}
      emptyMessage={emptyMessage}
      loading={loading}
      disableRowSelectionOnClick
      autoHeight
      getRowClassName={({ row }) => (row.isFrozen ? "teacher-schedule-row-frozen" : "")}
      sx={{
        "& .teacher-schedule-row-frozen": {
          backgroundColor: theme => theme.palette.errorContainer,
        },
      }}
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
