"use client";

import { useMediaQuery, useTheme } from "@mui/material";
import type { AdminBillingViewProps } from "../../billing/types/billingViewTypes";
import { AdminBillingDesktopView } from "./AdminBillingDesktopView";
import { AdminBillingMobileView } from "./AdminBillingMobileView";

export function AdminBillingView(props: Readonly<AdminBillingViewProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return <AdminBillingMobileView {...props} />;
  }

  return <AdminBillingDesktopView {...props} />;
}
