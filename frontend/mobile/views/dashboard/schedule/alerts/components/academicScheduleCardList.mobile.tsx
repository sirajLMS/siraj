"use client";

import {
  ComputerOutlined,
  LocationOnOutlined,
  MeetingRoomOutlined,
  PersonOutlined,
  ScheduleOutlined,
} from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { classHref, profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import type { AcademicClassRow, ClassSessionStatus } from "@/frontend/common/views/dashboard/schedule/alerts/types";
import {
  MobileCardListItem,
  MobileMeetingJoinAction,
  MobilePersonProfileLink,
  MobileStatusBadge,
} from "@/frontend/mobile/components/ui";
import { MobileCardList } from "@/frontend/mobile/components/ui/container/MobileCardList";
import { MobileClassProfileLink } from "@/frontend/mobile/components/ui/display/classProfileLink/ClassProfileLink.mobile";
import { ClassSessionActionButtonMobile } from "@/frontend/mobile/views/dashboard/schedule/alerts/components/classSessionActionButton.mobile";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

function shouldShowScheduleAlertJoin(row: AcademicClassRow): boolean {
  if (row.sessionStatus !== "upcoming" && row.sessionStatus !== "active") {
    return false;
  }
  return isJoinableClassInstance(row.executionState, row.outcome, { isFrozen: row.isFrozen ?? false });
}

export interface AcademicScheduleCardListMobileLabels {
  readonly joinSession: string;
  readonly leaveClass: string;
  readonly leaveDisabledReason: string;
  readonly viewClassAudit: string;
  readonly contactAdmin: string;
  readonly active: string;
  readonly upcoming: string;
  readonly missed: string;
  readonly hold: string;
  readonly endOfSchedule: string;
}

interface AcademicScheduleCardListMobileProps {
  readonly rows: readonly AcademicClassRow[];
  readonly labels: AcademicScheduleCardListMobileLabels;
  readonly paginationOptions: ListPaginationOptions;
  readonly onLeave: (id: string) => void;
  readonly onViewClassAudit: (id: string) => void;
}

function getRoomIcon(room: string) {
  if (room.toLowerCase().includes("lab")) {
    return ComputerOutlined;
  }
  if (room.toLowerCase().includes("room")) {
    return MeetingRoomOutlined;
  }
  return LocationOnOutlined;
}

type AcademicCardLabels = AcademicScheduleCardListMobileProps["labels"];

function ClassCardHeader({ row, labels }: Readonly<{ row: AcademicClassRow; labels: AcademicCardLabels }>) {
  const statusLabels: Record<ClassSessionStatus, string> = {
    active: labels.active,
    upcoming: labels.upcoming,
    missed: labels.missed,
    hold: labels.hold,
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
      <Box>
        <MobileClassProfileLink
          href={row.id ? classHref(row.id) : undefined}
          name={row.className}
          avatarUrl={row.classAvatarUrl}
          typographyVariant="titleLg"
          fontWeight={600}
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
          <PersonOutlined sx={theme => ({ fontSize: 14, color: theme.palette.text.secondary })} />
          <MobilePersonProfileLink
            href={profileHrefForTeacher({ teacherId: row.instructorId })}
            name={row.instructor}
            avatarSize={32}
            typographyVariant="bodyMd"
            fontWeight={400}
          />
        </Box>
      </Box>
      <MobileStatusBadge category="classSession" status={row.sessionStatus} label={statusLabels[row.sessionStatus]} />
    </Box>
  );
}

function ClassCardMetadata({ row }: Readonly<{ row: AcademicClassRow }>) {
  return (
    <Box
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        gap: 2,
        py: 1.5,
        borderTop: `1px solid ${theme.palette.border.light}`,
        borderBottom: `1px solid ${theme.palette.border.light}`,
        mb: 2,
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <ScheduleOutlined sx={theme => ({ fontSize: 16, color: theme.palette.header })} />
        <Typography variant="labelMd" sx={theme => ({ fontWeight: 500, color: theme.palette.primary.main })}>
          {row.time}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Box component={getRoomIcon(row.room)} sx={theme => ({ fontSize: 16, color: theme.palette.header })} />
        <Typography variant="labelMd" sx={theme => ({ fontWeight: 500, color: theme.palette.primary.main })}>
          {row.room}
        </Typography>
      </Box>
    </Box>
  );
}

function ClassCardActions({
  row,
  labels,
  onLeave,
  onViewClassAudit,
}: Readonly<{
  row: AcademicClassRow;
  labels: AcademicCardLabels;
  onLeave: (id: string) => void;
  onViewClassAudit: (id: string) => void;
}>) {
  const actionLabels = {
    joinSession: labels.joinSession,
    leaveClass: labels.leaveClass,
    leaveDisabledReason: labels.leaveDisabledReason,
    viewClassAudit: labels.viewClassAudit,
    contactAdmin: labels.contactAdmin,
  };

  if (row.sessionStatus === "missed") {
    return (
      <ClassSessionActionButtonMobile
        action="view_class_audit"
        classId={row.id}
        labels={actionLabels}
        onLeave={onLeave}
        onViewClassAudit={onViewClassAudit}
        fullWidth
      />
    );
  }

  if (row.sessionStatus === "hold") {
    return (
      <ClassSessionActionButtonMobile
        action="contact_admin"
        classId={row.id}
        labels={actionLabels}
        onLeave={onLeave}
        onViewClassAudit={onViewClassAudit}
        fullWidth
      />
    );
  }

  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
      <ClassSessionActionButtonMobile
        action={row.action === "leave_disabled" ? "leave_disabled" : "leave_enabled"}
        classId={row.id}
        labels={actionLabels}
        onLeave={onLeave}
        onViewClassAudit={onViewClassAudit}
        fullWidth
      />
      {shouldShowScheduleAlertJoin(row) ? (
        <MobileMeetingJoinAction
          variant="icon"
          joinUrl={row.meetingJoinUrl}
          meeting={row.effectiveMeeting}
          emptyRole="class"
          label={labels.joinSession}
          id={`join-session-${row.id}`}
        />
      ) : null}
    </Box>
  );
}

const AcademicClassCard = ({
  row,
  labels,
  onLeave,
  onViewClassAudit,
}: Readonly<{
  row: AcademicClassRow;
  labels: AcademicScheduleCardListMobileProps["labels"];
  onLeave: (id: string) => void;
  onViewClassAudit: (id: string) => void;
}>) => {
  const isMissed = row.sessionStatus === "missed";

  return (
    <MobileCardListItem variant="edge-to-edge" dimmed={isMissed}>
      <ClassCardHeader row={row} labels={labels} />
      <ClassCardMetadata row={row} />
      <ClassCardActions row={row} labels={labels} onLeave={onLeave} onViewClassAudit={onViewClassAudit} />
    </MobileCardListItem>
  );
};

const EndOfSchedule = ({ label }: Readonly<{ label: string }>) => {
  return (
    <Box sx={{ py: 4, textAlign: "center" }}>
      <Box
        sx={theme => ({
          width: "100%",
          height: 192,
          borderRadius: 0,
          backgroundColor: theme.palette.action.hover,
          border: `1px solid ${theme.palette.border.light}`,
          mb: 2,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <ScheduleOutlined sx={theme => ({ fontSize: 64, color: theme.palette.text.disabled, opacity: 0.4 })} />
      </Box>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, fontStyle: "italic" })}>
        {label}
      </Typography>
    </Box>
  );
};

export function AcademicScheduleCardListMobile({
  rows,
  labels,
  paginationOptions,
  onLeave,
  onViewClassAudit,
}: AcademicScheduleCardListMobileProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <MobileCardList
        rows={rows}
        getKey={row => row.id}
        paginationOptions={paginationOptions}
        layout="edge-to-edge"
        renderItem={row => (
          <AcademicClassCard row={row} labels={labels} onLeave={onLeave} onViewClassAudit={onViewClassAudit} />
        )}
      />
      <EndOfSchedule label={labels.endOfSchedule} />
    </Box>
  );
}
