"use client";

import type { SxProps, Theme } from "@mui/material";
import type { ReactNode } from "react";
import { HorizontalScrollRow } from "@/frontend/common/components/ui/container/HorizontalScrollRow";

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

/**
 * Desktop horizontal scroll container for card rows.
 * Delegates to the shared {@link HorizontalScrollRow} with desktop-tuned
 * defaults: 3-unit gap/padding, 1-unit lead spacing, and scrollbar visible
 * from the `md` breakpoint up.
 */
export function DesktopHorizontalScrollRow({
  children,
  sx,
  leadSpacing = 1,
  showScrollbar = "desktop",
}: DesktopHorizontalScrollRowProps) {
  return (
    <HorizontalScrollRow
      sx={sx}
      leadSpacing={leadSpacing}
      gap={3}
      padding={3}
      paddingBottom={1}
      showScrollbar={showScrollbar}
    >
      {children}
    </HorizontalScrollRow>
  );
}
