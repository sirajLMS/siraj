"use client";

import { Box, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

type ShowScrollbarOption = boolean | "desktop";

export interface DesktopHorizontalScrollRowProps {
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
 * Desktop horizontal scroll container for card rows.
 * Uses 3-unit gap and 3-unit inline padding tuned for desktop row layouts.
 * Defaults `showScrollbar` to "desktop" so the scrollbar appears on the
 * desktop tier and is hidden on smaller viewports.
 */
export function DesktopHorizontalScrollRow({
  children,
  sx,
  leadSpacing = 1,
  showScrollbar = "desktop",
}: DesktopHorizontalScrollRowProps) {
  return (
    <Box
      sx={mergeSx(
        theme => ({
          display: "flex",
          gap: theme.spacing(3),
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x proximity",
          paddingInlineStart: theme.spacing(3),
          paddingInlineEnd: theme.spacing(3),
          scrollPaddingInlineStart: theme.spacing(3 + leadSpacing),
          paddingBottom: theme.spacing(1),
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
