"use client";

import { Grid } from "@mui/material";
import type { ReactNode } from "react";
import { SupervisorProfileShared } from "@/frontend/common/views/dashboard/supervisor/profile/__shared__/supervisorProfileShared";
import type { SupervisorProfileViewModel } from "@/frontend/common/views/dashboard/supervisor/profile/useSupervisorProfileViewModel";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui";
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
      <DesktopSectionPanel>{children}</DesktopSectionPanel>
    </Grid>
  );
}

export function SupervisorProfileDesktopView({ ...vm }: Readonly<SupervisorProfileViewModel>) {
  return (
    <SupervisorProfileShared
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
