"use client";

import { AccessTimeOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, Paper, Tooltip, Typography } from "@mui/material";
import type { ReactNode } from "react";
import type { TeacherScheduleRow } from "@/frontend/common/stores/teacherDashboardTypes";
import { studentHref } from "@/frontend/common/utils/profileHref";
import { formatDurationMinutes } from "@/frontend/common/views/dashboard/admin/home/utils/formatScheduleTime";
import type { TeacherDashboardViewLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
import {
  getStatusLabel,
  resolveTeacherStatusBadge,
} from "@/frontend/common/views/dashboard/teachers/dashboard/utils/sessionStatusUtils";
import {
  DesktopActionIconLink,
  DesktopPersonProfileLinkCell,
  DesktopStatusBadge,
} from "@/frontend/desktop/components/ui";
import { TeacherScheduleSessionActionsCellDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/teacherScheduleSessionActionsCell.desktop";
import { resolveTeacherScheduleSessionActions } from "@/shared/lib/schedule/teacher-schedule-session-actions";

export interface TeacherScheduleCardDesktopItemProps {
  readonly row: TeacherScheduleRow;
  readonly labels: TeacherDashboardViewLabels;
  readonly canActivate: boolean;
  readonly onActivate?: (id: string) => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
}

/**
 * Desktop variant of the teacher-schedule card — previously an orphan (only
 * the mobile counterpart existed). Renders a denser, horizontally-oriented
 * single-row card mirroring the desktop data grid's per-row layout: row
 * number · student (avatar+name) · time · duration · status · actions · class
 * link. The desktop view typically renders the schedule via the data grid;
 * this card is the card-mode equivalent should the view switch to a card
 * layout.
 */
export function TeacherScheduleCardDesktop({
  row,
  labels,
  canActivate,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
}: Readonly<TeacherScheduleCardDesktopItemProps>): ReactNode {
  const sessionActions = resolveTeacherScheduleSessionActions({
    executionState: row.executionState,
    outcome: row.outcome,
    activateEnabled: row.activateEnabled,
    canActivate,
    videoEnabled: row.videoEnabled,
    isConnecting: row.status === "connecting",
    isFrozen: row.isFrozen,
  });
  const badge = resolveTeacherStatusBadge(row.status);
  const duration = formatDurationMinutes(row.durationMinutes);
  const studentHrefValue = row.studentId ? studentHref(row.studentId) : undefined;
  const isFrozen = row.isFrozen === true;
  const isCompleted = row.status === "completed";
  const isLive = row.isLive === true;
  const hasActions =
    sessionActions.activate ||
    sessionActions.start ||
    sessionActions.markAbsent ||
    sessionActions.requestLeave ||
    sessionActions.joinVideo;

  return (
    <Paper
      variant="outlined"
      sx={theme => ({
        p: 1.5,
        borderColor: theme.palette.border.light,
        backgroundColor: isFrozen ? theme.palette.errorContainer : theme.palette.surfaceContainerLowest,
        opacity: isCompleted ? 0.7 : 1,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        borderInlineStart: isLive ? `4px solid ${theme.palette.primary.main}` : undefined,
      })}
    >
      <Typography
        sx={{
          typography: "bodyMd",
          fontFamily: "monospace",
          fontWeight: 700,
          color: theme => theme.palette.text.secondary,
          width: 32,
          flexShrink: 0,
          textAlign: "end",
        }}
      >
        {String(row.rowNumber).padStart(2, "0")}
      </Typography>

      <Box sx={{ minWidth: 160, flex: "1 1 200px" }}>
        <DesktopPersonProfileLinkCell
          href={studentHrefValue}
          name={row.studentName}
          showAvatar
          avatarSize={32}
          fallbackInitial={row.studentInitials?.[0] ?? "?"}
          typographyVariant="bodyMd"
          fontWeight={600}
        />
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
        <AccessTimeOutlined sx={theme => ({ fontSize: 18, color: theme.palette.primary.main })} />
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              typography: "bodyMd",
              color: theme => theme.palette.primary.main,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {row.timeRange}
          </Typography>
          {duration ? (
            <Typography
              sx={{
                typography: "labelSm",
                color: theme => theme.palette.text.secondary,
                fontFamily: "monospace",
              }}
            >
              {duration}
            </Typography>
          ) : null}
        </Box>
      </Box>

      <Box sx={{ flex: "0 0 auto" }}>
        {isFrozen ? (
          <Typography sx={{ typography: "labelMd", color: theme => theme.palette.info.main, fontWeight: 700 }}>
            {labels.schedule.frozen}
          </Typography>
        ) : (
          <DesktopStatusBadge
            category={badge.category}
            status={badge.status}
            label={getStatusLabel(row.status, labels.status)}
            size="small"
          />
        )}
      </Box>

      {hasActions ? (
        <Box sx={{ flex: "1 1 auto", justifyContent: "flex-end", display: "flex", alignItems: "center" }}>
          <TeacherScheduleSessionActionsCellDesktop
            row={row}
            labels={labels}
            canActivate={canActivate}
            onActivate={onActivate}
            onStartSession={onStartSession}
            onMarkAbsent={onMarkAbsent}
            onRequestLeave={onRequestLeave}
          />
        </Box>
      ) : null}

      <Tooltip title={labels.schedule.classId}>
        <DesktopActionIconLink href={`/classes/${row.id}`} aria-label={labels.schedule.classId}>
          <VisibilityOutlined fontSize="small" />
        </DesktopActionIconLink>
      </Tooltip>
    </Paper>
  );
}
