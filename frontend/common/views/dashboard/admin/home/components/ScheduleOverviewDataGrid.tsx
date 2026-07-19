"use client";

import { AppDataGrid } from "@/frontend/common/components/ui";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useScheduleColumns } from "@/frontend/common/views/dashboard/admin/home/components/useScheduleColumns";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";

interface ScheduleOverviewDataGridProps {
  readonly rows: readonly DailyScheduleRow[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount?: number;
  readonly onPageChange: (page: number) => void;
  readonly headers: {
    readonly className: string;
    readonly student: string;
    readonly teacher: string;
    readonly time: string;
    readonly yourTime: string;
    readonly teacherTime: string;
    readonly studentTime: string;
    readonly duration: string;
    readonly status: string;
    readonly actions: string;
    readonly history: string;
    readonly joinVideo: string;
  };
  readonly statusLabels: Record<ClassOutcome | ClassExecutionState, string>;
  readonly detailsLabel: string;
  readonly emptyMessage: string;
  readonly loading?: boolean;
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
}: ScheduleOverviewDataGridProps) {
  const { hasPermission } = useUserStore();
  const showTimezones = hasPermission(AppPermission.ScheduleViewTimezones);

  const columns = useScheduleColumns({ headers, statusLabels, detailsLabel, showTimezones });

  return (
    <AppDataGrid<DailyScheduleRow>
      rows={rows}
      columns={columns}
      getRowId={row => row.id ?? ""}
      loading={loading}
      paginationOptions={
        totalCount !== undefined
          ? buildServerPaginationOptions({
              page,
              pageSize,
              totalCount,
              onPageChange,
              pageSizeOptions: [pageSize],
            })
          : { mode: "client", pageSize, pageSizeOptions: [pageSize] }
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
