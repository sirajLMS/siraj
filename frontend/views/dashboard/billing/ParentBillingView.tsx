"use client";

import { useMediaQuery, useTheme } from "@mui/material";
import { ParentBillingDesktopView } from "./ParentBillingDesktopView";
import { ParentBillingMobileView } from "./ParentBillingMobileView";
import type { ParentBillingViewProps } from "./types/billingViewTypes";

export function ParentBillingView(props: Readonly<ParentBillingViewProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return <ParentBillingMobileView {...props} />;
  }

  return <ParentBillingDesktopView {...props} />;
}
