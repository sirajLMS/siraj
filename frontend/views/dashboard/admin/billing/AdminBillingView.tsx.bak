"use client";

import { useMediaQuery, useTheme } from "@mui/material";
import { AdminBillingDesktopView } from "@/frontend/views/dashboard/admin/billing/AdminBillingDesktopView";
import { AdminBillingMobileView } from "@/frontend/views/dashboard/admin/billing/AdminBillingMobileView";
import type { AdminBillingViewProps } from "@/frontend/views/dashboard/billing/types/billingViewTypes";

export function AdminBillingView(props: Readonly<AdminBillingViewProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return <AdminBillingMobileView {...props} />;
  }

  return <AdminBillingDesktopView {...props} />;
}
