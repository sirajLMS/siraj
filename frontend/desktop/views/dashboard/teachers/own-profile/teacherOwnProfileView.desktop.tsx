"use client";

import { Grid, Paper } from "@mui/material";
import type { ReactNode } from "react";
import { TeacherOwnProfileShared } from "@/frontend/common/views/dashboard/teachers/own-profile/__shared__/teacherOwnProfileShared";
import type { TeacherOwnProfileViewModel } from "@/frontend/common/views/dashboard/teachers/own-profile/useTeacherOwnProfileViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

function DesktopProfileLayout({ children }: { readonly children: ReactNode }) {
  return (
    <Grid container spacing={3}>
      {children}
    </Grid>
  );
}

function DesktopProfileSection({ children }: { readonly children: ReactNode }) {
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        {children}
      </Paper>
    </Grid>
  );
}

export function TeacherOwnProfileDesktopView({ ...vm }: Readonly<TeacherOwnProfileViewModel>) {
  return (
    <TeacherOwnProfileShared
      vm={vm}
      options={{
        PageContainer: DesktopPageContainer,
        PageHeader: DesktopPageHeader,
        ProfileLayout: DesktopProfileLayout,
        ProfileSection: DesktopProfileSection,
      }}
    />
  );
}

export default TeacherOwnProfileDesktopView;
