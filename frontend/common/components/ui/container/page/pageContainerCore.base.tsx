// INTERNAL: Do not import outside of tier wrappers (DesktopPageContainer / MobilePageContainer).
"use client";

import { Box, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

export interface PageContainerCoreProps {
  readonly sx?: SxProps<Theme>;
  readonly children: ReactNode;
}

export function PageContainerCore({ sx, children }: PageContainerCoreProps) {
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
