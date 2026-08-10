"use client";

import { Fab, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import { useViewport } from "@/frontend/common/hooks/useViewport";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

export interface MobileFabProps {
  readonly icon: ReactNode;
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly sx?: SxProps<Theme>;
}

export function MobileFab({ icon, label, onClick, disabled, sx }: MobileFabProps) {
  const { isMobile } = useViewport();

  // Only render on mobile; desktop uses its own FAB or button
  if (!isMobile) {
    return null;
  }

  return (
    <Fab
      size="large"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      sx={mergeSx(
        {
          position: "fixed",
          bottom: "88px",
          right: 24,
          zIndex: theme => theme.zIndex.speedDial,
          backgroundColor: theme => theme.palette.primary.main,
          color: theme => theme.palette.onPrimary,
          "&:hover": {
            backgroundColor: theme => theme.palette.primary.dark,
          },
        },
        sx
      )}
    >
      {icon}
    </Fab>
  );
}
