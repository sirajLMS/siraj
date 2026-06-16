"use client";

import { CalendarTodayOutlined, LogoutOutlined, PlayArrowOutlined } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import type { TeacherDashboardLabels } from "../types/teacherDashboardLabels";

interface TeacherActiveSessionControlsProps {
  readonly labels: TeacherDashboardLabels["activeControls"];
  readonly onStart: () => void;
  readonly onMarkAbsent: () => void;
  readonly onRequestLeave: () => void;
}

export function TeacherActiveSessionControls({
  labels,
  onStart,
  onMarkAbsent,
  onRequestLeave,
}: Readonly<TeacherActiveSessionControlsProps>) {
  return (
    <>
      <Tooltip title={labels.startSession}>
        <IconButton
          onClick={onStart}
          aria-label={labels.startSession}
          sx={theme => ({
            width: 40,
            height: 40,
            bgcolor: theme.palette.secondaryContainer,
            color: theme.palette.onSecondaryContainer,
            "&:hover": { bgcolor: theme.palette.secondaryContainer },
          })}
        >
          <PlayArrowOutlined />
        </IconButton>
      </Tooltip>
      <Tooltip title={labels.markAbsent}>
        <IconButton
          onClick={onMarkAbsent}
          aria-label={labels.markAbsent}
          sx={theme => ({
            width: 40,
            height: 40,
            bgcolor: theme.palette.surfaceContainerLowest,
            border: `2px solid ${theme.palette.error.main}`,
            color: theme.palette.error.main,
          })}
        >
          <LogoutOutlined />
        </IconButton>
      </Tooltip>
      <Tooltip title={labels.requestLeave}>
        <IconButton
          onClick={onRequestLeave}
          aria-label={labels.requestLeave}
          sx={theme => ({
            width: 40,
            height: 40,
            bgcolor: theme.palette.surfaceContainerLowest,
            border: `2px solid ${theme.palette.onSurfaceVariant}`,
            color: theme.palette.onSurfaceVariant,
          })}
        >
          <CalendarTodayOutlined />
        </IconButton>
      </Tooltip>
    </>
  );
}
