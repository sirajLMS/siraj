import type { GridColDef } from "@mui/x-data-grid";
import { DateTimeTooltipDisplay } from "@/frontend/common/components/intl/DateTimeTooltipDisplay";
import { classHref, profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type { PendingReviewRow } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopClassProfileLinkCell } from "@/frontend/desktop/components/ui/display/classProfileLink/ClassProfileLinkCell.desktop";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display/personProfileLink/PersonProfileLinkCell.desktop";
import { PendingReviewActionsCell } from "@/frontend/desktop/views/dashboard/supervisor/lesson-reviews/pendingReviewActionsCell.desktop";
import type { PendingReviewsLabels } from "@/shared/locale";

function statusLabel(status: PendingReviewRow["status"], labels: PendingReviewsLabels): string {
  if (!status) return labels.statusLabels.PENDING_REVIEW;
  return labels.statusLabels[status] ?? labels.statusLabels.PENDING_REVIEW;
}

export function buildParticipantColumns(labels: PendingReviewsLabels): GridColDef<PendingReviewRow>[] {
  return [
    {
      field: "subjectName",
      headerName: labels.classColumn,
      flex: 1.2,
      minWidth: 180,
      renderCell: params => (
        <DesktopClassProfileLinkCell
          href={params.row.classInstanceId ? classHref(params.row.classInstanceId) : undefined}
          name={params.row.subjectName?.trim() || "—"}
          avatarUrl={params.row.classAvatarUrl}
        />
      ),
    },
    {
      field: "studentName",
      headerName: labels.studentColumn,
      flex: 1,
      minWidth: 150,
      renderCell: params => (
        <DesktopPersonProfileLinkCell
          href={params.row.studentId ? studentHref(params.row.studentId) : undefined}
          name={params.row.studentName || params.row.studentId}
          avatarUrl={params.row.studentAvatarUrl}
        />
      ),
    },
    {
      field: "teacherName",
      headerName: labels.teacherColumn,
      flex: 1,
      minWidth: 150,
      renderCell: params => (
        <DesktopPersonProfileLinkCell
          href={profileHrefForTeacher({ teacherId: params.row.teacherId })}
          name={params.row.teacherName || params.row.teacherId}
          avatarUrl={params.row.teacherAvatarUrl}
        />
      ),
    },
  ];
}

export function buildReportMetricColumns(labels: PendingReviewsLabels, locale: string): GridColDef<PendingReviewRow>[] {
  return [
    {
      field: "attendanceEvaluation",
      headerName: labels.attendanceColumn,
      width: 130,
      valueGetter: (_, row) => row.attendanceEvaluation ?? "",
    },
    {
      field: "completionPercentage",
      headerName: labels.completionColumn,
      width: 130,
      valueGetter: (_, row) => `${row.completionPercentage}%`,
    },
    {
      field: "lessonDate",
      headerName: labels.lessonDateColumn,
      flex: 1,
      minWidth: 130,
      valueGetter: (_, row) => row.lessonDate,
      renderCell: params => <DateTimeTooltipDisplay value={params.row.lessonDate} locale={locale} />,
    },
    {
      field: "submittedAt",
      headerName: labels.submittedAtColumn,
      flex: 1,
      minWidth: 130,
      valueGetter: (_, row) => row.submittedAt,
      renderCell: params => <DateTimeTooltipDisplay value={params.row.submittedAt} locale={locale} />,
    },
  ];
}

export function buildStatusColumns(
  labels: PendingReviewsLabels,
  approving: boolean,
  onSelectReport: (report: PendingReviewRow) => void,
  onApprove: (reportId: string) => void,
  onOpenRejectDialog: (report: PendingReviewRow) => void
): GridColDef<PendingReviewRow>[] {
  return [
    {
      field: "status",
      headerName: labels.statusColumn,
      width: 120,
      renderCell: params => (
        <DesktopStatusBadge
          category="classStatus"
          status={params.row.status ? params.row.status.toLowerCase() : "pending"}
          label={statusLabel(params.row.status, labels)}
        />
      ),
    },
    {
      field: "actions",
      headerName: labels.actionsColumn,
      width: 140,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: params => (
        <PendingReviewActionsCell
          row={params.row}
          labels={labels}
          approving={approving}
          onSelectReport={onSelectReport}
          onApprove={onApprove}
          onOpenRejectDialog={onOpenRejectDialog}
        />
      ),
    },
  ];
}
