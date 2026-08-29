"use client";

import { AppDataGrid } from "@/frontend/common/components/ui";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import {
  AppPermission,
  type ClassExecutionState,
  type ClassOutcome,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useScheduleColumns } from "@/frontend/common/views/dashboard/admin/home/components/useScheduleColumns";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import type { ScheduleOverviewHeaders } from "@/frontend/common/views/dashboard/admin/home/types/scheduleColumns.types";

interface ScheduleOverviewDataGridProps {
  readonly rows: readonly DailyScheduleRow[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount?: number;
  readonly onPageChange: (page: number) => void;
  readonly headers: ScheduleOverviewHeaders;
  readonly statusLabels: Record<ClassOutcome | ClassExecutionState, string>;
  readonly detailsLabel: string;
  readonly emptyMessage: string;
  readonly loading?: boolean;
  /**
   * When supplied by the view (from the ViewModel's permission flags), wins
   * over the internal store derivation so callers control timezone columns.
   */
  readonly showTimezones?: boolean;
}

export function ScheduleOverviewDataGrid({
  rows,
  page,
  pageSize,
  totalCount,
  onPageChange,
  headers,
  statusLabels,
  detailsLabel,
  emptyMessage,
  loading = false,
  showTimezones: showTimezonesProp,
}: ScheduleOverviewDataGridProps) {
  const { hasPermission } = useUserStore();
  const showTimezones = showTimezonesProp ?? hasPermission(AppPermission.ScheduleViewTimezones);

  const columns = useScheduleColumns({ headers, statusLabels, detailsLabel, showTimezones });

  return (
    <AppDataGrid<DailyScheduleRow>
      rows={rows}
      columns={columns}
      getRowId={row => row.id ?? ""}
      loading={loading}
      paginationOptions={
        totalCount === undefined
          ? { mode: "client", pageSize, pageSizeOptions: [pageSize] }
          : buildServerPaginationOptions({
              page,
              pageSize,
              totalCount,
              onPageChange,
              pageSizeOptions: [pageSize],
            })
      }
      autoHeight
      rowHeight={60}
      ariaLabel="schedule-overview-table"
      emptyMessage={emptyMessage}
      columnVisibilityModel={{
        teacher: true,
        yourTime: true,
        teacherTime: showTimezones,
        studentTime: showTimezones,
      }}
      sx={{
        "& .MuiDataGrid-footerContainer": {
          backgroundColor: "transparent",
          minHeight: "auto",
        },
        "& .MuiDataGrid-columnHeader[data-field='teacher'], & .MuiDataGrid-cell[data-field='teacher']": {
          display: { xs: "none", md: "flex" },
        },
        "& .MuiDataGrid-columnHeader[data-field='yourTime'], & .MuiDataGrid-cell[data-field='yourTime']": {
          display: { xs: "none", sm: "flex" },
        },
        "& .MuiDataGrid-columnHeader[data-field='teacherTime'], & .MuiDataGrid-cell[data-field='teacherTime']": {
          display: { xs: "none", md: "flex" },
        },
        "& .MuiDataGrid-columnHeader[data-field='studentTime'], & .MuiDataGrid-cell[data-field='studentTime']": {
          display: { xs: "none", md: "flex" },
        },
      }}
    />
  );
}
