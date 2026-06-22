"use client";

import { AppDataGrid } from "@/frontend/components/ui/AppDataGrid";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import type { ClassStatus, ScheduleRow } from "@/frontend/views/dashboard/types/dashboard";
import { useScheduleColumns } from "./useScheduleColumns";

interface ScheduleOverviewDataGridProps {
  readonly rows: readonly ScheduleRow[];
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
  headers,
  statusLabels,
  detailsLabel,
  emptyMessage,
}: ScheduleOverviewDataGridProps) {
  const { hasPermission } = useUserStore();
  const showTimezones = hasPermission(AppPermission.ScheduleViewTimezones);

  const columns = useScheduleColumns({ headers, statusLabels, detailsLabel, showTimezones });

  return (
    <AppDataGrid<ScheduleRow>
      rows={rows}
      columns={columns}
      getRowId={row => row.classId}
      autoHeight
      rowHeight={60}
      hideFooter={rows.length <= 10}
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
