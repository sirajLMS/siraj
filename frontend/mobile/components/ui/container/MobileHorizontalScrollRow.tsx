"use client";

import { Box, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

export interface MobileHorizontalScrollRowProps {
  readonly children: ReactNode;
  readonly sx?: SxProps<Theme>;
  /** Extra inline-start inset before the first item (RTL/LTR safe). */
  readonly leadSpacing?: number;
  /**
   * Mobile variant hides the scrollbar by default — touch users get
   * natural momentum scrolling without visual chrome.
   */
  readonly showScrollbar?: boolean;
}

/**
 * Mobile horizontal scroll container tuned for small screens.
 * Smaller 1.5-unit gap, 2-unit inline padding so cards run edge-to-edge,
 * and a hidden scrollbar (touch-first UX). Optional `showScrollbar` turns
 * the thin scrollbar back on when a row needs explicit affordance.
 */
export function MobileHorizontalScrollRow({
  children,
  sx,
  leadSpacing = 0.5,
  showScrollbar = false,
}: MobileHorizontalScrollRowProps) {
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
          ...(showScrollbar
            ? {
                scrollbarWidth: "thin" as const,
                scrollbarColor: `${theme.palette.outlineVariant} transparent`,
                "&::-webkit-scrollbar": { display: "block", height: 6 },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: theme.palette.outlineVariant,
                  borderRadius: 3,
                },
                "&::-webkit-scrollbar-track": { backgroundColor: "transparent" },
              }
            : {
                scrollbarWidth: "none" as const,
                "&::-webkit-scrollbar": { display: "none" },
              }),
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
