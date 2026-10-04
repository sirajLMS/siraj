"use client";

import { Box, Typography } from "@mui/material";
import { LeaveRequestStatus, RescheduleDateLabel } from "@/frontend/common/graphql/generated/gql/graphql";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import {
  getTrackingStatusIcon,
  getTrackingStatusLabel,
} from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.helpers";
import type { TrackingRow } from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display";

interface TeacherNameCellProps {
  readonly row: TrackingRow;
}

export function TrackingTeacherNameCell({ row }: Readonly<TeacherNameCellProps>) {
  return (
    <DesktopPersonProfileLinkCell
      href={profileHrefForTeacher({ teacherId: row.teacherId })}
      name={row.teacherName ?? ""}
      avatarUrl={row.teacherAvatarUrl}
      avatarSize={36}
      typographyVariant="bodyMd"
      fontWeight={700}
    />
  );
}

interface StudentNameCellProps {
  readonly row: TrackingRow;
}

export function TrackingStudentNameCell({ row }: Readonly<StudentNameCellProps>) {
  return (
    <DesktopPersonProfileLinkCell
      href={row.studentId ? studentHref(row.studentId) : undefined}
      name={row.studentName ?? ""}
      avatarSize={36}
      typographyVariant="bodyMd"
      fontWeight={400}
      emphasizeLink={Boolean(row.studentId)}
    />
  );
}

interface ScheduledDateCellProps {
  readonly row: TrackingRow;
  readonly leaveRequestLabel: string;
  readonly newDateLabel: string;
}

/** Scheduled date with a tone tag distinguishing leave requests from rescheduled dates. */
export function TrackingScheduledDateCell({ row, leaveRequestLabel, newDateLabel }: Readonly<ScheduledDateCellProps>) {
  const isLeaveRequest = row.dateLabel === RescheduleDateLabel.LeaveRequest;
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.8,
        alignSelf: "center",
        height: "100%",
        justifyContent: "center",
      }}
    >
      <Typography variant="bodyMd">{row.scheduledDate}</Typography>
      <Box
        sx={theme => ({
          display: "inline-flex",
          alignItems: "center",
          px: 1,
          py: 0.25,
          borderRadius: 0.75,
          backgroundColor: isLeaveRequest ? theme.palette.error.main : theme.palette.primary.main,
          width: "fit-content",
        })}
      >
        <Typography
          variant="labelSm"
          sx={theme => ({
            color: isLeaveRequest ? theme.palette.onError : theme.palette.onPrimary,
            fontWeight: 700,
          })}
        >
          {isLeaveRequest ? leaveRequestLabel : newDateLabel}
        </Typography>
      </Box>
    </Box>
  );
}

interface TimeSlotCellProps {
  readonly row: TrackingRow;
}

export function TrackingTimeSlotCell({ row }: Readonly<TimeSlotCellProps>) {
  return (
    <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, whiteSpace: "nowrap" })}>
      {row.timeSlot}
    </Typography>
  );
}

interface StatusCellProps {
  readonly row: TrackingRow;
  readonly labels: Parameters<typeof getTrackingStatusLabel>[1];
}

export function TrackingStatusCell({ row, labels }: Readonly<StatusCellProps>) {
  const status = row.status ?? LeaveRequestStatus.Pending;
  const hasStatus = row.status !== null;
  return (
    <DesktopStatusBadge
      category="trackingStatus"
      status={status}
      label={hasStatus ? getTrackingStatusLabel(status, labels) : ""}
      icon={hasStatus ? getTrackingStatusIcon(status, { fontSize: 14, color: "inherit" }) : null}
    />
  );
}
