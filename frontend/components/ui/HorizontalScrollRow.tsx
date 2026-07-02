"use client";

import { Box, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import { mergeSx } from "./mergeSx";

interface HorizontalScrollRowProps {
  readonly children: ReactNode;
  readonly sx?: SxProps<Theme>;
  /** Extra inline-start inset before the first item (RTL/LTR safe). */
  readonly leadSpacing?: number;
}

/**
 * Horizontal scroll container for card rows on mobile.
 * Applies inline padding and a little extra start offset for the first child.
 */
export function HorizontalScrollRow({ children, sx, leadSpacing = 0.5 }: HorizontalScrollRowProps) {
  return (
    <Box
      sx={mergeSx(
        theme => ({
          display: "flex",
          gap: theme.spacing(1.5),
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x proximity",
          paddingInlineStart: theme.spacing(2),
          paddingInlineEnd: theme.spacing(2),
          scrollPaddingInlineStart: theme.spacing(2 + leadSpacing),
          paddingBottom: theme.spacing(0.5),
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          "& > *:first-of-type": {
            marginInlineStart: theme.spacing(leadSpacing),
          },
        }),
        sx
      )}
    >
      {children}
    </Box>
  );
}
