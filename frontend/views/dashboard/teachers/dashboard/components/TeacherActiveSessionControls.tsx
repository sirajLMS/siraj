"use client";

import { CalendarTodayOutlined, LogoutOutlined, PlayArrowOutlined } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
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
      <RequirePermission permissions={[AppPermission.SessionUpdateStatusStart]}>
        <Tooltip title={labels.startSession}>
          <IconButton
            onClick={onStart}
            aria-label={labels.startSession}
            sx={theme => ({
              width: 40,
              height: 40,
              backgroundColor: theme.palette.secondaryContainer,
              color: theme.palette.onSecondaryContainer,
              "&:hover": { backgroundColor: theme.palette.secondaryContainer },
            })}
          >
            <PlayArrowOutlined />
          </IconButton>
        </Tooltip>
      </RequirePermission>

      <RequirePermission permissions={[AppPermission.SessionUpdateStatusAbsent]}>
        <Tooltip title={labels.markAbsent}>
          <IconButton
            onClick={onMarkAbsent}
            aria-label={labels.markAbsent}
            sx={theme => ({
              width: 40,
              height: 40,
              backgroundColor: theme.palette.surfaceContainerLowest,
              border: `2px solid ${theme.palette.error.main}`,
              color: theme.palette.error.main,
            })}
          >
            <LogoutOutlined />
          </IconButton>
        </Tooltip>
      </RequirePermission>

      <RequirePermission permissions={[AppPermission.SessionUpdateStatusLeave]}>
        <Tooltip title={labels.requestLeave}>
          <IconButton
            onClick={onRequestLeave}
            aria-label={labels.requestLeave}
            sx={theme => ({
              width: 40,
              height: 40,
              backgroundColor: theme.palette.surfaceContainerLowest,
              border: `2px solid ${theme.palette.onSurfaceVariant}`,
              color: theme.palette.onSurfaceVariant,
            })}
          >
            <CalendarTodayOutlined />
          </IconButton>
        </Tooltip>
      </RequirePermission>
    </>
  );
}
