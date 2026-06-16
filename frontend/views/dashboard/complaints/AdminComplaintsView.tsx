"use client";

import { useMediaQuery, useTheme } from "@mui/material";
import { AdminComplaintsDesktopView } from "./AdminComplaintsDesktopView";
import { AdminComplaintsMobileView } from "./AdminComplaintsMobileView";
import type { AdminComplaintsViewProps } from "./types/complaintsViewTypes";

export function AdminComplaintsView(props: Readonly<AdminComplaintsViewProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return <AdminComplaintsMobileView {...props} />;
  }

  return <AdminComplaintsDesktopView {...props} />;
}
