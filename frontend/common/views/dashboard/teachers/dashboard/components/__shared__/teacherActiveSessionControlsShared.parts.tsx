"use client";

import { CalendarTodayOutlined, LogoutOutlined, PlayArrowOutlined } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog";
import type { TeacherDashboardLabels } from "@/shared/locale";

type ActiveControlsLabels = TeacherDashboardLabels["activeControls"];

interface ControlButtonBaseProps {
  readonly tooltip: string;
  readonly ariaLabel: string;
  readonly buttonSize: number;
  readonly iconFontSize: "small" | "medium" | "large" | undefined;
}

export function StartSessionControlButton({
  tooltip,
  ariaLabel,
  onStart,
  buttonSize,
  iconFontSize,
}: Readonly<ControlButtonBaseProps> & { readonly onStart: () => void }) {
  return (
    <Tooltip title={tooltip}>
      <IconButton
        onClick={onStart}
        aria-label={ariaLabel}
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
  );
}

export function MarkAbsentControlButton({
  tooltip,
  ariaLabel,
  disabled,
  onOpenDialog,
  buttonSize,
  iconFontSize,
}: Readonly<ControlButtonBaseProps> & {
  readonly disabled: boolean;
  readonly onOpenDialog: (() => void) | undefined;
}) {
  return (
    <Tooltip title={tooltip}>
      <span>
        <IconButton
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              onOpenDialog?.();
            }
          }}
          aria-label={ariaLabel}
          sx={theme => ({
            width: buttonSize,
            height: buttonSize,
            backgroundColor: theme.palette.surfaceContainerLowest,
            border: `2px solid ${theme.palette.error.main}`,
            color: theme.palette.error.main,
            opacity: disabled ? 0.5 : 1,
          })}
        >
          <LogoutOutlined fontSize={iconFontSize} />
        </IconButton>
      </span>
    </Tooltip>
  );
}

export function RequestLeaveControlButton({
  tooltip,
  ariaLabel,
  onRequestLeave,
  buttonSize,
  iconFontSize,
}: Readonly<ControlButtonBaseProps> & { readonly onRequestLeave: () => void }) {
  return (
    <Tooltip title={tooltip}>
      <IconButton
        onClick={onRequestLeave}
        aria-label={ariaLabel}
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
  );
}

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

export function AbsentConfirmDialog({
  open,
  onClose,
  onConfirm,
  isLoading,
  labels,
}: Readonly<{
  open: boolean;
  onClose: (() => void) | undefined;
  onConfirm: () => void;
  isLoading: boolean;
  labels: ActiveControlsLabels;
}>) {
  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose ?? (() => {})}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={labels.markAbsentDialogTitle}
      body={labels.markAbsentConfirmation}
      cancelLabel={labels.cancel}
      confirmLabel={labels.markAbsentConfirm}
      confirmSx={markAbsentConfirmSx}
    />
  );
}
