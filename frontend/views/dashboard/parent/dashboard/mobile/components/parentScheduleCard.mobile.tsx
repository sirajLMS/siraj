"use client";

import { AcUnitOutlined, ScheduleOutlined } from "@mui/icons-material";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { MeetingJoinAction, MobileCardListItem, StatusBadge } from "@/frontend/components/ui";
import { PersonProfileLink } from "@/frontend/components/ui/display/personProfileLink/PersonProfileLink";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type { ParentDashboardLabels } from "@/frontend/views/dashboard/parent/dashboard/types/parentDashboardLabels";
import type { ParentScheduleRow } from "@/frontend/views/dashboard/parent/dashboard/types/parentDashboardTypes";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

export interface ParentScheduleMobileCardItemProps {
  readonly row: ParentScheduleRow;
  readonly labels: ParentDashboardLabels;
}

function formatDuration(template: string, minutes: number): string {
  return template.replace("{minutes}", String(minutes));
}

function formatTeacherLabel(template: string, name: string): string {
  return template.replace("{name}", name);
}

/**
 * Parent-schedule card rendered for each row via the `renderItem` callback
 * of `MobileCardList`. Uses the shared `MobileCardListItem` shell with
 * `edge-to-edge` variant and an inline-start accent border for frozen rows.
 */
export function ParentScheduleCardMobile({ row, labels }: Readonly<ParentScheduleMobileCardItemProps>): ReactNode {
  const studentProfileHref = row.studentId ? studentHref(row.studentId) : undefined;
  const teacherProfileHref = profileHrefForTeacher({ teacherId: row.teacherId });
  const teacherLabel = formatTeacherLabel(labels.schedule.teacherLabel, row.teacherName);

  return (
    <MobileCardListItem
      variant="edge-to-edge"
      dimmed={row.isFrozen}
      accentBorder={row.isFrozen ? { color: "info", side: "inline-start" } : undefined}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            sx={theme => ({
              p: 1,
              borderRadius: 2,
              backgroundColor: theme.palette.secondaryContainer,
              display: "flex",
            })}
          >
            <ScheduleOutlined sx={theme => ({ color: theme.palette.onSecondaryContainer })} />
          </Box>
          <Box>
            <Typography variant="bodyMd" sx={{ fontWeight: 700, color: theme => theme.palette.primary.main }}>
              {row.classTime}
            </Typography>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {formatDuration(labels.schedule.duration, row.durationMinutes)}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          {row.isFrozen ? (
            <Tooltip title={labels.schedule.contactAdmin}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <AcUnitOutlined sx={theme => ({ fontSize: 18, color: theme.palette.info.main })} />
                <Typography variant="labelMd" sx={theme => ({ color: theme.palette.info.main, fontWeight: 700 })}>
                  {labels.schedule.frozen}
                </Typography>
              </Box>
            </Tooltip>
          ) : null}
          <StatusBadge
            category={row.bookingStatus === "rescheduled" ? "trackingStatus" : "session"}
            status={row.bookingStatus === "rescheduled" ? "rescheduled" : "confirmed"}
            label={labels.bookingStatus[row.bookingStatus]}
          />
        </Stack>
      </Box>

      <Box
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pt: 2,
          borderTop: `1px dashed ${theme.palette.outlineVariant}`,
        })}
      >
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <PersonProfileLink
            href={studentProfileHref}
            name={row.studentName}
            avatarUrl={row.studentAvatarUrl}
            fallbackInitial={row.studentInitials || "S"}
            avatarSize={40}
            typographyVariant="bodyMd"
            fontWeight={700}
          />
          <PersonProfileLink
            href={teacherProfileHref}
            name={teacherLabel}
            avatarSize={32}
            typographyVariant="labelMd"
            fontWeight={400}
            emphasizeLink={Boolean(teacherProfileHref)}
          />
        </Stack>
        {isJoinableClassInstance(row.executionState, row.outcome, { isFrozen: row.isFrozen }) ? (
          <MeetingJoinAction
            variant="icon"
            joinUrl={row.meetingJoinUrl}
            meeting={row.effectiveMeeting}
            disabled={!row.videoEnabled}
            label={labels.schedule.joinVideo}
            emptyRole="parent"
          />
        ) : row.isFrozen ? (
          <Tooltip title={labels.schedule.contactAdmin}>
            <AcUnitOutlined sx={theme => ({ fontSize: 22, color: theme.palette.info.main, opacity: 0.7 })} />
          </Tooltip>
        ) : null}
      </Box>
    </MobileCardListItem>
  );
}
