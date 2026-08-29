"use client";

import { IconButton, Tooltip } from "@mui/material";
import type { ReactNode } from "react";

export interface TooltipIconButtonProps {
  readonly label: string;
  readonly onClick: () => void;
  readonly icon: ReactNode;
}

/**
 * onClick counterpart of {@link ActionIconLink}: an icon action wrapped in a
 * tooltip, for row-level triggers that fire a callback instead of navigating.
 */
export function TooltipIconButton({ label, onClick, icon }: Readonly<TooltipIconButtonProps>): ReactNode {
  return (
    <Tooltip title={label}>
      <IconButton size="small" aria-label={label} onClick={onClick}>
        {icon}
      </IconButton>
    </Tooltip>
  );
}
