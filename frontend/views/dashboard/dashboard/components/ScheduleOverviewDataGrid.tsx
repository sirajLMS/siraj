"use client";

import type { GridPaginationModel } from "@mui/x-data-grid";
import { AppDataGrid } from "@/frontend/components/ui/AppDataGrid";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import type { ClassStatus, ScheduleRow } from "@/frontend/views/dashboard/types/dashboard";
import { useScheduleColumns } from "./useScheduleColumns";

interface ScheduleOverviewDataGridProps {
  readonly rows: readonly ScheduleRow[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
  readonly headers: {
    readonly classId: string;
    readonly student: string;
    readonly teacher: string;
    readonly time: string;
    readonly yourTime: string;
    readonly teacherTime: string;
    readonly studentTime: string;
    readonly status: string;
    readonly actions: string;
  };
  readonly statusLabels: Record<ClassStatus, string>;
  readonly detailsLabel: string;
  readonly emptyMessage: string;
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
}: ScheduleOverviewDataGridProps) {
  const { hasPermission } = useUserStore();
  const showTimezones = hasPermission(AppPermission.ScheduleViewTimezones);

  const columns = useScheduleColumns({ headers, statusLabels, detailsLabel, showTimezones });

  const paginationModel: GridPaginationModel = {
    page,
    pageSize,
  };

  return (
    <AppDataGrid<ScheduleRow>
      rows={rows}
      columns={columns}
      getRowId={row => row.classId}
      rowCount={totalCount}
      paginationMode="server"
      paginationModel={paginationModel}
      onPaginationModelChange={model => {
        onPageChange(model.page);
      }}
      pageSizeOptions={[pageSize]}
      autoHeight
      rowHeight={60}
      ariaLabel="schedule-overview-table"
      emptyMessage={emptyMessage}
      columnVisibilityModel={{
        teacher: true,
        time: !showTimezones,
        yourTime: showTimezones,
        teacherTime: showTimezones,
        studentTime: showTimezones,
      }}
      sx={{
        "& .MuiDataGrid-columnHeader[data-field='teacher'], & .MuiDataGrid-cell[data-field='teacher']": {
          display: { xs: "none", md: "flex" },
        },
        "& .MuiDataGrid-columnHeader[data-field='time'], & .MuiDataGrid-cell[data-field='time']": {
          display: { xs: "none", sm: "flex" },
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
