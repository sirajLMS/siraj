"use client";

import { AcUnitOutlined, ScheduleOutlined } from "@mui/icons-material";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type { ParentDashboardLabels } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardLabels";
import type { ParentScheduleRow } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";
import {
  DesktopMeetingJoinAction,
  DesktopPersonProfileLinkCell,
  DesktopStatusBadge,
} from "@/frontend/desktop/components/ui";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

export interface ParentScheduleDesktopListItemProps {
  readonly row: ParentScheduleRow;
  readonly labels: ParentDashboardLabels;
}

/**
 * Desktop schedule row rendered inline (the parent desktop view uses an
 * `AppDataGrid`-based grid in `ParentScheduleDataGrid.desktop`). This card
 * variant is exposed for the optional list/compact desktop layouts where a
 * row-level card is preferred over a DataGrid row. Frozen rows get an
 * inline-start accent border and a snowflake indicator.
 */
export function ParentScheduleCardDesktop({ row, labels }: Readonly<ParentScheduleDesktopListItemProps>): ReactNode {
  const studentProfileHref = row.studentId ? studentHref(row.studentId) : undefined;
  const teacherProfileHref = profileHrefForTeacher({ teacherId: row.teacherId });
  const teacherLabel = labels.schedule.teacherLabel(row.teacherName);

  return (
    <Box
      sx={theme => ({
        p: 2,
        borderRadius: 2,
        border: `1px solid ${row.isFrozen ? theme.palette.info.main : theme.palette.outlineVariant}`,
        backgroundColor: theme.palette.surfaceContainerLowest,
        opacity: row.isFrozen ? 0.85 : 1,
      })}
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
              {labels.schedule.duration(row.durationMinutes)}
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
          <DesktopStatusBadge
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
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <DesktopPersonProfileLinkCell
            href={studentProfileHref}
            name={row.studentName}
            avatarUrl={row.studentAvatarUrl}
            showAvatar
            avatarSize={40}
            fallbackInitial={row.studentInitials?.[0] ?? "?"}
            typographyVariant="bodyMd"
            fontWeight={700}
          />
          <DesktopPersonProfileLinkCell
            href={teacherProfileHref}
            name={teacherLabel}
            avatarSize={32}
            typographyVariant="labelMd"
            fontWeight={400}
            emphasizeLink={Boolean(teacherProfileHref)}
          />
        </Stack>
        {isJoinableClassInstance(row.executionState, row.outcome, { isFrozen: row.isFrozen }) ? (
          <DesktopMeetingJoinAction
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
    </Box>
  );
}
