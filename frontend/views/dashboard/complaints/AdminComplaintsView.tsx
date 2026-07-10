"use client";

import { useMediaQuery, useTheme } from "@mui/material";
import { AdminComplaintsDesktopView } from "@/frontend/views/dashboard/complaints/AdminComplaintsDesktopView";
import { AdminComplaintsMobileView } from "@/frontend/views/dashboard/complaints/AdminComplaintsMobileView";
import type { AdminComplaintsViewProps } from "@/frontend/views/dashboard/complaints/types/complaintsViewTypes";

export function AdminComplaintsView(props: Readonly<AdminComplaintsViewProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return <AdminComplaintsMobileView {...props} />;
  }

  return <AdminComplaintsDesktopView {...props} />;
}
