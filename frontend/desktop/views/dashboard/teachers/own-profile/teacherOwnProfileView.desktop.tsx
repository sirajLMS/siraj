"use client";

import { Grid } from "@mui/material";
import type { ReactNode } from "react";
import { TeacherOwnProfileShared } from "@/frontend/common/views/dashboard/teachers/own-profile/__shared__/teacherOwnProfileShared";
import type { TeacherOwnProfileViewModel } from "@/frontend/common/views/dashboard/teachers/own-profile/useTeacherOwnProfileViewModel";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

function DesktopProfileLayout({ children }: { readonly children: ReactNode }) {
  return (
    <Grid container spacing={3}>
      {children}
    </Grid>
  );
}

function DesktopProfileSection({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <DesktopSectionPanel title={title}>{children}</DesktopSectionPanel>
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
