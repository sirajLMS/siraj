import { Grid, Stack } from "@mui/material";
import type { ReactNode } from "react";
import { ParentProfileShared } from "@/frontend/common/views/dashboard/profile/parent/parentProfileShared";
import type { ParentProfileViewModel } from "@/frontend/common/views/dashboard/profile/parent/useParentProfileViewModel";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui";

function DesktopViewContentWrapper({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Stack spacing={3}>{children}</Stack>
      </Grid>
    </Grid>
  );
}

const desktopSlots = {
  ViewContentWrapper: DesktopViewContentWrapper,
  SectionPanel: DesktopSectionPanel,
};

export function ParentProfileDesktopView(props: Readonly<ParentProfileViewModel>) {
  return <ParentProfileShared {...props} slots={desktopSlots} />;
}
