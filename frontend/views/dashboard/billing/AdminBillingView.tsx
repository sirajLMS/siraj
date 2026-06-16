"use client";

import { useMediaQuery, useTheme } from "@mui/material";
import { AdminBillingDesktopView } from "./AdminBillingDesktopView";
import { AdminBillingMobileView } from "./AdminBillingMobileView";
import type { AdminBillingViewProps } from "./types/billingViewTypes";

export function AdminBillingView(props: Readonly<AdminBillingViewProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return <AdminBillingMobileView {...props} />;
  }

  return <AdminBillingDesktopView {...props} />;
}
