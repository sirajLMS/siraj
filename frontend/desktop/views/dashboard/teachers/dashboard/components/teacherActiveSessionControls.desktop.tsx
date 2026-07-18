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
import type { TeacherActiveSessionControlsProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";

/**
 * Desktop variant of the active-session controls row.
 * Slightly lighter visual weight (32×32) than the mobile variant — desktop rows
 * are denser and the controls live inline with the rest of the action cell.
 *
 * Plan v5: per specs.md §3 N3 + N7 + §6.4, `useState(absentDialogOpen)` and
 * the per-button `<RequirePermission>` wrappers were lifted to the
 * `TeacherDashboardContainer` + `teacherDashboardStore`. The component now
 * receives `hasSessionUpdateStatus*` booleans and a lifted `absentDialogOpen`
 * state with `onAbsentDialogOpen` / `onAbsentDialogClose` callbacks as props.
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
  hasSessionUpdateStatusStart,
  hasSessionUpdateStatusAbsent,
  hasSessionUpdateStatusLeave,
  absentDialogOpen,
  onAbsentDialogOpen,
  onAbsentDialogClose,
}: Readonly<TeacherActiveSessionControlsProps>) {
  const handleAbsentConfirm = () => {
    onMarkAbsent();
    onAbsentDialogClose?.();
  };

  const resolvedStartTooltip = startTooltip ?? labels.startSession;
  const resolvedMarkAbsentTooltip = markAbsentTooltip ?? labels.markAbsent;
  const resolvedRequestLeaveTooltip = requestLeaveTooltip ?? labels.requestLeave;

  return (
    <>
      {showStart && (hasSessionUpdateStatusStart ?? true) ? (
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
      ) : null}

      {showMarkAbsent && (hasSessionUpdateStatusAbsent ?? true) ? (
        <Tooltip title={resolvedMarkAbsentTooltip}>
          <span>
            <IconButton
              size="small"
              disabled={markAbsentDisabled}
              onClick={() => {
                if (!markAbsentDisabled) {
                  onAbsentDialogOpen?.();
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
      ) : null}

      {showRequestLeave && (hasSessionUpdateStatusLeave ?? true) ? (
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
      ) : null}

      {showMarkAbsent && (hasSessionUpdateStatusAbsent ?? true) ? (
        <Dialog open={absentDialogOpen ?? false} onClose={onAbsentDialogClose}>
          <DialogTitle>{labels.markAbsentDialogTitle}</DialogTitle>
          <DialogContent>
            <DialogContentText>{labels.markAbsentConfirmation}</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={onAbsentDialogClose}>{labels.cancel}</Button>
            <Button onClick={handleAbsentConfirm} variant="contained" color="warning">
              {labels.markAbsentConfirm}
            </Button>
          </DialogActions>
        </Dialog>
      ) : null}
    </>
  );
}
