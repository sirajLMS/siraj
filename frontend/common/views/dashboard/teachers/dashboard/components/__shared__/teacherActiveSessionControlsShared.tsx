"use client";

import { CalendarTodayOutlined, LogoutOutlined, PlayArrowOutlined } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog";
import type { TeacherActiveSessionControlsProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";

export interface TeacherActiveSessionControlsSharedOptions {
  readonly buttonSize: number;
  readonly iconFontSize: "small" | "medium" | "large" | undefined;
}

export interface TeacherActiveSessionControlsSharedProps extends TeacherActiveSessionControlsProps {
  readonly markAbsentLoading?: boolean;
  readonly options: TeacherActiveSessionControlsSharedOptions;
}

const noopDialogClose = () => {};

/**
 * Warning-toned confirm for mark-absent: absence records a completed session
 * with an absence outcome rather than deleting an entity, so the shared
 * destructive dialog keeps its chrome but the confirm action uses the
 * warning palette instead of the default error palette.
 */
const markAbsentConfirmSx: SxProps<Theme> = theme => ({
  py: 1.5,
  backgroundColor: theme.palette.warning.main,
  color: theme.palette.onWarning,
  "&:hover": { backgroundColor: theme.palette.warning.dark },
});

export function TeacherActiveSessionControlsShared({
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
  markAbsentLoading = false,
  options,
}: Readonly<TeacherActiveSessionControlsSharedProps>) {
  const { buttonSize, iconFontSize } = options;

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
            onClick={onStart}
            aria-label={labels.startSession}
            sx={theme => ({
              width: buttonSize,
              height: buttonSize,
              backgroundColor: theme.palette.secondaryContainer,
              color: theme.palette.onSecondaryContainer,
              "&:hover": { backgroundColor: theme.palette.secondaryContainer },
            })}
          >
            <PlayArrowOutlined fontSize={iconFontSize} />
          </IconButton>
        </Tooltip>
      ) : null}

      {showMarkAbsent && (hasSessionUpdateStatusAbsent ?? true) ? (
        <Tooltip title={resolvedMarkAbsentTooltip}>
          <span>
            <IconButton
              disabled={markAbsentDisabled}
              onClick={() => {
                if (!markAbsentDisabled) {
                  onAbsentDialogOpen?.();
                }
              }}
              aria-label={labels.markAbsent}
              sx={theme => ({
                width: buttonSize,
                height: buttonSize,
                backgroundColor: theme.palette.surfaceContainerLowest,
                border: `2px solid ${theme.palette.error.main}`,
                color: theme.palette.error.main,
                opacity: markAbsentDisabled ? 0.5 : 1,
              })}
            >
              <LogoutOutlined fontSize={iconFontSize} />
            </IconButton>
          </span>
        </Tooltip>
      ) : null}

      {showRequestLeave && (hasSessionUpdateStatusLeave ?? true) ? (
        <Tooltip title={resolvedRequestLeaveTooltip}>
          <IconButton
            onClick={onRequestLeave}
            aria-label={labels.requestLeave}
            sx={theme => ({
              width: buttonSize,
              height: buttonSize,
              backgroundColor: theme.palette.surfaceContainerLowest,
              border: `2px solid ${theme.palette.onSurfaceVariant}`,
              color: theme.palette.onSurfaceVariant,
            })}
          >
            <CalendarTodayOutlined fontSize={iconFontSize} />
          </IconButton>
        </Tooltip>
      ) : null}

      {showMarkAbsent && (hasSessionUpdateStatusAbsent ?? true) ? (
        <BaseDeleteDialog
          open={absentDialogOpen ?? false}
          onClose={onAbsentDialogClose ?? noopDialogClose}
          onConfirm={handleAbsentConfirm}
          isLoading={markAbsentLoading}
          title={labels.markAbsentDialogTitle}
          body={labels.markAbsentConfirmation}
          cancelLabel={labels.cancel}
          confirmLabel={labels.markAbsentConfirm}
          confirmSx={markAbsentConfirmSx}
        />
      ) : null}
    </>
  );
}
