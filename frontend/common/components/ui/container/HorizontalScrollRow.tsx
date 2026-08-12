"use client";

import { Box, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

type ShowScrollbarOption = boolean | "desktop";

interface HorizontalScrollRowProps {
  readonly children: ReactNode;
  readonly sx?: SxProps<Theme>;
  /** Extra inline-start inset before the first item (RTL/LTR safe). */
  readonly leadSpacing?: number;
  /** Gap between items in theme spacing units (default 1.5). */
  readonly gap?: number;
  /** Inline padding in theme spacing units (default 2). */
  readonly padding?: number;
  /** Bottom padding in theme spacing units (default 0.5). */
  readonly paddingBottom?: number;
  /**
   * When false (default), scrollbar is hidden.
   * When true, scrollbar is always visible when overflowing.
   * When "desktop", scrollbar is visible from md breakpoint up only.
   */
  readonly showScrollbar?: ShowScrollbarOption;
}

function hiddenScrollbarStyles() {
  return {
    scrollbarWidth: "none" as const,
    "&::-webkit-scrollbar": { display: "none" },
  };
}

function visibleScrollbarStyles(theme: Theme) {
  return {
    scrollbarWidth: "thin" as const,
    scrollbarColor: `${theme.palette.outlineVariant} transparent`,
    "&::-webkit-scrollbar": {
      display: "block",
      height: 6,
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: theme.palette.outlineVariant,
      borderRadius: 3,
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: "transparent",
    },
  };
}

function scrollbarStyles(theme: Theme, showScrollbar: ShowScrollbarOption) {
  if (showScrollbar === true) {
    return visibleScrollbarStyles(theme);
  }

  if (showScrollbar === "desktop") {
    return {
      ...hiddenScrollbarStyles(),
      [theme.breakpoints.up("md")]: visibleScrollbarStyles(theme),
    };
  }

  return hiddenScrollbarStyles();
}

/**
 * Horizontal scroll container for card rows on mobile.
 * Applies inline padding and a little extra start offset for the first child.
 */
export function HorizontalScrollRow({
  children,
  sx,
  leadSpacing = 0.5,
  gap = 1.5,
  padding = 2,
  paddingBottom = 0.5,
  showScrollbar = false,
}: HorizontalScrollRowProps) {
  return (
    <Box
      sx={mergeSx(
        theme => ({
          display: "flex",
          gap: theme.spacing(gap),
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x proximity",
          paddingInlineStart: theme.spacing(padding),
          paddingInlineEnd: theme.spacing(padding),
          scrollPaddingInlineStart: theme.spacing(padding + leadSpacing),
          paddingBottom: theme.spacing(paddingBottom),
          ...scrollbarStyles(theme, showScrollbar),
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
