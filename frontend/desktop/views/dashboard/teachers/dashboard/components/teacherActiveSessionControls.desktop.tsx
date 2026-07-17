"use client";

import { CalendarTodayOutlined, LogoutOutlined, PlayArrowOutlined } from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useState } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { TeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";

interface TeacherActiveSessionControlsDesktopProps {
  readonly labels: TeacherDashboardLabels["activeControls"];
  readonly showStart?: boolean;
  readonly showMarkAbsent?: boolean;
  readonly showRequestLeave?: boolean;
  readonly startTooltip?: string;
  readonly markAbsentTooltip?: string;
  readonly requestLeaveTooltip?: string;
  readonly markAbsentDisabled?: boolean;
  readonly onStart: () => void;
  readonly onMarkAbsent: () => void;
  readonly onRequestLeave: () => void;
}

/**
 * Desktop variant of the active-session controls row.
 * Slightly lighter visual weight (32×32) than the mobile variant — desktop rows
 * are denser and the controls live inline with the rest of the action cell.
 */
export function TeacherActiveSessionControlsDesktop({
  labels,
  showStart = true,
  showMarkAbsent = true,
  showRequestLeave = true,
  startTooltip,
  markAbsentTooltip,
  requestLeaveTooltip,
  markAbsentDisabled = false,
  onStart,
  onMarkAbsent,
  onRequestLeave,
}: Readonly<TeacherActiveSessionControlsDesktopProps>) {
  const [absentDialogOpen, setAbsentDialogOpen] = useState(false);

  const handleAbsentConfirm = () => {
    onMarkAbsent();
    setAbsentDialogOpen(false);
  };

  const resolvedStartTooltip = startTooltip ?? labels.startSession;
  const resolvedMarkAbsentTooltip = markAbsentTooltip ?? labels.markAbsent;
  const resolvedRequestLeaveTooltip = requestLeaveTooltip ?? labels.requestLeave;

  return (
    <>
      {showStart ? (
        <RequirePermission permissions={[AppPermission.SessionUpdateStatusStart]}>
          <Tooltip title={resolvedStartTooltip}>
            <IconButton
              size="small"
              onClick={onStart}
              aria-label={labels.startSession}
              sx={theme => ({
                width: 32,
                height: 32,
                backgroundColor: theme.palette.secondaryContainer,
                color: theme.palette.onSecondaryContainer,
                "&:hover": { backgroundColor: theme.palette.secondaryContainer },
              })}
            >
              <PlayArrowOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </RequirePermission>
      ) : null}

      {showMarkAbsent ? (
        <RequirePermission permissions={[AppPermission.SessionUpdateStatusAbsent]}>
          <Tooltip title={resolvedMarkAbsentTooltip}>
            <span>
              <IconButton
                size="small"
                disabled={markAbsentDisabled}
                onClick={() => {
                  if (!markAbsentDisabled) {
                    setAbsentDialogOpen(true);
                  }
                }}
                aria-label={labels.markAbsent}
                sx={theme => ({
                  width: 32,
                  height: 32,
                  backgroundColor: theme.palette.surfaceContainerLowest,
                  border: `2px solid ${theme.palette.error.main}`,
                  color: theme.palette.error.main,
                  opacity: markAbsentDisabled ? 0.5 : 1,
                })}
              >
                <LogoutOutlined fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </RequirePermission>
      ) : null}

      {showRequestLeave ? (
        <RequirePermission permissions={[AppPermission.SessionUpdateStatusLeave]}>
          <Tooltip title={resolvedRequestLeaveTooltip}>
            <IconButton
              size="small"
              onClick={onRequestLeave}
              aria-label={labels.requestLeave}
              sx={theme => ({
                width: 32,
                height: 32,
                backgroundColor: theme.palette.surfaceContainerLowest,
                border: `2px solid ${theme.palette.onSurfaceVariant}`,
                color: theme.palette.onSurfaceVariant,
              })}
            >
              <CalendarTodayOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </RequirePermission>
      ) : null}

      {showMarkAbsent ? (
        <Dialog open={absentDialogOpen} onClose={() => setAbsentDialogOpen(false)}>
          <DialogTitle>{labels.markAbsentDialogTitle}</DialogTitle>
          <DialogContent>
            <DialogContentText>{labels.markAbsentConfirmation}</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAbsentDialogOpen(false)}>{labels.cancel}</Button>
            <Button onClick={handleAbsentConfirm} variant="contained" color="warning">
              {labels.markAbsentConfirm}
            </Button>
          </DialogActions>
        </Dialog>
      ) : null}
    </>
  );
}
