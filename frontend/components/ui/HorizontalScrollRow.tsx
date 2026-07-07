"use client";

import { Box, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import { mergeSx } from "./mergeSx";

type ShowScrollbarOption = boolean | "desktop";

interface HorizontalScrollRowProps {
  readonly children: ReactNode;
  readonly sx?: SxProps<Theme>;
  /** Extra inline-start inset before the first item (RTL/LTR safe). */
  readonly leadSpacing?: number;
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
  showScrollbar = false,
}: HorizontalScrollRowProps) {
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
