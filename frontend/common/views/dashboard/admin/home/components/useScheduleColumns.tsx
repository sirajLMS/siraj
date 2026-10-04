"use client";

import { Box } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import type { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql";
import { ScheduleInstanceStatusBadge } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleInstanceStatusBadge";
import { StyledMonospaceLabel } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewDataGrid.styles";
import {
  buildActionsColumn,
  buildTimeColumns,
} from "@/frontend/common/views/dashboard/admin/home/components/scheduleOverviewColumnBuilders";
import {
  renderClassCell,
  renderStudentCell,
  renderTeacherCell,
} from "@/frontend/common/views/dashboard/admin/home/components/scheduleOverviewColumnCells";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import type { ScheduleOverviewHeaders } from "@/frontend/common/views/dashboard/admin/home/types/scheduleColumns.types";
import { formatDurationMinutes } from "@/frontend/common/views/dashboard/admin/home/utils/formatScheduleTime";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";
import { useAppLocale } from "@/shared/locale";

interface UseScheduleColumnsParams {
  readonly headers: ScheduleOverviewHeaders;
  readonly statusLabels: Record<ClassOutcome | ClassExecutionState, string>;
  readonly detailsLabel: string;
  readonly showTimezones: boolean;
}

export function useScheduleColumns({ headers, statusLabels, detailsLabel, showTimezones }: UseScheduleColumnsParams) {
  const locale = useAppLocale();

  return useMemo<GridColDef<DailyScheduleRow>[]>(() => {
    return [
      {
        field: "courseName",
        headerName: headers.className,
        flex: 1.2,
        minWidth: 180,
        renderCell: ({ row }) => renderClassCell(row),
      },
      ...buildTimeColumns(showTimezones, headers, locale),
      {
        field: "duration",
        headerName: headers.duration,
        width: 90,
        flex: 0.5,
        minWidth: 80,
        renderCell: ({ row }) => (
          <StyledMonospaceLabel variant="labelMd">{formatDurationMinutes(row.duration)}</StyledMonospaceLabel>
        ),
      },
      {
        field: "status",
        headerName: headers.status,
        width: 130,
        renderCell: ({ row }) => (
          <ScheduleInstanceStatusBadge
            outcome={row.outcome}
            executionState={row.executionState}
            scheduledEndAt={row.scheduledEndAt}
            scheduledStartAt={row.scheduledStartAt}
            durationMinutes={row.duration}
            statusLabels={statusLabels}
          />
        ),
      },
      {
        field: "teacher",
        headerName: headers.teacher,
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => renderTeacherCell(row),
      },
      {
        field: "student",
        headerName: headers.student,
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => renderStudentCell(row),
      },
      {
        field: "join",
        headerName: "",
        width: 56,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <Box sx={{ display: "flex", justifyContent: "center", width: "100%", height: "100%", alignItems: "center" }}>
            {isJoinableClassInstance(row.executionState, row.outcome, { isFrozen: row.isFrozen ?? false }) ? (
              <MeetingJoinAction
                variant="icon"
                joinUrl={row.meetingJoinUrl}
                meeting={row.effectiveMeeting}
                label={headers.joinVideo}
                emptyRole="class"
              />
            ) : null}
          </Box>
        ),
      },
      buildActionsColumn(headers, detailsLabel, headers.history),
    ];
  }, [detailsLabel, headers, statusLabels, showTimezones, locale]);
}
