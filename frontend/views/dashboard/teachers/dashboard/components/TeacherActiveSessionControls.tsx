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
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import type { TeacherDashboardLabels } from "../types/teacherDashboardLabels";

interface TeacherActiveSessionControlsProps {
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

export function TeacherActiveSessionControls({
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
}: Readonly<TeacherActiveSessionControlsProps>) {
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
      ) : null}

      {showMarkAbsent ? (
        <RequirePermission permissions={[AppPermission.SessionUpdateStatusAbsent]}>
          <Tooltip title={resolvedMarkAbsentTooltip}>
            <span>
              <IconButton
                disabled={markAbsentDisabled}
                onClick={() => {
                  if (!markAbsentDisabled) {
                    setAbsentDialogOpen(true);
                  }
                }}
                aria-label={labels.markAbsent}
                sx={theme => ({
                  width: 40,
                  height: 40,
                  backgroundColor: theme.palette.surfaceContainerLowest,
                  border: `2px solid ${theme.palette.error.main}`,
                  color: theme.palette.error.main,
                  opacity: markAbsentDisabled ? 0.5 : 1,
                })}
              >
                <LogoutOutlined />
              </IconButton>
            </span>
          </Tooltip>
        </RequirePermission>
      ) : null}

      {showRequestLeave ? (
        <RequirePermission permissions={[AppPermission.SessionUpdateStatusLeave]}>
          <Tooltip title={resolvedRequestLeaveTooltip}>
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
