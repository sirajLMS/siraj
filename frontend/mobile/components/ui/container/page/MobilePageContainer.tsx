"use client";

import type { SxProps, Theme } from "@mui/material";
import type { ReactNode } from "react";
import { PageContainerCore } from "@/frontend/common/components/ui/container/page/pageContainerCore.base";

export interface MobilePageContainerProps {
  readonly sx?: SxProps<Theme>;
  readonly children: ReactNode;
}

// Mobile page wrapper. No navbar progress bar (mobile has no fixed 64px navbar).
// Outer padding/edge-to-edge layout is handled by DashboardLayout.pageMargin.
export function MobilePageContainer({ sx, children }: MobilePageContainerProps) {
  return <PageContainerCore sx={sx}>{children}</PageContainerCore>;
}
