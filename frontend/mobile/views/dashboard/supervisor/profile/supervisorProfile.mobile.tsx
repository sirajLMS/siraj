"use client";

import { Paper, Stack } from "@mui/material";
import type { ReactNode } from "react";
import { SupervisorProfileShared } from "@/frontend/common/views/dashboard/supervisor/profile/__shared__/supervisorProfileShared";
import type { SupervisorProfileViewModel } from "@/frontend/common/views/dashboard/supervisor/profile/useSupervisorProfileViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui/container/page";

function MobileProfileLayout({ children }: { readonly children: ReactNode }) {
  return <Stack spacing={3}>{children}</Stack>;
}

function MobileProfileSection({ children }: { readonly children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      {children}
    </Paper>
  );
}

export function SupervisorProfileMobileView({ ...vm }: Readonly<SupervisorProfileViewModel>) {
  return (
    <SupervisorProfileShared
      vm={vm}
      options={{
        PageContainer: MobilePageContainer,
        PageHeader: MobilePageHeader,
        ProfileLayout: MobileProfileLayout,
        ProfileSection: MobileProfileSection,
      }}
    />
  );
}
