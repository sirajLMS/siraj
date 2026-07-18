"use client";

import { Box, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

export interface MobilePageContainerProps {
  readonly sx?: SxProps<Theme>;
  readonly children: ReactNode;
}

/**
 * Mobile page wrapper. Navbar offset is handled by DashboardLayoutMobile
 * (pt: navbarHeight for the fixed AppBar) — do not re-add it here.
 * Outer edge-to-edge layout is handled by DashboardLayoutMobile page padding.
 * Structurally simpler than DesktopPageContainer — no LinearProgress overlay.
 */
export function MobilePageContainer({ sx, children }: MobilePageContainerProps) {
  return (
    <Box
      sx={mergeSx(
        {
          display: "flex",
          flexDirection: "column",
          gap: theme => theme.layout.sectionGap,
          width: "100%",
          position: "relative",
        },
        sx
      )}
    >
      {children}
    </Box>
  );
}
