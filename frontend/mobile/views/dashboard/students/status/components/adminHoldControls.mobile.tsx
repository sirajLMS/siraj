"use client";

import { Box, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import { AdminHoldControlsShared } from "@/frontend/common/views/dashboard/students/status/components/adminHoldControlsShared";
import type { AdminHoldControlsProps } from "@/frontend/common/views/dashboard/students/status/types";
import type { AdminHoldControlsSlotProps } from "@/frontend/common/views/dashboard/students/status/types/adminHoldControlsShared.types";
import {
  MobileAdminControlPanel,
  MobileFilterButton,
  MobileHorizontalScrollRow,
  MobilePrimaryPageAction,
} from "@/frontend/mobile/components/ui";

const MobileQuickReasonsContainer = ({ children }: Readonly<{ children: ReactNode }>) => (
  <Box sx={{ mt: 1.5 }}>
    <MobileHorizontalScrollRow sx={{ paddingInlineStart: 0, paddingInlineEnd: 0 } as SxProps<Theme>}>
      {children}
    </MobileHorizontalScrollRow>
  </Box>
);
MobileQuickReasonsContainer satisfies Required<AdminHoldControlsSlotProps>["QuickReasonsContainer"];

const slots: AdminHoldControlsSlotProps = {
  FilterButton: MobileFilterButton,
  PrimaryPageAction: MobilePrimaryPageAction,
  AdminControlPanel: MobileAdminControlPanel,
  QuickReasonsContainer: MobileQuickReasonsContainer,
};

export function AdminHoldControlsMobile({ isUpdating }: Readonly<AdminHoldControlsProps>) {
  return <AdminHoldControlsShared props={{ isUpdating }} slots={slots} containerGap={2.5} />;
}
