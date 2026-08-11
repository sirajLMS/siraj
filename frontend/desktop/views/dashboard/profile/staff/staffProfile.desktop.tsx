"use client";

import { Grid, Stack } from "@mui/material";
import type React from "react";
import type { StaffProfileSharedSlots } from "@/frontend/common/views/dashboard/profile/__shared__/staffProfileShared";
import { StaffProfileSharedView } from "@/frontend/common/views/dashboard/profile/__shared__/staffProfileShared";
import type { StaffProfileViewModel } from "@/frontend/common/views/dashboard/profile/staff/useStaffProfileViewModel";

const DesktopViewContentWrapper: React.ComponentType<{ readonly children: React.ReactNode }> = ({ children }) => (
  <Grid container spacing={3}>
    <Grid size={{ xs: 12, md: 6 }}>
      <Stack spacing={3}>{children}</Stack>
    </Grid>
  </Grid>
);

const desktopSlots: StaffProfileSharedSlots = {
  ViewContentWrapper: DesktopViewContentWrapper,
};

export function StaffProfileDesktopView(props: Readonly<StaffProfileViewModel>): React.JSX.Element | null {
  return <StaffProfileSharedView {...props} {...desktopSlots} />;
}
