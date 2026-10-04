"use client";

import { VisibilityOutlined } from "@mui/icons-material";
import { Typography } from "@mui/material";
import { ActionIconLink } from "@/frontend/common/components/ui/button/ActionIconLink";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import { classHref, profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import {
  formatStudentHistoryDuration,
  mapStudentHistoryStatusToBadge,
  resolveStudentHistoryStatusLabel,
} from "@/frontend/common/views/dashboard/student/history/utils/studentHistorySessionPresentation";
import type { StudentSessionsViewModel } from "@/frontend/common/views/dashboard/student/sessions/useStudentSessionsViewModel";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import {
  DesktopClassProfileLinkCell,
  type DesktopClassProfileLinkCellProps,
} from "@/frontend/desktop/components/ui/display/classProfileLink/ClassProfileLinkCell.desktop";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display/personProfileLink/PersonProfileLinkCell.desktop";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

type SessionCellLabels = StudentSessionsViewModel["labels"];

function isSessionJoinable(row: StudentHistorySessionRow): boolean {
  return Boolean(row.meetingJoinUrl) && isJoinableClassInstance(undefined, row.outcome, { isFrozen: row.isFrozen });
}

interface SessionRowCellProps {
  readonly row: StudentHistorySessionRow;
}

interface SessionCellProps extends SessionRowCellProps {
  readonly labels: SessionCellLabels;
}

interface SessionActionsCellProps extends SessionRowCellProps {
  readonly labels: SessionCellLabels;
  readonly onOpenMeetingUrl: StudentSessionsViewModel["onOpenMeetingUrl"];
}

/**
 * Shared profile-link cell props for the class/instructor columns. Both desktop
 * cell wrappers accept the same prop shape, so one builder serves both columns.
 */
function sessionProfileLinkProps(
  href: string | undefined,
  name: string,
  avatarSize: number
): DesktopClassProfileLinkCellProps {
  return {
    href,
    name: name.trim() || "—",
    avatarSize,
    typographyVariant: "bodyMd",
    fontWeight: 700,
  };
}

export function SessionTitleCell({ row }: Readonly<SessionRowCellProps>) {
  return <DesktopClassProfileLinkCell {...sessionProfileLinkProps(classHref(row.id), row.title, 40)} />;
}

export function SessionInstructorCell({ row }: Readonly<SessionRowCellProps>) {
  return (
    <DesktopPersonProfileLinkCell
      {...sessionProfileLinkProps(profileHrefForTeacher({ teacherId: row.teacherId }), row.instructor, 36)}
    />
  );
}

export function SessionDurationCell({ row, labels }: Readonly<SessionCellProps>) {
  return <Typography variant="bodyMd">{formatStudentHistoryDuration(row.duration, labels)}</Typography>;
}

export function SessionStatusCell({ row, labels }: Readonly<SessionCellProps>) {
  return (
    <DesktopStatusBadge
      category="classStatus"
      status={mapStudentHistoryStatusToBadge(row.status, row.outcome)}
      label={resolveStudentHistoryStatusLabel(row, labels.statusLabels)}
    />
  );
}

export function SessionNotesCell({ row }: Readonly<SessionRowCellProps>) {
  return (
    <Typography variant="bodyMd" noWrap title={row.notes || undefined}>
      {row.notes?.trim() || "—"}
    </Typography>
  );
}

export function SessionActionsCell({ row, labels, onOpenMeetingUrl }: Readonly<SessionActionsCellProps>) {
  if (isSessionJoinable(row)) {
    return (
      <MeetingJoinAction
        joinUrl={row.meetingJoinUrl}
        meeting={row.effectiveMeeting}
        onJoinAction={() => onOpenMeetingUrl(row.meetingJoinUrl)}
        variant="icon"
        label={labels.joinSession}
        emptyRole="class"
      />
    );
  }
  return (
    <ActionIconLink href={classHref(row.id)} aria-label={labels.viewClass}>
      <VisibilityOutlined fontSize="small" />
    </ActionIconLink>
  );
}
