"use client";

import { AcUnitOutlined } from "@mui/icons-material";
import { Box, Tooltip, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { TeacherScheduleRow } from "@/frontend/common/stores/teacherDashboardTypes";
import { ScheduleInstanceStatusBadge } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleInstanceStatusBadge";
import type { TeacherScheduleDataGridProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";
import type { TeacherDashboardViewLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid";
import { DesktopGridPagination } from "@/frontend/desktop/components/ui/filter";
import { TeacherScheduleSessionActionsCellDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/teacherScheduleSessionActionsCell.desktop";
import { TeacherScheduleStudentCellDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/teacherScheduleStudentCell.desktop";

interface TeacherScheduleDataGridDesktopProps extends TeacherScheduleDataGridProps {}

function formatRowNumber(value: number): string {
  return String(value).padStart(2, "0");
}

function formatDuration(minutes: number | undefined, formatFn: (minutes: number) => string): string {
  if (!minutes) {
    return "—";
  }
  return formatFn(minutes);
}

function TimeRangeCell({ row, labels }: { row: TeacherScheduleRow; labels: TeacherDashboardViewLabels }) {
  return (
    <Box sx={{ alignSelf: "center", display: "flex", alignItems: "center", height: "100%" }}>
      <Typography sx={{ typography: "bodyMd", fontWeight: 700 }}>{row.timeRange}</Typography>
      {row.isCurrent && (
        <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
          {labels.schedule.current}
        </Typography>
      )}
    </Box>
  );
}

function FrozenStatusCell({ labels }: { labels: TeacherDashboardViewLabels }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Tooltip title={labels.schedule.contactAdmin}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <AcUnitOutlined sx={theme => ({ fontSize: 16, color: theme.palette.info.main })} />
          <Typography sx={{ typography: "labelMd", color: theme => theme.palette.info.main, fontWeight: 700 }}>
            {labels.schedule.frozen}
          </Typography>
        </Box>
      </Tooltip>
    </Box>
  );
}

function StatusCell({
  row,
  labels,
  instanceStatusLabels,
}: {
  row: TeacherScheduleRow;
  labels: TeacherDashboardViewLabels;
  instanceStatusLabels: Record<ClassOutcome | ClassExecutionState, string>;
}) {
  if (row.isFrozen) {
    return <FrozenStatusCell labels={labels} />;
  }
  return (
    <ScheduleInstanceStatusBadge
      outcome={row.outcome}
      executionState={row.executionState}
      scheduledEndAt={row.scheduledEndAt}
      scheduledStartAt={row.scheduledStartAt}
      durationMinutes={row.durationMinutes}
      statusLabels={instanceStatusLabels}
    />
  );
}

function buildColumns(
  labels: TeacherDashboardViewLabels,
  instanceStatusLabels: Record<ClassOutcome | ClassExecutionState, string>,
  canActivate: boolean,
  onActivate: ((id: string) => void) | undefined,
  onStartSession: ((id: string) => void) | undefined,
  onMarkAbsent: ((id: string) => void) | undefined,
  onRequestLeave: ((id: string) => void) | undefined
): GridColDef<TeacherScheduleRow>[] {
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
      renderCell: ({ row }) => <TeacherScheduleStudentCellDesktop row={row} />,
    },
    {
      field: "timeRange",
      headerName: labels.schedule.time,
      flex: 1,
      minWidth: 160,
      renderCell: ({ row }) => <TimeRangeCell row={row} labels={labels} />,
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
      renderCell: ({ row }) => <StatusCell row={row} labels={labels} instanceStatusLabels={instanceStatusLabels} />,
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
        <TeacherScheduleSessionActionsCellDesktop
          row={row}
          labels={labels}
          canActivate={canActivate}
          onActivate={onActivate}
          onStartSession={onStartSession}
          onMarkAbsent={onMarkAbsent}
          onRequestLeave={onRequestLeave}
        />
      ),
    },
  ];
}

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
      {...(isServerPagination
        ? {
            paginationMode: "server" as const,
            rowCount: totalCount,
            paginationModel: { page, pageSize },
            onPaginationModelChange: model => {
              onPageChange(model.page);
            },
            pageSizeOptions: [pageSize],
            slots: { pagination: DesktopGridPagination },
          }
        : {})}
    />
  );
}
