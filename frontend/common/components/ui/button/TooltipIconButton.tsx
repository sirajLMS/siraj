"use client";

import { Box, IconButton, type IconButtonProps, type SxProps, type Theme, Tooltip } from "@mui/material";
import type { ReactNode } from "react";

export interface TooltipIconButtonProps {
  readonly label: string;
  readonly onClick?: () => void;
  readonly icon: ReactNode;
  readonly disabled?: boolean;
  readonly disabledReason?: string;
  readonly size?: "small" | "medium" | "large";
  readonly color?: IconButtonProps["color"];
  readonly sx?: SxProps<Theme>;
}

/**
 * onClick counterpart of {@link ActionIconLink}: an icon action wrapped in a
 * tooltip, for row-level triggers that fire a callback instead of navigating.
 *
 * Disabled state uses a plain `<span>` wrapper so the Tooltip still shows on
 * hover/focus (MUI suppresses pointer events on disabled buttons).
 */
export function TooltipIconButton({
  label,
  onClick,
  icon,
  disabled = false,
  disabledReason,
  size = "small",
  color,
  sx,
}: Readonly<TooltipIconButtonProps>): ReactNode {
  const tooltipTitle = disabled && disabledReason ? disabledReason : label;
  const button = (
    <IconButton size={size} color={color} aria-label={label} onClick={onClick} disabled={disabled} sx={sx}>
      {icon}
    </IconButton>
  );

  return (
    <Tooltip title={tooltipTitle}>
      {disabled ? (
        <Box component="span" sx={{ display: "inline-flex" }}>
          {button}
        </Box>
      ) : (
        button
      )}
    </Tooltip>
  );
}
