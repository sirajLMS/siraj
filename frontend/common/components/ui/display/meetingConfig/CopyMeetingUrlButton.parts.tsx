"use client";

import { alpha, Box, Button, IconButton, type Theme, Tooltip } from "@mui/material";
import type { ReactElement } from "react";

/**
 * Variant triggers and the screen-reader live region for
 * `CopyMeetingUrlButton`. Each trigger owns one visual variant (button, text,
 * icon) and receives pre-resolved copy state so the parent stays a thin
 * controller.
 */

/** Visually-hidden style for the screen-reader live region announcing copy feedback. */
const visuallyHiddenSx = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  border: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
} as const;

export interface CopyMeetingUrlTriggerProps {
  readonly size: "small" | "medium" | "large";
  readonly disabled: boolean;
  readonly onClick: () => void;
  readonly ariaLabel: string;
  readonly pressed: boolean;
  readonly tooltipText: string;
  readonly icon: ReactElement;
  readonly iconColor: (theme: Theme) => string;
  readonly label: string;
}

export function CopyMeetingUrlLiveRegion({ message }: { readonly message: string }): ReactElement {
  return (
    <Box component="output" aria-live="polite" sx={visuallyHiddenSx}>
      {message}
    </Box>
  );
}

export function CopyMeetingUrlButtonTrigger({
  size,
  disabled,
  onClick,
  ariaLabel,
  pressed,
  tooltipText,
  icon,
  iconColor,
  label,
}: Readonly<CopyMeetingUrlTriggerProps>): ReactElement {
  const button = (
    <Button
      size={size}
      variant="text"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={pressed}
      startIcon={icon}
      sx={theme => ({
        color: iconColor(theme),
        "&:hover": {
          backgroundColor: alpha(theme.palette.success.main, 0.08),
        },
      })}
    >
      {label}
    </Button>
  );

  return (
    <Tooltip title={tooltipText}>
      {disabled ? (
        <Box component="span" aria-disabled={true} sx={{ display: "inline-flex" }}>
          {button}
        </Box>
      ) : (
        button
      )}
    </Tooltip>
  );
}

export function CopyMeetingUrlTextTrigger({
  disabled,
  onClick,
  ariaLabel,
  pressed,
  tooltipText,
  icon,
  iconColor,
  label,
}: Readonly<CopyMeetingUrlTriggerProps>): ReactElement {
  return (
    <Tooltip title={tooltipText}>
      <Box
        aria-disabled={disabled ? true : undefined}
        sx={theme => ({
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          color: iconColor(theme),
          "&:hover": disabled ? {} : { color: theme.palette.primary.main },
        })}
      >
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-pressed={pressed}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            cursor: disabled ? "default" : "pointer",
            padding: 0,
            color: "inherit",
            font: "inherit",
          }}
        >
          {icon}
          <Box sx={{ typography: "bodyMd" }}>{label}</Box>
        </button>
      </Box>
    </Tooltip>
  );
}

export function CopyMeetingUrlIconTrigger({
  size,
  disabled,
  onClick,
  ariaLabel,
  pressed,
  tooltipText,
  icon,
  iconColor,
}: Readonly<CopyMeetingUrlTriggerProps>): ReactElement {
  const iconButton = (
    <IconButton
      size={size}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={pressed}
      sx={theme => ({
        color: iconColor(theme),
        "&:hover": {
          backgroundColor: alpha(iconColor(theme), 0.08),
        },
      })}
    >
      {icon}
    </IconButton>
  );

  return (
    <Tooltip title={tooltipText}>
      {disabled ? (
        <Box component="span" aria-disabled={true} sx={{ display: "inline-flex" }}>
          {iconButton}
        </Box>
      ) : (
        iconButton
      )}
    </Tooltip>
  );
}
