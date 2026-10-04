import { Box } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import { classHref, profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import type { AcademicClassRow } from "@/frontend/common/views/dashboard/schedule/alerts/types";
import { DesktopClassProfileLinkCell, DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import type {
  AcademicScheduleDataGridDesktopLabels,
  SessionStatusLabels,
} from "@/frontend/desktop/views/dashboard/schedule/alerts/components/academicScheduleDataGrid.types";
import { ClassSessionActionButtonDesktop } from "@/frontend/desktop/views/dashboard/schedule/alerts/components/classSessionActionButton.desktop";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

const SESSION_STATUS_LABELS: SessionStatusLabels = {
  active: "active",
  upcoming: "upcoming",
  missed: "missed",
  hold: "hold",
};

function shouldShowScheduleAlertJoin(row: AcademicClassRow): boolean {
  if (row.sessionStatus !== "upcoming" && row.sessionStatus !== "active") {
    return false;
  }
  return isJoinableClassInstance(row.executionState, row.outcome, { isFrozen: row.isFrozen ?? false });
}

function buildActionLabels(labels: AcademicScheduleDataGridDesktopLabels) {
  return {
    joinSession: labels.joinSession,
    leaveClass: labels.leaveClass,
    leaveDisabledReason: labels.leaveDisabledReason,
    viewClassAudit: labels.viewClassAudit,
    contactAdmin: labels.contactAdmin,
  };
}

function renderClassSessionCell(
  row: AcademicClassRow,
  labels: AcademicScheduleDataGridDesktopLabels,
  actionLabels: ReturnType<typeof buildActionLabels>,
  onLeave: (id: string) => void,
  onViewClassAudit: (id: string) => void
) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 2,
        width: "100%",
        height: "100%",
      }}
    >
      <DesktopStatusBadge
        category="classSession"
        status={row.sessionStatus}
        label={labels[SESSION_STATUS_LABELS[row.sessionStatus]]}
      />
      {shouldShowScheduleAlertJoin(row) ? (
        <MeetingJoinAction
          variant="icon"
          joinUrl={row.meetingJoinUrl}
          meeting={row.effectiveMeeting}
          emptyRole="parent"
          label={labels.joinSession}
          id={`join-session-${row.id}`}
        />
      ) : null}
      <ClassSessionActionButtonDesktop
        action={row.action}
        classId={row.id}
        labels={actionLabels}
        onLeave={onLeave}
        onViewClassAudit={onViewClassAudit}
      />
    </Box>
  );
}

export function buildAcademicScheduleColumns(
  labels: AcademicScheduleDataGridDesktopLabels,
  onLeave: (id: string) => void,
  onViewClassAudit: (id: string) => void
): GridColDef<AcademicClassRow>[] {
  const actionLabels = buildActionLabels(labels);

  return [
    {
      field: "className",
      headerName: labels.className,
      flex: 1.2,
      minWidth: 200,
      renderCell: ({ row }) => (
        <DesktopClassProfileLinkCell
          href={classHref(row.id)}
          name={row.className}
          avatarUrl={row.classAvatarUrl}
          avatarSize={40}
          typographyVariant="bodyMd"
          fontWeight={700}
        />
      ),
    },
    {
      field: "instructor",
      headerName: labels.instructor,
      flex: 1,
      minWidth: 140,
      renderCell: ({ row }) => (
        <DesktopPersonProfileLinkCell
          href={profileHrefForTeacher({ teacherId: row.instructorId })}
          name={row.instructor}
          avatarSize={32}
          typographyVariant="bodyMd"
          fontWeight={400}
        />
      ),
    },
    {
      field: "time",
      headerName: labels.time,
      flex: 1,
      minWidth: 160,
    },
    {
      field: "room",
      headerName: labels.room,
      width: 130,
    },
    {
      field: "sessionStatus",
      headerName: labels.status,
      width: 280,
      sortable: false,
      align: "right",
      headerAlign: "right",
      renderCell: ({ row }) => renderClassSessionCell(row, labels, actionLabels, onLeave, onViewClassAudit),
    },
  ];
}
