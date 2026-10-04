import { Typography } from "@mui/material";
import { RateSource, TeacherDueStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type {
  TeacherDueRow,
  TeacherDuesColumnLabels,
} from "@/frontend/common/views/dashboard/supervisor/teacher-dues/types/teacherDuesTypes";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display/personProfileLink/PersonProfileLinkCell.desktop";

export function TeacherNameCell({ row }: Readonly<{ row: TeacherDueRow }>) {
  return (
    <DesktopPersonProfileLinkCell
      href={profileHrefForTeacher({ userId: row.teacherUserId, teacherId: row.teacherId })}
      name={row.teacherName || row.teacherId}
      avatarUrl={row.teacherAvatarUrl}
    />
  );
}

export function StudentNameCell({ row }: Readonly<{ row: TeacherDueRow }>) {
  return (
    <DesktopPersonProfileLinkCell
      href={row.studentId ? studentHref(row.studentId) : undefined}
      name={row.studentName || row.studentId}
      avatarUrl={row.studentAvatarUrl}
    />
  );
}

export function StatusCell({ row, labels }: Readonly<{ row: TeacherDueRow; labels: TeacherDuesColumnLabels }>) {
  const status = row.status ?? TeacherDueStatus.Pending;
  const statusLabel = status === TeacherDueStatus.Paid ? labels.statusPaid : labels.statusPending;
  return <DesktopStatusBadge category="invoice" status={status} label={statusLabel} />;
}

function rateSourceLabel(source: RateSource | null, labels: TeacherDuesColumnLabels): string {
  switch (source) {
    case RateSource.Override:
      return labels.rateSourceOverride;
    case RateSource.Recurring:
      return labels.rateSourceRecurring;
    case RateSource.Subject:
      return labels.rateSourceSubject;
    case RateSource.Teacher:
      return labels.rateSourceTeacher;
    default:
      return labels.rateSourceTeacher;
  }
}

export function RateSourceCell({ row, labels }: Readonly<{ row: TeacherDueRow; labels: TeacherDuesColumnLabels }>) {
  return <Typography variant="bodyMd">{rateSourceLabel(row.rateSource, labels)}</Typography>;
}

export function MarkAsPaidCell({
  row,
  canMarkPaid,
  markingPaid,
  labels,
  onMarkPaid,
}: Readonly<{
  row: TeacherDueRow;
  canMarkPaid: boolean;
  markingPaid: boolean;
  labels: TeacherDuesColumnLabels;
  onMarkPaid: (dueIds: string[]) => void;
}>) {
  if (!canMarkPaid) return null;
  return (
    <DesktopPrimaryPageAction size="small" onClick={() => onMarkPaid([row.id])} disabled={markingPaid}>
      {labels.markAsPaidButton}
    </DesktopPrimaryPageAction>
  );
}
