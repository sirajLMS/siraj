import { Grid, Stack } from "@mui/material";
import type { ReactNode } from "react";
import { ParentProfileShared } from "@/frontend/common/views/dashboard/profile/parent/parentProfileShared";
import type { ParentProfileViewModel } from "@/frontend/common/views/dashboard/profile/parent/useParentProfileViewModel";
import { AssociatedStudentsSectionDesktopView } from "@/frontend/desktop/views/dashboard/profile/parent/sections/associatedStudentsSection.desktop";

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
  StudentsSection: AssociatedStudentsSectionDesktopView,
};

export function ParentProfileDesktopView(props: Readonly<ParentProfileViewModel>) {
  return <ParentProfileShared {...props} slots={desktopSlots} />;
}
