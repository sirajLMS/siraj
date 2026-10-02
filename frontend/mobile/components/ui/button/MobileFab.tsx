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
        (theme: Theme) => ({
          position: "fixed",
          // Mirror the main scroll-area offset (bottomNavHeight + safe-area +
          // spacing(2)) so the FAB always clears the fixed bottom navbar,
          // including devices with a home indicator (safe-area inset).
          bottom: `calc(${theme.layout.bottomNavHeight} + env(safe-area-inset-bottom, 0px) + ${theme.spacing(2)})`,
          right: 24,
          zIndex: theme.zIndex.speedDial,
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.onPrimary,
          "&:hover": {
            backgroundColor: theme.palette.primary.dark,
          },
        }),
        sx
      )}
    >
      {icon}
    </Fab>
  );
}
