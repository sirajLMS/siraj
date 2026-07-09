"use client";

import { useMediaQuery, useTheme } from "@mui/material";
import { ParentBillingDesktopView } from "@/frontend/views/dashboard/billing/ParentBillingDesktopView";
import { ParentBillingMobileView } from "@/frontend/views/dashboard/billing/ParentBillingMobileView";
import type { ParentBillingViewProps } from "@/frontend/views/dashboard/billing/types/billingViewTypes";

export function ParentBillingView(props: Readonly<ParentBillingViewProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return <ParentBillingMobileView {...props} />;
  }

  return <ParentBillingDesktopView {...props} />;
}
