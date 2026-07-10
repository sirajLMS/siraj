"use client";

import { Box, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid, GridPagination } from "@/frontend/components/ui";
import type { ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";
import type { TeacherScheduleRow } from "@/frontend/stores/teacherDashboardTypes";
import { ScheduleInstanceStatusBadge } from "@/frontend/views/dashboard/admin/home/components/ScheduleInstanceStatusBadge";
import { TeacherScheduleSessionActionsCell } from "@/frontend/views/dashboard/teachers/dashboard/components/TeacherScheduleSessionActionsCell";
import { TeacherScheduleStudentCell } from "@/frontend/views/dashboard/teachers/dashboard/components/TeacherScheduleStudentCell";
import type { TeacherDashboardLabels } from "@/frontend/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";

interface TeacherScheduleDataGridProps {
  readonly rows: readonly TeacherScheduleRow[];
  readonly labels: TeacherDashboardLabels;
  readonly instanceStatusLabels: Record<ClassOutcome | ClassExecutionState, string>;
  readonly canActivate: boolean;
  readonly emptyMessage: string;
  readonly onJoinVideo?: (id: string) => void;
  readonly onActivate?: (id: string) => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
  readonly loading?: boolean;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

function formatRowNumber(value: number): string {
  return String(value).padStart(2, "0");
}

function formatDuration(minutes: number | undefined, template: string): string {
  if (!minutes) {
    return "—";
  }
  return template.replace("{minutes}", String(minutes));
}

export function TeacherScheduleDataGrid({
  rows,
  labels,
  instanceStatusLabels,
  canActivate,
  emptyMessage,
  onJoinVideo,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
  loading = false,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
}: Readonly<TeacherScheduleDataGridProps>) {
  const columns = useMemo<GridColDef<TeacherScheduleRow>[]>(() => {
    return [
      {
        field: "rowNumber",
        headerName: labels.schedule.rowNumber,
        width: 70,
        renderCell: ({ row }) => formatRowNumber(row.rowNumber),
      },
      {
        field: "studentName",
        headerName: labels.schedule.student,
        flex: 1.2,
        minWidth: 180,
        renderCell: ({ row }) => <TeacherScheduleStudentCell row={row} />,
      },
      {
        field: "timeRange",
        headerName: labels.schedule.time,
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) => (
          <Box sx={{ alignSelf: "center", display: "flex", alignItems: "center", height: "100%" }}>
            <Typography sx={{ typography: "bodyMd", fontWeight: 700 }}>{row.timeRange}</Typography>
            {row.isCurrent && (
              <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
                {labels.schedule.current}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        field: "durationMinutes",
        headerName: labels.schedule.duration,
        flex: 0.8,
        minWidth: 100,
        renderCell: ({ row }) => formatDuration(row.durationMinutes, labels.schedule.durationValue),
      },
      {
        field: "status",
        headerName: labels.schedule.status,
        flex: 1,
        minWidth: 140,
        sortable: false,
        renderCell: ({ row }) => (
          <ScheduleInstanceStatusBadge
            outcome={row.outcome}
            executionState={row.executionState}
            scheduledEndAt={row.scheduledEndAt}
            scheduledStartAt={row.scheduledStartAt}
            durationMinutes={row.durationMinutes}
            statusLabels={instanceStatusLabels}
          />
        ),
      },
      {
        field: "actions",
        headerName: labels.schedule.actions,
        flex: 1.4,
        minWidth: 200,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: ({ row }) => (
          <TeacherScheduleSessionActionsCell
            row={row}
            labels={labels}
            canActivate={canActivate}
            onJoinVideo={onJoinVideo}
            onActivate={onActivate}
            onStartSession={onStartSession}
            onMarkAbsent={onMarkAbsent}
            onRequestLeave={onRequestLeave}
          />
        ),
      },
    ];
  }, [
    canActivate,
    instanceStatusLabels,
    labels,
    onActivate,
    onJoinVideo,
    onMarkAbsent,
    onRequestLeave,
    onStartSession,
  ]);

  const isServerPagination = totalCount !== undefined && onPageChange !== undefined;

  return (
    <AppDataGrid<TeacherScheduleRow>
      rows={rows}
      columns={columns}
      getRowId={row => row.id}
      emptyMessage={emptyMessage}
      loading={loading}
      disableRowSelectionOnClick
      autoHeight
      {...(isServerPagination
        ? {
            paginationMode: "server" as const,
            rowCount: totalCount,
            paginationModel: { page, pageSize },
            onPaginationModelChange: model => {
              onPageChange(model.page);
            },
            pageSizeOptions: [pageSize],
            slots: { pagination: GridPagination },
          }
        : {})}
    />
  );
}
