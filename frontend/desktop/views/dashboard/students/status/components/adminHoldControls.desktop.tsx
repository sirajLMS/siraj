"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { AdminHoldControlsShared } from "@/frontend/common/views/dashboard/students/status/components/adminHoldControlsShared";
import type { AdminHoldControlsProps } from "@/frontend/common/views/dashboard/students/status/types";
import type { AdminHoldControlsSlotProps } from "@/frontend/common/views/dashboard/students/status/types/adminHoldControlsShared.types";
import {
  DesktopAdminControlPanel,
  DesktopFilterButton,
  DesktopPrimaryPageAction,
} from "@/frontend/desktop/components/ui";

const DefaultQuickReasonsContainer = ({ children }: Readonly<{ children: ReactNode }>) => (
  <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>{children}</Box>
);

const slots: AdminHoldControlsSlotProps = {
  FilterButton: DesktopFilterButton,
  PrimaryPageAction: DesktopPrimaryPageAction,
  AdminControlPanel: DesktopAdminControlPanel,
  QuickReasonsContainer: DefaultQuickReasonsContainer,
};

export function AdminHoldControlsDesktop({ isUpdating }: Readonly<AdminHoldControlsProps>) {
  return <AdminHoldControlsShared props={{ isUpdating }} slots={slots} />;
}
