"use client";

import { PersonOutlined, ScheduleOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { classHref, profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import type { AcademicClassRow } from "@/frontend/common/views/dashboard/schedule/alerts/types";
import { MobileMeetingJoinAction, MobilePersonProfileLink, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { MobileClassProfileLink } from "@/frontend/mobile/components/ui/display/classProfileLink/ClassProfileLink.mobile";
import {
  buildClassSessionStatusLabels,
  getRoomIcon,
  shouldShowScheduleAlertJoin,
} from "@/frontend/mobile/views/dashboard/schedule/alerts/components/academicScheduleCardList.helpers";
import type { AcademicScheduleCardListMobileLabels } from "@/frontend/mobile/views/dashboard/schedule/alerts/components/academicScheduleCardList.mobile";
import { ClassSessionActionButtonMobile } from "@/frontend/mobile/views/dashboard/schedule/alerts/components/classSessionActionButton.mobile";

type AcademicCardLabels = AcademicScheduleCardListMobileLabels;

export function ClassCardHeader({ row, labels }: Readonly<{ row: AcademicClassRow; labels: AcademicCardLabels }>) {
  const statusLabels = buildClassSessionStatusLabels(labels);

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

export function ClassCardMetadata({ row }: Readonly<{ row: AcademicClassRow }>) {
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

export function ClassCardActions({
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
