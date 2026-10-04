import { AcUnitOutlined, HistoryOutlined } from "@mui/icons-material";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { MeetingUrlCell } from "@/frontend/common/components/ui/display/meetingConfig";
import { safeOpenWindow } from "@/frontend/common/lib/safeOpenWindow";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type { ParentScheduleRow } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";
import type { ParentScheduleDataGridDesktopProps } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentScheduleComponents.types";
import { DesktopPersonProfileLinkCell, DesktopStatusBadge } from "@/frontend/desktop/components/ui";
import { ParentClassStatusIndicatorDesktop } from "@/frontend/desktop/views/dashboard/parent/dashboard/components/parentClassStatusIndicator.desktop";
import {
  centeredCellSx,
  formatRowNumber,
  resolveBookingBadge,
  resolveMeetingUrlStatus,
} from "@/frontend/desktop/views/dashboard/parent/dashboard/components/parentScheduleDataGrid.helpers";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

type ParentScheduleLabels = ParentScheduleDataGridDesktopProps["labels"];

interface ParentScheduleCellProps {
  readonly row: ParentScheduleRow;
  readonly labels: ParentScheduleLabels;
}

export function ParentScheduleRowNumberCell({ row }: Readonly<ParentScheduleCellProps>) {
  return (
    <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, alignSelf: "center" })}>
      {formatRowNumber(row.rowNumber)}
    </Typography>
  );
}

export function ParentScheduleClassTimeCell({ row, labels }: Readonly<ParentScheduleCellProps>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
      <Typography variant="bodyMd" sx={{ fontWeight: 700, color: theme => theme.palette.primary.main }}>
        {row.classTime}
      </Typography>
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {labels.schedule.duration(row.durationMinutes)}
      </Typography>
    </Box>
  );
}

export function ParentScheduleStudentNameCell({ row }: Readonly<ParentScheduleCellProps>) {
  return (
    <DesktopPersonProfileLinkCell
      href={row.studentId ? studentHref(row.studentId) : undefined}
      name={row.studentName}
      avatarUrl={row.studentAvatarUrl}
      showAvatar
      avatarSize={32}
      fallbackInitial={row.studentInitials?.[0] ?? "?"}
      typographyVariant="bodyMd"
      fontWeight={600}
    />
  );
}

export function ParentScheduleTeacherNameCell({ row }: Readonly<ParentScheduleCellProps>) {
  return (
    <DesktopPersonProfileLinkCell
      href={row.teacherId ? profileHrefForTeacher({ teacherId: row.teacherId }) : undefined}
      name={row.teacherName}
      avatarUrl={row.teacherAvatarUrl}
      avatarSize={32}
      typographyVariant="bodyMd"
      fontWeight={400}
      emphasizeLink={Boolean(row.teacherId)}
    />
  );
}

export function ParentScheduleHistoryCell({
  row,
  labels,
  onHistory,
}: Readonly<ParentScheduleCellProps> & { readonly onHistory: (id: string) => void }) {
  return (
    <Box sx={centeredCellSx}>
      <Tooltip title={labels.schedule.history}>
        <IconButton
          size="small"
          aria-label={labels.schedule.history}
          onClick={() => {
            onHistory(row.id);
          }}
          sx={theme => ({ color: theme.palette.header })}
        >
          <HistoryOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export function ParentScheduleBookingStatusCell({ row, labels }: Readonly<ParentScheduleCellProps>) {
  const badge = resolveBookingBadge(row.bookingStatus);
  return (
    <DesktopStatusBadge
      category={badge.category}
      status={badge.status}
      label={labels.bookingStatus[row.bookingStatus]}
    />
  );
}

export function ParentScheduleContactCell({ row, labels }: Readonly<ParentScheduleCellProps>) {
  if (row.isFrozen) {
    return (
      <Box sx={centeredCellSx}>
        <Tooltip title={labels.schedule.contactAdmin}>
          <AcUnitOutlined sx={theme => ({ fontSize: 22, color: theme.palette.info.main, opacity: 0.7 })} />
        </Tooltip>
      </Box>
    );
  }
  const isJoinable = isJoinableClassInstance(row.executionState, row.outcome, { isFrozen: row.isFrozen });
  return (
    <Box sx={centeredCellSx}>
      <MeetingUrlCell
        meetingUrl={row.meetingJoinUrl}
        meetingUrlStatus={resolveMeetingUrlStatus(row)}
        joinLabel={labels.schedule.joinVideo}
        compact
        onJoin={isJoinable ? () => safeOpenWindow(row.meetingJoinUrl) : undefined}
      />
    </Box>
  );
}

export function ParentScheduleLiveClassStatusCell({ row, labels }: Readonly<ParentScheduleCellProps>) {
  return <ParentClassStatusIndicatorDesktop status={row.liveClassStatus} label={labels.liveClassStatus.startingSoon} />;
}
