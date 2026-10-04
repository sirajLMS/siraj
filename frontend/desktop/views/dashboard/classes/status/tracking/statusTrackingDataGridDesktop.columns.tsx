import type { GridColDef } from "@mui/x-data-grid";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import { classHref, profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import { STATUS_LABEL_KEYS } from "@/frontend/common/views/dashboard/classes/status/tracking/constants/statusLabelKeys.constants";
import { StatusAction } from "@/frontend/common/views/dashboard/classes/status/tracking/StatusBadgeAction";
import {
  computeSessionStatus,
  formatScheduleRange,
  type StatusTrackingDataGridProps,
  type StatusTrackingScheduleRow,
} from "@/frontend/common/views/dashboard/classes/status/tracking/types";
import {
  createStatusActionLabels,
  renderStatusTrackingJoinCell,
} from "@/frontend/common/views/dashboard/classes/status/tracking/utils/statusTrackingGridShared";
import { getStatusIcon } from "@/frontend/common/views/dashboard/classes/status/tracking/utils/statusTrackingIcons.utils";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui";
import { DesktopClassProfileLinkCell } from "@/frontend/desktop/components/ui/display/classProfileLink/ClassProfileLinkCell.desktop";
import {
  DesktopPersonProfileLinkCell,
  type DesktopPersonProfileLinkCellProps,
} from "@/frontend/desktop/components/ui/display/personProfileLink/PersonProfileLinkCell.desktop";

type StatusTrackingGridLabels = StatusTrackingDataGridProps["labels"];

function renderProfileCell(props: DesktopPersonProfileLinkCellProps) {
  return <DesktopPersonProfileLinkCell {...props} typographyVariant="bodyMd" />;
}

function renderCourseProfileCell(row: StatusTrackingScheduleRow) {
  return (
    <DesktopClassProfileLinkCell
      href={row.id ? classHref(row.id) : undefined}
      name={row.courseName?.trim() ?? "—"}
      avatarUrl={row.avatarUrl}
      avatarSize={40}
      typographyVariant="bodyMd"
      fontWeight={700}
    />
  );
}

function renderStatusBadgeCell(row: StatusTrackingScheduleRow, labels: StatusTrackingGridLabels) {
  const status = computeSessionStatus(row.studentStatus, row.isFrozen, row.executionState);
  return (
    <DesktopStatusBadge
      category="sessionTracking"
      status={status}
      label={labels[STATUS_LABEL_KEYS[status]]}
      icon={getStatusIcon(status)}
    />
  );
}

interface BuildStatusTrackingDataGridDesktopColumnsParams {
  readonly labels: StatusTrackingGridLabels;
  readonly locale: string;
  readonly onActivate: StatusTrackingDataGridProps["onActivate"];
  readonly onReschedule: StatusTrackingDataGridProps["onReschedule"];
  readonly onVerify: StatusTrackingDataGridProps["onVerify"];
}

export function buildStatusTrackingDataGridDesktopColumns({
  labels,
  locale,
  onActivate,
  onReschedule,
  onVerify,
}: Readonly<BuildStatusTrackingDataGridDesktopColumnsParams>): GridColDef<StatusTrackingScheduleRow>[] {
  const actionLabels = createStatusActionLabels(labels);

  return [
    {
      field: "courseName",
      headerName: labels.class,
      flex: 1.2,
      minWidth: 180,
      renderCell: ({ row }) => renderCourseProfileCell(row),
    },
    {
      field: "studentName",
      headerName: labels.student,
      flex: 1.1,
      minWidth: 160,
      renderCell: ({ row }) =>
        renderProfileCell({
          href: row.studentId ? studentHref(row.studentId) : undefined,
          name: row.studentName ?? "",
          avatarUrl: row.studentAvatarUrl,
          avatarSize: 40,
          fontWeight: 700,
        }),
    },
    {
      field: "teacherName",
      headerName: labels.teacher,
      flex: 1,
      minWidth: 140,
      renderCell: ({ row }) =>
        renderProfileCell({
          href: profileHrefForTeacher({ teacherId: row.teacherId }),
          name: row.teacherName ?? "",
          avatarUrl: row.teacherAvatarUrl,
          avatarSize: 32,
          fontWeight: 600,
        }),
    },
    {
      field: "schedule",
      headerName: labels.schedule,
      flex: 1,
      minWidth: 140,
      valueGetter: (_value, row) => formatScheduleRange(row.scheduledStartAt, row.scheduledEndAt, locale),
    },
    {
      field: "status",
      headerName: labels.status,
      width: 180,
      renderCell: ({ row }) => renderStatusBadgeCell(row, labels),
    },
    {
      field: "join",
      headerName: "",
      width: 56,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }) => renderStatusTrackingJoinCell(row, labels, MeetingJoinAction),
    },
    {
      field: "actions",
      headerName: labels.actions,
      width: 200,
      flex: 1,
      sortable: false,
      align: "right",
      headerAlign: "center",
      renderCell: ({ row }) => (
        <StatusAction
          row={row}
          labels={actionLabels}
          onActivate={onActivate}
          onReschedule={onReschedule}
          onVerify={onVerify}
        />
      ),
    },
  ];
}
