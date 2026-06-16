"use client";

import { Box, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import { mergeSx } from "./mergeSx";

interface PageContainerProps {
  readonly sx?: SxProps<Theme>;
  readonly children: ReactNode;
}

/**
 * Standard page content wrapper. DashboardLayout already applies pageMargin —
 * views must NOT add their own outer padding.
 */
export function PageContainer({ sx, children }: PageContainerProps) {
  return (
    <Box
      sx={mergeSx(
        {
          display: "flex",
          flexDirection: "column",
          gap: theme => theme.layout.sectionGap,
          width: "100%",
        },
        sx
      )}
    >
      {children}
    </Box>
  );
}
