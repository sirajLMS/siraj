"use client";

import type { SxProps, Theme } from "@mui/material";
import type { ReactNode } from "react";
import { HorizontalScrollRow } from "@/frontend/common/components/ui/container/HorizontalScrollRow";

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
 * Delegates to the shared `HorizontalScrollRow` — the mobile variant
 * restricts `showScrollbar` to `boolean` (never the `"desktop"` breakpoint
 * mode that the common component offers).
 */
export function MobileHorizontalScrollRow({
  children,
  sx,
  leadSpacing = 0.5,
  showScrollbar = false,
}: Readonly<MobileHorizontalScrollRowProps>) {
  return (
    <HorizontalScrollRow sx={sx} leadSpacing={leadSpacing} showScrollbar={showScrollbar}>
      {children}
    </HorizontalScrollRow>
  );
}
