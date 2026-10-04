"use client";

import type { GridColDef } from "@mui/x-data-grid";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { MeetingUrlCell } from "@/frontend/common/components/ui/display/meetingConfig/MeetingUrlCell";
import {
  AppPermission,
  type ClassExecutionState,
  type ClassOutcome,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { TeacherScheduleRow } from "@/frontend/common/stores/teacherDashboardTypes";
import type { TeacherDashboardViewLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
import {
  StatusCell,
  TimeRangeCell,
} from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/teacherScheduleDataGridCells.parts";
import { TeacherScheduleSessionActionsCellDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/teacherScheduleSessionActionsCell.desktop";
import { TeacherScheduleStudentCellDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/teacherScheduleStudentCell.desktop";

function formatRowNumber(value: number): string {
  return String(value).padStart(2, "0");
}

function formatDuration(minutes: number | undefined, formatFn: (minutes: number) => string): string {
  if (!minutes) {
    return "—";
  }
  return formatFn(minutes);
}

function buildMeetingUrlColumn(labels: TeacherDashboardViewLabels): GridColDef<TeacherScheduleRow> {
  return {
    field: "meetingUrl",
    headerName: labels.schedule.meetingUrl,
    flex: 1.2,
    minWidth: 180,
    sortable: false,
    renderCell: ({ row }) => (
      <RequirePermission
        permissions={[AppPermission.MeetingConfigsManageOwn, AppPermission.MeetingConfigsManageClass]}
        fallback={
          <MeetingUrlCell
            meetingUrl={row.meetingJoinUrl}
            meetingUrlStatus={row.meetingUrlStatus}
            meetingUrlError={row.meetingUrlError}
            joinLabel={labels.actions.joinVideo}
            setupHref="/profile?tab=meeting"
            compact
            badgeSize="small"
            canCopyUrl={false}
          />
        }
      >
        <MeetingUrlCell
          meetingUrl={row.meetingJoinUrl}
          meetingUrlStatus={row.meetingUrlStatus}
          meetingUrlError={row.meetingUrlError}
          joinLabel={labels.actions.joinVideo}
          setupHref="/profile?tab=meeting"
          compact
          badgeSize="small"
          canCopyUrl
        />
      </RequirePermission>
    ),
  };
}

function buildActionsColumn(
  labels: TeacherDashboardViewLabels,
  canActivate: boolean,
  onActivate: ((id: string) => void) | undefined,
  onStartSession: ((id: string) => void) | undefined,
  onMarkAbsent: ((id: string) => void) | undefined,
  onRequestLeave: ((id: string) => void) | undefined
): GridColDef<TeacherScheduleRow> {
  return {
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
  };
}

export function buildColumns(
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
    buildMeetingUrlColumn(labels),
    buildActionsColumn(labels, canActivate, onActivate, onStartSession, onMarkAbsent, onRequestLeave),
  ];
}
